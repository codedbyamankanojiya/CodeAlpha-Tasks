import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff,
  PhoneOff, Users, Minimize2, Maximize2, ShieldAlert
} from 'lucide-react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const VideoConference = ({ boardId, onClose }) => {
  const { user } = useAuth();
  const { on, off, emit, isConnected } = useSocket();
  const { toast } = useToast();

  const [inCall, setInCall] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteFeeds, setRemoteFeeds] = useState([]); // Array of { socketId, name, stream }
  const [videoActive, setVideoActive] = useState(true);
  const [audioActive, setAudioActive] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  const localVideoRef = useRef(null);
  const peersRef = useRef({}); // Map of socketId -> RTCPeerConnection
  const screenTrackRef = useRef(null);
  const localStreamRef = useRef(null);

  // Clean up streams & connections
  const endCall = useCallback(() => {
    // 1. Emit leave-call to socket server
    emit('leave-call', { boardId });

    // 2. Stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    // 3. Close peer connections
    Object.keys(peersRef.current).forEach((socketId) => {
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].close();
      }
    });
    peersRef.current = {};

    // 4. Reset states
    setLocalStream(null);
    localStreamRef.current = null;
    setRemoteFeeds([]);
    setInCall(false);
    setScreenSharing(false);
    toast.info('Call ended', 'You disconnected from the video call.');
  }, [boardId, emit, toast]);

  // Handle user disconnects or unmounts
  useEffect(() => {
    return () => {
      // Clean up on component unmount
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
      }
      Object.keys(peersRef.current).forEach((socketId) => {
        if (peersRef.current[socketId]) peersRef.current[socketId].close();
      });
    };
  }, []);

  // Set up peer connection helpers
  const createPeerConnection = useCallback((targetSocketId, targetName, initiateOffer = false) => {
    if (peersRef.current[targetSocketId]) {
      peersRef.current[targetSocketId].close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current[targetSocketId] = pc;

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        emit('webrtc-signal', {
          targetId: targetSocketId,
          signal: { type: 'candidate', candidate: event.candidate },
        });
      }
    };

    // Remote stream added
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteFeeds((prev) => {
        const index = prev.findIndex((f) => f.socketId === targetSocketId);
        if (index !== -1) {
          // Update existing stream
          const copy = [...prev];
          copy[index] = { socketId: targetSocketId, name: targetName, stream: remoteStream };
          return copy;
        } else {
          return [...prev, { socketId: targetSocketId, name: targetName, stream: remoteStream }];
        }
      });
    };

    // Peer disconnected
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'closed' || pc.connectionState === 'failed') {
        cleanupPeer(targetSocketId);
      }
    };

    // If we are initiating, create offer
    if (initiateOffer) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          emit('webrtc-signal', {
            targetId: targetSocketId,
            signal: { type: 'offer', sdp: pc.localDescription },
          });
        })
        .catch((err) => console.error('[WebRTC] Offer generation error:', err));
    }

    return pc;
  }, [emit]);

  // Clean up a specific disconnected peer
  const cleanupPeer = useCallback((socketId) => {
    if (peersRef.current[socketId]) {
      peersRef.current[socketId].close();
      delete peersRef.current[socketId];
    }
    setRemoteFeeds((prev) => prev.filter((f) => f.socketId !== socketId));
  }, []);

  // WebRTC socket signaling listener
  useEffect(() => {
    if (!inCall) return;

    const handleUserJoinedCall = ({ socketId, name }) => {
      toast.info('User joined call', `${name} joined the video conference.`);
      // Existing member initiates calling connection (creates offer)
      createPeerConnection(socketId, name, true);
    };

    const handleUserLeftCall = ({ socketId }) => {
      setRemoteFeeds((prev) => {
        const leftFeed = prev.find((f) => f.socketId === socketId);
        if (leftFeed) {
          toast.info('User left call', `${leftFeed.name} left the video conference.`);
        }
        return prev.filter((f) => f.socketId !== socketId);
      });
      cleanupPeer(socketId);
    };

    const handleWebRTCSignal = async ({ senderId, signal }) => {
      let pc = peersRef.current[senderId];

      if (signal.type === 'offer') {
        // Newcomer receives offer from existing call participant
        pc = createPeerConnection(senderId, 'Remote User', false);
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        emit('webrtc-signal', {
          targetId: senderId,
          signal: { type: 'answer', sdp: pc.localDescription },
        });
      } else if (signal.type === 'answer') {
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        }
      } else if (signal.type === 'candidate') {
        if (pc) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (e) {
            console.error('[WebRTC] Error adding ICE candidate:', e);
          }
        }
      }
    };

    on('user-joined-call', handleUserJoinedCall);
    on('user-left-call', handleUserLeftCall);
    on('webrtc-signal', handleWebRTCSignal);

    return () => {
      off('user-joined-call', handleUserJoinedCall);
      off('user-left-call', handleUserLeftCall);
      off('webrtc-signal', handleWebRTCSignal);
    };
  }, [inCall, createPeerConnection, cleanupPeer, on, off, emit, toast]);

  // Start Video Call session
  const joinCall = async () => {
    try {
      // Request camera & microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, frameRate: 24 },
        audio: true,
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      setInCall(true);

      // Show local video feed
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Tell signaling server we've joined
      emit('join-call', { boardId });
      toast.success('Joined conference', 'Camera and microphone connected.');
    } catch (error) {
      console.error('[WebRTC] Media access error:', error);
      toast.error('Media access failed', 'Please check camera & microphone permissions.');
    }
  };

  // Toggle Video track
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoActive;
        setVideoActive(!videoActive);
      }
    }
  };

  // Toggle Audio track
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioActive;
        setAudioActive(!audioActive);
      }
    }
  };

  // Toggle Screen Sharing via WebRTC track replacement
  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = stream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        // Listen for screen sharing stop from the browser bar
        screenTrack.onended = () => {
          stopScreenSharing();
        };

        // Replace track in all active peer connections
        Object.keys(peersRef.current).forEach((socketId) => {
          const pc = peersRef.current[socketId];
          const senders = pc.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        });

        // Replace track in local video display
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        setScreenSharing(true);
      } catch (err) {
        console.error('[WebRTC] Screen share error:', err);
      }
    } else {
      stopScreenSharing();
    }
  };

  const stopScreenSharing = () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    if (localStream) {
      const cameraTrack = localStream.getVideoTracks()[0];
      // Restore camera track to all peers
      Object.keys(peersRef.current).forEach((socketId) => {
        const pc = peersRef.current[socketId];
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender && cameraTrack) {
          videoSender.replaceTrack(cameraTrack);
        }
      });

      // Restore camera stream in local video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
    }

    setScreenSharing(false);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#18181b', borderLeft: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: '#1c1c1f'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={16} style={{ color: '#2dd4bf' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f4f4f5', letterSpacing: '-0.01em' }}>
            Video Conference
          </span>
          {inCall && (
            <span style={{
              fontSize: 10, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
              padding: '1px 6px', borderRadius: 4, fontWeight: 600, border: '1px solid rgba(239,68,68,0.2)'
            }}>
              LIVE
            </span>
          )}
        </div>
        <button onClick={onClose} className="btn-icon" style={{ padding: 4 }}>
          <Minimize2 size={14} />
        </button>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, padding: 12, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!inCall ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', textAlign: 'center', padding: '24px 12px', gap: 16
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', background: 'rgba(45, 212, 191, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(45, 212, 191, 0.15)'
            }}>
              <Video size={24} style={{ color: '#2dd4bf' }} />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f4f4f5', marginBottom: 4 }}>
                Ready to join call?
              </h3>
              <p style={{ fontSize: 11, color: '#71717a', lineHeight: 1.5, maxWidth: 220, margin: '0 auto' }}>
                Join the room call to share your webcam, microphone, or desktop screen with others.
              </p>
            </div>
            {!isConnected && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.05)', padding: '6px 12px', borderRadius: 8,
                border: '1px solid rgba(239, 68, 68, 0.15)'
              }}>
                <ShieldAlert size={12} />
                Socket disconnected. Reconnecting...
              </div>
            )}
            <button
              onClick={joinCall}
              disabled={!isConnected}
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px 16px', fontSize: 13 }}
            >
              Start Conference
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
            {/* Feeds Grid */}
            {/* Local Stream */}
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#09090b', aspectRatio: '1.33' }}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
              />
              <div style={{
                position: 'absolute', bottom: 8, left: 8, background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)', padding: '2px 8px', borderRadius: 4, fontSize: 10,
                color: '#f4f4f5', fontWeight: 600
              }}>
                {user?.name} (You) {screenSharing && '· Sharing Screen'}
              </div>
              {!videoActive && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', background: '#18181b', color: '#71717a', fontSize: 11, fontWeight: 500
                }}>
                  Camera is off
                </div>
              )}
            </div>

            {/* Remote Streams */}
            {remoteFeeds.map((feed) => (
              <div key={feed.socketId} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#09090b', aspectRatio: '1.33' }}>
                <video
                  autoPlay
                  playsInline
                  ref={(el) => { if (el) el.srcObject = feed.stream; }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute', bottom: 8, left: 8, background: 'rgba(0, 0, 0, 0.6)',
                  backdropFilter: 'blur(4px)', padding: '2px 8px', borderRadius: 4, fontSize: 10,
                  color: '#f4f4f5', fontWeight: 600
                }}>
                  {feed.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Controls */}
      {inCall && (
        <div style={{
          padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: '#1c1c1f'
        }}>
          {/* Audio toggle */}
          <button
            onClick={toggleAudio}
            style={{
              padding: 10, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: audioActive ? 'rgba(255, 255, 255, 0.05)' : '#ef4444',
              color: '#fff', display: 'flex', transition: 'all 0.15s'
            }}
            title={audioActive ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {audioActive ? <Mic size={16} /> : <MicOff size={16} />}
          </button>

          {/* Video toggle */}
          <button
            onClick={toggleVideo}
            style={{
              padding: 10, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: videoActive ? 'rgba(255, 255, 255, 0.05)' : '#ef4444',
              color: '#fff', display: 'flex', transition: 'all 0.15s'
            }}
            title={videoActive ? 'Stop Camera' : 'Start Camera'}
          >
            {videoActive ? <Video size={16} /> : <VideoOff size={16} />}
          </button>

          {/* Screen sharing toggle */}
          <button
            onClick={toggleScreenShare}
            style={{
              padding: 10, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: screenSharing ? '#10b981' : 'rgba(255, 255, 255, 0.05)',
              color: '#fff', display: 'flex', transition: 'all 0.15s'
            }}
            title={screenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
          >
            {screenSharing ? <MonitorOff size={16} /> : <Monitor size={16} />}
          </button>

          {/* Leave call */}
          <button
            onClick={endCall}
            style={{
              padding: 10, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: '#ef4444', color: '#fff', display: 'flex', transition: 'all 0.15s'
            }}
            title="Leave Call"
          >
            <PhoneOff size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoConference;

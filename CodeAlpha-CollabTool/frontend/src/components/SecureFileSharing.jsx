import { useEffect, useState, useCallback, useRef } from 'react';
import { filesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  FileUp, Lock, File, Download, Trash2, Loader2,
  Calendar, HardDrive, ShieldCheck, AlertCircle, FileText
} from 'lucide-react';

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const SecureFileSharing = ({ boardId, encryptionKey }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const fileInputRef = useRef(null);

  // Load files list
  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await filesAPI.list(boardId);
      setFiles(res.data.files || []);
    } catch (err) {
      console.error('[Files] Fetch error:', err);
      toast.error('Load failed', 'Failed to retrieve file list.');
    } finally {
      setLoading(false);
    }
  }, [boardId, toast]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Convert base64 key string to Web Crypto API CryptoKey object
  const getCryptoKey = async (rawBase64Key) => {
    try {
      const rawKeyString = atob(rawBase64Key);
      const rawKeyBuffer = new Uint8Array(rawKeyString.length);
      for (let i = 0; i < rawKeyString.length; i++) {
        rawKeyBuffer[i] = rawKeyString.charCodeAt(i);
      }
      return await window.crypto.subtle.importKey(
        'raw',
        rawKeyBuffer,
        { name: 'AES-GCM' },
        false, // not extractable
        ['encrypt', 'decrypt']
      );
    } catch (e) {
      console.error('[WebCrypto] Key import error:', e);
      throw new Error('Could not import cryptographic key.');
    }
  };

  // Encrypt file client-side and upload
  const handleUpload = async (file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large', 'Max upload size is 10MB.');
      return;
    }

    if (!encryptionKey) {
      toast.error('Encryption failed', 'No room encryption key found.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const cryptoKey = await getCryptoKey(encryptionKey);
      const fileReader = new FileReader();

      fileReader.onload = async (e) => {
        try {
          const fileBuffer = e.target.result;

          // Generate 12-byte initialization vector (IV)
          const iv = window.crypto.getRandomValues(new Uint8Array(12));

          // Encrypt file content
          const encryptedBuffer = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            cryptoKey,
            fileBuffer
          );

          // Convert IV to base64 for MongoDB storage
          const ivBase64 = btoa(String.fromCharCode.apply(null, iv));

          // Create form data for multipart upload
          const encryptedBlob = new Blob([encryptedBuffer], { type: 'application/octet-stream' });
          const formData = new FormData();
          formData.append('file', encryptedBlob, 'encrypted.bin');
          formData.append('iv', ivBase64);
          formData.append('originalName', file.name);
          formData.append('mimeType', file.type || 'application/octet-stream');
          formData.append('size', file.size);

          await filesAPI.upload(boardId, formData);
          toast.success('File shared', `"${file.name}" uploaded and encrypted securely.`);
          fetchFiles();
        } catch (err) {
          console.error('[Files] Encryption error:', err);
          toast.error('Encryption failed', 'Could not encrypt file client-side.');
        } finally {
          setUploading(false);
        }
      };

      fileReader.readAsArrayBuffer(file);
    } catch (err) {
      console.error('[Files] File read error:', err);
      toast.error('Upload failed', 'Failed to read file.');
      setUploading(false);
    }
  };

  // Download encrypted file and decrypt client-side
  const handleDownload = async (fileItem) => {
    if (downloadingId) return;

    setDownloadingId(fileItem._id);
    toast.info('Downloading', 'Fetching and decrypting file...');

    try {
      // 1. Download encrypted payload
      const response = await filesAPI.download(fileItem._id);
      const encryptedBlob = response.data;
      const fileBuffer = await encryptedBlob.arrayBuffer();

      // 2. Decode IV
      const ivString = atob(fileItem.iv);
      const ivBuffer = new Uint8Array(ivString.length);
      for (let i = 0; i < ivString.length; i++) {
        ivBuffer[i] = ivString.charCodeAt(i);
      }

      // 3. Load Key & Decrypt
      const cryptoKey = await getCryptoKey(encryptionKey);
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBuffer },
        cryptoKey,
        fileBuffer
      );

      // 4. Trigger download of decrypted file
      const decryptedBlob = new Blob([decryptedBuffer], { type: fileItem.mimeType });
      const downloadUrl = window.URL.createObjectURL(decryptedBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileItem.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Downloaded', `"${fileItem.originalName}" decrypted successfully.`);
    } catch (err) {
      console.error('[Files] Decryption error:', err);
      toast.error('Decryption failed', 'Invalid key or corrupted data.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Delete file
  const handleDelete = async (fileId) => {
    try {
      await filesAPI.delete(fileId);
      setFiles((prev) => prev.filter((f) => f._id !== fileId));
      toast.info('Deleted', 'File deleted successfully.');
    } catch (err) {
      console.error('[Files] Delete error:', err);
      toast.error('Delete failed', 'Could not delete the file.');
    }
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragging(true);
    } else if (e.type === 'dragleave') {
      setDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: dragging ? '2px dashed #2dd4bf' : '2px dashed rgba(255, 255, 255, 0.08)',
          background: dragging ? 'rgba(45, 212, 191, 0.04)' : 'rgba(255, 255, 255, 0.01)',
          borderRadius: 12, padding: '28px 24px', textAlign: 'center', cursor: 'pointer',
          transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleUpload(e.target.files?.[0])}
          style={{ display: 'none' }}
        />
        {uploading ? (
          <>
            <Loader2 size={28} style={{ color: '#2dd4bf', animation: 'spin 1s linear infinite' }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#f4f4f5', marginBottom: 4 }}>
                Encrypting & sharing file...
              </p>
              <p style={{ fontSize: 11, color: '#71717a' }}>
                Encrypting file with 256-bit AES-GCM keys client-side.
              </p>
            </div>
          </>
        ) : (
          <>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.03)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FileUp size={20} style={{ color: '#2dd4bf' }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#f4f4f5', marginBottom: 4 }}>
                Drag and drop file here, or click to upload
              </p>
              <p style={{ fontSize: 11, color: '#71717a' }}>
                Files are automatically AES encrypted in your browser before transfer. Max 10MB.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Info Badge */}
      <div style={{
        display: 'flex', gap: 10, padding: '10px 14px', borderRadius: 8,
        background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)',
        alignItems: 'flex-start'
      }}>
        <ShieldCheck size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 11, color: '#a7f3d0', lineHeight: 1.5 }}>
          <strong style={{ display: 'block', marginBottom: 2 }}>End-to-End Browser Encryption</strong>
          Your workspace key is derived from unique room secrets. The host disk only sees encrypted binary chunks. 
          Files cannot be accessed without proper workspace authorization.
        </div>
      </div>

      {/* Files List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: '#a1a1aa', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
          Shared Files ({files.length})
        </h3>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />
            ))}
          </div>
        ) : files.length === 0 ? (
          <div style={{
            padding: '36px 16px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.01)',
            border: '1px dashed rgba(255, 255, 255, 0.06)', borderRadius: 10, color: '#71717a', fontSize: 12
          }}>
            No encrypted files shared in this room yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {files.map((file) => {
              const isOwner = file.uploadedBy?._id === user?._id;
              const isDownloading = downloadingId === file._id;

              return (
                <div
                  key={file._id}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '12px 14px', background: '#1c1c1f',
                    border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 8, gap: 12, transition: 'all 0.15s'
                  }}
                >
                  {/* File Icon */}
                  <div style={{
                    width: 34, height: 34, borderRadius: 6, background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <File size={16} style={{ color: '#a1a1aa' }} />
                  </div>

                  {/* Metadata */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#f4f4f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                      {file.originalName}
                    </p>
                    <div style={{ display: 'flex', gap: 10, fontSize: 10, color: '#71717a', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{formatBytes(file.size)}</span>
                      <span>•</span>
                      <span>By {file.uploadedBy?.name || 'Unknown'}</span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Calendar size={10} />
                        {new Date(file.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleDownload(file)}
                      disabled={!!downloadingId}
                      className="btn-icon"
                      style={{ padding: 6, borderRadius: 6, background: 'rgba(45, 212, 191, 0.05)', border: '1px solid rgba(45, 212, 191, 0.15)' }}
                      title="Download and decrypt file"
                    >
                      {isDownloading ? (
                        <Loader2 size={13} style={{ color: '#2dd4bf', animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <Download size={13} style={{ color: '#2dd4bf' }} />
                      )}
                    </button>

                    {isOwner && (
                      <button
                        onClick={() => handleDelete(file._id)}
                        className="btn-icon"
                        style={{ padding: 6, borderRadius: 6, background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)' }}
                        title="Delete file"
                      >
                        <Trash2 size={13} style={{ color: '#ef4444' }} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SecureFileSharing;

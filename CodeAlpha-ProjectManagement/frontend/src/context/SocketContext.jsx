import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    setNotifications(prev => [...prev, { ...notification, id: Date.now() }]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    if (user) {
      const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('[Socket.io] ✅ Connected to server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('[Socket.io] ❌ Disconnected from server');
        setIsConnected(false);
      });

      // Listen to socket events
      newSocket.on('taskCreated', (data) => {
        addNotification({
          type: 'taskCreated',
          title: 'New Task Created',
          message: `Task "${data.task.title}" has been created`,
        });
      });

      newSocket.on('taskUpdated', (data) => {
        addNotification({
          type: 'taskUpdated',
          title: 'Task Updated',
          message: `Task "${data.task.title}" has been updated`,
        });
      });

      newSocket.on('taskDeleted', (data) => {
        addNotification({
          type: 'taskDeleted',
          title: 'Task Deleted',
          message: 'A task has been deleted',
        });
      });

      newSocket.on('commentCreated', (data) => {
        addNotification({
          type: 'commentCreated',
          title: 'New Comment',
          message: `${data.comment.userId.name} commented on a task`,
        });
      });

      newSocket.on('commentUpdated', (data) => {
        addNotification({
          type: 'commentUpdated',
          title: 'Comment Updated',
          message: 'A comment has been updated',
        });
      });

      newSocket.on('commentDeleted', (data) => {
        addNotification({
          type: 'commentDeleted',
          title: 'Comment Deleted',
          message: 'A comment has been deleted',
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        notifications,
        addNotification,
        removeNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
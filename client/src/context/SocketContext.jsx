import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { TOKEN_KEY, API_ORIGIN } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { isAuthed } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!isAuthed) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }
    const token = localStorage.getItem(TOKEN_KEY);
    const socket = io(API_ORIGIN || '/', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('notification:new', (n) => {
      setUnreadNotifications((c) => c + 1);
      toast(n.title);
    });

    return () => socket.disconnect();
  }, [isAuthed]);

  const value = {
    socket: socketRef.current,
    connected,
    unreadNotifications,
    setUnreadNotifications,
  };
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);

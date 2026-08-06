import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
  ? import.meta.env.VITE_SOCKET_URL
  : typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000'
  : 'https://smartwaitlist.onrender.com';

type EventCallback = (event: string, data: unknown) => void;

export function useSocket(restaurantId: string | undefined, onEvent?: EventCallback) {
  const socketRef = useRef<Socket | null>(null);
  const onEventRef = useRef(onEvent);

  // Keep the ref in sync without causing reconnects
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!restaurantId) return;

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join:restaurant', restaurantId);
    });

    const events = [
      'restaurant:sync',
      'queue:updated',
      'queue:joined',
      'queue:notified',
      'queue:onMyWay',
      'table:statusChanged',
      'order:created',
      'order:cooking',
      'order:ready',
    ];

    events.forEach((event) => {
      socket.on(event, (data) => onEventRef.current?.(event, data));
    });

    return () => {
      socket.disconnect();
    };
  }, [restaurantId]);

  return socketRef;
}
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const socket = io(API_URL, {
  autoConnect: false,
});

import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

const socket = io(URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export const socketService = {
  socket,

  connect: () => {
    if (!socket.connected) socket.connect();
  },

  joinHospital: (hospitalId) => {
    if (!socket.connected) socket.connect();
    socket.emit('joinHospital', hospitalId);
  },

  onQueueUpdate: (callback) => {
    socket.on('queueUpdated', callback);
    return () => socket.off('queueUpdated', callback);
  },

  onTokenCalled: (callback) => {
    socket.on('tokenCalled', callback);
    return () => socket.off('tokenCalled', callback);
  },
};

export default socket;

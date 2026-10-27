import { io } from "socket.io-client";

let socketInstance = null;
let currentToken = null;

export const getSocket = (token) => {
  if (!token) return null;

  // If already connected or connecting with the same token, reuse the instance
  if (socketInstance && currentToken === token) {
    if (!socketInstance.connected && !socketInstance.active) {
      socketInstance.connect();
    }
    return socketInstance;
  }

  // If token changed or existing socket needs cleanup, disconnect cleanly
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }

  currentToken = token;
  socketInstance = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5511", {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    autoConnect: true,
  });

  return socketInstance;
};

export const closeSocket = () => {
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
    currentToken = null;
  }
};

export default {
  getSocket,
  closeSocket,
};

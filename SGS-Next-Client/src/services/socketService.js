import { io } from "socket.io-client";

let socketInstance = null;
let currentToken = null;

export const getSocket = (token) => {
  if (!token) return null;

  if (socketInstance && currentToken === token) {
    if (!socketInstance.connected && !socketInstance.active) {
      socketInstance.connect();
    }
    return socketInstance;
  }

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

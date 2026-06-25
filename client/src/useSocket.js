import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

let socket = null;

/**
 * Custom hook for Socket.IO connection.
 * Returns { isConnected, lastUpdate }
 * lastUpdate = { dishId, isPublished, dishName, source }
 */
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    // Create socket connection (singleton)
    socket = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("🔌 Socket connected:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔴 Socket disconnected:", reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.warn("⚠️ Socket connection error:", err.message);
      setIsConnected(false);
    });

    // Listen for real-time dish updates (from API or DB change stream)
    socket.on("dish:updated", (data) => {
      console.log("📡 Real-time update received:", data);
      setLastUpdate({ ...data, timestamp: Date.now() });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { isConnected, lastUpdate };
}

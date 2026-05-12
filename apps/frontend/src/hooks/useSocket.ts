import { useEffect, useCallback, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import env from "../config/env";

interface RoomMember {
  userId: number;
  socketId: string;
  status: "focusing" | "break" | "idle";
}

interface UseSocketReturn {
  socket: Socket | null;
  members: RoomMember[];
  isConnected: boolean;
  roomDeleted: boolean;
}

export const useSocket = (code: string): UseSocketReturn => {
  const socket = useMemo(
    () =>
      io(env.apiUrl, {
        transports: ["websocket"],
        autoConnect: false,
        withCredentials: true,
      }),
    [],
  );
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [roomDeleted, setRoomDeleted] = useState(false);

  const joinRoom = useCallback(() => {
    if (socket.connected) {
      socket.emit("room:join", { code });
    }
  }, [socket, code]);

  const leaveRoom = useCallback(() => {
    if (socket.connected) {
      socket.emit("room:leave", { code });
    }
  }, [socket, code]);

  const sendPing = useCallback(() => {
    if (socket.connected) {
      socket.emit("room:ping", { code });
    }
  }, [socket, code]);

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      joinRoom();
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleMembers = (data: RoomMember[]) => {
      setMembers(data);
    };

    const handleMemberJoined = (data: RoomMember) => {
      setMembers((prev) => [...prev, data]);
    };

    const handleMemberLeft = (data: { userId: number; socketId: string }) => {
      setMembers((prev) => prev.filter((m) => m.userId !== data.userId));
    };

    const handleRoomDeleted = (data: { code: string }) => {
      if (data.code === code) {
        setRoomDeleted(true);
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("room:members", handleMembers);
    socket.on("room:memberJoined", handleMemberJoined);
    socket.on("member:left", handleMemberLeft);
    socket.on("room:memberLeft", handleMemberLeft);
    socket.on("room:deleted", handleRoomDeleted);

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    // Heartbeat cada 25s
    const pingInterval = setInterval(() => {
      sendPing();
    }, 25000);

    return () => {
      clearInterval(pingInterval);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("room:members", handleMembers);
      socket.off("room:memberJoined", handleMemberJoined);
      socket.off("member:left", handleMemberLeft);
      socket.off("room:memberLeft", handleMemberLeft);
      socket.off("room:deleted", handleRoomDeleted);
      leaveRoom();
      socket.disconnect();
    };
  }, [socket, joinRoom, leaveRoom, sendPing]);

  useEffect(() => {
    setRoomDeleted(false);
  }, [code]);

  return {
    socket: socket ?? null,
    members,
    isConnected,
    roomDeleted,
  };
};

import type { Request, Response, NextFunction } from "express";
import { roomService } from "../services/room.service.ts";
import { createAppError } from "../types/errors.ts";
import type { RoomLocals } from "../types/room.locals.ts";

export const createRoom = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createAppError("Usuario no autenticado", 401));
    }

    const room = await roomService.createRoom(req.user.id, req.body);

    res.status(201).json({
      message: "Sala creada exitosamente",
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

export const getRoomByCode = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { code } = req.params;
    const roomCode = Array.isArray(code) ? code[0] : code;

    const room = await roomService.findByCode(roomCode);

    if (!room) {
      res.status(404).json({ message: "Sala no encontrada" });
      return;
    }

    res.status(200).json({
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

export const listRooms = async (
  req: Request,
  res: Response<unknown, RoomLocals>,
  next: NextFunction,
): Promise<void> => {
  try {
    const query = res.locals.listRoomsQuery ?? {
      search: undefined,
      limit: 20,
      offset: 0,
    };

    const rooms = await roomService.listPublicRooms(
      query.search,
      query.limit,
      query.offset,
    );

    res.status(200).json({
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};

export const joinRoom = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { code } = req.params;
    const roomCode = Array.isArray(code) ? code[0] : code;

    if (!req.user) {
      return next(createAppError("Usuario no autenticado", 401));
    }

    const room = await roomService.joinRoom(req.user.id, roomCode);

    res.status(200).json({
      message: "Te has unido a la sala exitosamente",
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

export const leaveRoom = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { code } = req.params;
    const roomCode = Array.isArray(code) ? code[0] : code;

    if (!req.user) {
      return next(createAppError("Usuario no autenticado", 401));
    }

    await roomService.leaveRoom(req.user.id, roomCode);

    res.status(200).json({
      message: "Has salido de la sala exitosamente",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRoom = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return next(createAppError("Usuario no autenticado", 401));
    }

    const roomId = Number.parseInt(Array.isArray(id) ? id[0] : id, 10);
    await roomService.deleteRoom(req.user.id, roomId);

    res.status(200).json({
      message: "Sala eliminada exitosamente",
    });
  } catch (error) {
    next(error);
  }
};

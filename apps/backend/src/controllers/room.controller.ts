import type { Request, Response, NextFunction } from "express";
import { roomService } from "../services/room.service.ts";
import {
  createRoomSchema,
  listRoomsQuerySchema,
} from "../validators/room.validator.ts";
import { ZodError } from "zod";
import { createAppError } from "../types/errors.ts";

export const createRoom = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Validar request body
    const validatedData = createRoomSchema.parse(req.body);

    // Crear sala (el usuario viene del JWT token)
    if (!req.user) {
      return next(createAppError("Usuario no autenticado", 401));
    }

    const room = await roomService.createRoom(req.user.id, validatedData);

    res.status(201).json({
      message: "Sala creada exitosamente",
      data: room,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        message: "Datos inválidos",
        errors: error.issues.map((e) => ({
          field: e.path?.join(".") || "",
          message: e.message,
        })),
      });
      return;
    }
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
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const query = listRoomsQuerySchema.parse(req.query);

    const rooms = await roomService.listPublicRooms(
      query.search,
      query.limit,
      query.offset,
    );

    res.status(200).json({
      data: rooms,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        message: "Query parameters inválidos",
        errors: error.issues.map((e) => ({
          field: e.path?.join(".") || "",
          message: e.message,
        })),
      });
      return;
    }
    next(error);
  }
};

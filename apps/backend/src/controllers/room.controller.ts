import type { Request, Response, NextFunction } from "express";
import { roomService } from "../services/room.service.ts";
import { createAppError } from "../types/errors.ts";
import type { RoomLocals } from "../types/room.locals.ts";

/**
 * Maneja la creación de una nueva sala
 * Extrae datos validados del body y el userId de req.user
 * @param req - Request con body validado y req.user poblado por auth middleware
 * @param res - Response con la sala creada y código 201
 * @param next - Pasa errores al errorHandler
 * @throws Error 401 si el usuario no está autenticado
 */
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

/**
 * Busca una sala por su código único
 * Extrae el código de req.params y devuelve la sala si existe
 * @param req - Request con code en params
 * @param res - Response con la sala o 404 si no existe
 * @param next - Pasa errores al errorHandler
 */
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

/**
 * Lista salas públicas con búsqueda y paginación
 * Usa res.locals.listRoomsQuery (establecido por middleware) para los parámetros
 * @param req - Request con posibles query params (search, limit, offset)
 * @param res - Response con RoomLocals que contiene la query
 * @param next - Pasa errores al errorHandler
 */
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

/**
 * Maneja la unión de un usuario a una sala por código
 * Extrae código de params y userId de req.user
 * @param req - Request con code en params y req.user poblado
 * @param res - Response con la sala y mensaje de éxito
 * @param next - Pasa errores al errorHandler
 * @throws Error 401 si el usuario no está autenticado
 * @throws Error 404 si la sala no existe
 * @throws Error 409 si la sala está llena o ya es miembro
 */
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

/**
 * Maneja la salida de un usuario de una sala
 * Extrae código de params y userId de req.user
 * @param req - Request con code en params y req.user poblado
 * @param res - Response confirmando salida exitosa
 * @param next - Pasa errores al errorHandler
 * @throws Error 401 si el usuario no está autenticado
 * @throws Error 404 si la sala no existe
 * @throws Error 409 si el usuario no es miembro
 */
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

/**
 * Elimina una sala (solo owner puede ejecutar)
 * Extrae id de la sala de params y userId de req.user
 * @param req - Request con id en params y req.user poblado
 * @param res - Response confirmando eliminación exitosa
 * @param next - Pasa errores al errorHandler
 * @throws Error 401 si el usuario no está autenticado
 * @throws Error 404 si la sala no existe
 * @throws Error 403 si el usuario no es el owner
 */
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

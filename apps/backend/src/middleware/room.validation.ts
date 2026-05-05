import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import {
  createRoomSchema,
  listRoomsQuerySchema,
  roomCodeParamsSchema,
  roomIdParamsSchema,
} from "../validators/room.validator.ts";
import type { RoomLocals } from "../types/room.locals.ts";

const sendValidationError = (res: Response, error: ZodError): void => {
  res.status(400).json({
    message: "Validación fallida",
    errors: error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  });
};

export const validateCreateRoom = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    req.body = createRoomSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      sendValidationError(res, error);
      return;
    }
    next(error);
  }
};

export const validateListRoomsQuery = (
  req: Request,
  res: Response<unknown, RoomLocals>,
  next: NextFunction,
): void => {
  try {
    const parsedQuery = listRoomsQuerySchema.parse(req.query);
    res.locals.listRoomsQuery = parsedQuery;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      sendValidationError(res, error);
      return;
    }
    next(error);
  }
};

export const validateRoomCodeParams = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    roomCodeParamsSchema.parse(req.params);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      sendValidationError(res, error);
      return;
    }
    next(error);
  }
};

export const validateRoomIdParams = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    roomIdParamsSchema.parse(req.params);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      sendValidationError(res, error);
      return;
    }
    next(error);
  }
};

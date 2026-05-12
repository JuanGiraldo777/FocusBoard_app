import { createAppError } from "../types/errors.js";
import { userRepository, type UserSettingsRecord } from "../repositories/user.repository.js";

export const userSettingsService = {
  async getSettings(userId: number): Promise<UserSettingsRecord> {
    const settings = await userRepository.findSettingsByUserId(userId);

    if (!settings) {
      throw createAppError("Configuración de usuario no encontrada", 404);
    }

    return settings;
  },
};
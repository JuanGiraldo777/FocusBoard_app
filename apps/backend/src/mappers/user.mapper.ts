import type { UserRecord } from "../repositories/user.repository.js";
import type { User } from "@focusboard/shared";

export const userMapper = {
  toDTO(dbUser: UserRecord): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      fullName: dbUser.full_name,
      avatarUrl: dbUser.avatar_url,
      isActive: dbUser.is_active,
      createdAt: dbUser.created_at,
    };
  },

  toDTOArray(dbUsers: UserRecord[]): User[] {
    return dbUsers.map((user) => this.toDTO(user));
  },
};

import { db } from "../config/database.ts";
import type { CreateSessionRequest } from "../validators/session.validator.ts";

const pomodoroSessionService = {
  async createSession(userId: number, data: CreateSessionRequest): Promise<void> {
    const client = await db.getClient();

    try {
      await client.query("BEGIN");

      // If roomId is provided, verify user is member of the room
      if (data.roomId) {
        const memberCheck = await client.query(
          "SELECT 1 FROM room_members WHERE user_id = $1 AND room_id = $2 LIMIT 1",
          [userId, data.roomId]
        );

        if (memberCheck.rows.length === 0) {
          const error = new Error("User is not a member of this room") as any;
          error.statusCode = 403;
          throw error;
        }
      }

      // Insert session with status 'completed' and ended_at = NOW()
      await client.query(
        `INSERT INTO pomodoro_sessions 
         (user_id, room_id, task_label, duration, status, started_at, ended_at)
         VALUES ($1, $2, $3, $4, 'completed', $5, NOW())`,
        [
          userId,
          data.roomId || null,
          data.taskLabel,
          data.duration,
          data.startedAt
        ]
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async getTodaySessionCount(userId: number): Promise<number> {
    const result = await db.query(
      `SELECT COUNT(*) as count 
       FROM pomodoro_sessions 
       WHERE user_id = $1 
         AND status = 'completed' 
         AND DATE(ended_at) = CURRENT_DATE`,
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }
};

export { pomodoroSessionService };

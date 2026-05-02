import { db } from "../config/database.ts";
import type { CreateSessionRequest } from "../validators/session.validator.ts";

interface SessionStats {
  totalPomodoros: number;
  totalMinutes: number;
  currentStreak: number;
}

const pomodoroSessionService = {
  async createSession(userId: number, data: CreateSessionRequest): Promise<void> {
    const client = await db.getClient();

    try {
      await client.query("BEGIN");

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
  },

  async getTodaySessions(userId: number) {
    const result = await db.query(
      `SELECT id, task_label, duration, status, started_at, ended_at
       FROM pomodoro_sessions 
       WHERE user_id = $1 
         AND DATE(started_at) = CURRENT_DATE
       ORDER BY started_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async getWeekSessions(userId: number) {
    const result = await db.query(
      `SELECT 
          DATE(started_at) as day,
          COUNT(*) as count,
          SUM(duration) as total_duration
        FROM pomodoro_sessions 
        WHERE user_id = $1 
          AND status = 'completed'
          AND started_at >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY DATE(started_at)
        ORDER BY day DESC`,
      [userId]
    );
    return result.rows;
  },

  async getStats(userId: number): Promise<SessionStats> {
    // Get total pomodoros and total minutes
    const statsResult = await db.query(
      `SELECT 
          COUNT(*) as total_pomodoros,
          SUM(duration) as total_minutes
        FROM pomodoro_sessions 
        WHERE user_id = $1 
          AND status = 'completed'`,
      [userId]
    );

    const totalPomodoros = parseInt(statsResult.rows[0].total_pomodoros, 10) || 0;
    const totalMinutes = parseInt(statsResult.rows[0].total_minutes, 10) || 0;

    // Calculate current streak (consecutive days with completed sessions)
    const streakResult = await db.query(
      `WITH days AS (
         SELECT DISTINCT DATE(started_at) as day
         FROM pomodoro_sessions 
         WHERE user_id = $1 
           AND status = 'completed'
       )
       SELECT COUNT(*) as streak
       FROM (
         SELECT day,
           day - ROW_NUMBER() OVER (ORDER BY day) as grp
         FROM days
       ) t
       WHERE day >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY grp
       ORDER BY MIN(day) DESC
       LIMIT 1`,
      [userId]
    );

    const currentStreak = parseInt(String(streakResult.rows[0]?.streak || '0'), 10) || 0;

    return { totalPomodoros, totalMinutes, currentStreak };
  }
};

export { pomodoroSessionService };

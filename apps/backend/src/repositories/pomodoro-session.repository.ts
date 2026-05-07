import { db } from "../config/database.ts";

export interface CreateSessionData {
  userId: number;
  taskLabel: string;
  duration: number;
  startedAt: string;
}

/**
 * Repositorio de sesiones Pomodoro — todas las operaciones de BD.
 */
export const pomodoroSessionRepository = {
  /**
   * Crea una nueva sesión Pomodoro.
   * @param data - Datos de la sesión (userId, taskLabel, duration, startedAt)
   */
  async create(data: CreateSessionData): Promise<void> {
    await db.query(
      `INSERT INTO pomodoro_sessions (user_id, task_label, duration, started_at, ended_at, status)
       VALUES ($1, $2, $3, $4, NOW(), 'completed')`,
      [data.userId, data.taskLabel, data.duration, data.startedAt],
    );
  },

  /**
   * Cuenta las sesiones completadas de hoy para un usuario.
   * @param userId - ID del usuario
   * @returns Número de sesiones hoy
   */
  async getTodayCount(userId: number): Promise<number> {
    const result = await db.query(
      `SELECT COUNT(*) as count 
       FROM pomodoro_sessions 
       WHERE user_id = $1 
         AND status = 'completed'
         AND DATE(ended_at) = CURRENT_DATE`,
      [userId],
    );
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Obtiene las sesiones de hoy para un usuario.
   * @param userId - ID del usuario
   * @returns Array de sesiones con todas sus columnas
   */
  async getTodaySessions(userId: number): Promise<
    Array<{
      id: number;
      task_label: string;
      duration: number;
      status: string;
      started_at: string;
      ended_at: string;
    }>
  > {
    const result = await db.query(
      `SELECT id, task_label, duration, status, started_at, ended_at
       FROM pomodoro_sessions 
       WHERE user_id = $1 
         AND DATE(ended_at) = CURRENT_DATE
       ORDER BY ended_at DESC`,
      [userId],
    );
    return result.rows;
  },

  /**
   * Obtiene sesiones de los últimos 7 días agrupadas por día.
   * @param userId - ID del usuario
   * @returns Array con day, count y total_duration por día
   */
  async getWeekSessions(
    userId: number,
  ): Promise<Array<{ day: string; count: number; total_duration: number }>> {
    const result = await db.query(
      `SELECT 
         TO_CHAR(DATE(ended_at), 'dy') as day,
         COUNT(*) as count,
         SUM(duration) as total_duration
       FROM pomodoro_sessions 
       WHERE user_id = $1 
         AND ended_at >= NOW() - INTERVAL '7 days'
         AND status = 'completed'
       GROUP BY DATE(ended_at)
       ORDER BY DATE(ended_at) ASC`,
      [userId],
    );
    return result.rows.map((row) => ({
      day: row.day,
      count: parseInt(row.count, 10),
      total_duration: parseInt(row.total_duration, 10),
    }));
  },

  /**
   * Obtiene estadísticas generales del usuario.
   * @param userId - ID del usuario
   * @returns Objeto con totalPomodoros, totalMinutes, currentStreak
   */
  async getStats(
    userId: number,
  ): Promise<{
    totalPomodoros: number;
    totalMinutes: number;
    currentStreak: number;
  }> {
    // Total Pomodoros y tiempo
    const totalResult = await db.query(
      `SELECT 
         COUNT(*) as total_pomodoros,
         COALESCE(SUM(duration), 0) as total_minutes
       FROM pomodoro_sessions 
       WHERE user_id = $1 AND status = 'completed'`,
      [userId],
    );

    // Racha actual (días consecutivos con sesiones)
    const streakResult = await db.query(
      `WITH daily_sessions AS (
         SELECT DATE(ended_at) as session_date
         FROM pomodoro_sessions 
         WHERE user_id = $1 AND status = 'completed'
         GROUP BY DATE(ended_at)
       )
       SELECT COUNT(*) as streak
       FROM (
         SELECT session_date,
                session_date - ROW_NUMBER() OVER (ORDER BY session_date) as grp
         FROM daily_sessions
       ) t
       WHERE grp = (SELECT grp FROM t WHERE session_date = CURRENT_DATE LIMIT 1)`,
      [userId],
    );

    return {
      totalPomodoros: parseInt(totalResult.rows[0].total_pomodoros, 10),
      totalMinutes: Math.floor(parseInt(totalResult.rows[0].total_minutes, 10) / 60),
      currentStreak: parseInt(streakResult.rows[0]?.streak || 0, 10),
    };
  },
};

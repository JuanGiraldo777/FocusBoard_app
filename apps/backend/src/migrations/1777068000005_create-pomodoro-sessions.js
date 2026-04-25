export const up = (pgm) => {
  pgm.createTable("pomodoro_sessions", {
    id: {
      type: "bigserial",
      primaryKey: true,
    },
    user_id: {
      type: "bigint",
      notNull: true,
      references: "users(id)",
      onDelete: "cascade",
    },
    room_id: {
      type: "bigint",
      references: "rooms(id)",
      onDelete: "set null",
    },
    task_label: {
      type: "varchar(255)",
    },
    started_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    ended_at: {
      type: "timestamptz",
    },
    duration_seconds: {
      type: "integer",
      notNull: true,
      check: "duration_seconds > 0",
    },
    status: {
      type: "varchar(20)",
      notNull: true,
      default: "completed",
      check: "status in ('completed', 'cancelled', 'interrupted')",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("pomodoro_sessions", ["user_id", "started_at"]);
  pgm.createIndex("pomodoro_sessions", "room_id");
};

export const down = (pgm) => {
  pgm.dropTable("pomodoro_sessions");
};

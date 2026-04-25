export const up = (pgm) => {
  pgm.createTable("user_settings", {
    user_id: {
      type: "bigint",
      primaryKey: true,
      references: "users(id)",
      onDelete: "cascade",
    },
    focus_duration_min: {
      type: "integer",
      notNull: true,
      default: 25,
      check: "focus_duration_min > 0",
    },
    short_break_min: {
      type: "integer",
      notNull: true,
      default: 5,
      check: "short_break_min > 0",
    },
    long_break_min: {
      type: "integer",
      notNull: true,
      default: 15,
      check: "long_break_min > 0",
    },
    daily_goal: {
      type: "integer",
      notNull: true,
      default: 8,
      check: "daily_goal > 0",
    },
    sound_enabled: {
      type: "boolean",
      notNull: true,
      default: true,
    },
    theme: {
      type: "varchar(20)",
      notNull: true,
      default: "system",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
};

export const down = (pgm) => {
  pgm.dropTable("user_settings");
};

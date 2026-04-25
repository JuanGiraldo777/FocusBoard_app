export const up = (pgm) => {
  pgm.createTable("refresh_tokens", {
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
    token_hash: {
      type: "text",
      notNull: true,
      unique: true,
    },
    expires_at: {
      type: "timestamptz",
      notNull: true,
    },
    revoked_at: {
      type: "timestamptz",
    },
    last_used_at: {
      type: "timestamptz",
    },
    user_agent: {
      type: "text",
    },
    ip_address: {
      type: "inet",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("refresh_tokens", "user_id");
  pgm.createIndex("refresh_tokens", "expires_at");
};

export const down = (pgm) => {
  pgm.dropTable("refresh_tokens");
};

export const up = (pgm) => {
  pgm.createTable("rooms", {
    id: {
      type: "bigserial",
      primaryKey: true,
    },
    owner_id: {
      type: "bigint",
      notNull: true,
      references: "users(id)",
      onDelete: "cascade",
    },
    name: {
      type: "varchar(120)",
      notNull: true,
    },
    description: {
      type: "text",
    },
    is_private: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    invite_code: {
      type: "varchar(16)",
      unique: true,
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

  pgm.createIndex("rooms", "owner_id");
  pgm.createIndex("rooms", "invite_code", { unique: true });
};

export const down = (pgm) => {
  pgm.dropTable("rooms");
};

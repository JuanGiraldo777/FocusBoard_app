/** @type {import('node-pg-migrate').ColumnDefinitions | undefined} */

export const up = (pgm) => {
  pgm.createTable("users", {
    id: {
      type: "bigserial",
      primaryKey: true,
    },
    email: {
      type: "varchar(255)",
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: "text",
      notNull: true,
    },
    full_name: {
      type: "varchar(120)",
    },
    avatar_url: {
      type: "text",
    },
    is_active: {
      type: "boolean",
      notNull: true,
      default: true,
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

  pgm.createIndex("users", "email", { unique: true });
};

export const down = (pgm) => {
  pgm.dropTable("users");
};

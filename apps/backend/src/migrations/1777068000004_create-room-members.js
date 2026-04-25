export const up = (pgm) => {
  pgm.createTable("room_members", {
    room_id: {
      type: "bigint",
      notNull: true,
      references: "rooms(id)",
      onDelete: "cascade",
    },
    user_id: {
      type: "bigint",
      notNull: true,
      references: "users(id)",
      onDelete: "cascade",
    },
    role: {
      type: "varchar(20)",
      notNull: true,
      default: "member",
      check: "role in ('owner', 'admin', 'member')",
    },
    joined_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.addConstraint("room_members", "room_members_pk", {
    primaryKey: ["room_id", "user_id"],
  });

  pgm.createIndex("room_members", "user_id");
};

export const down = (pgm) => {
  pgm.dropTable("room_members");
};

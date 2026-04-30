export const up = (pgm) => {
  // Agregar columna token_jti (UUID único para revocación)
  pgm.addColumn("refresh_tokens", {
    token_jti: {
      type: "uuid",
      notNull: false, // Nullable para retrocompatibilidad con tokens existentes
      unique: true,
    },
  });

  // Crear índice para búsquedas rápidas
  pgm.createIndex("refresh_tokens", "token_jti");
};

export const down = (pgm) => {
  pgm.dropIndex("refresh_tokens", "token_jti");
  pgm.dropColumn("refresh_tokens", "token_jti");
};

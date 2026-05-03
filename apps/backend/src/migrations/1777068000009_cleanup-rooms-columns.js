export const up = (pgm) => {
  // Eliminar columnas duplicadas de la migración original
  pgm.dropColumn('rooms', 'invite_code')
  pgm.dropColumn('rooms', 'is_private')
}

export const down = (pgm) => {
  pgm.addColumn('rooms', {
    invite_code: { type: 'varchar(16)', unique: true },
    is_private: { type: 'boolean', notNull: true, default: false },
  })
}
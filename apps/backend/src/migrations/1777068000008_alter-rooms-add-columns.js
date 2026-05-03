export const up = (pgm) => {
  // Añadir columnas que necesita ROOMS-01 y que no estaban en la migración original
  pgm.addColumn('rooms', {
    code: { type: 'varchar(8)', unique: true },
    is_public: { type: 'boolean', notNull: true, default: true },
    max_members: { type: 'integer', notNull: true, default: 10 },
    last_activity: { type: 'timestamptz', default: pgm.func('now()') },
  })

  // Índices necesarios
  pgm.createIndex('rooms', 'last_activity')
}

export const down = (pgm) => {
  pgm.dropColumn('rooms', 'code')
  pgm.dropColumn('rooms', 'is_public')
  pgm.dropColumn('rooms', 'max_members')
  pgm.dropColumn('rooms', 'last_activity')
}
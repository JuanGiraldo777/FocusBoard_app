import { env } from "./config/env.ts";
import { connectDB } from "./config/database.ts";
import { initRedis } from "./config/redis.ts";
import { createApp, createSocketIO } from "./app.ts";
import { createServer } from "http";

const startServer = async (): Promise<void> => {
  console.log("Iniciando FocusBoard Backend...");

  // Verificar conexión a PostgreSQL
  await connectDB();

  // Inicializar Redis para rate limiting
  await initRedis();

  // Crear y inicializar Express
  const app = createApp();

  // Crear servidor HTTP y Socket.io
  const httpServer = createServer(app);
  const io = await createSocketIO(httpServer);

  // Iniciar servidor
  const port = parseInt(env.PORT, 10);
  httpServer.listen(port, () => {
    console.log(` Servidor corriendo en http://localhost:${port}`);
    console.log(` Socket.io iniciado`);
  });
};

startServer().catch((error) => {
  console.error("Error iniciando servidor:", error);
  process.exit(1);
});

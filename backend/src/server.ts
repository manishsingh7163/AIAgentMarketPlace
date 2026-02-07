import app from "./app";
import { config } from "./config";
import { connectDatabase, disconnectDatabase } from "./config/database";

async function main() {
  // Connect to the database
  await connectDatabase();

  const server = app.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║   AI Agent Marketplace API                   ║
║   Running on port ${config.port}                      ║
║   Environment: ${config.nodeEnv.padEnd(28)}║
╚══════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    server.close(async () => {
      await disconnectDatabase();
      console.log("Server shut down gracefully");
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

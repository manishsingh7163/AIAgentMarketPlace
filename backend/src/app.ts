import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import hpp from "hpp";
import { config } from "./config";
import { apiLimiter } from "./middleware/rateLimiter";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

// Routes
import authRoutes from "./routes/auth.routes";
import agentRoutes from "./routes/agent.routes";
import listingRoutes from "./routes/listing.routes";
import orderRoutes from "./routes/order.routes";
import transactionRoutes from "./routes/transaction.routes";

const app = express();

// ─── Security Middleware ──────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  })
);
app.use(hpp()); // Prevent HTTP parameter pollution

// ─── Body Parsing ─────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" })); // Limit body size
app.use(express.urlencoded({ extended: false }));

// ─── Logging ──────────────────────────────────────────────────────
if (config.isDev) {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ─── Rate Limiting ────────────────────────────────────────────────
app.use("/api", apiLimiter);

// ─── Health Check ─────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    },
  });
});

// ─── API Routes ───────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/transactions", transactionRoutes);

// ─── Error Handling ───────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

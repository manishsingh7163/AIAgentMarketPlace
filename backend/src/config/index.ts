import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  isDev: process.env.NODE_ENV !== "production",

  database: {
    url: process.env.DATABASE_URL!,
  },

  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "change-this-in-production",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  platform: {
    feePercent: parseFloat(process.env.PLATFORM_FEE_PERCENT || "1"),
    walletAddress: process.env.PLATFORM_WALLET_ADDRESS || "", // Solana wallet for receiving 1% fees
  },

  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
    usdcMint: process.env.USDC_MINT || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC on Solana mainnet
    network: process.env.SOLANA_NETWORK || "mainnet-beta",
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },

  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
      : ["http://localhost:5173"],
  },
} as const;

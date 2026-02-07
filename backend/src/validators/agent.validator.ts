import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  description: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
});

export const verificationSchema = z.object({
  capabilities: z
    .array(z.string().max(100))
    .min(1, "At least one capability is required")
    .max(20),
  endpoint: z.string().url().optional(),
  webhookUrl: z.string().url().optional(),
  publicKey: z.string().max(2000).optional(),
});

import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  API_HOST: z.string().default("0.0.0.0"),
  API_PORT: z.coerce.number().int().positive().default(3333),
  APP_DOMAIN: z.string().default("localhost"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  JWT_SECRET: z.string().min(32).default("change-this-development-secret-with-32-chars"),
  UPLOAD_DIR: z.string().default("uploads")
});

export const env = envSchema.parse(process.env);

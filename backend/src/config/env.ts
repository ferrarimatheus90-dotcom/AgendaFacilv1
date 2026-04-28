import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().optional().default("file:./dev.db"),
  REDIS_URL: z.string().optional().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(16).default("super-secret-key-agentflow-testing"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  EVOLUTION_API_URL: z.string().url().optional().default("http://localhost:8080"),
  EVOLUTION_API_KEY: z.string().optional().default("demo-key"),
  WEBHOOK_URL: z.string().url().optional(),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import jwt from "@fastify/jwt";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { authRoutes } from "./modules/auth/auth.routes";
import { agentsRoutes } from "./modules/agents/agents.routes";
import { conversationsRoutes } from "./modules/conversations/conversations.routes";
import { messagesRoutes } from "./modules/messages/messages.routes";
import { webhookRoutes } from "./modules/whatsapp/webhook.routes";
import { whatsappRoutes } from "./modules/whatsapp/whatsapp.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";
import { settingsRoutes } from "./modules/settings/settings.routes";
import { startWorker } from "./jobs/processMessage.job";

const app = Fastify({ logger: true });

async function bootstrap() {
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
  });
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
  await app.register(jwt, { secret: env.JWT_SECRET });

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(agentsRoutes, { prefix: "/api/agents" });
  await app.register(conversationsRoutes, { prefix: "/api/conversations" });
  await app.register(messagesRoutes, { prefix: "/api/messages" });
  await app.register(webhookRoutes, { prefix: "/api/webhook" });
  await app.register(whatsappRoutes, { prefix: "/api/whatsapp" });
  await app.register(dashboardRoutes, { prefix: "/api/dashboard" });
  await app.register(settingsRoutes, { prefix: "/api/settings" });

  app.setErrorHandler((error, _req, reply) => {
    logger.error(error);
    reply.status(error.statusCode ?? 500).send({
      error: error.message ?? "Internal Server Error",
    });
  });

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  logger.info(`AgentFlow backend running on port ${env.PORT}`);

  // startWorker();
  // logger.info("BullMQ worker started");
}

bootstrap().catch((err) => {
  logger.error(err);
  process.exit(1);
});

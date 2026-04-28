import type { FastifyInstance } from "fastify";
import { authenticate } from "../auth/auth.middleware";
import { getDashboardStats, getDashboardActivity, getRecentActivity } from "./dashboard.service";

export async function dashboardRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/stats", async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const stats = await getDashboardStats(sub);
    return reply.send(stats);
  });

  app.get("/activity", async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const activity = await getDashboardActivity(sub);
    return reply.send({ activity });
  });

  app.get("/recent", async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const recent = await getRecentActivity(sub);
    return reply.send({ recent });
  });
}

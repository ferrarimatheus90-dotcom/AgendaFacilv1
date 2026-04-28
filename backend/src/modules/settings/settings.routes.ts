import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../auth/auth.middleware";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

const updateApiKeysSchema = z.object({
  apiKeyAnthropic: z.string().optional().nullable(),
  apiKeyOpenAI: z.string().optional().nullable(),
});

export async function settingsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.put("/profile", async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const body = updateProfileSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten().fieldErrors });
    }

    const { currentPassword, newPassword, ...fields } = body.data;
    const updateData: Record<string, unknown> = { ...fields };

    if (newPassword) {
      if (!currentPassword) {
        return reply.status(400).send({ error: "currentPassword is required to change password" });
      }
      const user = await prisma.user.findUnique({ where: { id: sub } });
      if (!user) return reply.status(404).send({ error: "User not found" });

      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) return reply.status(401).send({ error: "Invalid current password" });

      updateData.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    const user = await prisma.user.update({
      where: { id: sub },
      data: updateData,
      select: { id: true, name: true, email: true, plan: true },
    });

    return reply.send({ user });
  });

  app.put("/api-keys", async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const body = updateApiKeysSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten().fieldErrors });
    }

    await prisma.user.update({
      where: { id: sub },
      data: body.data,
    });

    return reply.send({ ok: true });
  });
}

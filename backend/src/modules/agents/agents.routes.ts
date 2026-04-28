import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../auth/auth.middleware";
import { createAgentSchema, updateAgentSchema } from "./agents.schema";
import {
  listAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  toggleAgent,
} from "./agents.service";
import { testAgent } from "./agents.test.service";

export async function agentsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/", async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const agents = await listAgents(sub);
    return reply.send({ agents });
  });

  app.post("/", async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const body = createAgentSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten().fieldErrors });
    }
    const agent = await createAgent(sub, body.data);
    return reply.status(201).send({ agent });
  });

  app.get("/:id", async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { id } = req.params as { id: string };
    const agent = await getAgent(id, sub);
    return reply.send({ agent });
  });

  app.put("/:id", async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { id } = req.params as { id: string };
    const body = updateAgentSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten().fieldErrors });
    }
    const agent = await updateAgent(id, sub, body.data);
    return reply.send({ agent });
  });

  app.delete("/:id", async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { id } = req.params as { id: string };
    await deleteAgent(id, sub);
    return reply.status(204).send();
  });

  app.patch("/:id/toggle", async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { id } = req.params as { id: string };
    const result = await toggleAgent(id, sub);
    return reply.send(result);
  });

  app.post("/:id/test", async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { id } = req.params as { id: string };
    const body = z.object({ message: z.string().min(1) }).safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten().fieldErrors });
    }
    try {
      const result = await testAgent(id, sub, body.data.message);
      return reply.send(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro interno no agente";
      const status = (err as { statusCode?: number }).statusCode ?? 500;
      return reply.status(status).send({ error: message });
    }
  });
}

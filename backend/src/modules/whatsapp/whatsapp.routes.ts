import type { FastifyInstance } from "fastify";
import { authenticate } from "../auth/auth.middleware";
import { createInstanceSchema, listInstances, createInstance, getInstanceQrCode, getInstanceStatus } from "./whatsapp.service";

export async function whatsappRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/instances", async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const instances = await listInstances(sub);
    return reply.send({ instances });
  });

  app.post("/instances", async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const body = createInstanceSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten().fieldErrors });
    }
    try {
      const instance = await createInstance(sub, body.data);
      return reply.status(201).send({ instance });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao criar instância";
      const isPrismaUnique = msg.includes("Unique constraint");
      const status = (err as { statusCode?: number }).statusCode ?? 400;
      return reply.status(isPrismaUnique ? 409 : status).send({
        error: isPrismaUnique
          ? `Já existe uma instância com o nome "${body.data.instanceName}". Use um nome diferente.`
          : msg,
      });
    }
  });

  app.post("/instances/:id/connect", async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { id } = req.params as { id: string };
    const data = await getInstanceQrCode(id, sub);
    return reply.send(data);
  });

  app.get("/instances/:id/status", async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { id } = req.params as { id: string };
    const data = await getInstanceStatus(id, sub);
    return reply.send(data);
  });
}

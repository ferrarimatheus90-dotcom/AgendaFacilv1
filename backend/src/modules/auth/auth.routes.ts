import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerSchema, loginSchema } from "./auth.schema";
import { registerUser, loginUser, getUserById } from "./auth.service";
import { authenticate } from "./auth.middleware";
import { env } from "../../config/env";

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", async (req, reply) => {
    const body = registerSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten().fieldErrors });
    }

    const user = await registerUser(body.data);
    const token = app.jwt.sign({ sub: user.id }, { expiresIn: env.JWT_EXPIRES_IN });

    return reply.status(201).send({ user, token });
  });

  app.post("/login", async (req, reply) => {
    const body = loginSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten().fieldErrors });
    }

    const user = await loginUser(body.data);
    const token = app.jwt.sign({ sub: user.id }, { expiresIn: env.JWT_EXPIRES_IN });

    return reply.send({ user, token });
  });

  app.get("/me", { preHandler: authenticate }, async (req, reply) => {
    const payload = req.user as { sub: string };
    const user = await getUserById(payload.sub);
    return reply.send({ user });
  });
}

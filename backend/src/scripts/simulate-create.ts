import { sign } from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";

async function simulateCreate() {
  const user = await prisma.user.findFirst({ where: { email: "admin@agentflow.com" } });
  if (!user) {
    console.error("User admin@agentflow.com not found!");
    return;
  }

  const token = sign({ userId: user.id }, env.JWT_SECRET);
  console.log(`Simulando criação de instância para: ${user.email}`);
  
  const payload = {
    instanceName: "Marketing",
    // Os campos opcionais deixaremos vazios para usar o padrão do .env
  };

  const res = await fetch("http://localhost:3001/api/whatsapp/instances", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log(`Status: ${res.status}`);
  console.log("Resposta:", JSON.stringify(data, null, 2));
}

simulateCreate();

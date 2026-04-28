import { prisma } from "../lib/prisma";

async function clean() {
  await prisma.whatsAppInstance.deleteMany();
  await prisma.agent.deleteMany();
  console.log("Banco de dados limpo para testes!");
}

clean();

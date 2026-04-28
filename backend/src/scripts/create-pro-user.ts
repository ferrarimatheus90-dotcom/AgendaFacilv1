import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "teste@agentflow.com";
  const password = "password123";
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { plan: "PRO" },
    create: {
      name: "Usuário Teste PRO",
      email,
      passwordHash,
      plan: "PRO",
    },
  });

  console.log("Usuário PRO criado com sucesso!");
  console.log("Email:", email);
  console.log("Senha:", password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

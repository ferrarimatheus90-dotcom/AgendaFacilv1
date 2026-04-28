import { prisma } from "../lib/prisma";
import { createInstance } from "../modules/whatsapp/whatsapp.service";

async function testService() {
  const user = await prisma.user.findFirst({ where: { email: "admin@agentflow.com" } });
  if (!user) {
    console.error("User admin@agentflow.com not found!");
    return;
  }

  console.log(`--- Testando criação de instância via Service ---`);
  console.log(`Usuário: ${user.email} (${user.id})`);

  try {
    const result = await createInstance(user.id, {
      instanceName: "Marketing",
      // ele vai usar o .env do backend
    });
    console.log("✅ Instância criada com sucesso!");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("❌ Erro ao criar instância:");
    console.error(err);
  }
}

testService();

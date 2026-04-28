import { prisma } from "../lib/prisma";

async function checkDatabase() {
  console.log("--- Verificando Banco de Dados AgentFlow ---");
  
  const users = await prisma.user.findMany();
  console.log(`Usuários: ${users.length}`);
  for (const u of users) {
    console.log(` - ${u.email}`);
  }

  const instances = await prisma.whatsAppInstance.findMany();
  console.log(`\nInstâncias no DB: ${instances.length}`);
  for (const inst of instances) {
    console.log(` - ${inst.instanceName} | Status: ${inst.status} | URL: ${inst.evolutionUrl}`);
  }

  const agents = await prisma.agent.findMany();
  console.log(`\nAgentes no DB: ${agents.length}`);
  for (const a of agents) {
    console.log(` - ${a.name} | Status: ${a.status} | InstanceID: ${a.instanceId}`);
  }
}

checkDatabase();

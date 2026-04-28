import { prisma } from "../lib/prisma";
import { EvolutionClient } from "../modules/whatsapp/evolution.client";
import { env } from "../config/env";

async function main() {
  const instances = await prisma.whatsAppInstance.findMany();
  
  const webhookUrl = env.WEBHOOK_URL || `${env.FRONTEND_URL.replace("3000", "3001")}/api/webhook/evolution`;
  console.log(`Setting webhook URL to: ${webhookUrl}`);

  for (const instance of instances) {
    try {
      const client = new EvolutionClient(instance.evolutionUrl, instance.evolutionKey);
      await client.setWebhook(instance.instanceName, {
        url: webhookUrl,
        webhook_by_events: true,
        events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
      });
      console.log(`Successfully updated webhook for instance: ${instance.instanceName}`);
    } catch (err: any) {
      console.error(`Failed to update webhook for instance ${instance.instanceName}:`, err.message);
    }
  }
}

main().catch(console.error).finally(() => process.exit(0));

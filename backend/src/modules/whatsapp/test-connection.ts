import { env } from "../../config/env";
import { EvolutionClient } from "./evolution.client";

const TEST_PHONE = "5515996566722";

async function testConnection() {
  console.log("\n╔═══════════════════════════════════════╗");
  console.log("║   Teste de Conexão — Evolution API    ║");
  console.log("╚═══════════════════════════════════════╝\n");
  console.log(`🌐 URL: ${env.EVOLUTION_API_URL}`);
  console.log(`🔑 Key: ${env.EVOLUTION_API_KEY.slice(0, 8)}${"*".repeat(8)}`);
  console.log(`📱 Número de teste: ${TEST_PHONE}\n`);

  const client = new EvolutionClient(env.EVOLUTION_API_URL, env.EVOLUTION_API_KEY);

  // 1. Listar instâncias
  console.log("── [1/4] Listando instâncias ──────────────");
  let instances;
  try {
    instances = await client.fetchInstances();
  } catch (err: unknown) {
    console.log(`❌ Erro ao conectar: ${err instanceof Error ? err.message : err}`);
    console.log("💡 Verifique EVOLUTION_API_URL e EVOLUTION_API_KEY no .env");
    return;
  }

  console.log(`✅ ${instances.length} instância(s) encontrada(s)`);
  for (const inst of instances) {
    const icon = inst.connectionStatus === "open" ? "🟢" : "🔴";
    const phone = inst.ownerJid?.replace("@s.whatsapp.net", "") ?? "—";
    console.log(`   ${icon} "${inst.name}" | ${inst.connectionStatus} | 📱 ${phone}`);
  }

  // 2. Usar a instância conectada
  const connected = instances.find((i) => i.connectionStatus === "open");
  console.log(`\n── [2/4] Instância ativa ───────────────────`);
  if (!connected) {
    console.log("❌ Nenhuma instância com connectionStatus=open");
    console.log(`   Acesse ${env.EVOLUTION_API_URL}/manager e conecte um WhatsApp`);
    return;
  }
  console.log(`✅ Usando: "${connected.name}"`);
  console.log(`   ID:      ${connected.id}`);
  console.log(`   Perfil:  ${connected.profileName ?? "—"}`);
  console.log(`   JID:     ${connected.ownerJid ?? "—"}`);
  console.log(`   Token:   ${connected.token.slice(0, 8)}...`);

  // 3. Verificar número no WhatsApp
  console.log(`\n── [3/4] Validando ${TEST_PHONE} no WhatsApp ──`);
  try {
    const res = await fetch(
      `${env.EVOLUTION_API_URL}/chat/whatsappNumbers/${connected.name}`,
      {
        method: "POST",
        headers: { apikey: env.EVOLUTION_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ numbers: [TEST_PHONE] }),
      },
    );
    const data = await res.json() as Array<{ exists: boolean; jid: string }>;
    if (Array.isArray(data) && data[0]?.exists) {
      console.log(`✅ Número válido: ${data[0].jid}`);
    } else {
      console.log(`⚠️  Número não encontrado no WhatsApp`);
    }
  } catch {
    console.log("⚠️  Não foi possível validar o número");
  }

  // 4. Enviar mensagem de teste
  console.log(`\n── [4/4] Enviando mensagem de teste ────────`);
  try {
    const result = await client.sendText(connected.name, {
      number: TEST_PHONE,
      text: `🤖 *AgentFlow* — conexão verificada com sucesso!\n\nInstância: *${connected.name}*`,
    }) as { key?: { id?: string } };
    console.log(`✅ Mensagem enviada!`);
    console.log(`   Message ID: ${result?.key?.id ?? "—"}`);
  } catch (err: unknown) {
    console.log(`❌ Falha ao enviar: ${err instanceof Error ? err.message : err}`);
  }

  console.log("\n════════════════════════════════════════════");
  console.log(`✅ Instância para usar no AgentFlow: "${connected.name}"`);
  console.log("════════════════════════════════════════════\n");
}

testConnection().catch(console.error);

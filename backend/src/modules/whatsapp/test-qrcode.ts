import { env } from "../../config/env";
import { EvolutionClient } from "./evolution.client";

async function testQrCode() {
  const client = new EvolutionClient(env.EVOLUTION_API_URL, env.EVOLUTION_API_KEY);
  
  // Como já sabemos que "Marketing" existe, vamos tentar pegar o QR Code.
  // Note: se já estiver conectado, pode retornar erro ou status=open.
  console.log("--- Testando Get QR Code ---");
  try {
    const data = await client.getQrCode("Marketing");
    console.log("Resposta do Connect:");
    console.log(JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error("❌ Erro ao buscar QR Code:");
    console.error(err.message);
    if (err.statusCode) console.error(`Código: ${err.statusCode}`);
  }
}

testQrCode();

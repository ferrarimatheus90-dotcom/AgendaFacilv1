// Compatible with Evolution API v2.3+

export interface EvolutionInstance {
  id: string;
  name: string;
  connectionStatus: "open" | "close" | "connecting";
  ownerJid: string | null;
  profileName: string | null;
  token: string;
}

interface SendTextPayload {
  number: string;
  text: string;
}

interface SetWebhookPayload {
  url: string;
  webhook_by_events: boolean;
  events: string[];
}

export class EvolutionClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        apikey: this.apiKey,
        ...(options.headers ?? {}),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw Object.assign(new Error(`Evolution API error (${res.status}): ${text}`), {
        statusCode: res.status,
      });
    }

    return res.json() as Promise<T>;
  }

  async fetchInstances(): Promise<EvolutionInstance[]> {
    const raw = await this.request<{ value: EvolutionInstance[] } | EvolutionInstance[]>(
      "/instance/fetchInstances",
    );
    // v2.3+ returns { value: [...], Count: N }, older versions return plain array
    return Array.isArray(raw) ? raw : (raw as { value: EvolutionInstance[] }).value ?? [];
  }

  async getInstanceStatus(instanceName: string): Promise<EvolutionInstance | null> {
    const raw = await this.request<{ value: EvolutionInstance[] } | EvolutionInstance[]>(
      `/instance/fetchInstances?instanceName=${instanceName}`,
    );
    const list = Array.isArray(raw) ? raw : (raw as { value: EvolutionInstance[] }).value ?? [];
    return list[0] ?? null;
  }

  sendText(instanceName: string, payload: SendTextPayload) {
    return this.request(`/message/sendText/${instanceName}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  getQrCode(instanceName: string) {
    return this.request(`/instance/connect/${instanceName}`);
  }

  createInstance(instanceName: string) {
    return this.request("/instance/create", {
      method: "POST",
      body: JSON.stringify({ instanceName, qrcode: true }),
    });
  }

  setWebhook(instanceName: string, payload: SetWebhookPayload) {
    // Evolution API v2.3+ requires a "webhook" wrapper object
    return this.request(`/webhook/set/${instanceName}`, {
      method: "POST",
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: payload.url,
          webhookByEvents: payload.webhook_by_events,
          webhookBase64: false,
          events: payload.events,
        },
      }),
    });
  }
}

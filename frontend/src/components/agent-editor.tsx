"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Agent } from "@/stores/agents.store";

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  systemPrompt: z.string().min(1, "Prompt obrigatório"),
  model: z.enum(["CLAUDE_SONNET", "CLAUDE_HAIKU", "GPT_4O", "GPT_4O_MINI"]),
  tone: z.enum(["FRIENDLY", "PROFESSIONAL", "CASUAL", "TECHNICAL"]),
  language: z.string().default("pt-BR"),
  memoryEnabled: z.boolean().default(true),
  memoryWindow: z.coerce.number().int().min(1).max(100).default(20),
  instanceId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface AgentEditorProps {
  defaultValues?: Partial<Agent>;
  onSave: (data: FormData) => Promise<void>;
  isSaving?: boolean;
}

const PROMPT_TEMPLATES = [
  {
    label: "Geral: Atendimento & Vendas",
    content: "Você é um atendente virtual prestativo e enérgico. Ajude os clientes a encontrarem os produtos ideais, destaque benefícios e conduza para o fechamento da compra. Responda sucintamente e use emojis com moderação.",
  },
  {
    label: "Geral: Suporte Técnico",
    content: "Você é um especialista de suporte técnico. Responda de forma clara, passo a passo, evitando jargões complexos sempre que possível. Tenha paciência, seja analítico e, se o problema não for resolvido rapidamente, peça que o cliente aguarde o contato humano.",
  },
  {
    label: "Nicho: Barbearia",
    content: "Você é o assistente virtual da melhor barbearia da cidade. Mantenha um tom de voz descontraído, com estilo 'brother'. Sua função é captar novos agendamentos de corte de cabelo e barba, enviando as opções de horários e valores. Finalize confirmando o agendamento.",
  },
  {
    label: "Nicho: Oficina Mecânica",
    content: "Você é um assistente virtual de uma oficina mecânica de confiança. Seja pragmático, atencioso e passe segurança ao cliente. Colete o modelo do veículo, o defeito relatado e ofereça opções para agendamento de revisão ou guincho. Não dê diagnósticos prontos de defeitos mecânicos pelo chat.",
  },
  {
    label: "Nicho: Delivery de Comida",
    content: "Você é um garçom digital rápido e simpático de um delivery (hamburgueria/pizzaria/restaurante). Ajude o cliente a montar o pedido, faça upselling suave (ex: 'deseja adicionar uma bebida?'), confirme o endereço, a forma de pagamento e informe o tempo estimado de entrega.",
  },
  {
    label: "Nicho: Corretor de Imóveis",
    content: "Você é um assistente digital de correção imobiliária. Seja sofisticado, atencioso e profissional. Descubra qual perfil de imóvel o cliente procura (compra ou aluguel, dormitórios, faixa de valor). Envie informações de imóveis cadastrados e agende visitas com o corretor responsável.",
  },
  {
    label: "Nicho: Clínica Médica/Odonto",
    content: "Você é um atendente humanizado de uma clínica. Transmita segurança, privacidade e acolhimento. Obtenha do paciente o tipo de queixa ou especialidade que deseja buscar, cruze com a agenda dos profissionais e confirme a marcação. Respeite as práticas éticas de saúde (não prescreva ou faça diagnósticos).",
  },
  {
    label: "Nicho: Loja de Moda/Roupas",
    content: "Você é o personal stylist digital da loja. Fale sobre as novas tendências de moda, pergunte os tamanhos dos clientes e ofereça links/imagens das peças da coleção. Seja persuasivo e sempre mencione opções de frete grátis ou parcelamento quando chegar no momento da venda.",
  }
];

export function AgentEditor({ defaultValues, onSave, isSaving }: AgentEditorProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      systemPrompt: defaultValues?.systemPrompt ?? "",
      model: (defaultValues?.model as FormData["model"]) ?? "GPT_4O",
      tone: (defaultValues?.tone as FormData["tone"]) ?? "FRIENDLY",
      language: defaultValues?.language ?? "pt-BR",
      memoryEnabled: defaultValues?.memoryEnabled ?? true,
      memoryWindow: defaultValues?.memoryWindow ?? 20,
      instanceId: defaultValues?.instanceId ?? undefined,
    },
  });

  const memoryEnabled = watch("memoryEnabled");

  return (
    <form onSubmit={handleSubmit(onSave)}>
      <Tabs defaultValue="prompt">
        <TabsList className="mb-6">
          <TabsTrigger value="prompt">Prompt</TabsTrigger>
          <TabsTrigger value="personality">Personalidade</TabsTrigger>
          <TabsTrigger value="memory">Memória</TabsTrigger>
        </TabsList>

        <TabsContent value="prompt" className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome do agente</Label>
            <Input placeholder="Ex: Atendente da Loja" {...register("name")} />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex-1">
                <Label>System Prompt (Instruções)</Label>
                <p className="text-xs text-text-muted mt-1">Diga ao agente quem ele é e o que deve fazer nas conversas.</p>
              </div>
              <div className="w-full md:w-64">
                <Select
                  onValueChange={(v) => {
                    if (v) setValue("systemPrompt", v, { shouldValidate: true });
                  }}
                >
                  <SelectTrigger className="h-8 text-xs bg-accent/5 border-accent/20 text-accent">
                    <SelectValue placeholder="Carregar um modelo incrível..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PROMPT_TEMPLATES.map(t => (
                      <SelectItem key={t.label} value={t.content} className="text-xs">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Textarea
              placeholder="Você é um assistente da agência. Responda sempre de forma polida..."
              className="min-h-[240px] mt-2"
              {...register("systemPrompt")}
            />

            {errors.systemPrompt && <p className="text-xs text-red-400">{errors.systemPrompt.message}</p>}
          </div>
        </TabsContent>

        <TabsContent value="personality" className="space-y-4">
          <div className="space-y-1.5">
            <Label>Modelo de IA</Label>
            <Select
              defaultValue={defaultValues?.model ?? "GPT_4O"}
              onValueChange={(v) => setValue("model", v as FormData["model"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GPT_4O">GPT-4o (recomendado)</SelectItem>
                <SelectItem value="GPT_4O_MINI">GPT-4o mini (rápido)</SelectItem>
                <SelectItem value="CLAUDE_SONNET">Claude Sonnet</SelectItem>
                <SelectItem value="CLAUDE_HAIKU">Claude Haiku</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Tom de voz</Label>
            <Select
              defaultValue={defaultValues?.tone ?? "FRIENDLY"}
              onValueChange={(v) => setValue("tone", v as FormData["tone"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FRIENDLY">Amigável</SelectItem>
                <SelectItem value="PROFESSIONAL">Profissional</SelectItem>
                <SelectItem value="CASUAL">Casual</SelectItem>
                <SelectItem value="TECHNICAL">Técnico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Idioma</Label>
            <Select
              defaultValue={defaultValues?.language ?? "pt-BR"}
              onValueChange={(v) => setValue("language", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português (BR)</SelectItem>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="es-ES">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="memory" className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-surface">
            <div>
              <p className="text-sm font-medium">Memória de conversa</p>
              <p className="text-xs text-text-muted mt-0.5">O agente lembra das mensagens anteriores</p>
            </div>
            <Switch
              checked={memoryEnabled}
              onCheckedChange={(v) => setValue("memoryEnabled", v)}
            />
          </div>

          {memoryEnabled && (
            <div className="space-y-1.5">
              <Label>Janela de memória (mensagens)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                {...register("memoryWindow")}
              />
              <p className="text-xs text-text-muted">Quantas mensagens anteriores o agente considera</p>
              {errors.memoryWindow && <p className="text-xs text-red-400">{errors.memoryWindow.message}</p>}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6 pt-4 border-t border-border">
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          Salvar agente
        </Button>
      </div>
    </form>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { AgentEditor } from "@/components/agent-editor";
import { AgentTester } from "@/components/agent-tester";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAgentsStore, type Agent } from "@/stores/agents.store";
import { api } from "@/lib/api";

export default function EditAgentPage() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { update } = useAgentsStore();
  const router = useRouter();

  useEffect(() => {
    api.get<{ agent: Agent }>(`/api/agents/${id}`).then((r) => setAgent(r.agent)).catch(console.error);
  }, [id]);

  const handleSave = async (data: Partial<Agent>) => {
    setIsSaving(true);
    try {
      await update(id, data);
      router.push("/agents");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <Topbar
        title={agent?.name ?? "Editar agente"}
        actions={
          <Link href="/agents">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
          </Link>
        }
      />
      <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-5xl">
        {!agent ? (
          <div className="flex items-center justify-center py-24 col-span-2">
            <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
          </div>
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <AgentEditor defaultValues={agent} onSave={handleSave} isSaving={isSaving} />
              </CardContent>
            </Card>

            <div className="space-y-3">
              <p className="text-sm font-medium text-text-muted">Teste em tempo real</p>
              <AgentTester agentId={agent.id} agentName={agent.name} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

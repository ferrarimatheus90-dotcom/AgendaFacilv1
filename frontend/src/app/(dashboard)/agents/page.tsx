"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Plus, Bot } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { AgentCard } from "@/components/agent-card";
import { Button } from "@/components/ui/button";
import { useAgentsStore } from "@/stores/agents.store";

export default function AgentsPage() {
  const { agents, isLoading, fetch, toggle, remove } = useAgentsStore();

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div>
      <Topbar
        title="Agentes"
        description="Gerencie seus agentes de IA"
        actions={
          <Link href="/agents/new">
            <Button size="sm">
              <Plus className="w-4 h-4" /> Novo agente
            </Button>
          </Link>
        }
      />

      <div className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Nenhum agente criado</h2>
            <p className="text-text-muted text-sm mb-6">Crie seu primeiro agente de IA para WhatsApp</p>
            <Link href="/agents/new">
              <Button>
                <Plus className="w-4 h-4" /> Criar primeiro agente
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} onToggle={toggle} onDelete={remove} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

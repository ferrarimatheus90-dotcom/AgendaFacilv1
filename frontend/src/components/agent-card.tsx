"use client";
import { Bot, MessageSquare, Phone, MoreVertical, Pause, Play, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Agent } from "@/stores/agents.store";

const modelLabels: Record<string, string> = {
  CLAUDE_SONNET: "Claude Sonnet",
  CLAUDE_HAIKU: "Claude Haiku",
  GPT_4O: "GPT-4o",
  GPT_4O_MINI: "GPT-4o mini",
};

interface AgentCardProps {
  agent: Agent;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AgentCard({ agent, onToggle, onDelete }: AgentCardProps) {
  return (
    <Card className="hover:border-accent/30 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold">{agent.name}</h3>
              <p className="text-xs text-text-muted">{modelLabels[agent.model] ?? agent.model}</p>
            </div>
          </div>
          <Badge variant={agent.status === "ACTIVE" ? "success" : "muted"}>
            {agent.status === "ACTIVE" ? "Ativo" : "Pausado"}
          </Badge>
        </div>

        <p className="text-sm text-text-muted line-clamp-2 mb-4">{agent.systemPrompt}</p>

        <div className="flex items-center gap-4 text-xs text-text-muted mb-4">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            {agent._count?.conversations ?? 0} conversas
          </span>
          {agent.instance?.phoneNumber && (
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-whatsapp-green" />
              {agent.instance.phoneNumber}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/agents/${agent.id}`} className="flex-1">
            <Button variant="secondary" size="sm" className="w-full gap-1.5">
              <Edit className="w-3.5 h-3.5" /> Editar
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => onToggle(agent.id)} title={agent.status === "ACTIVE" ? "Pausar" : "Ativar"}>
            {agent.status === "ACTIVE" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(agent.id)} className="hover:text-red-400">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

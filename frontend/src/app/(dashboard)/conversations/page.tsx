"use client";
import { useEffect, useState } from "react";
import { MessageSquare, Search } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { ChatPanel } from "@/components/chat-panel";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { formatDate, formatPhone } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  contactName: string | null;
  contactPhone: string;
  status: string;
  updatedAt: string;
  agent: { id: string; name: string };
  messages: { content: string; role: string; createdAt: string }[];
  _count: { messages: number };
}

interface Message {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: string;
}

interface ConversationDetail {
  id: string;
  contactName: string | null;
  contactPhone: string;
  messages: Message[];
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<ConversationDetail | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get<{ conversations: Conversation[] }>("/api/conversations").then((r) => {
      setConversations(r.conversations);
    });
  }, []);

  const loadDetail = async (id: string) => {
    const { conversation } = await api.get<{ conversation: ConversationDetail }>(`/api/conversations/${id}`);
    setSelected(conversation);
  };

  const filtered = conversations.filter(
    (c) =>
      (c.contactName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      c.contactPhone.includes(search),
  );

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col">
      <Topbar title="Conversas" description="Histórico de atendimentos" />

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 border-r border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                placeholder="Buscar conversa..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-text-muted">
                <MessageSquare className="w-8 h-8 mb-2" />
                <p className="text-sm">Nenhuma conversa</p>
              </div>
            ) : (
              filtered.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => loadDetail(conv.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-border hover:bg-surface transition-colors",
                    selected?.id === conv.id && "bg-surface border-l-2 border-l-accent",
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">
                      {conv.contactName ?? formatPhone(conv.contactPhone)}
                    </p>
                    <span className="text-[10px] text-text-muted shrink-0 ml-2">
                      {formatDate(conv.updatedAt).split(",")[1]}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted truncate">
                    {conv.messages[0]?.content ?? "Sem mensagens"}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-text-muted">{conv.agent.name}</span>
                    <Badge variant={conv.status === "ACTIVE" ? "success" : "muted"} className="text-[10px] py-0">
                      {conv.status === "ACTIVE" ? "Ativo" : conv.status === "RESOLVED" ? "Resolvido" : "Aguardando"}
                    </Badge>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className="flex-1">
          {selected ? (
            <ChatPanel
              conversationId={selected.id}
              contactName={selected.contactName}
              contactPhone={selected.contactPhone}
              messages={selected.messages}
              onMessageSent={(msg) =>
                setSelected((s) => s ? { ...s, messages: [...s.messages, msg] } : s)
              }
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-text-muted">
              <MessageSquare className="w-12 h-12 mb-3" />
              <p className="text-sm">Selecione uma conversa</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

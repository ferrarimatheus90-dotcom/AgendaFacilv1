"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

interface AgentTesterProps {
  agentId: string;
  agentName: string;
}

export function AgentTester({ agentId, agentName }: AgentTesterProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput("");
    setError("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const { assistantReply } = await api.post<{ assistantReply: string }>(
        `/api/agents/${agentId}/test`,
        { message: userMsg },
      );
      setMessages((m) => [...m, { role: "assistant", content: assistantReply }]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao chamar o agente");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[420px] border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surface">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-sm font-medium">Testar: {agentName}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7"
          onClick={() => setMessages([])}
          title="Limpar conversa"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-text-muted text-sm gap-2">
            <Bot className="w-8 h-8 text-accent/40" />
            <p>Envie uma mensagem para testar o agente</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-accent" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-accent text-background rounded-br-sm"
                  : "bg-surface border border-border rounded-bl-sm"
              }`}
            >
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-text-muted" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-end gap-2">
            <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-accent" />
            </div>
            <div className="bg-surface border border-border rounded-2xl rounded-bl-sm px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20 text-xs text-red-400">
          {error}
        </div>
      )}

      <div className="p-3 border-t border-border flex items-center gap-2 bg-surface">
        <Input
          placeholder="Digite uma mensagem..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={isLoading}
          className="flex-1 bg-background"
        />
        <Button size="icon" onClick={send} disabled={!input.trim() || isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

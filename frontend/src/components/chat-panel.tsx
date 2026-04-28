"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, formatPhone } from "@/lib/utils";
import { api } from "@/lib/api";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: string;
}

interface ChatPanelProps {
  conversationId: string;
  contactName?: string | null;
  contactPhone: string;
  messages: Message[];
  onMessageSent?: (msg: Message) => void;
}

export function ChatPanel({ conversationId, contactName, contactPhone, messages, onMessageSent }: ChatPanelProps) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || isSending) return;
    setIsSending(true);
    try {
      const { message } = await api.post<{ message: Message }>(
        `/api/conversations/${conversationId}/intervene`,
        { text },
      );
      setText("");
      onMessageSent?.(message);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <p className="font-semibold text-sm">{contactName ?? formatPhone(contactPhone)}</p>
        <p className="text-xs text-text-muted">{formatPhone(contactPhone)}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.filter((m) => m.role !== "SYSTEM").map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "USER" ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === "USER"
                  ? "bg-surface border border-border text-text-primary rounded-tl-sm"
                  : "bg-whatsapp-green/15 border border-whatsapp-green/20 text-text-primary rounded-tr-sm"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className="text-[10px] text-text-muted mt-1 text-right">
                {formatDate(msg.createdAt)}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-border flex items-center gap-2">
        <Input
          placeholder="Enviar mensagem manual..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={isSending}
          className="flex-1"
        />
        <Button size="icon" onClick={sendMessage} disabled={!text.trim() || isSending}>
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

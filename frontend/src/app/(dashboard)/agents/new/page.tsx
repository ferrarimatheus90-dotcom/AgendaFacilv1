"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Topbar } from "@/components/topbar";
import { AgentEditor } from "@/components/agent-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAgentsStore } from "@/stores/agents.store";

export default function NewAgentPage() {
  const [isSaving, setIsSaving] = useState(false);
  const { create } = useAgentsStore();
  const router = useRouter();

  const handleSave = async (data: Parameters<typeof create>[0]) => {
    setIsSaving(true);
    try {
      await create(data);
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
        title="Novo agente"
        actions={
          <Link href="/agents">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
          </Link>
        }
      />
      <div className="p-6 max-w-2xl">
        <Card>
          <CardContent className="p-6">
            <AgentEditor onSave={handleSave} isSaving={isSaving} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

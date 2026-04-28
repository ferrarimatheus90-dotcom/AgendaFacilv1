"use client";
import { useEffect, useState } from "react";
import { Plus, Plug, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Topbar } from "@/components/topbar";
import { ConnectionCard } from "@/components/connection-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api } from "@/lib/api";

interface Instance {
  id: string;
  instanceName: string;
  phoneNumber: string | null;
  status: "CONNECTED" | "DISCONNECTED" | "CONNECTING";
  _count: { agents: number };
}

export default function ConnectionsPage() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    instanceName: string;
    evolutionUrl?: string;
    evolutionKey?: string;
  }>();

  const fetchInstances = () => {
    api.get<{ instances: Instance[] }>("/api/whatsapp/instances").then((r) => setInstances(r.instances));
  };

  useEffect(() => { fetchInstances(); }, []);

  const onSubmit = async (data: { instanceName: string; evolutionUrl?: string; evolutionKey?: string }) => {
    setIsCreating(true);
    try {
      await api.post("/api/whatsapp/instances", data);
      reset();
      setOpen(false);
      fetchInstances();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <Topbar
        title="Conexões WhatsApp"
        description="Gerencie suas instâncias da Evolution API"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4" /> Nova instância
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar instância WhatsApp</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label>Nome da instância</Label>
                  <Input placeholder="minha-loja" {...register("instanceName", { required: "Obrigatório" })} />
                  {errors.instanceName && <p className="text-xs text-red-400">{errors.instanceName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Evolution API URL (opcional)</Label>
                  <Input placeholder="http://localhost:8080" {...register("evolutionUrl")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Evolution API Key (opcional)</Label>
                  <Input type="password" placeholder="Deixe em branco para usar a padrão" {...register("evolutionKey")} />
                </div>
                <Button type="submit" className="w-full" disabled={isCreating}>
                  {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Criar instância
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="p-6">
        {instances.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <Plug className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Nenhuma instância conectada</h2>
            <p className="text-text-muted text-sm mb-6">Crie uma instância para conectar ao WhatsApp</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {instances.map((inst) => (
              <ConnectionCard key={inst.id} instance={inst} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

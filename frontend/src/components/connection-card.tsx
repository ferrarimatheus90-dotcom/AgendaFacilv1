"use client";
import { useState } from "react";
import { QrCode, Loader2, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

interface Instance {
  id: string;
  instanceName: string;
  phoneNumber: string | null;
  status: "CONNECTED" | "DISCONNECTED" | "CONNECTING";
  _count?: { agents: number };
}

interface ConnectionCardProps {
  instance: Instance;
}

export function ConnectionCard({ instance }: ConnectionCardProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const connect = async () => {
    setIsLoading(true);
    try {
      const data = await api.post<{ base64?: string; qrcode?: { base64?: string } }>(
        `/api/whatsapp/instances/${instance.id}/connect`,
        {},
      );
      const base64 = data.base64 ?? data.qrcode?.base64;
      if (base64) {
        setQrCode(base64);
      } else if ((data as any).instance?.state === "open") {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const statusConfig = {
    CONNECTED: { label: "Conectado", variant: "success" as const, icon: Wifi },
    DISCONNECTED: { label: "Desconectado", variant: "error" as const, icon: WifiOff },
    CONNECTING: { label: "Conectando...", variant: "warning" as const, icon: RefreshCw },
  };
  const { label, variant, icon: StatusIcon } = statusConfig[instance.status];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className="w-4 h-4" />
            {instance.instanceName}
          </CardTitle>
          <Badge variant={variant}>{label}</Badge>
        </div>
        <CardDescription>
          {instance.phoneNumber ? `📱 ${instance.phoneNumber}` : "Número não vinculado"}
          {instance._count ? ` · ${instance._count.agents} agente(s)` : ""}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {qrCode && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-text-muted">Escaneie com o WhatsApp</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" className="w-48 h-48 rounded-lg" />
          </div>
        )}

        {instance.status !== "CONNECTED" && (
          <Button variant="secondary" size="sm" onClick={connect} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
            {qrCode ? "Atualizar QR Code" : "Gerar QR Code"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

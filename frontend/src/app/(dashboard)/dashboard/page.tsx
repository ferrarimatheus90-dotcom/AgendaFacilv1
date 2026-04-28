"use client";
import { useEffect, useState } from "react";
import { Bot, MessageSquare, TrendingUp, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Topbar } from "@/components/topbar";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Stats {
  activeAgents: number;
  conversationsToday: number;
  messagesToday: number;
  totalConversations: number;
}

interface ActivityPoint {
  hour: string;
  count: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<ActivityPoint[]>([]);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    api.get<Stats>("/api/dashboard/stats").then(setStats).catch(console.error);
    api.get<{ activity: ActivityPoint[] }>("/api/dashboard/activity").then((r) => setActivity(r.activity)).catch(console.error);
    api.get<{ recent: any[] }>("/api/dashboard/recent").then((r) => setRecent(r.recent)).catch(console.error);
  }, []);

  return (
    <div>
      <Topbar title="Dashboard" description="Visão geral da sua plataforma" />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Agentes ativos" value={stats?.activeAgents ?? "—"} icon={Bot} accent />
          <StatCard title="Conversas hoje" value={stats?.conversationsToday ?? "—"} icon={MessageSquare} />
          <StatCard title="Mensagens hoje" value={stats?.messagesToday ?? "—"} icon={TrendingUp} />
          <StatCard title="Total conversas" value={stats?.totalConversations ?? "—"} icon={Users} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Atividade — últimas 24h</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={activity} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#25262f" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: "#8b8d9a", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval={3}
                  />
                  <YAxis
                    tick={{ fill: "#8b8d9a", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#15161f",
                      border: "1px solid #25262f",
                      borderRadius: 8,
                      color: "#e8e9ed",
                      fontSize: 12,
                    }}
                    cursor={{ fill: "#25262f" }}
                  />
                  <Bar dataKey="count" fill="#00d4aa" radius={[4, 4, 0, 0]} name="Mensagens" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Atividade recente</CardTitle>
              <TrendingUp className="w-4 h-4 text-text-muted" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recent.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-8">Nenhuma atividade recente</p>
                ) : (
                  recent.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        item.role === "USER" ? "bg-accent/10" : "bg-white/5"
                      )}>
                        {item.role === "USER" ? <MessageSquare className="w-4 h-4 text-accent" /> : <Bot className="w-4 h-4 text-text-muted" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-2">
                          <p className="text-xs font-semibold truncate">{item.contactName || item.contactPhone}</p>
                          <span className="text-[10px] text-text-muted">agora</span>
                        </div>
                        <p className="text-xs text-text-muted truncate mt-0.5">{item.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

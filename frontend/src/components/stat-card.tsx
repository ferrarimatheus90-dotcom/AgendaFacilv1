import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  accent?: boolean;
}

export function StatCard({ title, value, icon: Icon, trend, accent }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-text-muted">{title}</p>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent ? "bg-accent/10" : "bg-surface"}`}>
            <Icon className={`w-4 h-4 ${accent ? "text-accent" : "text-text-muted"}`} />
          </div>
        </div>
        <p className="text-3xl font-bold">{value}</p>
        {trend && <p className="text-xs text-text-muted mt-1">{trend}</p>}
      </CardContent>
    </Card>
  );
}

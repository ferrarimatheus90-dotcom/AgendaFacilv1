"use client";
import { Bell } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

interface TopbarProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Topbar({ title, description, actions }: TopbarProps) {
  return (
    <header className="h-16 border-b border-border px-6 flex items-center justify-between bg-background sticky top-0 z-10">
      <div>
        <h1 className="font-bold text-lg">{title}</h1>
        {description && <p className="text-xs text-text-muted">{description}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

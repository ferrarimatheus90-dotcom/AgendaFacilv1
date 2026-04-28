"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { useAuthStore } from "@/stores/auth.store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { token, fetchMe } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  // Aguarda a hidratação do Zustand antes de redirecionar
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchMe();
  }, [hydrated, token, router, fetchMe]);

  if (!hydrated) return null;
  if (!token) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

"use client";
import { create } from "zustand";
import { api } from "@/lib/api";

export interface Agent {
  id: string;
  name: string;
  systemPrompt: string;
  model: string;
  tone: string;
  language: string;
  memoryEnabled: boolean;
  memoryWindow: number;
  status: "ACTIVE" | "PAUSED";
  instanceId: string | null;
  instance?: { id: string; instanceName: string; status: string; phoneNumber: string | null } | null;
  _count?: { conversations: number };
  createdAt: string;
  updatedAt: string;
}

interface AgentsState {
  agents: Agent[];
  isLoading: boolean;
  fetch: () => Promise<void>;
  create: (data: Partial<Agent>) => Promise<Agent>;
  update: (id: string, data: Partial<Agent>) => Promise<Agent>;
  remove: (id: string) => Promise<void>;
  toggle: (id: string) => Promise<void>;
}

export const useAgentsStore = create<AgentsState>((set, get) => ({
  agents: [],
  isLoading: false,

  fetch: async () => {
    set({ isLoading: true });
    try {
      const { agents } = await api.get<{ agents: Agent[] }>("/api/agents");
      set({ agents, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  create: async (data) => {
    const { agent } = await api.post<{ agent: Agent }>("/api/agents", data);
    set((s) => ({ agents: [agent, ...s.agents] }));
    return agent;
  },

  update: async (id, data) => {
    const { agent } = await api.put<{ agent: Agent }>(`/api/agents/${id}`, data);
    set((s) => ({ agents: s.agents.map((a) => (a.id === id ? agent : a)) }));
    return agent;
  },

  remove: async (id) => {
    await api.delete(`/api/agents/${id}`);
    set((s) => ({ agents: s.agents.filter((a) => a.id !== id) }));
  },

  toggle: async (id) => {
    const { status } = await api.patch<{ id: string; status: string }>(`/api/agents/${id}/toggle`);
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === id ? { ...a, status: status as "ACTIVE" | "PAUSED" } : a,
      ),
    }));
  },
}));

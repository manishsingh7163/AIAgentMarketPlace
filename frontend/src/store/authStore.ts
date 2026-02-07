import { create } from "zustand";
import type { Agent } from "../types";
import { api } from "../services/api";

interface AuthState {
  agent: Agent | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    description?: string;
  }) => Promise<void>;
  logout: () => void;
  loadFromStorage: () => void;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  agent: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.login(email, password);
      const { agent, token } = res.data!;
      api.setToken(token);
      localStorage.setItem("token", token);
      localStorage.setItem("agent", JSON.stringify(agent));
      set({ agent, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await api.register(data);
      const { agent, token } = res.data!;
      api.setToken(token);
      localStorage.setItem("token", token);
      localStorage.setItem("agent", JSON.stringify(agent));
      set({ agent, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    api.setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("agent");
    set({ agent: null, token: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    const token = localStorage.getItem("token");
    const agentStr = localStorage.getItem("agent");
    if (token && agentStr) {
      try {
        const agent = JSON.parse(agentStr);
        api.setToken(token);
        set({ agent, token, isAuthenticated: true });
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("agent");
      }
    }
  },

  refreshProfile: async () => {
    try {
      const res = await api.getProfile();
      if (res.data) {
        localStorage.setItem("agent", JSON.stringify(res.data));
        set({ agent: res.data });
      }
    } catch {
      // Silent fail
    }
  },
}));

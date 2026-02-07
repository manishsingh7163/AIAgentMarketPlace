import type { ApiResponse, Agent, Listing, Order, Transaction, DashboardStats, Verification } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  }

  // ─── Auth ────────────────────────────────────────────────────────

  async register(body: { name: string; email: string; password: string; description?: string }) {
    return this.request<{ agent: Agent; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ agent: Agent; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  // ─── Agents ──────────────────────────────────────────────────────

  async getProfile() {
    return this.request<Agent>("/agents/me");
  }

  async updateProfile(data: { name?: string; description?: string }) {
    return this.request<Agent>("/agents/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async getDashboard() {
    return this.request<DashboardStats>("/agents/me/dashboard");
  }

  async getAgentPublic(id: string) {
    return this.request<Agent>(`/agents/${id}`);
  }

  async submitVerification(data: { capabilities: string[]; endpoint?: string; webhookUrl?: string }) {
    return this.request<Verification>("/agents/verify", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getVerificationStatus() {
    return this.request<Verification>("/agents/verify/status");
  }

  // ─── Listings ────────────────────────────────────────────────────

  async getListings(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<Listing[]>(`/listings${query ? `?${query}` : ""}`);
  }

  async getListing(id: string) {
    return this.request<Listing>(`/listings/${id}`);
  }

  async createListing(data: {
    title: string;
    description: string;
    category: string;
    type: "BUY" | "SELL";
    price: number;
    tags?: string[];
  }) {
    return this.request<Listing>("/listings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateListing(id: string, data: Record<string, unknown>) {
    return this.request<Listing>(`/listings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteListing(id: string) {
    return this.request<void>(`/listings/${id}`, { method: "DELETE" });
  }

  // ─── Orders ──────────────────────────────────────────────────────

  async getOrders(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<Order[]>(`/orders${query ? `?${query}` : ""}`);
  }

  async getOrder(id: string) {
    return this.request<Order>(`/orders/${id}`);
  }

  async createOrder(listingId: string, notes?: string) {
    return this.request<Order>("/orders", {
      method: "POST",
      body: JSON.stringify({ listingId, notes }),
    });
  }

  async verifyOrder(id: string) {
    return this.request<Order>(`/orders/${id}/verify`, { method: "POST" });
  }

  async completeOrder(id: string) {
    return this.request<Order>(`/orders/${id}/complete`, { method: "POST" });
  }

  async cancelOrder(id: string) {
    return this.request<Order>(`/orders/${id}/cancel`, { method: "POST" });
  }

  // ─── Transactions ────────────────────────────────────────────────

  async getTransactions(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<Transaction[]>(`/transactions${query ? `?${query}` : ""}`);
  }
}

export const api = new ApiClient();

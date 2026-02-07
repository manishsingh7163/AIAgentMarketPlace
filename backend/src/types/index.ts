import { Request } from "express";

export interface AuthPayload {
  agentId: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  agent?: AuthPayload;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ListingFilters {
  category?: string;
  type?: "BUY" | "SELL";
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  agentId?: string;
  status?: string;
}

export const PLATFORM_FEE_PERCENT = 1;

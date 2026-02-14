export interface Agent {
  id: string;
  name: string;
  email?: string;
  apiKey?: string;
  avatar?: string;
  description?: string;
  status: "PENDING" | "VERIFIED" | "SUSPENDED";
  rating: number;
  totalTrades: number;
  walletAddress?: string;
  isClaimed?: boolean;
  verifiedAt?: string;
  lastActive?: string;
  createdAt: string;
  verificaiton?: {
    status: string;
    capabilities: string[];
  };
}

export interface PaymentInfo {
  currency: string;
  network: string;
  networkId: string;
  usdcMint: string;
  platformFeePercent: number;
  platformWallet: string | null;
  explorerBase: string;
}

export interface PaymentInstructions {
  order: { id: string; status: string; listing: string };
  payment: {
    currency: string;
    network: string;
    totalAmount: number;
    breakdown: {
      sellerAmount: number;
      platformFee: number;
      feePercent: number;
    };
    instructions: Array<{
      label: string;
      to: string | null;
      toName: string;
      amount: number;
      currency: string;
      note?: string;
    }>;
  };
  buyer: { name: string; walletAddress: string | null };
  seller: { name: string; walletAddress: string | null };
  alreadyPaid: { txSignature: string; feeTxSignature: string | null } | null;
}

export interface Listing {
  id: string;
  agentId: string;
  agent: {
    id: string;
    name: string;
    rating: number;
    status: string;
    description?: string;
    totalTrades?: number;
  };
  title: string;
  description: string;
  category: ListingCategory;
  type: "BUY" | "SELL";
  price: number;
  currency: string;
  tags: string[];
  metadata?: Record<string, unknown>;
  status: "ACTIVE" | "PAUSED" | "SOLD" | "EXPIRED" | "CANCELLED";
  viewCount: number;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ListingCategory =
  | "DATA"
  | "API_SERVICE"
  | "MODEL"
  | "COMPUTE"
  | "STORAGE"
  | "AUTOMATION"
  | "ANALYSIS"
  | "CONTENT"
  | "OTHER";

export interface Order {
  id: string;
  listingId: string;
  listing: {
    id: string;
    title: string;
    type?: string;
    category?: string;
  };
  buyerId: string;
  buyer: { id: string; name: string; rating?: number };
  sellerId: string;
  seller: { id: string; name: string; rating?: number };
  amount: number;
  platformFee: number;
  totalAmount: number;
  buyerVerified: boolean;
  sellerVerified: boolean;
  verificationHash?: string;
  status: OrderStatus;
  notes?: string;
  completedAt?: string;
  createdAt: string;
  transaction?: Transaction;
}

export type OrderStatus =
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED"
  | "REFUNDED";

export interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  status: string;
  processedAt?: string;
  createdAt: string;
  order?: {
    id: string;
    listing: { id: string; title: string };
    buyer: { id: string; name: string };
    seller: { id: string; name: string };
  };
}

export interface DashboardStats {
  activeListings: number;
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
}

export interface Verification {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  capabilities: string[];
  endpoint?: string;
  reviewNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface ApiResponse<T> {
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

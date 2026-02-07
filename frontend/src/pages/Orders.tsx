import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";
import type { Order } from "../types";
import StatusBadge from "../components/StatusBadge";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

export default function Orders() {
  const { agent } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getOrders();
      setOrders(res.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    orderId: string,
    action: "verify" | "complete" | "cancel"
  ) => {
    setActionLoading(orderId);
    setError("");
    try {
      if (action === "verify") await api.verifyOrder(orderId);
      else if (action === "complete") await api.completeOrder(orderId);
      else if (action === "cancel") await api.cancelOrder(orderId);
      await fetchOrders();
    } catch (err: any) {
      setError(err.message || `Failed to ${action} order`);
    } finally {
      setActionLoading(null);
    }
  };

  const isBuyer = (order: Order) => order.buyerId === agent?.id;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 w-32 bg-gray-200 rounded mb-8" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-5 mb-4">
            <div className="h-5 w-48 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-32 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Orders</h1>
      <p className="text-gray-500 mb-8">
        Manage your buy and sell orders. Verify orders to proceed with transactions.
      </p>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-6 bg-red-50 text-red-700 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ChevronRight className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No orders yet
          </h3>
          <p className="text-gray-500 mb-4">
            Browse the marketplace and place your first order.
          </p>
          <Link to="/marketplace" className="btn-primary inline-flex">
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const buyer = isBuyer(order);
            const canVerify =
              (order.status === "PENDING_VERIFICATION" ||
                order.status === "VERIFIED") &&
              ((buyer && !order.buyerVerified) ||
                (!buyer && !order.sellerVerified));
            const canComplete =
              order.status === "VERIFIED" || order.status === "IN_PROGRESS";
            const canCancel =
              order.status !== "COMPLETED" && order.status !== "CANCELLED";

            return (
              <div key={order.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        to={`/listings/${order.listingId}`}
                        className="font-semibold text-gray-900 hover:text-brand-600 truncate"
                      >
                        {order.listing.title}
                      </Link>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span>
                        {buyer ? "Buying from" : "Selling to"}{" "}
                        <strong>
                          {buyer ? order.seller.name : order.buyer.name}
                        </strong>
                      </span>
                      <span>
                        Amount:{" "}
                        <strong className="text-gray-900">
                          ${order.amount.toLocaleString()}
                        </strong>
                      </span>
                      <span>
                        Fee: ${order.platformFee.toFixed(2)}
                      </span>
                      <span>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Verification Status */}
                    <div className="flex items-center gap-4 mt-2">
                      <span
                        className={`flex items-center gap-1 text-xs ${
                          order.buyerVerified
                            ? "text-emerald-600"
                            : "text-gray-400"
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Buyer {order.buyerVerified ? "verified" : "pending"}
                      </span>
                      <span
                        className={`flex items-center gap-1 text-xs ${
                          order.sellerVerified
                            ? "text-emerald-600"
                            : "text-gray-400"
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Seller {order.sellerVerified ? "verified" : "pending"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {canVerify && (
                      <button
                        onClick={() => handleAction(order.id, "verify")}
                        disabled={actionLoading === order.id}
                        className="btn-primary text-xs px-3 py-1.5"
                        title="Verify this order"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                        Verify
                      </button>
                    )}
                    {canComplete && order.buyerVerified && order.sellerVerified && (
                      <button
                        onClick={() => handleAction(order.id, "complete")}
                        disabled={actionLoading === order.id}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Complete
                      </button>
                    )}
                    {canCancel && (
                      <button
                        onClick={() => handleAction(order.id, "cancel")}
                        disabled={actionLoading === order.id}
                        className="btn-ghost text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Transaction info */}
                {order.transaction && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      Transaction: <strong className="text-gray-700">{order.transaction.status}</strong>
                    </span>
                    <span>
                      Net: <strong className="text-gray-700">${order.transaction.netAmount?.toFixed(2)}</strong>
                    </span>
                    {order.transaction.processedAt && (
                      <span>
                        Processed: {new Date(order.transaction.processedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";
import type { Listing } from "../types";
import {
  ArrowLeft,
  ShieldCheck,
  Eye,
  Clock,
  Tag,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, agent } = useAuthStore();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      api
        .getListing(id)
        .then((res) => setListing(res.data || null))
        .catch(() => setError("Listing not found"))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleOrder = async () => {
    if (!listing) return;
    setOrdering(true);
    setError("");
    try {
      await api.createOrder(listing.id);
      setOrderSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to create order");
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-8" />
        <div className="h-8 w-2/3 bg-gray-200 rounded mb-4" />
        <div className="h-4 w-full bg-gray-100 rounded mb-2" />
        <div className="h-4 w-3/4 bg-gray-100 rounded" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Listing not found
        </h2>
        <Link to="/marketplace" className="text-brand-600 mt-2 inline-block">
          Back to marketplace
        </Link>
      </div>
    );
  }

  const isOwner = agent?.id === listing.agentId;
  const isBuyListing = listing.type === "BUY";
  const platformFee = (listing.price * 1) / 100;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(-1)}
        className="btn-ghost mb-6 -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`px-3 py-1 rounded-md text-xs font-semibold ${
                  isBuyListing
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                {isBuyListing ? "BUYING" : "SELLING"}
              </span>
              <span className="badge-gray">{listing.category.replace("_", " ")}</span>
              {listing.status !== "ACTIVE" && (
                <span className="badge-red">{listing.status}</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {listing.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {listing.viewCount} views
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(listing.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Description
            </h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          {listing.tags.length > 0 && (
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {listing.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-sm"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Price Card */}
          <div className="card p-6">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              ${listing.price.toLocaleString()}
              <span className="text-sm text-gray-400 font-normal ml-1">
                {listing.currency}
              </span>
            </div>
            <div className="text-xs text-gray-400 mb-5">
              + ${platformFee.toFixed(2)} platform fee (1%)
            </div>

            {orderSuccess ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Order placed! Go to{" "}
                <Link to="/orders" className="font-medium underline">
                  Orders
                </Link>{" "}
                to verify.
              </div>
            ) : isOwner ? (
              <Link
                to={`/listings/${listing.id}`}
                className="btn-secondary w-full text-center"
              >
                This is your listing
              </Link>
            ) : !isAuthenticated ? (
              <Link to="/login" className="btn-primary w-full text-center">
                Sign in to {isBuyListing ? "offer" : "buy"}
              </Link>
            ) : (
              <button
                onClick={handleOrder}
                disabled={ordering || listing.status !== "ACTIVE"}
                className="btn-primary w-full"
              >
                {ordering
                  ? "Placing order..."
                  : isBuyListing
                  ? "Offer to Sell"
                  : "Place Order"}
              </button>
            )}

            {error && (
              <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Seller Card */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              {isBuyListing ? "Buyer" : "Seller"}
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-semibold">
                {listing.agent.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-gray-900">
                    {listing.agent.name}
                  </span>
                  {listing.agent.status === "VERIFIED" && (
                    <ShieldCheck className="w-4 h-4 text-brand-500" />
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {listing.agent.rating?.toFixed(1)} rating
                  {listing.agent.totalTrades
                    ? ` · ${listing.agent.totalTrades} trades`
                    : ""}
                </div>
              </div>
            </div>
            {listing.agent.description && (
              <p className="text-sm text-gray-500 mt-3">
                {listing.agent.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";
import type { DashboardStats, Listing, Verification } from "../types";
import ListingCard from "../components/ListingCard";
import {
  ShoppingBag,
  ClipboardList,
  CheckCircle2,
  DollarSign,
  Plus,
  ShieldCheck,
  AlertCircle,
  Key,
  Copy,
  Check,
} from "lucide-react";

export default function Dashboard() {
  const { agent, refreshProfile } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // Verification form state
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [capabilities, setCapabilities] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, listingsRes, verifyRes] = await Promise.all([
        api.getDashboard(),
        api.getListings(agent?.id ? { agentId: agent.id } : {}),
        api.getVerificationStatus().catch(() => ({ data: null })),
      ]);
      setStats(statsRes.data || null);
      setListings((listingsRes.data || []).slice(0, 3));
      setVerification(verifyRes.data || null);
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyApiKey = async () => {
    if (agent?.apiKey) {
      await navigator.clipboard.writeText(agent.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const submitVerification = async () => {
    setVerifyError("");
    setVerifyLoading(true);
    try {
      const caps = capabilities
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      await api.submitVerification({
        capabilities: caps,
        endpoint: endpoint || undefined,
      });
      await loadDashboard();
      await refreshProfile();
      setShowVerifyForm(false);
    } catch (err: any) {
      setVerifyError(err.message || "Failed");
    } finally {
      setVerifyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-8" />
        <div className="grid grid-cols-4 gap-5 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5">
              <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-8 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">
            Welcome back, {agent?.name}
          </p>
        </div>
        <Link to="/listings/new" className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Listing
        </Link>
      </div>

      {/* Verification Banner */}
      {agent?.status !== "VERIFIED" && (
        <div className="card p-5 mb-6 border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800">
                {verification?.status === "PENDING"
                  ? "Verification pending review"
                  : "Get verified to start trading"}
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                {verification?.status === "PENDING"
                  ? "Your verification request is being reviewed. You'll be able to create listings and place orders once approved."
                  : "Verified agents can create listings and place orders. Submit your verification request to get started."}
              </p>
              {!verification && !showVerifyForm && (
                <button
                  onClick={() => setShowVerifyForm(true)}
                  className="btn-primary mt-3 text-sm"
                >
                  Start Verification
                </button>
              )}
            </div>
          </div>

          {showVerifyForm && (
            <div className="mt-4 pt-4 border-t border-amber-200 space-y-3">
              {verifyError && (
                <div className="flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {verifyError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">
                  Capabilities (comma-separated)
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="data-processing, api-integration, nlp"
                  value={capabilities}
                  onChange={(e) => setCapabilities(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">
                  API Endpoint (optional)
                </label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://api.youragent.com"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={submitVerification}
                  disabled={verifyLoading || !capabilities}
                  className="btn-primary text-sm"
                >
                  {verifyLoading ? "Submitting..." : "Submit for Review"}
                </button>
                <button
                  onClick={() => setShowVerifyForm(false)}
                  className="btn-ghost text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          {
            label: "Active Listings",
            value: stats?.activeListings || 0,
            icon: <ShoppingBag className="w-5 h-5" />,
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Total Orders",
            value: stats?.totalOrders || 0,
            icon: <ClipboardList className="w-5 h-5" />,
            color: "text-purple-600 bg-purple-50",
          },
          {
            label: "Completed",
            value: stats?.completedOrders || 0,
            icon: <CheckCircle2 className="w-5 h-5" />,
            color: "text-emerald-600 bg-emerald-50",
          },
          {
            label: "Revenue",
            value: `$${(stats?.totalRevenue || 0).toLocaleString()}`,
            icon: <DollarSign className="w-5 h-5" />,
            color: "text-amber-600 bg-amber-50",
          },
        ].map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{stat.label}</span>
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}
              >
                {stat.icon}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* API Key Section */}
      <div className="card p-5 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">API Key</h3>
              <p className="text-xs text-gray-500">
                Use this key to authenticate API requests from your agent
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <code className="px-3 py-1.5 bg-gray-100 rounded text-sm font-mono text-gray-700">
              {showApiKey ? agent?.apiKey : "••••••••••••••••••••"}
            </code>
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="btn-ghost text-xs"
            >
              {showApiKey ? "Hide" : "Show"}
            </button>
            <button onClick={copyApiKey} className="btn-ghost text-xs">
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Listings */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Your Listings</h2>
        <Link to="/marketplace" className="text-sm text-brand-600 font-medium">
          View all
        </Link>
      </div>
      {listings.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-gray-500">
            You haven't created any listings yet.
          </p>
          <Link to="/listings/new" className="btn-primary mt-4 inline-flex">
            <Plus className="w-4 h-4 mr-2" />
            Create your first listing
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-5">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

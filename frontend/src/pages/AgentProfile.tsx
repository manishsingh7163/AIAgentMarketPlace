import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import type { Agent, Listing } from "../types";
import {
  Bot,
  ShieldCheck,
  Clock,
  Star,
  ArrowUpRight,
  ShoppingBag,
  Tag,
  AlertCircle,
} from "lucide-react";

export default function AgentProfile() {
  const { name } = useParams<{ name: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getAgentByName(name!);
        if (res.data) {
          setAgent(res.data.agent);
          setListings(res.data.recentListings as any);
        }
      } catch (err: any) {
        setError(err.message || "Agent not found");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [name]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Agent Not Found
        </h1>
        <p className="text-gray-500 mb-6">
          {error || `No agent named "${name}" exists on AgentMarket.`}
        </p>
        <Link to="/marketplace" className="btn-primary">
          Browse Marketplace
        </Link>
      </div>
    );
  }

  const timeAgo = (date: string) => {
    const now = new Date();
    const d = new Date(date);
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-brand-100 text-brand-700 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {agent.avatar ? (
              <img
                src={agent.avatar}
                alt={agent.name}
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              agent.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {agent.name}
              </h1>
              {agent.status === "VERIFIED" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
              )}
              {agent.isClaimed && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                  Claimed
                </span>
              )}
            </div>
            {agent.description && (
              <p className="text-gray-500 mb-3">{agent.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Joined {new Date(agent.createdAt).toLocaleDateString()}
              </span>
              {agent.lastActive && (
                <span className="flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5" />
                  Active {timeAgo(agent.lastActive)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5" />
                {agent.rating.toFixed(1)} rating
              </span>
              <span className="flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5" />
                {agent.totalTrades} trades
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {agent.totalTrades}
          </div>
          <div className="text-xs text-gray-500 mt-1">Total Trades</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {agent.rating.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Rating</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {listings.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Active Listings</div>
        </div>
      </div>

      {/* Capabilities */}
      {agent.verificaiton?.capabilities &&
        (agent.verificaiton.capabilities as string[]).length > 0 && (
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Capabilities
            </h2>
            <div className="flex flex-wrap gap-2">
              {(agent.verificaiton.capabilities as string[]).map(
                (cap: string) => (
                  <span
                    key={cap}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    <Tag className="w-3 h-3" />
                    {cap}
                  </span>
                )
              )}
            </div>
          </div>
        )}

      {/* Active Listings */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Active Listings
        </h2>
        {listings.length === 0 ? (
          <p className="text-gray-400 text-sm">
            This agent has no active listings yet.
          </p>
        ) : (
          <div className="space-y-3">
            {listings.map((listing: any) => (
              <Link
                key={listing.id}
                to={`/listings/${listing.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded ${
                      listing.type === "SELL"
                        ? "bg-green-50 text-green-700"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {listing.type}
                  </span>
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {listing.title}
                  </span>
                  <span className="text-xs text-gray-400 hidden sm:block">
                    {listing.category}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    ${listing.price}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-brand-600" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

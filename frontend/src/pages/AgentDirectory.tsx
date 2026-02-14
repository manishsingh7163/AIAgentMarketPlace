import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import type { Agent } from "../types";
import {
  Bot,
  ShieldCheck,
  Star,
  ShoppingBag,
  Users,
  ArrowRight,
} from "lucide-react";

export default function AgentDirectory() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getAgentDirectory({ limit: "50" });
        setAgents(res.data || []);
        setTotal(res.meta?.total || 0);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-brand-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Agent Directory
            </h1>
          </div>
          <p className="text-gray-500">
            {total} verified agents trading on AgentMarket
          </p>
        </div>
      </div>

      {/* Onboarding Banner */}
      <div className="card bg-gradient-to-r from-brand-50 to-blue-50 border-brand-200 p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-brand-600 text-white rounded-lg flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Register your AI agent
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Send this instruction to your AI agent to register on AgentMarket:
            </p>
            <div className="bg-white/80 border border-brand-200 rounded-lg p-3 font-mono text-sm text-gray-800 mb-3">
              Read {window.location.origin}/skill.md and follow the instructions
              to join AgentMarket
            </div>
            <p className="text-xs text-gray-500">
              Your agent registers itself, gets an API key, and sends you a
              claim link. You verify ownership, and the agent is activated.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-16">
          <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No agents yet
          </h2>
          <p className="text-gray-500">
            Be the first to register an agent!
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Link
              key={agent.id}
              to={`/u/${agent.name}`}
              className="card p-4 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 bg-brand-100 text-brand-700 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 group-hover:bg-brand-200 transition-colors">
                  {agent.avatar ? (
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="w-full h-full rounded-xl object-cover"
                    />
                  ) : (
                    agent.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-900 truncate">
                      {agent.name}
                    </span>
                    {agent.status === "VERIFIED" && (
                      <ShieldCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  {agent.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                      {agent.description}
                    </p>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-600 flex-shrink-0 mt-1" />
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400 border-t border-gray-100 pt-2">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {agent.rating?.toFixed(1) || "0.0"}
                </span>
                <span className="flex items-center gap-1">
                  <ShoppingBag className="w-3 h-3" />
                  {agent.totalTrades || 0} trades
                </span>
                {agent.lastActive && (
                  <span className="ml-auto">
                    Active {timeAgo(agent.lastActive)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

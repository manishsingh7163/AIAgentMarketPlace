import { useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { ShieldCheck, AlertCircle, CheckCircle2, Bot } from "lucide-react";

export default function ClaimAgent() {
  const { token } = useParams<{ token: string }>();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [claimed, setClaimed] = useState<{
    name: string;
    status: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClaim = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.claimAgent(token!, email);
      setClaimed(res.data as any);
    } catch (err: any) {
      setError(err.message || "Failed to claim agent");
    } finally {
      setLoading(false);
    }
  };

  if (claimed) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Agent Claimed!
          </h1>
          <p className="text-gray-500 mb-6">
            <span className="font-semibold text-gray-900">{claimed.name}</span>{" "}
            has been verified and activated. Your agent can now trade on the
            marketplace.
          </p>
          <div className="card p-4 text-left mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold">
                {claimed.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  {claimed.name}
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Your agent's status is now <strong>VERIFIED</strong>. It can
              create listings, place orders, and complete transactions.
            </p>
          </div>
          <a
            href="/marketplace"
            className="btn-primary inline-flex items-center"
          >
            Browse Marketplace
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-600 rounded-xl mb-4">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Claim Your AI Agent
          </h1>
          <p className="text-gray-500 mt-1">
            Your agent registered on AgentMarket and sent you this link.
            <br />
            Verify your email to activate the agent.
          </p>
        </div>

        <div className="card p-6">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-amber-800 mb-1">
              How it works
            </h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>1. Your AI agent registered itself on AgentMarket</li>
              <li>2. It sent you this claim link</li>
              <li>
                3. Enter your email below to verify ownership and activate the
                agent
              </li>
            </ul>
          </div>

          <form onSubmit={handleClaim} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Your Email
              </label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                This proves you own this agent. The agent will be verified and
                activated.
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Claiming..." : "Claim & Verify Agent"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

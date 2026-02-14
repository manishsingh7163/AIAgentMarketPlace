import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  Bot,
  LayoutDashboard,
  LogOut,
  ShoppingBag,
  Plus,
  ClipboardList,
  Book,
  Users,
} from "lucide-react";

export default function Navbar() {
  const { isAuthenticated, agent, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center group-hover:bg-brand-700 transition-colors">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">
              Agent<span className="text-brand-600">Market</span>
            </span>
          </Link>

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/marketplace"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Marketplace
            </Link>
            <Link
              to="/agents"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="w-4 h-4" />
              Agents
            </Link>
            <Link
              to="/docs"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Book className="w-4 h-4" />
              API Docs
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  to="/orders"
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ClipboardList className="w-4 h-4" />
                  Orders
                </Link>
                <Link
                  to="/listings/new"
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-brand-600 hover:text-brand-700 rounded-lg hover:bg-brand-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Listing
                </Link>
              </>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-7 h-7 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-semibold">
                    {agent?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {agent?.name}
                  </span>
                  {agent?.status === "VERIFIED" && (
                    <span className="badge-green text-[10px]">Verified</span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-ghost !p-2"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

import { Link } from "react-router-dom";
import {
  Database,
  Globe,
  Brain,
  Cpu,
  HardDrive,
  Zap,
  BarChart3,
  FileText,
  Package,
  ArrowUpRight,
  Eye,
  ShieldCheck,
} from "lucide-react";
import type { Listing, ListingCategory } from "../types";

const categoryIcons: Record<ListingCategory, React.ReactNode> = {
  DATA: <Database className="w-4 h-4" />,
  API_SERVICE: <Globe className="w-4 h-4" />,
  MODEL: <Brain className="w-4 h-4" />,
  COMPUTE: <Cpu className="w-4 h-4" />,
  STORAGE: <HardDrive className="w-4 h-4" />,
  AUTOMATION: <Zap className="w-4 h-4" />,
  ANALYSIS: <BarChart3 className="w-4 h-4" />,
  CONTENT: <FileText className="w-4 h-4" />,
  OTHER: <Package className="w-4 h-4" />,
};

const categoryLabels: Record<ListingCategory, string> = {
  DATA: "Data",
  API_SERVICE: "API Service",
  MODEL: "Model",
  COMPUTE: "Compute",
  STORAGE: "Storage",
  AUTOMATION: "Automation",
  ANALYSIS: "Analysis",
  CONTENT: "Content",
  OTHER: "Other",
};

export default function ListingCard({ listing }: { listing: Listing }) {
  const isBuy = listing.type === "BUY";

  return (
    <Link to={`/listings/${listing.id}`} className="card group hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                isBuy
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              {isBuy ? "BUYING" : "SELLING"}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500 bg-gray-50">
              {categoryIcons[listing.category]}
              {categoryLabels[listing.category]}
            </span>
          </div>
          <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition-colors" />
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-semibold text-gray-900 mb-1.5 line-clamp-1 group-hover:text-brand-700 transition-colors">
          {listing.title}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
          {listing.description}
        </p>

        {/* Tags */}
        {listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {listing.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
              >
                {tag}
              </span>
            ))}
            {listing.tags.length > 3 && (
              <span className="px-2 py-0.5 text-gray-400 text-xs">
                +{listing.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-[10px] font-semibold">
              {listing.agent.name.charAt(0)}
            </div>
            <span className="text-xs text-gray-500">{listing.agent.name}</span>
            {listing.agent.status === "VERIFIED" && (
              <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Eye className="w-3 h-3" />
              {listing.viewCount}
            </span>
            <span className="text-base font-bold text-gray-900">
              ${listing.price.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

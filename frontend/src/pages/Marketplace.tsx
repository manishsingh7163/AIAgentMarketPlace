import { useState, useEffect } from "react";
import { api } from "../services/api";
import type { Listing, ListingCategory } from "../types";
import ListingCard from "../components/ListingCard";
import { Search, SlidersHorizontal, X } from "lucide-react";

const categories: { value: string; label: string }[] = [
  { value: "", label: "All Categories" },
  { value: "DATA", label: "Data" },
  { value: "API_SERVICE", label: "API Service" },
  { value: "MODEL", label: "Models" },
  { value: "COMPUTE", label: "Compute" },
  { value: "STORAGE", label: "Storage" },
  { value: "AUTOMATION", label: "Automation" },
  { value: "ANALYSIS", label: "Analysis" },
  { value: "CONTENT", label: "Content" },
  { value: "OTHER", label: "Other" },
];

export default function Marketplace() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<"" | "BUY" | "SELL">("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { sortBy };
      if (search) params.search = search;
      if (category) params.category = category;
      if (type) params.type = type;

      const res = await api.getListings(params);
      setListings(res.data || []);
      setTotal(res.meta?.total || 0);
    } catch (err) {
      console.error("Failed to fetch listings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [category, type, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setType("");
    setSortBy("createdAt");
  };

  const hasActiveFilters = search || category || type;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
          <p className="text-gray-500 mt-1">
            {total} listings available
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="input pl-10"
              placeholder="Search listings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary ${showFilters ? "ring-2 ring-brand-500" : ""}`}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input w-auto"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={type}
              onChange={(e) => setType(e.target.value as "" | "BUY" | "SELL")}
              className="input w-auto"
            >
              <option value="">All Types</option>
              <option value="SELL">Selling</option>
              <option value="BUY">Buying</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input w-auto"
            >
              <option value="createdAt">Newest</option>
              <option value="price">Price</option>
              <option value="viewCount">Most Viewed</option>
            </select>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn-ghost text-red-600">
                <X className="w-4 h-4 mr-1" />
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex gap-2 mb-3">
                <div className="h-6 w-16 bg-gray-200 rounded" />
                <div className="h-6 w-20 bg-gray-200 rounded" />
              </div>
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-full mb-1" />
              <div className="h-4 bg-gray-100 rounded w-2/3 mb-4" />
              <div className="h-8 bg-gray-100 rounded mt-3" />
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No listings found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { AlertCircle, Plus, X } from "lucide-react";

const categories = [
  { value: "DATA", label: "Data" },
  { value: "API_SERVICE", label: "API Service" },
  { value: "MODEL", label: "Model" },
  { value: "COMPUTE", label: "Compute" },
  { value: "STORAGE", label: "Storage" },
  { value: "AUTOMATION", label: "Automation" },
  { value: "ANALYSIS", label: "Analysis" },
  { value: "CONTENT", label: "Content" },
  { value: "OTHER", label: "Other" },
];

export default function CreateListing() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("DATA");
  const [type, setType] = useState<"BUY" | "SELL">("SELL");
  const [price, setPrice] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.createListing({
        title,
        description,
        category,
        type,
        price: parseFloat(price),
        tags,
      });
      navigate(`/listings/${res.data?.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Create New Listing
      </h1>
      <p className="text-gray-500 mb-8">
        List something you want to buy or sell on the marketplace.
      </p>

      <div className="card p-6">
        {error && (
          <div className="flex items-center gap-2 p-3 mb-6 bg-red-50 text-red-700 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What do you want to do?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("SELL")}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  type === "SELL"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                Sell something
              </button>
              <button
                type="button"
                onClick={() => setType("BUY")}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  type === "BUY"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                Buy something
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Title
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Real-time Financial Data Feed"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              className="input resize-none"
              rows={5}
              placeholder="Describe what you're offering or looking for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={10}
              maxLength={5000}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Category
              </label>
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Price (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="input"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tags <span className="text-gray-400 font-normal">(up to 10)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input"
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                maxLength={50}
              />
              <button
                type="button"
                onClick={addTag}
                className="btn-secondary flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Creating..." : "Create Listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

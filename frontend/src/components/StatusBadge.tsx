import type { OrderStatus } from "../types";

const statusConfig: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  PENDING_VERIFICATION: {
    label: "Pending Verification",
    className: "badge-yellow",
  },
  VERIFIED: { label: "Verified", className: "badge-blue" },
  IN_PROGRESS: { label: "In Progress", className: "badge-blue" },
  COMPLETED: { label: "Completed", className: "badge-green" },
  CANCELLED: { label: "Cancelled", className: "badge-gray" },
  DISPUTED: { label: "Disputed", className: "badge-red" },
  REFUNDED: { label: "Refunded", className: "badge-gray" },
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status] || {
    label: status,
    className: "badge-gray",
  };

  return <span className={config.className}>{config.label}</span>;
}

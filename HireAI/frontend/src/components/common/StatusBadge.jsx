const statusStyles = {
  active: "border-green-200 bg-green-50 text-green-700",
  accepted: "border-green-200 bg-green-50 text-green-700",
  hired: "border-green-200 bg-green-50 text-green-700",
  shortlisted: "border-blue-200 bg-blue-50 text-blue-700",
  "l1 interview": "border-blue-200 bg-blue-50 text-blue-700",
  "l2 interview": "border-blue-200 bg-blue-50 text-blue-700",
  "client interview": "border-blue-200 bg-blue-50 text-blue-700",
  new: "border-slate-200 bg-slate-100 text-slate-700",
  applied: "border-slate-200 bg-slate-100 text-slate-700",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  "offer sent": "border-amber-200 bg-amber-50 text-amber-800",
  offered: "border-amber-200 bg-amber-50 text-amber-800",
  "closing soon": "border-amber-200 bg-amber-50 text-amber-800",
  rejected: "border-red-200 bg-red-50 text-red-700",
  overdue: "border-red-200 bg-red-50 text-red-700",
  declined: "border-red-200 bg-red-50 text-red-700",
};

function StatusBadge({ status, className = "" }) {
  const label = status || "Unknown";
  const style =
    statusStyles[String(label).trim().toLowerCase()] ||
    "border-[#d8e5f5] bg-[#e8f0fb] text-[#133f7d]";

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[11px] font-bold leading-none ${style} ${className}`}
    >
      {label}
    </span>
  );
}

export default StatusBadge;

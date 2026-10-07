import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import Button from "./Button";
import Card from "./Card";

function SkeletonRows({ rows = 4 }) {
  return (
    <div aria-hidden="true" className="space-y-3 p-5">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-4 border-b border-[#eef2f6] pb-3 last:border-0"
        >
          <div className="size-9 shrink-0 rounded-full bg-slate-200" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-2/5 rounded bg-slate-200" />
            <div className="h-2.5 w-3/5 rounded bg-slate-100" />
          </div>
          <div className="hidden h-6 w-20 rounded-full bg-slate-100 sm:block" />
          <div className="hidden h-3 w-16 rounded bg-slate-100 md:block" />
        </div>
      ))}
    </div>
  );
}

function PageState({
  variant,
  title,
  description,
  onRetry,
  retryLabel = "Try again",
  action,
  icon: Icon,
  rows = 4,
  className = "",
}) {
  if (variant === "loading") {
    return (
      <Card
        aria-label={title || "Loading"}
        aria-live="polite"
        className={`overflow-hidden ${className}`}
      >
        <div className="flex items-center gap-3 border-b border-[#eef2f6] px-5 py-4">
          <div className="size-8 animate-pulse rounded-lg bg-[#e8f0fb]" />
          <div className="h-3 w-36 animate-pulse rounded bg-slate-200" />
        </div>
        <SkeletonRows rows={rows} />
      </Card>
    );
  }

  const isError = variant === "error";
  const StateIcon = Icon || (isError ? AlertCircle : Inbox);

  return (
    <Card
      role={isError ? "alert" : undefined}
      className={`flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center ${className}`}
    >
      <div
        className={`mb-4 flex size-12 items-center justify-center rounded-2xl ${
          isError
            ? "bg-red-50 text-red-600"
            : "bg-[#e8f0fb] text-[#133f7d]"
        }`}
      >
        <StateIcon size={22} />
      </div>
      <h2 className="m-0 text-base font-bold text-[#1e293b]">{title}</h2>
      {description && (
        <p className="mb-0 mt-2 max-w-md text-sm leading-6 text-[#64748b]">
          {description}
        </p>
      )}
      {onRetry && (
        <Button
          type="button"
          size="sm"
          className="mt-5"
          onClick={onRetry}
        >
          <RefreshCw size={14} />
          {retryLabel}
        </Button>
      )}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

export default PageState;

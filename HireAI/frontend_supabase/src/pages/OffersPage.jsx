import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, FileText, CalendarDays, RefreshCw, UserRoundCheck } from "lucide-react";
import PageShell from "../components/common/PageShell";
import PageState from "../components/common/PageState";
import StatCard from "../components/common/StatCard";
import { API_URL, getAuthHeader } from "../utils/auth";

const OFFER_STATUSES = ["Pending", "Accepted", "Declined", "Expired"];

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusClass(status) {
  if (status === "Accepted") return "[background:#dcfce7] [color:#166534]";
  if (status === "Declined" || status === "Expired") {
    return "[background:#fee2e2] [color:#991b1b]";
  }
  return "[background:#fef3c7] [color:#92400e]";
}

function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyOfferId, setBusyOfferId] = useState(null);

  const loadOffers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/api/offers`, {
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to load offers");
      }
      setOffers(Array.isArray(data) ? data : []);
    } catch (loadError) {
      console.error("Unable to load offers:", loadError);
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const taskId = window.setTimeout(loadOffers, 0);
    return () => window.clearTimeout(taskId);
  }, [loadOffers]);

  const acceptedCount = useMemo(
    () => offers.filter((offer) => offer.status === "Accepted").length,
    [offers],
  );
  const pendingCount = useMemo(
    () => offers.filter((offer) => offer.status === "Pending").length,
    [offers],
  );

  const updateStatus = async (offerId, status) => {
    setBusyOfferId(offerId);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/offers/${offerId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to update offer status");
      }
      setOffers((current) =>
        current.map((offer) =>
          offer.offer_id === offerId ? { ...offer, status } : offer,
        ),
      );
    } catch (updateError) {
      console.error("Unable to update offer status:", updateError);
      setError(updateError.message);
    } finally {
      setBusyOfferId(null);
    }
  };

  const onboardCandidate = async (offer) => {
    setBusyOfferId(offer.offer_id);
    setError("");
    try {
      const response = await fetch(
        `${API_URL}/api/candidates/${offer.candidate_id}/stage`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...getAuthHeader() },
          body: JSON.stringify({ stage: "Onboarded" }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to onboard candidate");
      }
      setOffers((current) =>
        current.map((item) =>
          item.offer_id === offer.offer_id
            ? { ...item, candidate_stage: "Onboarded" }
            : item,
        ),
      );
    } catch (onboardError) {
      console.error("Unable to onboard candidate:", onboardError);
      setError(onboardError.message);
    } finally {
      setBusyOfferId(null);
    }
  };

  return (
    <PageShell
      title="Offer Letters"
      active="offers"
      actions={
        <button
          type="button"
          className="btn btn-secondary btn-sm [border:none] [border-radius:8px] [cursor:pointer] [display:inline-flex] [align-items:center] [gap:6px] [background:#fff] [padding:8px_12px] [color:#133f7d] [border:1px_solid_#dbe3ee]"
          onClick={loadOffers}
          disabled={loading}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      }
    >
      {error && (
        <PageState
          variant="error"
          title="Couldn't load offers"
          description={error}
          onRetry={loadOffers}
          className="mb-4"
        />
      )}

      <div className="grid3 offer-kpi-grid [display:grid] [grid-template-columns:repeat(3,_1fr)] [gap:14px] [margin-bottom:24px] max-[960px]:[grid-template-columns:1fr]">
        <StatCard
          label="Offers Sent"
          value={offers.length}
          icon={<FileText size={18} />}
          color="brand"
        />
        <StatCard
          label="Accepted"
          value={acceptedCount}
          icon={<Check size={18} />}
          color="green"
        />
        <StatCard
          label="Awaiting Response"
          value={pendingCount}
          icon={<CalendarDays size={18} />}
          color="orange"
        />
      </div>

      {loading ? (
        <PageState
          variant="loading"
          title="Loading offers"
          rows={4}
        />
      ) : !error && offers.length === 0 ? (
        <PageState
          variant="empty"
          title="No offers yet"
          description="Offers created from Evaluations will appear here."
          icon={FileText}
        />
      ) : (
        <div className="card table-card [overflow-x:auto] [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:0]">
          <table className="[width:100%] [min-width:850px] [border-collapse:collapse]">
            <thead>
              <tr>
                {["Candidate", "Role", "CTC", "Sent On", "Expires", "Status", "Actions"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="[padding:12px_14px] [border-bottom:1px_solid_#e2e8f0] [background:#f8fafc] [font-size:11px] [font-weight:700] [text-align:left] [text-transform:uppercase] [letter-spacing:.4px] [color:#64748b]"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => {
                const isBusy = busyOfferId === offer.offer_id;
                const isOnboarded = offer.candidate_stage === "Onboarded";
                return (
                  <tr key={offer.offer_id}>
                    <td className="[padding:13px_14px] [border-bottom:1px_solid_#eef2f7] [font-size:13px] [font-weight:650] [color:#1e293b]">
                      <div>{offer.candidate_name}</div>
                      {offer.candidate_email && (
                        <div className="[margin-top:3px] [font-size:11px] [font-weight:400] [color:#64748b]">
                          {offer.candidate_email}
                        </div>
                      )}
                    </td>
                    <td className="[padding:13px_14px] [border-bottom:1px_solid_#eef2f7] [font-size:13px] [color:#334155]">
                      {offer.role || "—"}
                    </td>
                    <td className="[padding:13px_14px] [border-bottom:1px_solid_#eef2f7] [font-size:13px] [font-weight:650] [color:#1e293b]">
                      ₹{Number(offer.ctc).toLocaleString("en-IN")} LPA
                    </td>
                    <td className="[padding:13px_14px] [border-bottom:1px_solid_#eef2f7] [font-size:12px] [color:#475569]">
                      {formatDate(offer.sent_at)}
                    </td>
                    <td className="[padding:13px_14px] [border-bottom:1px_solid_#eef2f7] [font-size:12px] [color:#475569]">
                      {formatDate(offer.expiry_date)}
                    </td>
                    <td className="[padding:13px_14px] [border-bottom:1px_solid_#eef2f7]">
                      <select
                        aria-label={`Offer status for ${offer.candidate_name}`}
                        value={offer.status}
                        disabled={isBusy}
                        onChange={(event) =>
                          updateStatus(offer.offer_id, event.target.value)
                        }
                        className={`[border:1px_solid_#e2e8f0] [border-radius:999px] [padding:6px_10px] [font-size:11px] [font-weight:700] [outline:none] [cursor:pointer] ${statusClass(offer.status)}`}
                      >
                        {OFFER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="[padding:13px_14px] [border-bottom:1px_solid_#eef2f7]">
                      <button
                        type="button"
                        disabled={
                          isBusy || (offer.status !== "Accepted" && !isOnboarded)
                        }
                        onClick={() => onboardCandidate(offer)}
                        className="[display:inline-flex] [align-items:center] [gap:6px] [border:1px_solid_#bbf7d0] [border-radius:8px] [background:#f0fdf4] [padding:7px_10px] [font-size:12px] [font-weight:700] [color:#166534] [cursor:pointer] disabled:[opacity:.5] disabled:[cursor:not-allowed]"
                      >
                        <UserRoundCheck size={14} />
                        {isOnboarded ? "Onboarded" : isBusy ? "Saving..." : "Onboard"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}

export default OffersPage;

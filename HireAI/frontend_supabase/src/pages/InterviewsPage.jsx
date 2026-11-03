import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import PageShell from "../components/common/PageShell";
import { API_URL, canManageCandidates, getAuthHeader, getSession } from "../utils/auth";
import PageState from "../components/common/PageState";
import Button from "../components/common/Button";
import StatusBadge from "../components/common/StatusBadge";

function formatDate(date) {
  if (!date) return "Not scheduled";
  return new Date(date).toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InterviewsTable({ interviews, completed, canEdit, onViewDetails }) {
  if (!interviews.length) {
    return (
      <PageState
        variant="empty"
        title={completed ? "No completed interviews" : "No interviews scheduled"}
        description={
          completed
            ? "Evaluated interviews will appear here for reference."
            : "Schedule an interview to start managing candidate interview sessions."
        }
        icon={completed ? CheckCircle2 : CalendarDays}
      />
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[760px] table-fixed border-collapse">
        <colgroup>
          <col className="w-[22%]" />
          <col className="w-[25%]" />
          <col className="w-[21%]" />
          <col className="w-[17%]" />
          <col className="w-[15%]" />
        </colgroup>
        <thead className="bg-slate-50">
          <tr>
            {["Candidate", "Role", "Date & time", "Round", completed ? "Details" : "Actions"].map(
              (heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="border-b border-slate-200 px-4 py-3 text-left text-[10px] font-extrabold uppercase leading-4 tracking-[0.07em] text-slate-500 whitespace-nowrap"
                >
                  {heading}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {interviews.map((interview) => (
            <tr
              key={interview.id}
              className="transition-colors hover:bg-slate-50"
            >
              <td className="border-b border-slate-100 px-4 py-4 align-middle">
                <div className="text-sm font-bold leading-5 text-slate-800">
                  {interview.candidate_name || "Unknown candidate"}
                </div>
              </td>
              <td className="border-b border-slate-100 px-4 py-4 align-middle text-sm font-semibold leading-5 text-slate-700">
                {interview.role_name || "Role not specified"}
              </td>
              <td className="border-b border-slate-100 px-4 py-4 align-middle">
                <div className="flex min-w-[150px] flex-col gap-1">
                  <span className="text-sm font-semibold leading-5 text-slate-800">
                    {formatDate(interview.scheduled_at)}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs leading-4 text-slate-500">
                    <Clock size={13} aria-hidden="true" />
                    {formatTime(interview.scheduled_at)}
                  </span>
                </div>
              </td>
              <td className="border-b border-slate-100 px-4 py-4 align-middle">
                <StatusBadge status={`Round ${interview.round}`} />
              </td>
              <td className="border-b border-slate-100 px-4 py-4 text-right align-middle">
                <div className="flex min-w-[120px] justify-end">
                  {completed ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onViewDetails(interview)}
                    >
                      <Eye size={14} />
                      Details
                    </Button>
                  ) : canEdit ? (
                    <Link
                      to={`/edit-interview-schedule/${interview.id}`}
                      className="inline-flex min-h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-blue-900 no-underline transition-colors hover:border-blue-800 hover:bg-blue-50"
                      title="Edit interview schedule"
                    >
                      <Pencil size={14} />
                      Edit Schedule
                    </Link>
                  ) : (
                    <span className="[font-size:12px] [color:#64748b]">No actions</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const session = getSession();

  useEffect(() => {
    const loadInterviews = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(`${API_URL}/api/interviews`, {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to load interviews.");
        }
        setInterviews(Array.isArray(data) ? data : []);
      } catch (loadError) {
        console.error("Failed to load interviews:", loadError);
        setError(loadError.message || "Unable to load interviews.");
        setInterviews([]);
      } finally {
        setLoading(false);
      }
    };

    loadInterviews();
  }, [reloadCount]);

  const upcomingInterviews = interviews.filter(
    (interview) => !interview.is_completed,
  );
  const completedInterviews = interviews.filter(
    (interview) => interview.is_completed,
  );

  return (
    <PageShell
      title="Scheduled Interviews"
      active="interviews"
      eyebrow="INTERVIEW MANAGEMENT"
      description="Manage upcoming interviews and review completed interview details."
      actions={
        <>
          {!loading && (
            <div className="[display:inline-flex] [align-items:center] [gap:8px] [padding:9px_13px] [border:1px_solid_#d8e5f5] [border-radius:999px] [background:rgba(255,255,255,0.75)] [font-size:12px] [font-weight:700] [color:#133f7d]">
              <CalendarDays size={16} />
              {upcomingInterviews.length} upcoming · {completedInterviews.length} done
            </div>
          )}
          {canManageCandidates(session) && (
            <Button as={Link} to="/schedule-interview" size="sm">
              <Plus size={15} />
              Schedule interview
            </Button>
          )}
        </>
      }
    >
      <div className="mx-auto w-full max-w-[1300px]">
        {loading ? (
          <PageState variant="loading" title="Loading interviews" rows={5} />
        ) : error ? (
          <PageState
            variant="error"
            title="Couldn't load interviews"
            description={error}
            onRetry={() => setReloadCount((count) => count + 1)}
          />
        ) : (
          <div className="[display:grid] [gap:24px]">
            <section>
              <div className="[margin-bottom:12px]">
                <h2 className="[margin:0] [font-size:16px] [font-weight:800] [color:#1e293b]">
                  Upcoming interviews
                </h2>
                <p className="[margin-top:4px] [font-size:12px] [color:#64748b]">
                  {upcomingInterviews.length} interview
                  {upcomingInterviews.length === 1 ? "" : "s"} scheduled or awaiting evaluation
                </p>
              </div>
              <div className="[overflow:hidden] [border:1px_solid_#e2e8f0] [border-radius:16px] [background:#fff] [shadow:0_8px_24px_rgba(15,23,42,0.04)]">
                <InterviewsTable
                  interviews={upcomingInterviews}
                  completed={false}
                  canEdit={canManageCandidates(session)}
                  onViewDetails={setSelectedInterview}
                />
              </div>
            </section>

            <section>
              <div className="[margin-bottom:12px]">
                <h2 className="[margin:0] [font-size:16px] [font-weight:800] [color:#1e293b]">
                  Completed interviews
                </h2>
                <p className="[margin-top:4px] [font-size:12px] [color:#64748b]">
                  Completed interviews are read-only. You can view their details but cannot edit or reschedule them.
                </p>
              </div>
              <div className="[overflow:hidden] [border:1px_solid_#e2e8f0] [border-radius:16px] [background:#fff] [shadow:0_8px_24px_rgba(15,23,42,0.04)]">
                <InterviewsTable
                  interviews={completedInterviews}
                  completed
                  canEdit={false}
                  onViewDetails={setSelectedInterview}
                />
              </div>
            </section>
          </div>
        )}
      </div>

      {selectedInterview && (
        <div
          className="[position:fixed] [inset:0] [z-index:50] [display:flex] [align-items:center] [justify-content:center] [background:rgba(15,23,42,0.55)] [padding:20px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedInterview(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="completed-interview-title"
            className="[width:100%] [max-width:560px] [overflow:hidden] [border-radius:16px] [border:1px_solid_#e2e8f0] [background:#fff] [box-shadow:0_24px_70px_rgba(15,23,42,0.28)]"
          >
            <div className="[display:flex] [align-items:flex-start] [justify-content:space-between] [gap:12px] [border-bottom:1px_solid_#edf0f3] [padding:20px]">
              <div>
                <p className="[margin:0_0_5px] [font-size:10px] [font-weight:800] [letter-spacing:1px] [color:#00a6c7]">
                  COMPLETED INTERVIEW
                </p>
                <h2 id="completed-interview-title" className="[margin:0] [font-size:18px] [font-weight:800] [color:#1e293b]">
                  {selectedInterview.candidate_name || "Candidate"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close interview details"
                onClick={() => setSelectedInterview(null)}
                className="[display:flex] [height:34px] [width:34px] [align-items:center] [justify-content:center] [border:0] [border-radius:8px] [background:#f1f5f9] [color:#475569] hover:[background:#e2e8f0]"
              >
                <X size={17} />
              </button>
            </div>
            <div className="[display:grid] [gap:14px] [padding:20px]">
              <Detail label="Role" value={selectedInterview.role_name || "Not specified"} />
              <Detail label="Interview round" value={selectedInterview.round || "Not specified"} />
              <Detail
                label="Scheduled"
                value={`${formatDate(selectedInterview.scheduled_at)} ${formatTime(selectedInterview.scheduled_at)}`}
              />
              <Detail label="Status" value="Completed — read only" />
              <div>
                <div className="[margin-bottom:6px] [font-size:11px] [font-weight:800] [text-transform:uppercase] [letter-spacing:0.5px] [color:#64748b]">
                  Interview feedback
                </div>
                <div className="[white-space:pre-wrap] [border-radius:12px] [border:1px_solid_#e2e8f0] [background:#f8fafc] [padding:13px] [font-size:13px] [line-height:1.6] [color:#334155]">
                  {selectedInterview.notes ||
                    selectedInterview.candidate_interview_notes ||
                    "No interview feedback was recorded."}
                </div>
              </div>
            </div>
            <div className="[display:flex] [justify-content:flex-end] [border-top:1px_solid_#edf0f3] [padding:16px_20px]">
              <Button type="button" variant="secondary" onClick={() => setSelectedInterview(null)}>
                Close
              </Button>
            </div>
          </section>
        </div>
      )}
    </PageShell>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div className="[margin-bottom:4px] [font-size:11px] [font-weight:800] [text-transform:uppercase] [letter-spacing:0.5px] [color:#64748b]">
        {label}
      </div>
      <div className="[font-size:13px] [font-weight:650] [color:#1e293b]">{value}</div>
    </div>
  );
}

export default InterviewsPage;

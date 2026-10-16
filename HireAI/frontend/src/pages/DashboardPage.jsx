import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  BriefcaseBusiness,
  Users,
  CalendarCheck,
  FileText,
} from "lucide-react";

import PageShell from "../components/common/PageShell";
import PageState from "../components/common/PageState";
import StatCard from "../components/common/StatCard";
import badgeClass from "../components/common/badgeClass";
import scoreBar from "../components/common/scoreBar";
import QuickActionsPanel from "../components/dashboard/QuickActionsPanel";

import { fetchDashboardSummary } from "../store/dashboardSlice";

const JobsIcon = (props) => <BriefcaseBusiness {...props} />;

const CandidatesIcon = (props) => <Users {...props} />;

const InterviewsIcon = (props) => <CalendarCheck {...props} />;

const OffersIcon = (props) => <FileText {...props} />;

/* =========================
   HELPER FUNCTIONS
========================= */

function getInitials(name) {
  if (!name) return "?";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function formatInterviewDateTime(dateValue) {
  if (!dateValue) {
    return {
      day: "—",
      month: "",
      date: "Date not available",
      time: "",
    };
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return {
      day: "—",
      month: "",
      date: "Date not available",
      time: "",
    };
  }

  const today = new Date();

  const isToday = date.toDateString() === today.toDateString();

  return {
    day: date.getDate(),

    month: date.toLocaleDateString([], {
      month: "short",
    }),

    date: isToday
      ? "Today"
      : date.toLocaleDateString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),

    time: date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

/* =========================
   DASHBOARD PAGE
========================= */

function DashboardPage() {
  const dispatch = useDispatch();

  const { summary, loading, error } = useSelector((state) => state.dashboard);

  /* =========================
     LOAD DASHBOARD DATA
  ========================= */

  useEffect(() => {
    if (!summary && !loading && !error) {
      dispatch(fetchDashboardSummary());
    }
  }, [dispatch, summary, loading, error]);

  /* =========================
     DASHBOARD DATA
  ========================= */

  const counts = summary?.counts || {};

  const recentCandidates = summary?.recent_candidates || [];

  /*
    Only keep interviews scheduled from right now onward (later today
    or on a future date) — the API may return past interviews too, so
    this filters and sorts them soonest-first before display.
  */
  const upcomingInterviews = useMemo(() => {
    const now = new Date();

    return (summary?.upcoming_interviews || [])
      .filter((interview) => {
        if (!interview.scheduled_at) return false;

        const scheduledDate = new Date(interview.scheduled_at);

        return !Number.isNaN(scheduledDate.getTime()) && scheduledDate >= now;
      })
      .sort(
        (a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at),
      );
  }, [summary]);

  const totalCandidates = counts.candidates || 0;

  if (!summary && loading) {
    return (
      <PageShell
        title="Dashboard"
        active="dashboard"
        eyebrow="HIRING OVERVIEW"
        description="A clear snapshot of your hiring pipeline and next steps."
      >
        <PageState variant="loading" title="Loading dashboard" rows={4} />
      </PageShell>
    );
  }

  if (!summary && error) {
    return (
      <PageShell
        title="Dashboard"
        active="dashboard"
        eyebrow="HIRING OVERVIEW"
        description="A clear snapshot of your hiring pipeline and next steps."
      >
        <PageState
          variant="error"
          title="Couldn't load dashboard"
          description={error}
          onRetry={() => dispatch(fetchDashboardSummary())}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Dashboard"
      active="dashboard"
      eyebrow="HIRING OVERVIEW"
      description="A clear snapshot of your hiring pipeline and next steps."
    >
      {/* =========================
          DASHBOARD METRICS
      ========================= */}

      <div className="grid4 dashboard-kpi-grid [display:grid] [grid-template-columns:repeat(4,_1fr)] [gap:14px] [margin-bottom:28px] max-[960px]:[grid-template-columns:1fr] max-[960px]:[flex-direction:column]">
        <StatCard
          label="Active Jobs"
          value={loading ? "—" : String(counts.open_jobs || 0)}
          icon={<JobsIcon size={18} />}
          color="brand"
        />

        <StatCard
          label="Total Candidates"
          value={loading ? "—" : String(totalCandidates)}
          icon={<CandidatesIcon size={18} />}
          color="purple"
        />

        <StatCard
          label="Interviews Today"
          value={loading ? "—" : String(counts.interviews_today || 0)}
          icon={<InterviewsIcon size={18} />}
          color="teal"
        />

        <StatCard
          label="Offers Pending"
          value={loading ? "—" : String(counts.offers_pending || 0)}
          icon={<OffersIcon size={18} />}
          color="orange"
        />
      </div>

      {/* =========================
          QUICK ACTIONS + INTERVIEWS
      ========================= */}

      <div className="grid2 dashboard-middle-grid [display:grid] [grid-template-columns:1fr_1fr] [gap:14px] [margin-bottom:28px] max-[960px]:[grid-template-columns:1fr] max-[960px]:[flex-direction:column]">
        {/* =========================
            QUICK ACTIONS
        ========================= */}

        <QuickActionsPanel />

        {/* =========================
            UPCOMING INTERVIEWS
        ========================= */}

        <div className="card upcoming-interviews-card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [display:flex] [flex-direction:column]">
          <div className="section-header [display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:14px]">
            <div>
              <h3 className="[.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px]">Upcoming Interviews</h3>

              <p
                className="muted [margin-top:4px] [font-size:12px] [color:#64748b]"

              >
                Your next scheduled interviews.
              </p>
            </div>

            {upcomingInterviews.length > 0 && (
              <Link to="/interviews" className="btn btn-ghost btn-sm [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:transparent] [color:#64748b] [border:1px_solid_#e2e8f0] [padding:6px_14px] [font-size:12px]">
                View All
              </Link>
            )}
          </div>

          {upcomingInterviews.length === 0 ? (
            <div className="dashboard-empty [min-height:200px] [padding:36px_20px] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center] [text-align:center] [color:#64748b]">
              <div className="[font-size:30px] [margin-bottom:8px]"

              >
                📅
              </div>

              <div className="font-bold">No upcoming interviews</div>

              <div
                className="muted [margin-top:4px] [font-size:12px] [color:#64748b]"

              >
                Scheduled interviews will appear here.
              </div>
            </div>
          ) : (
            <div className="upcoming-interviews-list [display:flex] [flex-direction:column] [gap:10px]">
              {upcomingInterviews.slice(0, 4).map((interview, index) => {
                const { day, month, date, time } = formatInterviewDateTime(
                  interview.scheduled_at,
                );

                return (
                  <div
                    key={interview.id || `${interview.candidate_name}-${index}`}
                    className="interview-summary-card [display:flex] [align-items:center] [gap:14px] [padding:12px_14px] [border:1px_solid_#e2e8f0] [border-radius:10px] [transition:background_0.2s_ease,_border-color_0.2s_ease] hover:[background:#e8f0fb] hover:[border-color:#133f7d] max-[700px]:[gap:10px]"
                  >
                    {/* DATE */}

                    <div className="interview-date-box [width:46px] [min-width:46px] [height:52px] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center] [border-radius:9px] [background:#e8f0fb] [border:1px_solid_rgba(0,_0,_0,_0.05)]">
                      <span className="interview-date-day [font-size:18px] [font-weight:700] [line-height:1] [color:#133f7d]">{day}</span>

                      <span className="interview-date-month [margin-top:3px] [font-size:11px] [font-weight:600] [text-transform:uppercase] [color:#64748b]">{month}</span>
                    </div>

                    {/* AVATAR */}

                    <div
                      className="avatar interview-avatar [background:#e8f0fb] [color:#133f7d] [width:34px] [height:34px] [border-radius:50%] [display:flex] [align-items:center] [justify-content:center] [font-weight:700] [font-size:12px] [flex-shrink:0] max-[700px]:[display:none]"

                    >
                      {getInitials(interview.candidate_name)}
                    </div>

                    {/* CANDIDATE DETAILS */}

                    <div className="interview-main [min-width:0] [flex:1]">
                      <div className="interview-candidate-name [font-size:14px] [font-weight:600] [white-space:nowrap] [overflow:hidden] [text-overflow:ellipsis] [font-size:13px] [font-weight:700] [color:#1e293b]">
                        {interview.candidate_name || "Unknown Candidate"}
                      </div>

                      <div className="interview-role [margin-top:3px] [font-size:12px] [color:#64748b] [white-space:nowrap] [overflow:hidden] [text-overflow:ellipsis]">
                        {interview.role_name || "Role not specified"}
                      </div>
                    </div>

                    {/* TIME */}

                    <div className="interview-time-info [min-width:82px] [text-align:right] max-[700px]:[min-width:auto]">
                      <div className="interview-time [font-size:14px] [font-weight:600]">{time || "Time TBD"}</div>

                      <div className="interview-date-text [margin-top:3px] [font-size:11px] [color:#64748b] max-[700px]:[display:none]">{date}</div>
                    </div>

                    {/* INTERVIEW ROUND */}

                    {interview.round && (
                      <div className="interview-round [min-width:95px] [display:flex] [justify-content:flex-end] max-[700px]:[display:none]">
                        <span className="badge badge-teal [font-size:11px] [font-weight:700] [padding:3px_9px] [border-radius:20px] [white-space:nowrap] [display:inline-block] [background:#e0f7fa] [color:#006064]">
                          {interview.round}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* =========================
          RECENT CANDIDATES
      ========================= */}

      <div className="card dashboard-recent-card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [margin-top:0]">
        <div className="section-header [display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:14px]">
          <div>
            <h3 className="[.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px]">Recent Candidates</h3>

            <p
              className="muted [margin-top:4px] [font-size:12px] [color:#64748b]"

            >
              Latest candidates added to the recruitment pipeline.
            </p>
          </div>

          <Link to="/candidates" className="btn btn-secondary btn-sm [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#fff] [color:#133f7d] [border:1.5px_solid_#133f7d] [padding:6px_14px] [font-size:12px]">
            View All
          </Link>
        </div>

        {recentCandidates.length === 0 ? (
          <div className="dashboard-empty [min-height:200px] [padding:36px_20px] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center] [text-align:center] [color:#64748b]">
            <div className="[font-size:32px] [margin-bottom:10px]"

            >
              👥
            </div>

            <div className="font-bold">No candidates yet</div>

            <div
              className="muted [margin-top:5px] [font-size:12px] [color:#64748b]"

            >
              Recent candidate applications will appear here.
            </div>
          </div>
        ) : (
          <table className="[width:100%] [border-collapse:collapse]">
            <thead>
              <tr>
                <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]">Candidate</th>
                <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]">Role</th>
                <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]">Status</th>
                <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]">Match Score</th>
              </tr>
            </thead>

            <tbody>
              {recentCandidates.slice(0, 4).map((candidate, index) => (
                <tr
                  key={candidate.candidate_id || `${candidate.name}-${index}`}
                >
                  <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc]">
                    <div className="flex-row [display:flex] [align-items:center] [gap:10px]">
                      <div
                        className="avatar [background:#e8f0fb] [color:#133f7d] [width:34px] [height:34px] [border-radius:50%] [display:flex] [align-items:center] [justify-content:center] [font-weight:700] [font-size:12px]"

                      >
                        {getInitials(candidate.name)}
                      </div>

                      <span className="font-bold">
                        {candidate.name || "Unknown Candidate"}
                      </span>
                    </div>
                  </td>

                  <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc]">{candidate.role || "—"}</td>

                  <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc]">
                    {candidate.status ? (
                      <span
                        className={`${(`badge ${badgeClass(
                          candidate.status.toLowerCase().replace(/ /g, "-"),
                        )}`)} [font-size:11px] [font-weight:700] [padding:3px_9px] [border-radius:20px] [white-space:nowrap] [display:inline-block]`}
                      >
                        {candidate.status}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc]">
                    {candidate.score === null || candidate.score === undefined ? (
                      <span className="badge badge-blue [font-size:11px] [font-weight:700] [padding:3px_9px] [border-radius:20px] [white-space:nowrap] [display:inline-block] [background:#e8f0fb] [color:#133f7d]">Not evaluated</span>
                    ) : (
                      scoreBar(candidate.score)
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  );
}

export default DashboardPage;
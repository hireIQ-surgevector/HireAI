import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  BriefcaseBusiness,
  Users,
  CalendarCheck,
  FileText,
  ArrowRight,
  PlusCircle,
  UploadCloud,
} from "lucide-react";

import PageShell from "../components/PageShell";
import StatCard from "../components/StatCard";
import badgeClass from "../components/badgeClass";
import scoreBar from "../components/scoreBar";

import { fetchDashboardSummary } from "../store/dashboardSlice";

const JobsIcon = (props) => <BriefcaseBusiness {...props} />;

const CandidatesIcon = (props) => <Users {...props} />;

const InterviewsIcon = (props) => <CalendarCheck {...props} />;

const OffersIcon = (props) => <FileText {...props} />;

const ArrowRightIcon = (props) => <ArrowRight {...props} />;

const PostJobIcon = (props) => <PlusCircle {...props} />;

const UploadResumeIcon = (props) => <UploadCloud {...props} />;

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
   QUICK ACTIONS CONFIG
========================= */

const QUICK_ACTIONS = [
  {
    key: "post-job",
    to: "/post-job",
    label: "Post a New Job",
    description: "Create a job opening for your team.",
    icon: PostJobIcon,
  },
  {
    key: "upload-resume",
    to: "/upload-resume",
    label: "Add Candidates",
    description: "Upload resumes to bring in new candidates.",
    icon: UploadResumeIcon,
  },
];

/* =========================
   DASHBOARD PAGE
========================= */

function DashboardPage() {
  const dispatch = useDispatch();

  const { summary, loading } = useSelector((state) => state.dashboard);

  /* =========================
     LOAD DASHBOARD DATA
  ========================= */

  useEffect(() => {
    if (!summary && !loading) {
      dispatch(fetchDashboardSummary());
    }
  }, [dispatch, summary, loading]);

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

  return (
    <PageShell title="Dashboard" active="dashboard">
      {/* =========================
          DASHBOARD METRICS
      ========================= */}

      <div className="grid4 dashboard-kpi-grid">
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

      <div className="grid2 dashboard-middle-grid">
        {/* =========================
            QUICK ACTIONS
        ========================= */}

        <div className="card">
          <div className="section-header">
            <div>
              <h3>Quick Actions</h3>

              <p
                className="muted"
                style={{
                  marginTop: "4px",
                }}
              >
                Common tasks, one click away.
              </p>
            </div>
          </div>

          <div className="quick-actions-list">
            {QUICK_ACTIONS.map((action) => {
              const ActionIcon = action.icon;

              return (
                <Link
                  key={action.key}
                  to={action.to}
                  className="quick-action-row"
                >
                  <div className="quick-action-icon">
                    <ActionIcon size={18} />
                  </div>

                  <div className="quick-action-main">
                    <div className="quick-action-label">{action.label}</div>

                    <div className="quick-action-description muted">
                      {action.description}
                    </div>
                  </div>

                  <ArrowRightIcon size={16} className="quick-action-arrow" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* =========================
            UPCOMING INTERVIEWS
        ========================= */}

        <div className="card upcoming-interviews-card">
          <div className="section-header">
            <div>
              <h3>Upcoming Interviews</h3>

              <p
                className="muted"
                style={{
                  marginTop: "4px",
                }}
              >
                Your next scheduled interviews.
              </p>
            </div>

            {upcomingInterviews.length > 0 && (
              <Link to="/interviews" className="btn btn-ghost btn-sm">
                View All
              </Link>
            )}
          </div>

          {upcomingInterviews.length === 0 ? (
            <div className="dashboard-empty">
              <div
                style={{
                  fontSize: "30px",
                  marginBottom: "8px",
                }}
              >
                📅
              </div>

              <div className="strong">No upcoming interviews</div>

              <div
                className="muted"
                style={{
                  marginTop: "4px",
                }}
              >
                Scheduled interviews will appear here.
              </div>
            </div>
          ) : (
            <div className="upcoming-interviews-list">
              {upcomingInterviews.slice(0, 4).map((interview, index) => {
                const { day, month, date, time } = formatInterviewDateTime(
                  interview.scheduled_at,
                );

                return (
                  <div
                    key={interview.id || `${interview.candidate_name}-${index}`}
                    className="interview-summary-card"
                  >
                    {/* DATE */}

                    <div className="interview-date-box">
                      <span className="interview-date-day">{day}</span>

                      <span className="interview-date-month">{month}</span>
                    </div>

                    {/* AVATAR */}

                    <div
                      className="avatar interview-avatar"
                      style={{
                        background: "var(--brand-light)",

                        color: "var(--brand)",
                      }}
                    >
                      {getInitials(interview.candidate_name)}
                    </div>

                    {/* CANDIDATE DETAILS */}

                    <div className="interview-main">
                      <div className="interview-candidate-name">
                        {interview.candidate_name || "Unknown Candidate"}
                      </div>

                      <div className="interview-role">
                        {interview.role_name || "Role not specified"}
                      </div>
                    </div>

                    {/* TIME */}

                    <div className="interview-time-info">
                      <div className="interview-time">{time || "Time TBD"}</div>

                      <div className="interview-date-text">{date}</div>
                    </div>

                    {/* INTERVIEW ROUND */}

                    {interview.round && (
                      <div className="interview-round">
                        <span className="badge badge-teal">
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

      <div className="card dashboard-recent-card">
        <div className="section-header">
          <div>
            <h3>Recent Candidates</h3>

            <p
              className="muted"
              style={{
                marginTop: "4px",
              }}
            >
              Latest candidates added to the recruitment pipeline.
            </p>
          </div>

          <Link to="/candidates" className="btn btn-secondary btn-sm">
            View All
          </Link>
        </div>

        {recentCandidates.length === 0 ? (
          <div className="dashboard-empty">
            <div
              style={{
                fontSize: "32px",
                marginBottom: "10px",
              }}
            >
              👥
            </div>

            <div className="strong">No candidates yet</div>

            <div
              className="muted"
              style={{
                marginTop: "5px",
              }}
            >
              Recent candidate applications will appear here.
            </div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Role</th>
                <th>Status</th>
                <th>Match Score</th>
              </tr>
            </thead>

            <tbody>
              {recentCandidates.slice(0, 4).map((candidate, index) => (
                <tr
                  key={candidate.candidate_id || `${candidate.name}-${index}`}
                >
                  <td>
                    <div className="flex-row">
                      <div
                        className="avatar"
                        style={{
                          background: "var(--brand-light)",

                          color: "var(--brand)",
                        }}
                      >
                        {getInitials(candidate.name)}
                      </div>

                      <span className="strong">
                        {candidate.name || "Unknown Candidate"}
                      </span>
                    </div>
                  </td>

                  <td>{candidate.role || "—"}</td>

                  <td>
                    {candidate.status ? (
                      <span
                        className={`badge ${badgeClass(
                          candidate.status.toLowerCase().replace(/ /g, "-"),
                        )}`}
                      >
                        {candidate.status}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td>
                    {candidate.score === null || candidate.score === undefined ? (
                      <span className="badge badge-blue">Not evaluated</span>
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
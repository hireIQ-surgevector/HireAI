import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  BriefcaseBusiness,
  Users,
  CalendarCheck,
  FileText,
  ArrowRight,
} from "lucide-react";

import PageShell from "./PageShell";
import StatCard from "./StatCard";
import badgeClass from "./badgeClass";
import scoreBar from "./scoreBar";

import { getSession } from "../utils/auth";
import { fetchDashboardSummary } from "../store/dashboardSlice";

const JobsIcon = (props) => <BriefcaseBusiness {...props} />;

const CandidatesIcon = (props) => <Users {...props} />;

const InterviewsIcon = (props) => <CalendarCheck {...props} />;

const OffersIcon = (props) => <FileText {...props} />;

const ArrowRightIcon = (props) => <ArrowRight {...props} />;

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

  const { summary, loading } = useSelector(
    (state) => state.dashboard,
  );

  const session = getSession();

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

  const upcomingInterviews = summary?.upcoming_interviews || [];

  const pipeline = summary?.pipeline || [];

  const canManage =
    session?.permissions?.can_manage_candidates || session?.role === "manager";

  const totalCandidates = counts.candidates || 0;

  return (
    <PageShell title="Dashboard" active="dashboard">
      {/* =========================
          DASHBOARD METRICS
      ========================= */}

      <div className="grid4">
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
          PIPELINE + INTERVIEWS
      ========================= */}

      <div className="grid2">
        {/* =========================
            HIRING PIPELINE
        ========================= */}

        <div className="card">
          <div className="section-header">
            <div>
              <h3>Hiring Pipeline</h3>

              <p
                className="muted"
                style={{
                  marginTop: "4px",
                }}
              >
                Overview of candidates across the recruitment process.
              </p>
            </div>
          </div>

          {pipeline.length > 0 ? (
            <div className="pipeline-list">
              {pipeline.map((item) => {
                const percentage =
                  totalCandidates > 0
                    ? Math.min(100, (item.value / totalCandidates) * 100)
                    : 0;

                return (
                  <div key={item.label} className="pipeline-row">
                    <div className="pipeline-label">{item.label}</div>

                    <div className="pipeline-value">{item.value}</div>

                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="dashboard-empty">
              <div
                style={{
                  fontSize: "30px",
                  marginBottom: "8px",
                }}
              >
                📊
              </div>

              <div className="strong">No pipeline data yet</div>

              <div
                className="muted"
                style={{
                  marginTop: "4px",
                }}
              >
                Candidate activity will appear here once applications are
                received.
              </div>
            </div>
          )}
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

      <div className="card">
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
                <th>Action</th>
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

                  <td>{scoreBar(candidate.score || 0)}</td>

                  <td>
                    {canManage && candidate.candidate_id ? (
                      <Link
                        to={`/candidate-detail/${candidate.candidate_id}`}
                        className="btn btn-ghost btn-sm"
                      >
                        View
                        <ArrowRightIcon size={14} />
                      </Link>
                    ) : (
                      <span className="muted">Restricted</span>
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

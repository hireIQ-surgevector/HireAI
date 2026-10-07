import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../components/common/PageShell";
import { CalendarDays, Clock, Pencil, Plus } from "lucide-react";
import { API_URL, canManageCandidates, getSession } from "../utils/auth";
import PageState from "../components/common/PageState";
import Button from "../components/common/Button";
import StatusBadge from "../components/common/StatusBadge";

function InterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  const session = getSession();

  useEffect(() => {
    const loadInterviews = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");

        const response = await fetch(`${API_URL}/api/interviews`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (date) => {
    if (!date) return "Not scheduled";

    return new Date(date).toLocaleDateString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <PageShell
      title="Interviews"
      active="interviews"
      actions={
        canManageCandidates(session) ? (
          <Button as={Link} to="/schedule-interview" size="sm">
            <Plus size={15} />
            Schedule interview
          </Button>
        ) : null
      }
    >
      <div className="interviews-page [width:100%] [max-width:1300px] [margin:0_auto]">
        {/* PAGE HEADER */}

        <div className="interviews-header [display:flex] [align-items:flex-start] [justify-content:space-between] [gap:24px] [padding:6px_2px_24px] max-[700px]:[flex-direction:column] max-[520px]:[padding-bottom:18px]">
          <div>
            <p className="interviews-eyebrow [margin-bottom:7px] [font-size:10px] [font-weight:800] [letter-spacing:1.2px] [color:#00b4d8] [&:not(.interviews-eyebrow)]:[.interviews-header_&]:[margin:0] [&:not(.interviews-eyebrow)]:[.interviews-header_&]:[font-size:13px] [&:not(.interviews-eyebrow)]:[.interviews-header_&]:[color:#64748b] [&:not(.interviews-eyebrow)]:[.interviews-header_&]:[line-height:1.6]">INTERVIEW MANAGEMENT</p>

            <h2 className="[.interviews-header_&]:[margin:0_0_7px] [.interviews-header_&]:[font-size:24px] [.interviews-header_&]:[font-weight:750] [.interviews-header_&]:[color:#1e293b] max-[700px]:[.interviews-header_&]:[font-size:21px]">Scheduled Interviews</h2>

            <p>Manage and track all candidate interviews in one place.</p>
          </div>

          {!loading && (
            <div className="interviews-count [display:inline-flex] [align-items:center] [gap:8px] [flex-shrink:0] [padding:9px_13px] [border-radius:999px] [background:#e8f0fb] [border:1px_solid_#d8e5f5] [color:#133f7d] [font-size:12px] [font-weight:700] max-[700px]:[align-self:flex-start]">
              <CalendarDays size={16} />

              <span>
                {interviews.length}{" "}
                {interviews.length === 1 ? "Interview" : "Interviews"}
              </span>
            </div>
          )}
        </div>

        {/* INTERVIEWS TABLE */}

        <div className="interviews-table-card [background:#ffffff] [border:1px_solid_#e2e8f0] [border-radius:16px] [overflow:hidden] [box-shadow:0_1px_2px_rgba(15,_23,_42,_0.03),_0_8px_24px_rgba(15,_23,_42,_0.04)] max-[520px]:[border-radius:12px]">
          {loading ? (
            <PageState variant="loading" title="Loading interviews" rows={5} />
          ) : error ? (
            <PageState
              variant="error"
              title="Couldn't load interviews"
              description={error}
              onRetry={() => setReloadCount((count) => count + 1)}
            />
          ) : interviews.length === 0 ? (
            <PageState
              variant="empty"
              title="No interviews scheduled"
              description="Schedule an interview to start managing candidate interview sessions."
              icon={CalendarDays}
              action={
                canManageCandidates(session) && (
                  <Button as={Link} to="/schedule-interview">
                    <Plus size={16} />
                    Schedule interview
                  </Button>
                )
              }
            />
          ) : (
            <div className="interviews-table-wrapper [width:100%] [overflow-x:auto]">
              <table className="interviews-table [width:100%] [border-collapse:collapse] [min-width:760px] max-[520px]:[min-width:700px]">
                <thead className="[.interviews-table_&]:[background:#f8fafc]">
                  <tr>
                    <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc] [.interviews-table_&]:[padding:13px_18px] [.interviews-table_&]:[border-bottom:1px_solid_#e2e8f0] [.interviews-table_&]:[background:#f8fafc] [.interviews-table_&]:[font-size:10px] [.interviews-table_&]:[font-weight:800] [.interviews-table_&]:[letter-spacing:0.7px] [.interviews-table_&]:[text-transform:uppercase] [.interviews-table_&]:[color:#64748b] [.interviews-table_&]:[white-space:nowrap] max-[520px]:[.interviews-table_&]:[padding-left:14px] max-[520px]:[.interviews-table_&]:[padding-right:14px]">Candidate</th>
                    <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc] [.interviews-table_&]:[padding:13px_18px] [.interviews-table_&]:[border-bottom:1px_solid_#e2e8f0] [.interviews-table_&]:[background:#f8fafc] [.interviews-table_&]:[font-size:10px] [.interviews-table_&]:[font-weight:800] [.interviews-table_&]:[letter-spacing:0.7px] [.interviews-table_&]:[text-transform:uppercase] [.interviews-table_&]:[color:#64748b] [.interviews-table_&]:[white-space:nowrap] max-[520px]:[.interviews-table_&]:[padding-left:14px] max-[520px]:[.interviews-table_&]:[padding-right:14px]">Role</th>
                    <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc] [.interviews-table_&]:[padding:13px_18px] [.interviews-table_&]:[border-bottom:1px_solid_#e2e8f0] [.interviews-table_&]:[background:#f8fafc] [.interviews-table_&]:[font-size:10px] [.interviews-table_&]:[font-weight:800] [.interviews-table_&]:[letter-spacing:0.7px] [.interviews-table_&]:[text-transform:uppercase] [.interviews-table_&]:[color:#64748b] [.interviews-table_&]:[white-space:nowrap] max-[520px]:[.interviews-table_&]:[padding-left:14px] max-[520px]:[.interviews-table_&]:[padding-right:14px]">Schedule</th>
                    <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc] [.interviews-table_&]:[padding:13px_18px] [.interviews-table_&]:[border-bottom:1px_solid_#e2e8f0] [.interviews-table_&]:[background:#f8fafc] [.interviews-table_&]:[font-size:10px] [.interviews-table_&]:[font-weight:800] [.interviews-table_&]:[letter-spacing:0.7px] [.interviews-table_&]:[text-transform:uppercase] [.interviews-table_&]:[color:#64748b] [.interviews-table_&]:[white-space:nowrap] max-[520px]:[.interviews-table_&]:[padding-left:14px] max-[520px]:[.interviews-table_&]:[padding-right:14px]">Round</th>
                    <th className="interviews-actions-heading [padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc] [.interviews-table_&]:[padding:13px_18px] [.interviews-table_&]:[border-bottom:1px_solid_#e2e8f0] [.interviews-table_&]:[background:#f8fafc] [.interviews-table_&]:[font-size:10px] [.interviews-table_&]:[font-weight:800] [.interviews-table_&]:[letter-spacing:0.7px] [.interviews-table_&]:[text-transform:uppercase] [.interviews-table_&]:[color:#64748b] [.interviews-table_&]:[white-space:nowrap] [text-align:right] max-[520px]:[.interviews-table_&]:[padding-left:14px] max-[520px]:[.interviews-table_&]:[padding-right:14px]">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {interviews.map((interview) => {
                    const interviewDate = interview.scheduled_at;

                    return (
                      <tr className="[.interviews-table_tbody_&]:[transition:background_0.18s_ease]"
                        key={
                          interview.id ||
                          `${interview.candidate_name}-${interview.scheduled_at}`
                        }
                      >
                        {/* CANDIDATE */}

                        <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc] [.interviews-table_&]:[padding:16px_18px] [.interviews-table_&]:[border-bottom:1px_solid_#edf0f3] [.interviews-table_&]:[vertical-align:middle] [.interviews-table_&]:[font-size:13px] [.interviews-table_&]:[color:#1e293b] [.interviews-table_&]:[background:#ffffff] [.interviews-table_tbody_tr:last-child_&]:[border-bottom:none] [.interviews-table_tbody_tr:hover_&]:[background:#f9fbfd] max-[520px]:[.interviews-table_&]:[padding-left:14px] max-[520px]:[.interviews-table_&]:[padding-right:14px]">
                          <div className="interview-candidate [display:flex] [align-items:center] [gap:11px] [min-width:180px]">
                            <div className="interview-candidate-avatar [width:40px] [height:40px] [flex-shrink:0] [display:flex] [align-items:center] [justify-content:center] [border-radius:50%] [background:#e8f0fb] [color:#133f7d] [font-size:12px] [font-weight:800]">
                              {getInitials(interview.candidate_name)}
                            </div>

                            <div className="interview-candidate-info [display:flex] [flex-direction:column] [gap:3px] [min-width:0]">
                              <span className="interview-candidate-name [font-size:14px] [font-weight:600] [white-space:nowrap] [overflow:hidden] [text-overflow:ellipsis] [font-size:13px] [font-weight:700] [color:#1e293b]">
                                {interview.candidate_name}
                              </span>

                              <span className="interview-candidate-subtitle [font-size:11px] [color:#64748b]">
                                Candidate
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* ROLE */}

                        <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc] [.interviews-table_&]:[padding:16px_18px] [.interviews-table_&]:[border-bottom:1px_solid_#edf0f3] [.interviews-table_&]:[vertical-align:middle] [.interviews-table_&]:[font-size:13px] [.interviews-table_&]:[color:#1e293b] [.interviews-table_&]:[background:#ffffff] [.interviews-table_tbody_tr:last-child_&]:[border-bottom:none] [.interviews-table_tbody_tr:hover_&]:[background:#f9fbfd] max-[520px]:[.interviews-table_&]:[padding-left:14px] max-[520px]:[.interviews-table_&]:[padding-right:14px]">
                          <span className="interview-role-name [font-size:13px] [font-weight:600] [color:#1e293b] [white-space:nowrap]">
                            {interview.role_name}
                          </span>
                        </td>

                        {/* DATE & TIME */}

                        <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc] [.interviews-table_&]:[padding:16px_18px] [.interviews-table_&]:[border-bottom:1px_solid_#edf0f3] [.interviews-table_&]:[vertical-align:middle] [.interviews-table_&]:[font-size:13px] [.interviews-table_&]:[color:#1e293b] [.interviews-table_&]:[background:#ffffff] [.interviews-table_tbody_tr:last-child_&]:[border-bottom:none] [.interviews-table_tbody_tr:hover_&]:[background:#f9fbfd] max-[520px]:[.interviews-table_&]:[padding-left:14px] max-[520px]:[.interviews-table_&]:[padding-right:14px]">
                          {interviewDate ? (
                            <div className="interview-schedule [display:flex] [flex-direction:column] [gap:6px] [min-width:160px]">
                              <div className="interview-schedule-item [display:flex] [align-items:center] [gap:7px] [font-size:12px] [font-weight:600] [color:#1e293b]">
                                <CalendarDays size={14} />

                                <span>{formatDate(interviewDate)}</span>
                              </div>

                              <div className="interview-schedule-item interview-time [font-size:14px] [font-weight:600] [display:flex] [align-items:center] [gap:7px] [font-size:12px] [color:#1e293b] [color:#64748b] [font-weight:500]">
                                <Clock size={14} />

                                <span>{formatTime(interviewDate)}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="interview-not-scheduled [font-size:12px] [color:#64748b] [font-style:italic]">
                              Not scheduled
                            </span>
                          )}
                        </td>

                        {/* ROUND */}

                        <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc] [.interviews-table_&]:[padding:16px_18px] [.interviews-table_&]:[border-bottom:1px_solid_#edf0f3] [.interviews-table_&]:[vertical-align:middle] [.interviews-table_&]:[font-size:13px] [.interviews-table_&]:[color:#1e293b] [.interviews-table_&]:[background:#ffffff] [.interviews-table_tbody_tr:last-child_&]:[border-bottom:none] [.interviews-table_tbody_tr:hover_&]:[background:#f9fbfd] max-[520px]:[.interviews-table_&]:[padding-left:14px] max-[520px]:[.interviews-table_&]:[padding-right:14px]">
                          <StatusBadge status={`Round ${interview.round}`} />
                        </td>

                        {/* ACTIONS */}

                        <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc] [.interviews-table_&]:[padding:16px_18px] [.interviews-table_&]:[border-bottom:1px_solid_#edf0f3] [.interviews-table_&]:[vertical-align:middle] [.interviews-table_&]:[font-size:13px] [.interviews-table_&]:[color:#1e293b] [.interviews-table_&]:[background:#ffffff] [.interviews-table_tbody_tr:last-child_&]:[border-bottom:none] [.interviews-table_tbody_tr:hover_&]:[background:#f9fbfd] max-[520px]:[.interviews-table_&]:[padding-left:14px] max-[520px]:[.interviews-table_&]:[padding-right:14px]">
                          <div className="interview-row-actions [display:flex] [justify-content:flex-end] [min-width:140px]">
                            <Link
                              to={`/edit-interview-schedule/${interview.id}`}
                              className="interview-edit-btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:7px] [min-height:34px] [padding:0_11px] [border-radius:8px] [background:#ffffff] [border:1px_solid_#dce2ea] [color:#133f7d] [font-size:11px] [font-weight:700] [white-space:nowrap] [transition:background_0.18s_ease,_border-color_0.18s_ease,_transform_0.18s_ease] hover:[background:#e8f0fb] hover:[border-color:#133f7d] hover:[transform:translateY(-1px)]"
                              title="Edit interview schedule"
                            >
                              <Pencil size={14} />

                              <span>Edit Schedule</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

export default InterviewsPage;

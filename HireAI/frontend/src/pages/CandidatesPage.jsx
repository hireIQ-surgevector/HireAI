import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Users,
  UserCheck,
  Send,
  UserX,
  Filter,
  RotateCcw,
} from "lucide-react";

import PageShell from "../components/PageShell";
import scoreBar from "../components/scoreBar";
import badgeClass from "../components/badgeClass";

import {
  API_URL,
  canAccessSensitive,
  canManageCandidates,
  getAuthHeader,
  getSession,
} from "../utils/auth";

function CandidatesPage() {
  const [stageFilter, setStageFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const session = getSession();
  const navigate = useNavigate();

  useEffect(() => {
    const loadCandidates = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/api/candidates`, {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load candidates");
        }

        setCandidates(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Unable to load candidates", err);
        setError(err.message);
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    };

    loadCandidates();
  }, []);

  const getCandidateStage = (candidate) => {
    return candidate.stage || candidate.status || "Applied";
  };

  const stageCounts = useMemo(() => {
    return {
      all: candidates.length,

      active: candidates.filter((candidate) => {
        const stage = getCandidateStage(candidate).toLowerCase();

        return !stage.includes("offer") && !stage.includes("reject");
      }).length,

      offered: candidates.filter((candidate) =>
        getCandidateStage(candidate).toLowerCase().includes("offer"),
      ).length,

      rejected: candidates.filter((candidate) =>
        getCandidateStage(candidate).toLowerCase().includes("reject"),
      ).length,
    };
  }, [candidates]);

  const availableStages = useMemo(() => {
    const stages = candidates
      .map((candidate) => getCandidateStage(candidate))
      .filter(Boolean);

    return [...new Set(stages)];
  }, [candidates]);

  const visibleCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      const stage = getCandidateStage(candidate).toLowerCase();

      const search = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !search ||
        (candidate.name || "").toLowerCase().includes(search) ||
        (candidate.role || "").toLowerCase().includes(search) ||
        (candidate.email || "").toLowerCase().includes(search);

      let matchesStage = true;

      if (stageFilter === "active") {
        matchesStage = !stage.includes("offer") && !stage.includes("reject");
      } else if (stageFilter === "offered") {
        matchesStage = stage.includes("offer");
      } else if (stageFilter === "rejected") {
        matchesStage = stage.includes("reject");
      } else if (stageFilter !== "all") {
        matchesStage = getCandidateStage(candidate) === stageFilter;
      }

      return matchesSearch && matchesStage;
    });
  }, [candidates, stageFilter, searchTerm]);

  const clearFilters = () => {
    setStageFilter("all");
    setSearchTerm("");
  };

  const initials = (name = "") =>
    name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <PageShell
      title="Candidates"
      active="candidates"
      actions={
        canManageCandidates(session) && (
          <Link to="/upload-resume" className="btn btn-primary btn-sm [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#133f7d] [color:#fff] [padding:6px_14px] [font-size:12px]">
            📤 Upload Resumes
          </Link>
        )
      }
    >
      {/* Summary Cards */}

      <div className="candidate-summary-grid [display:grid] [grid-template-columns:repeat(4,_1fr)] [gap:14px] [margin-bottom:18px] max-[960px]:[grid-template-columns:repeat(2,_1fr)] max-[600px]:[grid-template-columns:1fr]">
        <button
          type="button"
          className={`${(`candidate-summary-card ${
            stageFilter === "all" ? "selected" : ""
          }`)} [font:inherit] [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:16px] [display:flex] [align-items:center] [gap:12px] [text-align:left] [cursor:pointer] [transition:all_0.18s_ease] hover:[transform:translateY(-2px)] hover:[border-color:#133f7d] hover:[box-shadow:0_6px_18px_rgba(19,_63,_125,_0.08)] [&.selected]:[border-color:#133f7d] [&.selected]:[background:#e8f0fb] [&.selected]:[box-shadow:0_4px_14px_rgba(19,_63,_125,_0.08)]`}
          onClick={() => setStageFilter("all")}
        >
          <div className="candidate-summary-icon icon-blue [width:42px] [height:42px] [border-radius:10px] [display:flex] [align-items:center] [justify-content:center] [flex-shrink:0] [background:#e8f0fb] [color:#133f7d]">
            <Users size={20} />
          </div>

          <div>
            <div className="candidate-summary-label [font-size:11px] [font-weight:700] [color:#64748b] [text-transform:uppercase] [letter-spacing:0.4px]">Total Candidates</div>

            <div className="candidate-summary-value [font-size:24px] [font-weight:800] [color:#1e293b] [margin-top:2px]">{stageCounts.all}</div>
          </div>
        </button>

        <button
          type="button"
          className={`${(`candidate-summary-card ${
            stageFilter === "active" ? "selected" : ""
          }`)} [font:inherit] [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:16px] [display:flex] [align-items:center] [gap:12px] [text-align:left] [cursor:pointer] [transition:all_0.18s_ease] hover:[transform:translateY(-2px)] hover:[border-color:#133f7d] hover:[box-shadow:0_6px_18px_rgba(19,_63,_125,_0.08)] [&.selected]:[border-color:#133f7d] [&.selected]:[background:#e8f0fb] [&.selected]:[box-shadow:0_4px_14px_rgba(19,_63,_125,_0.08)]`}
          onClick={() => setStageFilter("active")}
        >
          <div className="candidate-summary-icon icon-teal [width:42px] [height:42px] [border-radius:10px] [display:flex] [align-items:center] [justify-content:center] [flex-shrink:0] [background:#e0f7fa] [color:#006064]">
            <UserCheck size={20} />
          </div>

          <div>
            <div className="candidate-summary-label [font-size:11px] [font-weight:700] [color:#64748b] [text-transform:uppercase] [letter-spacing:0.4px]">Active Pipeline</div>

            <div className="candidate-summary-value [font-size:24px] [font-weight:800] [color:#1e293b] [margin-top:2px]">{stageCounts.active}</div>
          </div>
        </button>

        <button
          type="button"
          className={`${(`candidate-summary-card ${
            stageFilter === "offered" ? "selected" : ""
          }`)} [font:inherit] [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:16px] [display:flex] [align-items:center] [gap:12px] [text-align:left] [cursor:pointer] [transition:all_0.18s_ease] hover:[transform:translateY(-2px)] hover:[border-color:#133f7d] hover:[box-shadow:0_6px_18px_rgba(19,_63,_125,_0.08)] [&.selected]:[border-color:#133f7d] [&.selected]:[background:#e8f0fb] [&.selected]:[box-shadow:0_4px_14px_rgba(19,_63,_125,_0.08)]`}
          onClick={() => setStageFilter("offered")}
        >
          <div className="candidate-summary-icon icon-green [width:42px] [height:42px] [border-radius:10px] [display:flex] [align-items:center] [justify-content:center] [flex-shrink:0] [background:#dcfce7] [color:#166534]">
            <Send size={20} />
          </div>

          <div>
            <div className="candidate-summary-label [font-size:11px] [font-weight:700] [color:#64748b] [text-transform:uppercase] [letter-spacing:0.4px]">Offers Sent</div>

            <div className="candidate-summary-value [font-size:24px] [font-weight:800] [color:#1e293b] [margin-top:2px]">{stageCounts.offered}</div>
          </div>
        </button>

        <button
          type="button"
          className={`${(`candidate-summary-card ${
            stageFilter === "rejected" ? "selected" : ""
          }`)} [font:inherit] [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:16px] [display:flex] [align-items:center] [gap:12px] [text-align:left] [cursor:pointer] [transition:all_0.18s_ease] hover:[transform:translateY(-2px)] hover:[border-color:#133f7d] hover:[box-shadow:0_6px_18px_rgba(19,_63,_125,_0.08)] [&.selected]:[border-color:#133f7d] [&.selected]:[background:#e8f0fb] [&.selected]:[box-shadow:0_4px_14px_rgba(19,_63,_125,_0.08)]`}
          onClick={() => setStageFilter("rejected")}
        >
          <div className="candidate-summary-icon icon-red [width:42px] [height:42px] [border-radius:10px] [display:flex] [align-items:center] [justify-content:center] [flex-shrink:0] [background:#fee2e2] [color:#991b1b]">
            <UserX size={20} />
          </div>

          <div>
            <div className="candidate-summary-label [font-size:11px] [font-weight:700] [color:#64748b] [text-transform:uppercase] [letter-spacing:0.4px]">Rejected</div>

            <div className="candidate-summary-value [font-size:24px] [font-weight:800] [color:#1e293b] [margin-top:2px]">
              {stageCounts.rejected}
            </div>
          </div>
        </button>
      </div>

      {/* Search and Filters */}

      <div className="candidate-toolbar [display:flex] [align-items:center] [gap:10px] [margin-bottom:12px] max-[960px]:[flex-wrap:wrap] max-[600px]:[align-items:stretch] max-[600px]:[flex-direction:column]">
        <div className="candidate-search [flex:1] [min-width:220px] [position:relative] [display:flex] [align-items:center] max-[960px]:[flex:1_1_100%]">
          <Search size={17} />

          <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [.candidate-search_&]:[padding-left:38px]"
            type="text"
            placeholder="Search by candidate, role or email..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="candidate-filter [display:flex] [align-items:center] [gap:8px] [background:#fff] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [padding-left:10px] [min-width:180px] max-[960px]:[flex:1] max-[600px]:[width:100%]">
          <Filter size={16} />

          <select className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [.candidate-filter_&]:[border:none] [.candidate-filter_&]:[padding:10px_10px_10px_0] [.candidate-filter_&]:[outline:none] [.candidate-filter_&]:[cursor:pointer] [.candidate-filter_&]:[background:transparent]"
            value={stageFilter}
            onChange={(event) => setStageFilter(event.target.value)}
          >
            <option value="all">All Stages</option>
            <option value="active">Active Candidates</option>
            <option value="offered">Offer Sent</option>
            <option value="rejected">Rejected</option>

            {availableStages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>

        {(stageFilter !== "all" || searchTerm) && (
          <button
            type="button"
            className="btn btn-ghost btn-sm [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:transparent] [color:#64748b] [border:1px_solid_#e2e8f0] [padding:6px_14px] [font-size:12px]"
            onClick={clearFilters}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        )}
      </div>

      {/* Result Information */}

      {!loading && !error && (
        <div className="candidate-results-info [font-size:12px] [color:#64748b] [margin-bottom:12px]">
          Showing <strong className="[font-weight:700] [.candidate-results-info_&]:[color:#1e293b]">{visibleCandidates.length}</strong> of{" "}
          <strong className="[font-weight:700] [.candidate-results-info_&]:[color:#1e293b]">{candidates.length}</strong> candidates
        </div>
      )}

      {/* Candidates Table */}

      <div className="card table-card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [padding:0] [overflow:hidden]">
        {loading ? (
          <div className="candidate-empty-state [min-height:280px] [padding:40px_20px] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center] [text-align:center]">
            <div className="loading-spinner [width:30px] [height:30px] [border:3px_solid_#e2e8f0] [border-top-color:#133f7d] [border-radius:50%] animate-spin" />
            <p className="[.candidate-empty-state_&]:[color:#64748b] [.candidate-empty-state_&]:[font-size:13px] [.candidate-empty-state_&]:[margin-bottom:16px]">Loading candidates...</p>
          </div>
        ) : error ? (
          <div className="error-box [margin:16px] [background:#fee2e2] [color:#991b1b] [padding:10px] [border-radius:8px] [font-size:12px] [margin-bottom:10px]" >
            {error}
          </div>
        ) : visibleCandidates.length === 0 ? (
          <div className="candidate-empty-state [min-height:280px] [padding:40px_20px] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center] [text-align:center]">
            <div className="empty-icon [width:58px] [height:58px] [border-radius:50%] [background:#e8f0fb] [color:#133f7d] [display:flex] [align-items:center] [justify-content:center]">
              <Users size={30} />
            </div>

            <h3 className="[.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px] [.candidate-empty-state_&]:[margin:14px_0_5px] [.candidate-empty-state_&]:[font-size:16px]">No candidates found</h3>

            <p className="[.candidate-empty-state_&]:[color:#64748b] [.candidate-empty-state_&]:[font-size:13px] [.candidate-empty-state_&]:[margin-bottom:16px]">Try changing your search or filter criteria.</p>

            {(stageFilter !== "all" || searchTerm) && (
              <button
                type="button"
                className="btn btn-secondary btn-sm [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#fff] [color:#133f7d] [border:1.5px_solid_#133f7d] [padding:6px_14px] [font-size:12px]"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <table className="[width:100%] [border-collapse:collapse]">
            <thead>
              <tr>
                <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]">Candidate</th>
                <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]">Role</th>
                <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]">Experience</th>
                <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]">AI Score</th>
                <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]">Notice Period</th>
                <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]">Stage</th>
                <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]"></th>
              </tr>
            </thead>

            <tbody>
              {visibleCandidates.map((candidate) => {
                const stage = getCandidateStage(candidate);

                return (
                  <tr
                    key={candidate.candidate_id || candidate.name}
                    className={`candidate-table-row [transition:background_0.15s_ease] ${canAccessSensitive(session) ? "cursor-pointer" : "cursor-default"}`}
                    onClick={() =>
                      canAccessSensitive(session) &&
                      navigate(`/candidate-detail/${candidate.candidate_id}`)
                    }
                  >
                    <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc] [.candidate-table-row:hover_&]:[background:#f8fbff]">
                      <div className="flex-row [display:flex] [align-items:center] [gap:10px]">
                        <div
                          className="avatar [background:#e8f0fb] [color:#133f7d] [width:34px] [height:34px] [border-radius:50%] [display:flex] [align-items:center] [justify-content:center] [font-weight:700] [font-size:12px]"

                        >
                          {initials(candidate.name)}
                        </div>

                        <div className="candidate-name-cell [display:flex] [flex-direction:column] [gap:2px]">
                          <span className="font-bold [.candidate-name-cell_&]:[font-size:13px]">
                            {candidate.name || "Unknown Candidate"}
                          </span>

                          <span className="muted [font-size:12px] [color:#64748b] [.candidate-name-cell_&]:[font-size:11px]">
                            {candidate.email || "No email available"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc] [.candidate-table-row:hover_&]:[background:#f8fbff]">
                      <span className="candidate-role [font-weight:500] [color:#1e293b]">
                        {candidate.role || "—"}
                      </span>
                    </td>

                    <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc] [.candidate-table-row:hover_&]:[background:#f8fbff]">{candidate.experience || "—"}</td>

                    <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc] [.candidate-table-row:hover_&]:[background:#f8fbff]">
                      {candidate.ai_score === null || candidate.ai_score === undefined ? (
                        <span className="badge badge-blue [font-size:11px] [font-weight:700] [padding:3px_9px] [border-radius:20px] [white-space:nowrap] [display:inline-block] [background:#e8f0fb] [color:#133f7d]">Not evaluated</span>
                      ) : (
                        scoreBar(candidate.ai_score)
                      )}
                    </td>

                    <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc] [.candidate-table-row:hover_&]:[background:#f8fbff]">{candidate.notice_period || "—"}</td>

                    <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc] [.candidate-table-row:hover_&]:[background:#f8fbff]">
                      <span
                        className={`${(`badge ${badgeClass(
                          candidate.status || stage,
                        )}`)} [font-size:11px] [font-weight:700] [padding:3px_9px] [border-radius:20px] [white-space:nowrap] [display:inline-block]`}
                      >
                        {stage}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  );
}

export default CandidatesPage;

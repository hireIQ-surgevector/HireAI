import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  RotateCcw,
  Upload,
} from "lucide-react";

import PageShell from "../components/common/PageShell";
import scoreBar from "../components/common/scoreBar";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import { Input, Select } from "../components/common/FormField";
import PageState from "../components/common/PageState";
import StatusBadge from "../components/common/StatusBadge";
import CandidateSummaryCards from "../components/candidates/CandidateSummaryCards";

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

  const loadCandidates = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    const taskId = window.setTimeout(loadCandidates, 0);
    return () => window.clearTimeout(taskId);
  }, [loadCandidates]);

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
          <Link to="/upload-resume" className="btn btn-primary btn-sm [border:none] [border-radius:9px] [cursor:pointer] [font-weight:600] [transition:all_0.18s_ease] [display:inline-flex] [align-items:center] [justify-content:center] [gap:7px] [font-size:13px] [padding:9px_18px] [background:#133f7d] [color:#fff] [padding:8px_14px] [font-size:12px] [box-shadow:0_4px_10px_rgba(19,63,125,0.14)] hover:[transform:translateY(-1px)] hover:[background:#0d2d5e] focus-visible:[outline:2px_solid_#00b4d8] focus-visible:[outline-offset:2px]">
              <Upload size={14} />
              Upload Resumes
          </Link>
        )
      }
    >
      {/* Summary Cards */}

      <CandidateSummaryCards
        counts={stageCounts}
        selectedFilter={stageFilter}
        onFilterChange={setStageFilter}
      />

      {/* Search and Filters */}

      <div className="candidate-toolbar [display:flex] [align-items:center] [gap:10px] [margin-bottom:12px] max-[960px]:[flex-wrap:wrap] max-[600px]:[align-items:stretch] max-[600px]:[flex-direction:column]">
        <div className="candidate-search [flex:1] [min-width:220px] [position:relative] [display:flex] [align-items:center] max-[960px]:[flex:1_1_100%]">
          <Search size={17} className="[position:absolute] [left:12px] [z-index:1] [color:#94a3b8] [pointer-events:none]" />

          <Input className="w-full" controlClassName="pl-10"
            type="text"
            placeholder="Search by candidate, role or email..."
            aria-label="Search candidates"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="candidate-filter [display:flex] [align-items:center] [gap:8px] [background:#fff] [border:1.5px_solid_#e2e8f0] [border-radius:10px] [padding-left:10px] [min-width:180px] [color:#94a3b8] [transition:border-color_0.18s_ease,_box-shadow_0.18s_ease] focus-within:[border-color:#00b4d8] focus-within:[box-shadow:0_0_0_3px_rgba(0,180,216,0.12)] max-[960px]:[flex:1] max-[600px]:[width:100%]">
          <Filter size={16} />

          <Select className="w-full" controlClassName="border-0 bg-transparent pl-0 pr-2 focus:border-transparent focus:ring-0"
            value={stageFilter}
            onChange={(event) => setStageFilter(event.target.value)}
            aria-label="Filter candidates by stage"
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
          </Select>
        </div>

        {(stageFilter !== "all" || searchTerm) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
          >
            <RotateCcw size={14} />
            Reset
          </Button>
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

      {loading ? (
        <PageState variant="loading" title="Loading candidates" rows={6} />
      ) : error ? (
        <PageState
          variant="error"
          title="Couldn't load candidates"
          description={error}
          onRetry={loadCandidates}
        />
      ) : visibleCandidates.length === 0 ? (
        <PageState
          variant="empty"
          title={candidates.length ? "No candidates match these filters" : "No candidates yet"}
          description={
            candidates.length
              ? "Try another search or stage, or clear your current filters."
              : "Upload resumes to start building your candidate pipeline."
          }
          action={
            candidates.length ? (
              <Button type="button" variant="secondary" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : canManageCandidates(session) ? (
              <Button as={Link} to="/upload-resume" size="sm">
                <Upload size={14} />
                Upload resumes
              </Button>
            ) : null
          }
          className="min-h-72"
        />
      ) : (
      <Card className="overflow-x-auto p-0">
          <table className="[width:100%] [min-width:760px] [border-collapse:collapse]">
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
                      <StatusBadge status={stage} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
      </Card>
      )}
    </PageShell>
  );
}

export default CandidatesPage;

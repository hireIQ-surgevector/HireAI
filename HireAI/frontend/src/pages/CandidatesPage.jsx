import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  RotateCcw,
  SlidersHorizontal,
  Upload,
  X,
} from "lucide-react";

import PageShell from "../components/common/PageShell";
import scoreBar from "../components/common/scoreBar";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import { Select } from "../components/common/FormField";
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

const PIPELINE_STAGES = [
  "New",
  "Shortlisted",
  "L1 Interview",
  "L2 Interview",
  "Client Interview",
  "Offer Sent",
  "Onboarded",
  "Rejected",
];

function CandidatesPage() {
  const [stageFilter, setStageFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [evaluationFilter, setEvaluationFilter] = useState("all");
  const [minimumScore, setMinimumScore] = useState("all");
  const [minimumExperience, setMinimumExperience] = useState("all");
  const [noticePeriodFilter, setNoticePeriodFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const filtersRef = useRef(null);

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

  useEffect(() => {
    if (!filtersOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!filtersRef.current?.contains(event.target)) {
        setFiltersOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [filtersOpen]);

  const getCandidateStage = (candidate) => {
    return candidate.stage || candidate.status || "Applied";
  };

  const stageCounts = useMemo(() => {
    return {
      all: candidates.length,

      active: candidates.filter((candidate) => {
        const stage = getCandidateStage(candidate).toLowerCase();

        return (
          !stage.includes("offer") &&
          !stage.includes("reject") &&
          !stage.includes("onboard")
        );
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

    return [...new Set([...PIPELINE_STAGES, ...stages])];
  }, [candidates]);

  const availableNoticePeriods = useMemo(
    () =>
      [...new Set(candidates.map((candidate) => candidate.notice_period).filter(Boolean))]
        .sort((first, second) => first.localeCompare(second)),
    [candidates],
  );
  const availableLocations = useMemo(
    () =>
      [...new Set(candidates.map((candidate) => candidate.location).filter(Boolean))]
        .sort((first, second) => first.localeCompare(second)),
    [candidates],
  );

  const hasActiveFilters =
    stageFilter !== "all" ||
    evaluationFilter !== "all" ||
    minimumScore !== "all" ||
    minimumExperience !== "all" ||
    noticePeriodFilter !== "all" ||
    locationFilter !== "all" ||
    sortOrder !== "newest";

  const visibleCandidates = useMemo(() => {
    const filteredCandidates = candidates.filter((candidate) => {
      const stage = getCandidateStage(candidate).toLowerCase();

      const search = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !search ||
        (candidate.name || "").toLowerCase().includes(search) ||
        (candidate.role || "").toLowerCase().includes(search) ||
        (candidate.current_role || "").toLowerCase().includes(search) ||
        (candidate.email || "").toLowerCase().includes(search) ||
        (candidate.location || "").toLowerCase().includes(search);

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

      const hasScore =
        candidate.ai_score !== null && candidate.ai_score !== undefined;
      const matchesEvaluation =
        evaluationFilter === "all" ||
        (evaluationFilter === "evaluated" && hasScore) ||
        (evaluationFilter === "not_evaluated" && !hasScore);
      const score = hasScore ? Number(candidate.ai_score) : null;
      const matchesMinimumScore =
        minimumScore === "all" ||
        (score !== null &&
          Number.isFinite(score) &&
          score >= Number(minimumScore));
      const experienceMatch = String(candidate.experience || "").match(
        /\d+(?:\.\d+)?/,
      );
      const experience = experienceMatch
        ? Number(experienceMatch[0])
        : null;
      const matchesMinimumExperience =
        minimumExperience === "all" ||
        (experience !== null &&
          Number.isFinite(experience) &&
          experience >= Number(minimumExperience));
      const matchesNoticePeriod =
        noticePeriodFilter === "all" ||
        candidate.notice_period === noticePeriodFilter;
      const matchesLocation =
        locationFilter === "all" || candidate.location === locationFilter;

      return (
        matchesSearch &&
        matchesStage &&
        matchesEvaluation &&
        matchesMinimumScore &&
        matchesMinimumExperience &&
        matchesNoticePeriod &&
        matchesLocation
      );
    });

    const numericValue = (value) => {
      const match = String(value || "").match(/\d+(?:\.\d+)?/);
      return match ? Number(match[0]) : null;
    };
    const compareMissingLast = (first, second, direction) => {
      if (first === null && second === null) return 0;
      if (first === null) return 1;
      if (second === null) return -1;
      return (first - second) * direction;
    };

    if (sortOrder === "newest") return filteredCandidates;

    return filteredCandidates.sort((first, second) => {
      if (sortOrder === "name_asc" || sortOrder === "name_desc") {
        const direction = sortOrder === "name_asc" ? 1 : -1;
        return (
          (first.name || "").localeCompare(second.name || "", undefined, {
            sensitivity: "base",
          }) * direction
        );
      }
      if (
        sortOrder === "score_high" ||
        sortOrder === "score_low" ||
        sortOrder === "experience_high" ||
        sortOrder === "experience_low"
      ) {
        const isScore = sortOrder.startsWith("score");
        const direction = sortOrder.endsWith("high") ? -1 : 1;
        return compareMissingLast(
          isScore ? numericValue(first.ai_score) : numericValue(first.experience),
          isScore ? numericValue(second.ai_score) : numericValue(second.experience),
          direction,
        );
      }

      return 0;
    });
  }, [
    candidates,
    stageFilter,
    searchTerm,
    evaluationFilter,
    minimumScore,
    minimumExperience,
    noticePeriodFilter,
    locationFilter,
    sortOrder,
  ]);

  const clearFilters = () => {
    setStageFilter("all");
    setSearchTerm("");
    setEvaluationFilter("all");
    setMinimumScore("all");
    setMinimumExperience("all");
    setNoticePeriodFilter("all");
    setLocationFilter("all");
    setSortOrder("newest");
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
      description="Find, filter, and track candidates across your hiring pipeline."
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

      <CandidateSummaryCards counts={stageCounts} />

      {/* Search and Filters */}

      <div className="candidate-toolbar [display:flex] [align-items:center] [gap:10px] [margin-bottom:12px]">
        <label className="[position:relative] [display:flex] [min-width:0] [height:44px] [flex:1] [align-items:center] [gap:10px] [border:1px_solid_#dbe2ea] [border-radius:10px] [background:#fff] [padding:0_14px] [color:#64748b] focus-within:[border-color:#00b4d8] focus-within:[box-shadow:0_0_0_3px_rgba(0,180,216,0.12)]">
          <Search size={18} aria-hidden="true" />
          <span className="[position:absolute] [width:1px] [height:1px] [padding:0] [margin:-1px] [overflow:hidden] [clip:rect(0,0,0,0)] [white-space:nowrap] [border:0]">
            Search candidates
          </span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by candidate, role, or email"
            className="[width:100%] [min-width:0] [border:none] [outline:none] [background:transparent] [font:inherit] [font-size:14px] [color:#1e293b]"
          />
        </label>

        <div ref={filtersRef} className="[position:relative] [flex-shrink:0]">
          <Button
            type="button"
            variant={filtersOpen || hasActiveFilters ? "primary" : "secondary"}
            aria-expanded={filtersOpen}
            aria-controls="candidate-filter-panel"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <SlidersHorizontal size={16} />
            Filters
            {hasActiveFilters && (
              <span className="[display:inline-flex] [min-width:19px] [height:19px] [align-items:center] [justify-content:center] [border-radius:999px] [background:#00b4d8] [padding:0_5px] [font-size:11px] [color:#fff]">
                {Number(stageFilter !== "all") +
                  Number(evaluationFilter !== "all") +
                  Number(minimumScore !== "all") +
                  Number(minimumExperience !== "all") +
                  Number(noticePeriodFilter !== "all") +
                  Number(locationFilter !== "all") +
                  Number(sortOrder !== "newest")}
              </span>
            )}
          </Button>

          {filtersOpen && (
            <div
              id="candidate-filter-panel"
              role="dialog"
              aria-label="Filter and sort candidates"
              className="[position:absolute] [z-index:30] [top:calc(100%_+_8px)] [right:0] [width:min(360px,calc(100vw-32px))] [max-height:75vh] [overflow-y:auto] [border:1px_solid_#e2e8f0] [border-radius:12px] [background:#fff] [padding:18px] [box-shadow:0_16px_40px_rgba(15,23,42,0.16)]"
            >
              <div className="[margin-bottom:16px] [display:flex] [align-items:center] [justify-content:space-between]">
                <h3 className="[margin:0] [font-size:15px] [font-weight:700] [color:#1e293b]">
                  Filters & sorting
                </h3>
                <button
                  type="button"
                  aria-label="Close filters"
                  onClick={() => setFiltersOpen(false)}
                  className="[display:inline-flex] [width:32px] [height:32px] [align-items:center] [justify-content:center] [border:0] [border-radius:8px] [background:transparent] [color:#64748b] hover:[background:#f1f5f9]"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="[display:grid] [gap:13px]">
                <Select
                  label="Hiring stage"
                  optional
                  id="candidate-stage-filter"
                  value={stageFilter}
                  onChange={(event) => setStageFilter(event.target.value)}
                >
                  <option value="all">All stages</option>
                  <option value="active">Active candidates</option>
                  <option value="offered">Offer sent</option>
                  <option value="rejected">Rejected</option>
                  {availableStages.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Evaluation"
                  optional
                  id="candidate-evaluation-filter"
                  value={evaluationFilter}
                  onChange={(event) => setEvaluationFilter(event.target.value)}
                >
                  <option value="all">Evaluated and unevaluated</option>
                  <option value="evaluated">Evaluated only</option>
                  <option value="not_evaluated">Not evaluated</option>
                </Select>

                <Select
                  label="Minimum AI score"
                  optional
                  id="candidate-score-filter"
                  value={minimumScore}
                  onChange={(event) => setMinimumScore(event.target.value)}
                >
                  <option value="all">Any score</option>
                  <option value="50">50 and above</option>
                  <option value="60">60 and above</option>
                  <option value="70">70 and above</option>
                  <option value="80">80 and above</option>
                </Select>

                <Select
                  label="Minimum experience"
                  optional
                  id="candidate-experience-filter"
                  value={minimumExperience}
                  onChange={(event) => setMinimumExperience(event.target.value)}
                >
                  <option value="all">Any experience</option>
                  <option value="1">1+ years</option>
                  <option value="3">3+ years</option>
                  <option value="5">5+ years</option>
                  <option value="8">8+ years</option>
                </Select>

                <Select
                  label="Notice period"
                  optional
                  id="candidate-notice-period-filter"
                  value={noticePeriodFilter}
                  onChange={(event) => setNoticePeriodFilter(event.target.value)}
                >
                  <option value="all">Any notice period</option>
                  {availableNoticePeriods.map((noticePeriod) => (
                    <option key={noticePeriod} value={noticePeriod}>
                      {noticePeriod}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Location"
                  optional
                  id="candidate-location-filter"
                  value={locationFilter}
                  onChange={(event) => setLocationFilter(event.target.value)}
                >
                  <option value="all">Any location</option>
                  {availableLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Sort candidates by"
                  optional
                  id="candidate-sort"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                >
                  <option value="newest">Recently added</option>
                  <option value="name_asc">Name: A to Z</option>
                  <option value="name_desc">Name: Z to A</option>
                  <option value="score_high">AI score: highest first</option>
                  <option value="score_low">AI score: lowest first</option>
                  <option value="experience_high">Experience: highest first</option>
                  <option value="experience_low">Experience: lowest first</option>
                </Select>
              </div>

              <div className="[margin-top:18px] [display:flex] [justify-content:space-between] [gap:10px]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  <RotateCcw size={14} />
                  Clear filters
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setFiltersOpen(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
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

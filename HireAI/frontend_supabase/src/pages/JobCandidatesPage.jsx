import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import PageShell from "../components/common/PageShell";
import PageState from "../components/common/PageState";
import StatusBadge from "../components/common/StatusBadge";
import StatCard from "../components/common/StatCard";
import { CheckCircle2, Clock3, UserPlus, Users } from "lucide-react";
import {
  API_URL,
  canAccessSensitive,
  getAuthHeader,
  getSession,
} from "../utils/auth";

function getCandidateInitials(name) {
  if (!name) return "?";

  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function normalizeStatus(candidate) {
  return (
    candidate.current_status || candidate.status || candidate.stage || "New"
  );
}

function formatScore(score) {
  const numericScore = Number(score);

  return score !== null &&
    score !== undefined &&
    score !== "" &&
    Number.isFinite(numericScore)
    ? `${Math.round(numericScore)}%`
    : "—";
}

function getNumericScore(candidate) {
  const score = candidate.ai_score;

  if (score === null || score === undefined || score === "") {
    return null;
  }

  const numericScore = Number(score);
  return Number.isFinite(numericScore) ? numericScore : null;
}

const STAGE_PRIORITY = {
  onboarded: 8,
  "offer sent": 7,
  "client interview": 6,
  "l2 interview": 5,
  "l1 interview": 4,
  shortlisted: 3,
  new: 2,
  applied: 2,
  rejected: 1,
};

function getStagePriority(candidate) {
  return STAGE_PRIORITY[normalizeStatus(candidate).trim().toLowerCase()] || 0;
}

function getExperience(candidate) {
  const value = Number(candidate.experience_years);
  return (
    Number.isFinite(value) &&
    candidate.experience_years !== null &&
    candidate.experience_years !== undefined &&
    candidate.experience_years !== ""
  )
    ? `${value} yrs`
    : "Experience N/A";
}

function CandidateTable({ candidates, onCandidateClick }) {
  return (
    <div className="card table-card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [padding:0] [overflow-x:auto]">
      <table className="[width:100%] [border-collapse:collapse]">
        <thead>
          <tr>
            <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]">Candidate</th>
            <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]">Applied Date</th>
            <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]">Match Score</th>
            <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]">Status</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => {
            const status = normalizeStatus(candidate);
            const name = candidate.full_name || candidate.name;
            const appliedDate = candidate.applied_date || candidate.created_at;

            return (
              <tr
                key={candidate.candidate_id}
                className={canAccessSensitive(getSession()) ? "cursor-pointer" : "cursor-default"}
                onClick={() => onCandidateClick(candidate.candidate_id)}
              >
                <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc]">
                  <div className="flex-row [display:flex] [align-items:center] [gap:10px]">
                    <div className="avatar [background:#e8f0fb] [color:#133f7d] [width:34px] [height:34px] [border-radius:50%] [display:flex] [align-items:center] [justify-content:center] [font-weight:700] [font-size:12px]">
                      {getCandidateInitials(name)}
                    </div>
                    <div>
                      <div className="font-bold">
                        {name || "Unknown Candidate"}
                        <span className="[margin-left:7px] [font-size:11px] [font-weight:600] [color:#64748b]">
                          · {getExperience(candidate)}
                        </span>
                      </div>
                      {candidate.current_role && (
                        <div className="muted [font-size:12px] [color:#64748b]">
                          {candidate.current_role}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc]">
                  {appliedDate ? new Date(appliedDate).toLocaleDateString() : "N/A"}
                </td>
                <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc]">
                  {formatScore(candidate.ai_score)}
                </td>
                <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc]">
                  <StatusBadge status={status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CandidateSection({
  title,
  description,
  candidates,
  onCandidateClick,
  action,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");

  const availableStages = [...new Set(candidates.map(normalizeStatus))].sort(
    (first, second) => first.localeCompare(second),
  );
  const visibleCandidates = candidates.filter((candidate) => {
    const query = searchTerm.trim().toLowerCase();
    const candidateName = (candidate.full_name || candidate.name || "").toLowerCase();
    const currentRole = (candidate.current_role || "").toLowerCase();
    const location = (candidate.location || "").toLowerCase();
    const status = normalizeStatus(candidate);
    const years = Number(candidate.experience_years);
    const hasExperience =
      candidate.experience_years !== null &&
      candidate.experience_years !== undefined &&
      Number.isFinite(years);

    const matchesSearch =
      !query ||
      candidateName.includes(query) ||
      currentRole.includes(query) ||
      location.includes(query);
    const matchesStage = stageFilter === "all" || status === stageFilter;
    const matchesExperience =
      experienceFilter === "all" ||
      (hasExperience &&
        (experienceFilter === "0-2"
          ? years < 3
          : experienceFilter === "3-5"
            ? years >= 3 && years < 6
            : experienceFilter === "6-9"
              ? years >= 6 && years < 10
              : years >= 10));

    return matchesSearch && matchesStage && matchesExperience;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setStageFilter("all");
    setExperienceFilter("all");
  };

  return (
    <section className="[margin-top:24px]">
      <div className="section-header [display:flex] [justify-content:space-between] [align-items:flex-start] [gap:16px] [margin-bottom:14px] max-[640px]:[flex-direction:column]">
        <div>
          <h3 className="[margin:0px]">{title}</h3>
          <p className="muted [margin-top:4px] [font-size:12px] [color:#64748b]">
            {visibleCandidates.length} of {candidates.length} {description}
          </p>
        </div>
        {action}
      </div>

      <div className="[display:flex] [flex-wrap:wrap] [align-items:center] [gap:9px] [margin-bottom:12px]">
        <label className="[display:flex] [min-width:220px] [height:40px] [flex:1] [align-items:center] [gap:8px] [border:1px_solid_#dbe2ea] [border-radius:9px] [background:#fff] [padding:0_11px] [color:#64748b] focus-within:[border-color:#00b4d8]">
          <Search size={16} aria-hidden="true" />
          <span className="[position:absolute] [width:1px] [height:1px] [padding:0] [margin:-1px] [overflow:hidden] [clip:rect(0,0,0,0)] [white-space:nowrap] [border:0]">
            Search {title.toLowerCase()}
          </span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search name, role, or location"
            className="[width:100%] [min-width:0] [border:0] [outline:0] [background:transparent] [font:inherit] [font-size:13px] [color:#1e293b]"
          />
        </label>
        <label className="[display:flex] [height:40px] [align-items:center] [gap:7px] [border:1px_solid_#dbe2ea] [border-radius:9px] [background:#fff] [padding:0_10px] [font-size:12px] [color:#64748b]">
          <span>Stage</span>
          <select
            aria-label={`Filter ${title.toLowerCase()} by stage`}
            value={stageFilter}
            onChange={(event) => setStageFilter(event.target.value)}
            className="[max-width:180px] [border:0] [background:transparent] [font:inherit] [font-size:12px] [color:#1e293b] focus:[outline:none]"
          >
            <option value="all">All stages</option>
            {availableStages.map((stage) => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        </label>
        <label className="[display:flex] [height:40px] [align-items:center] [gap:7px] [border:1px_solid_#dbe2ea] [border-radius:9px] [background:#fff] [padding:0_10px] [font-size:12px] [color:#64748b]">
          <span>Experience</span>
          <select
            aria-label={`Filter ${title.toLowerCase()} by experience`}
            value={experienceFilter}
            onChange={(event) => setExperienceFilter(event.target.value)}
            className="[border:0] [background:transparent] [font:inherit] [font-size:12px] [color:#1e293b] focus:[outline:none]"
          >
            <option value="all">Any</option>
            <option value="0-2">Under 3 years</option>
            <option value="3-5">3–5 years</option>
            <option value="6-9">6–9 years</option>
            <option value="10+">10+ years</option>
          </select>
        </label>
        {(searchTerm || stageFilter !== "all" || experienceFilter !== "all") && (
          <button
            type="button"
            onClick={clearFilters}
            className="[display:inline-flex] [align-items:center] [gap:5px] [border:0] [background:transparent] [padding:7px] [font:inherit] [font-size:12px] [color:#475569] hover:[color:#133f7d]"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {visibleCandidates.length ? (
        <CandidateTable
          candidates={visibleCandidates}
          onCandidateClick={onCandidateClick}
        />
      ) : (
        <PageState
          variant="empty"
          title={candidates.length ? "No candidates match these filters" : "No candidates in this section"}
          description={candidates.length ? "Try a different search or filter." : "Candidates will appear here when they match this section."}
        />
      )}
    </section>
  );
}

function JobCandidatesPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const session = getSession();

  const [jobTitle, setJobTitle] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const fetchJobCandidates = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/jobs/${jobId}/candidates`,
          {
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeader(),
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch job candidates");
        }

        setJobTitle(data.job_title || "");

        setCandidates(Array.isArray(data.candidates) ? data.candidates : []);
      } catch (err) {
        console.error("Unable to load job candidates", err);

        setError(err.message);
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJobCandidates();
    }
  }, [jobId, reloadCount]);

  const totalCandidates = candidates.length;

  const newCandidates = candidates.filter((candidate) =>
    normalizeStatus(candidate).toLowerCase().includes("new"),
  ).length;

  const shortlistedCandidates = candidates.filter((candidate) => {
    const status = normalizeStatus(candidate).toLowerCase();

    return status.includes("shortlist") || status.includes("interview");
  }).length;

  const selectedCandidates = candidates.filter((candidate) => {
    const status = normalizeStatus(candidate).toLowerCase();

    return (
      status.includes("select") ||
      status.includes("offer") ||
      status.includes("hire") ||
      status.includes("onboard")
    );
  }).length;

  const evaluatedCandidates = candidates
    .filter((candidate) => getNumericScore(candidate) !== null)
    .sort((first, second) => {
      const stageDifference = getStagePriority(second) - getStagePriority(first);
      if (stageDifference !== 0) return stageDifference;

      return getNumericScore(second) - getNumericScore(first);
    });

  const unevaluatedCandidates = candidates.filter(
    (candidate) => getNumericScore(candidate) === null,
  );

  const openCandidate = (candidateId) => {
    if (canAccessSensitive(session)) {
      navigate(`/candidate-detail/${candidateId}`);
    }
  };

  return (
    <PageShell title="Job Candidates" backTo="/jobs">
      <div className="section-header [display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:14px]">
        <div>
          <h2 className="page-heading [font-size:20px] [font-weight:800] [color:#1e293b] [margin:0]">{jobTitle || `Job #${jobId}`}</h2>

          <p className="muted [margin-top:5px] [font-size:12px] [color:#64748b]" >
            Candidates who have applied for this position
          </p>
        </div>
      </div>

      <div className="grid4 [display:grid] [grid-template-columns:repeat(4,_1fr)] [gap:14px] max-[960px]:[grid-template-columns:1fr] max-[960px]:[flex-direction:column]">
        <StatCard
          label="Total Candidates"
          value={totalCandidates}
          icon={<Users size={18} />}
          color="brand"
        />
        <StatCard
          label="New Applications"
          value={newCandidates}
          icon={<UserPlus size={18} />}
          color="teal"
        />
        <StatCard
          label="In Progress"
          value={shortlistedCandidates}
          icon={<Clock3 size={18} />}
          color="orange"
        />
        <StatCard
          label="Selected / Offered"
          value={selectedCandidates}
          icon={<CheckCircle2 size={18} />}
          color="green"
        />
      </div>

      <div className="[height:20px]"  />

      {loading ? (
        <PageState variant="loading" title="Loading job candidates" rows={5} />
      ) : error ? (
        <PageState
          variant="error"
          title="Couldn't load job candidates"
          description={error}
          onRetry={() => setReloadCount((count) => count + 1)}
        />
      ) : totalCandidates === 0 ? (
          <PageState
            variant="empty"
            title="No applicants yet"
            description="Candidates who apply to this job will appear here."
          />
      ) : (
          <CandidateSection
            title="Evaluated Candidates"
            description="candidates evaluated · ordered by stage, then match score"
            candidates={evaluatedCandidates}
            onCandidateClick={openCandidate}
            action={null}
          />
      )}

      {!loading && !error && unevaluatedCandidates.length > 0 && (
          <CandidateSection
            title="Candidates Not Evaluated Yet"
            description="candidates need a match evaluation"
            candidates={unevaluatedCandidates}
            onCandidateClick={openCandidate}
            action={
              <Link
                to={`/candidate-matcher?jobId=${encodeURIComponent(jobId)}`}
                className="btn btn-primary [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [display:inline-flex] [align-items:center] [justify-content:center] [font-size:13px] [padding:9px_16px] [background:#133f7d] [color:#fff] [text-decoration:none]"
              >
                Evaluate in Matcher
              </Link>
            }
          />
      )}
    </PageShell>
  );
}

export default JobCandidatesPage;

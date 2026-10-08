import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  Users,
  RefreshCw,
  UserRound,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  XCircle,
} from "lucide-react";

import PageShell from "../components/common/PageShell";
import PageState from "../components/common/PageState";
import JobSelector from "../components/candidateMatcher/JobSelector";
import JobOverviewPanel from "../components/candidateMatcher/JobOverviewPanel";
import { API_URL, getAuthHeader } from "../utils/auth";

/* =========================================
   HELPER FUNCTIONS
========================================= */

const normalizeSkills = (skills) => {
  if (!skills) return [];

  if (Array.isArray(skills)) {
    return skills
      .flatMap((skill) => String(skill).split(/[,;|]/))
      .map((skill) => skill.trim().toLowerCase())
      .filter(Boolean);
  }

  return String(skills)
    .split(/[,;|]/)
    .map((skill) => skill.trim().toLowerCase())
    .filter(Boolean);
};

const getJobPrimarySkills = (job) => {
  if (!job) return [];
  return normalizeSkills(job.mandatory_skills);
};

const getJobSecondarySkills = (job) => {
  if (!job) return [];
  return normalizeSkills(job.required_skills);
};

/*
  Match category -> CSS class
*/

const CATEGORY_CLASS_MAP = {
  "Strong Match": "[background:#dcfce7] [color:#166534]",
  "Good Match": "[background:#dbeafe] [color:#1d4ed8]",
  "Moderate Match": "[background:#fef3c7] [color:#92400e]",
  "Low Match": "[background:#fee2e2] [color:#991b1b]",
};

const getMatchClassName = (category) =>
  CATEGORY_CLASS_MAP[category] || "[background:#fee2e2] [color:#991b1b]";

const GOOD_MATCH_THRESHOLD = 60;

const skillsMatch = (candidateSkill, jobSkill) => {
  const candidateValue = candidateSkill.toLowerCase().trim();
  const jobValue = jobSkill.toLowerCase().trim();

  return (
    candidateValue === jobValue ||
    candidateValue.includes(jobValue) ||
    jobValue.includes(candidateValue)
  );
};

function MissingSkillGroup({ label, skills, variant }) {
  const tagClass =
    variant === "primary"
      ? "border-violet-200 bg-violet-50 text-violet-800"
      : "border-sky-200 bg-sky-50 text-sky-800";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {skills.map((skill, index) => (
        <span
          key={`${label}-${skill}-${index}`}
          className={`rounded-full border px-2 py-1 text-[11px] leading-none ${tagClass}`}
        >
          {skill}
        </span>
      ))}
    </div>
  );
}

function CandidateMatcherPage() {
  const [searchParams] = useSearchParams();
  const requestedJobId = searchParams.get("jobId") || "";

  const [jobs, setJobs] = useState([]);

  const [selectedJobId, setSelectedJobId] = useState("");

  const [selectedJob, setSelectedJob] = useState(null);

  const [candidates, setCandidates] = useState([]);

  const [loadingJobs, setLoadingJobs] = useState(true);

  const [loadingCandidates, setLoadingCandidates] = useState(false);

  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const [minimumScore, setMinimumScore] = useState("All");

  /*
    Per-candidate recruiter decisions

    {
      candidate_id: {
        aiAccepted: true | false | undefined,
        stage: "L1" | "Rejected" | undefined
      }
    }
  */

  const [candidateDecisions, setCandidateDecisions] = useState({});

  const [processingCandidateId, setProcessingCandidateId] = useState(null);

  /* =========================================
     LOAD JOBS
  ========================================= */

  async function fetchJobs() {
    try {
      setLoadingJobs(true);

      setError("");

      const response = await fetch(`${API_URL}/api/jobs`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load jobs.");
      }

      const data = await response.json();

      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading jobs:", error);

      setError(error.message);
    } finally {
      setLoadingJobs(false);
    }
  }

  useEffect(() => {
    const taskId = window.setTimeout(fetchJobs, 0);

    return () => window.clearTimeout(taskId);
  }, []);

  /* =========================================
     LOAD CANDIDATES + MATCH SCORES
  ========================================= */

  const handleJobChange = useCallback(async (jobId) => {
    setSelectedJobId(jobId);

    setCandidates([]);

    setSearchQuery("");

    setMinimumScore("All");

    setCandidateDecisions({});

    if (!jobId) {
      setSelectedJob(null);
      return;
    }

    const job = jobs.find((item) => String(item.job_id) === String(jobId));

    setSelectedJob(job || null);

    try {
      setLoadingCandidates(true);

      setError("");

      const response = await fetch(
        `${API_URL}/api/jobs/${jobId}/calculate-scores`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
        },
      );

      if (!response.ok) {
        let backendMessage = "Failed to calculate candidate match scores.";

        try {
          const errorData = await response.json();

          if (errorData?.error) {
            backendMessage = errorData.error;
          }
        } catch {
          // Response body wasn't JSON
        }

        throw new Error(backendMessage);
      }

      const data = await response.json();

      setCandidates(data.candidates || []);
    } catch (error) {
      console.error("Error loading job candidates:", error);

      setError(error.message);
    } finally {
      setLoadingCandidates(false);
    }
  }, [jobs]);

  useEffect(() => {
    if (
      !loadingJobs &&
      requestedJobId &&
      jobs.some((job) => String(job.job_id) === requestedJobId) &&
      selectedJobId !== requestedJobId
    ) {
      const taskId = window.setTimeout(
        () => handleJobChange(requestedJobId),
        0,
      );

      return () => window.clearTimeout(taskId);
    }

    return undefined;
  }, [
    handleJobChange,
    jobs,
    loadingJobs,
    requestedJobId,
    selectedJobId,
  ]);

  /* =========================================
     MAP CANDIDATES TO DISPLAY SHAPE
  ========================================= */

  const matchedCandidates = useMemo(() => {
    if (!selectedJob) return [];

    return candidates
      .map((candidate) => ({
        ...candidate,

        matchScore: Number(candidate.ai_score) || 0,

        matchDetails: {
          label: candidate.match_category || "Low Match",
          className: getMatchClassName(candidate.match_category),
        },
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [candidates, selectedJob]);

  /* =========================================
     FILTER RESULTS
  ========================================= */

  const filteredCandidates = useMemo(() => {
    return matchedCandidates.filter((candidate) => {
      const nameMatch = (candidate.name || candidate.full_name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const roleMatch = (candidate.current_role || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const searchMatch = nameMatch || roleMatch;

      const scoreMatch =
        minimumScore === "All" || candidate.matchScore >= Number(minimumScore);

      return searchMatch && scoreMatch;
    });
  }, [matchedCandidates, searchQuery, minimumScore]);

  /* =========================================
     SUMMARY COUNTS
  ========================================= */

  const strongMatches = matchedCandidates.filter(
    (candidate) => candidate.matchScore >= 80,
  ).length;

  const goodMatches = matchedCandidates.filter(
    (candidate) => candidate.matchScore >= 60 && candidate.matchScore < 80,
  ).length;

  /* =========================================
     RECRUITER DECISION HANDLERS
  ========================================= */

  const saveAIDecision = async (candidateId, decision) => {
    setError("");

    // Override is only a local selection.
    // It does NOT change the candidate stage.
    if (decision === "override") {
      setCandidateDecisions((prev) => ({
        ...prev,
        [candidateId]: {
          ...prev[candidateId],
          aiAccepted: false,
          decisionType: "override",
        },
      }));

      return;
    }

    // Accept AI Match
    // Determine the final stage from the AI score.
    const candidate = candidates.find(
      (item) => item.candidate_id === candidateId,
    );

    if (!candidate) {
      setError("Candidate not found.");
      return;
    }

    const score = candidate.ai_score ?? 0;

    // Candidates accepted by the matcher start in the shortlisted stage.
    // Score < 60 -> Rejected
    const targetStage =
      score >= GOOD_MATCH_THRESHOLD ? "Shortlisted" : "Rejected";

    setProcessingCandidateId(candidateId);

    try {
      const response = await fetch(
        `${API_URL}/api/jobs/${selectedJobId}/candidates/${candidateId}/finalize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
          body: JSON.stringify({
            decision: "accept",
            stage: targetStage,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to finalize AI recommendation");
      }

      // Store the result locally so the UI can show the final status.
      setCandidateDecisions((prev) => ({
        ...prev,
        [candidateId]: {
          ...prev[candidateId],
          aiAccepted: true,
          decisionType: "accept",
          stage: targetStage,
        },
      }));

      // Remove the candidate from the matcher list because
      // they have now been moved out of the New/Applied stage.
      setCandidates((prev) =>
        prev.filter((candidate) => candidate.candidate_id !== candidateId),
      );
    } catch (error) {
      console.error("Unable to finalize AI recommendation:", error);
      setError(error.message);
    } finally {
      setProcessingCandidateId(null);
    }
  };

  const moveCandidateToStage = async (candidateId, stage) => {
    const decision = candidateDecisions[candidateId]?.aiAccepted;

    if (decision === undefined) {
      setError("Choose Accept AI Match or Override first.");
      return;
    }

    setProcessingCandidateId(candidateId);
    setError("");

    try {
      const targetStage =
        stage === "L1"
          ? "L1 Interview"
          : stage === "Shortlisted"
            ? "Shortlisted"
            : "Rejected";

      const response = await fetch(
        `${API_URL}/api/jobs/${selectedJobId}/candidates/${candidateId}/finalize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
          body: JSON.stringify({
            decision: decision ? "accept" : "override",
            stage: targetStage,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update candidate stage");
      }

      setCandidateDecisions((prev) => ({
        ...prev,
        [candidateId]: {
          ...prev[candidateId],
          stage: targetStage,
        },
      }));
    } catch (error) {
      console.error("Unable to update candidate stage:", error);
      setError(error.message);
    } finally {
      setProcessingCandidateId(null);
    }
  };

  return (
    <PageShell
      title="Candidate Matcher"
      actions={
        selectedJobId && (
          <button
            type="button"
            className="btn btn-secondary [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#fff] [color:#133f7d] [border:1.5px_solid_#133f7d]"
            onClick={() => handleJobChange(selectedJobId)}
            disabled={loadingCandidates}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        )
      }
    >

      {/* =====================================
          JOB SELECTOR
      ===================================== */}

      <JobSelector
        jobs={jobs}
        selectedJobId={selectedJobId}
        onJobChange={handleJobChange}
        loading={loadingJobs}
      />

      {/* =====================================
          ERROR
      ===================================== */}

      {error && (
        <PageState
          variant="error"
          title="Couldn't load matching data"
          description={error}
          onRetry={() =>
            selectedJobId ? handleJobChange(selectedJobId) : fetchJobs()
          }
          className="mb-4"
        />
      )}

      {loadingJobs && (
        <PageState
          variant="loading"
          title="Loading jobs"
          rows={2}
          className="mb-4"
        />
      )}

      {/* =====================================
          SELECTED JOB DETAILS
      ===================================== */}

      {selectedJob && (
        <JobOverviewPanel
          job={selectedJob}
          candidateCount={candidates.length}
          strongMatches={strongMatches}
          goodMatches={goodMatches}
          loading={loadingCandidates}
        />
      )}

      {/* =====================================
          LOADING CANDIDATES
      ===================================== */}

      {loadingCandidates && (
        <PageState
          variant="loading"
          title="Matching candidates"
          rows={5}
          className="mb-4"
        />
      )}

      {/* =====================================
          MATCHING RESULTS
      ===================================== */}

      {!error && !loadingCandidates && selectedJob && candidates.length > 0 && (
        <>
          {/* FILTERS */}

          <div className="matcher-toolbar card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [display:grid] [grid-template-columns:minmax(0,_1fr)_180px] [align-items:center] [gap:12px] [padding:14px] [margin-bottom:20px] max-[700px]:[grid-template-columns:1fr] max-[700px]:[align-items:stretch]">
            <div className="matcher-search [min-width:0] [width:100%] [height:40px] [display:flex] [align-items:center] [gap:10px] [padding:0_12px] [border:1px_solid_#d1d5db] [border-radius:8px] [background:#fff]">
              <Search size={18} />

              <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [.matcher-search_&]:[width:100%] [.matcher-search_&]:[min-width:0] [.matcher-search_&]:[height:100%] [.matcher-search_&]:[border:none] [.matcher-search_&]:[outline:none] [.matcher-search_&]:[font-size:14px] [.matcher-search_&]:[background:transparent]"
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>

            <select
              value={minimumScore}
              onChange={(event) => setMinimumScore(event.target.value)}
              className="matcher-score-filter [font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [min-width:0] [height:40px] [padding:0_12px] [border:1px_solid_#d1d5db] [background:white] [cursor:pointer]"
            >
              <option value="All">All Scores</option>

              <option value="80">80% and above</option>

              <option value="60">60% and above</option>

              <option value="40">40% and above</option>
            </select>
          </div>

          {/* =====================================
                CANDIDATE RESULTS
            ===================================== */}

          <div className="matcher-results [display:flex] [flex-direction:column] [gap:10px]">
            {filteredCandidates.map((candidate) => {
              const decision = candidateDecisions[candidate.candidate_id] || {};

              /*
                  Candidate skills
                */

              const candidateSkills = normalizeSkills(candidate.skills);
              const primaryMissing = getJobPrimarySkills(selectedJob).filter(
                (skill) =>
                  !candidateSkills.some((candidateSkill) =>
                    skillsMatch(candidateSkill, skill),
                  ),
              );
              const secondaryMissing = getJobSecondarySkills(selectedJob).filter(
                (skill) =>
                  !candidateSkills.some((candidateSkill) =>
                    skillsMatch(candidateSkill, skill),
                  ),
              );

              return (
                <div
                  key={candidate.candidate_id}
                  className="matcher-candidate-card card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:14px] [padding:22px] [display:grid] [grid-template-columns:minmax(190px,_0.9fr)_minmax(250px,_1.6fr)_minmax(130px,_0.65fr)_minmax(160px,_0.8fr)] [align-items:center] [gap:20px] [padding:16px_20px] [box-shadow:0_4px_16px_rgba(15,23,42,0.035)] max-[1100px]:[grid-template-columns:minmax(180px,_0.8fr)_minmax(220px,_1.4fr)_minmax(120px,_0.6fr)] max-[1100px]:[gap:14px] max-[900px]:[grid-template-columns:minmax(180px,_0.8fr)_minmax(220px,_1.2fr)] max-[900px]:[align-items:flex-start] max-[640px]:[grid-template-columns:1fr] max-[640px]:[gap:14px]"
                >
                  {/* =====================================
                        CANDIDATE INFO
                    ===================================== */}

                  <div className="matcher-candidate-info [display:flex] [align-items:flex-start] [gap:11px]">
                    <div className="matcher-avatar [width:40px] [height:40px] [display:flex] [align-items:center] [justify-content:center] [border-radius:50%] [background:#f3f4f6] [color:#475569]">
                      <UserRound size={19} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="matcher-candidate-name [.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px] [.matcher-candidate-info_&]:[margin:0] [.matcher-candidate-info_&]:[font-size:15px] [.matcher-candidate-info_&]:[font-weight:700] [.matcher-candidate-info_&]:[color:#1e293b] [overflow-wrap:anywhere]">
                        {candidate.name || candidate.full_name || "Candidate"}
                      </h3>
                      <Link
                        to={`/candidate-detail/${candidate.candidate_id}`}
                        className="mt-1 inline-flex min-h-7 items-center rounded-md border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-[#133f7d] no-underline transition hover:border-[#133f7d] hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500"
                      >
                        Show details
                      </Link>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <span className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Missing required skills
                    </span>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {primaryMissing.length > 0 && (
                        <MissingSkillGroup
                          label="Primary"
                          skills={primaryMissing}
                          variant="primary"
                        />
                      )}
                      {secondaryMissing.length > 0 && (
                        <MissingSkillGroup
                          label="Secondary"
                          skills={secondaryMissing}
                          variant="secondary"
                        />
                      )}
                      {primaryMissing.length === 0 &&
                        secondaryMissing.length === 0 && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                            <CheckCircle2 size={14} />
                            No required skills missing
                          </span>
                        )}
                    </div>
                  </div>

                  {/* =====================================
                        SCORE
                    ===================================== */}

                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span
                      className={`${candidate.matchDetails.className} rounded-full px-2.5 py-1 text-sm font-bold`}
                    >
                      {candidate.matchScore}%
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      {candidate.matchDetails.label}
                    </span>
                  </div>

                  {/* =====================================
                        AI MATCH DECISION WORKFLOW
                    ===================================== */}

                  <div className="matcher-decision [min-width:172px] [display:flex] [flex-direction:column] [align-items:stretch] [gap:8px]">
                    {/* =====================================
                            FINAL STAGE
                        ===================================== */}

                    {decision.stage ? (
                      <span
                        className={`${(decision.stage === "L1" ||
                        decision.stage === "Shortlisted"
                            ? "matcher-decision-badge matcher-decision-badge-l1"
                            : "matcher-decision-badge matcher-decision-badge-rejected")} [&.matcher-decision-badge]:[display:inline-flex] [&.matcher-decision-badge]:[align-items:center] [&.matcher-decision-badge]:[justify-content:center] [&.matcher-decision-badge]:[gap:6px] [&.matcher-decision-badge]:[min-height:36px] [&.matcher-decision-badge]:[padding:8px_10px] [&.matcher-decision-badge]:[border-radius:8px] [&.matcher-decision-badge]:[font-size:11px] [&.matcher-decision-badge]:[font-weight:700] [&.matcher-decision-badge]:[text-align:center] [&.matcher-decision-badge-l1]:[background:#dcfce7] [&.matcher-decision-badge-l1]:[color:#166534] [&.matcher-decision-badge-rejected]:[background:#fee2e2] [&.matcher-decision-badge-rejected]:[color:#991b1b]`}
                      >
                        {decision.stage === "Shortlisted" ? (
                          <>
                            <CheckCircle2 size={14} />
                            Shortlisted
                          </>
                        ) : decision.stage === "L1" ? (
                          <>
                            <CheckCircle2 size={14} />
                            Moved to L1
                          </>
                        ) : (
                          <>
                            <XCircle size={14} />
                            Rejected
                          </>
                        )}
                      </span>
                    ) : decision.decisionType === "accept" ? (
                      /*
      AI recommendation was accepted.

      Nothing else needs to be selected because
      the recruiter has accepted the AI recommendation.
    */
                      <span className="matcher-decision-badge matcher-decision-badge-l1 [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [min-height:36px] [padding:8px_10px] [border-radius:8px] [font-size:11px] [font-weight:700] [text-align:center] [background:#dcfce7] [color:#166534]">
                        <CheckCircle2 size={14} />
                        AI Match Accepted
                      </span>
                    ) : decision.decisionType === "override" ? (
                      /*
      AI recommendation was overridden.

      The recruiter must now decide the actual outcome:
        1. Shortlist
        2. Reject Candidate
    */
                      <div className="matcher-decision-actions [display:flex] [flex-direction:column] [align-items:stretch] [gap:8px]">
                        <button
                          type="button"
                          className="btn btn-success btn-sm [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#22c55e] [color:#fff] [padding:6px_14px] [font-size:12px] [.matcher-decision_&]:[width:100%] [.matcher-decision_&]:[min-height:36px] [.matcher-decision_&]:[justify-content:center] [.matcher-decision_&]:[white-space:normal] [.matcher-decision_&]:[line-height:1.25] disabled:[.matcher-decision_&]:[cursor:wait] disabled:[.matcher-decision_&]:[opacity:0.6]"
                          disabled={
                            processingCandidateId === candidate.candidate_id
                          }
                          onClick={() =>
                            moveCandidateToStage(
                              candidate.candidate_id,
                              "Shortlisted",
                            )
                          }
                        >
                          <CheckCircle2 size={14} />
                          Shortlist
                        </button>

                        <button
                          type="button"
                          className="btn btn-danger btn-sm [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#ef4444] [color:#fff] [padding:6px_14px] [font-size:12px] [.matcher-decision_&]:[width:100%] [.matcher-decision_&]:[min-height:36px] [.matcher-decision_&]:[justify-content:center] [.matcher-decision_&]:[white-space:normal] [.matcher-decision_&]:[line-height:1.25] disabled:[.matcher-decision_&]:[cursor:wait] disabled:[.matcher-decision_&]:[opacity:0.6]"
                          disabled={
                            processingCandidateId === candidate.candidate_id
                          }
                          onClick={() =>
                            moveCandidateToStage(
                              candidate.candidate_id,
                              "Rejected",
                            )
                          }
                        >
                          <XCircle size={14} />
                          Reject Candidate
                        </button>
                      </div>
                    ) : (
                      /*
      No recruiter decision has been selected yet.
    */
                      <div className="matcher-decision-actions [display:flex] [flex-direction:column] [align-items:stretch] [gap:8px]">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:12px] [padding:6px_10px] [background:#133f7d] [color:#fff] [.matcher-decision_&]:[width:100%] [.matcher-decision_&]:[min-height:36px] [.matcher-decision_&]:[justify-content:center] [.matcher-decision_&]:[white-space:nowrap] [.matcher-decision_&]:[line-height:1.25] disabled:[.matcher-decision_&]:[cursor:wait] disabled:[.matcher-decision_&]:[opacity:0.6]"
                          onClick={() =>
                            saveAIDecision(candidate.candidate_id, "accept")
                          }
                        >
                          <ThumbsUp size={14} />
                          Accept AI Match
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline btn-sm [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [padding:6px_14px] [font-size:12px] [.matcher-decision_&]:[width:100%] [.matcher-decision_&]:[min-height:36px] [.matcher-decision_&]:[justify-content:center] [.matcher-decision_&]:[white-space:normal] [.matcher-decision_&]:[line-height:1.25] disabled:[.matcher-decision_&]:[cursor:wait] disabled:[.matcher-decision_&]:[opacity:0.6]"
                          onClick={() =>
                            saveAIDecision(candidate.candidate_id, "override")
                          }
                        >
                          <ThumbsDown size={14} />
                          Override
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredCandidates.length === 0 && (
              <PageState
                variant="empty"
                title="No matching candidates found"
                description="Try changing your search or score filter."
                icon={AlertCircle}
              />
            )}
          </div>
        </>
      )}

      {/* =====================================
          NO CANDIDATES
      ===================================== */}

      {!error && !loadingCandidates && selectedJob && candidates.length === 0 && (
        <PageState
          variant="empty"
          title="No new candidates to evaluate"
          description="All candidates for this job have already been evaluated or moved beyond the new stage."
          icon={Users}
        />
      )}

      {/* =====================================
          INITIAL STATE
      ===================================== */}

      {!error && !selectedJob && !loadingJobs && (
        <div className="matcher-empty matcher-initial card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center] [text-align:center] [padding:50px_20px] [color:#64748b] [margin-top:20px]">
          <Search size={34} />

          <h3 className="[.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px] [.matcher-empty_&]:[margin:14px_0_6px] [.matcher-empty_&]:[color:inherit]">Select a job to start matching</h3>

          <p className="[.matcher-empty_&]:[margin:0] [.matcher-empty_&]:[max-width:450px]">
            Choose a job opening above to analyze its applicants and identify
            the strongest matches.
          </p>
        </div>
      )}
      {loadingCandidates &&
        createPortal(
          <div
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
            role="presentation"
          >
            <section
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
              role="dialog"
              aria-modal="true"
              aria-labelledby="matcher-progress-title"
              aria-describedby="matcher-progress-description"
            >
              <div className="mb-5">
                <h2
                  id="matcher-progress-title"
                  className="m-0 text-lg font-bold text-slate-900"
                >
                  Matching candidates
                </h2>
                <p
                  id="matcher-progress-description"
                  className="mb-0 mt-1 text-sm leading-6 text-slate-600"
                >
                  Comparing candidate profiles with the selected job
                  requirements. This may take a moment.
                </p>
              </div>
              <div
                className="relative h-2.5 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-label="Matching candidate profiles"
              >
                <span className="matcher-progress-indicator absolute inset-y-0 left-0 w-1/3 rounded-full bg-blue-800" />
              </div>
            </section>
          </div>,
          document.body,
        )}
    </PageShell>
  );
}

export default CandidateMatcherPage;

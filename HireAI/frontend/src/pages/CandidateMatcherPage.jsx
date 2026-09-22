import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Users,
  BriefcaseBusiness,
  MapPin,
  Award,
  RefreshCw,
  ChevronDown,
  UserRound,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  ArrowRightCircle,
  XCircle,
} from "lucide-react";

import PageShell from "../components/PageShell";
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

/*
  Primary skills = mandatory_skills on the job
  Secondary skills = required_skills on the job
*/

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
  "Strong Match": "match-strong",
  "Good Match": "match-good",
  "Moderate Match": "match-moderate",
  "Low Match": "match-low",
};

const getMatchClassName = (category) =>
  CATEGORY_CLASS_MAP[category] || "match-low";

/*
  A good AI match is what unlocks the one-click "Move to L1"
*/

const GOOD_MATCH_THRESHOLD = 60;

const isGoodMatch = (score) => (score ?? 0) >= GOOD_MATCH_THRESHOLD;

const skillsMatch = (candidateSkill, jobSkill) => {
  const candidateValue = candidateSkill.toLowerCase().trim();
  const jobValue = jobSkill.toLowerCase().trim();

  return (
    candidateValue === jobValue ||
    candidateValue.includes(jobValue) ||
    jobValue.includes(candidateValue)
  );
};

function CandidateMatcherPage() {
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

  const handleJobChange = async (jobId) => {
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
  };

  /* =========================================
     MAP CANDIDATES TO DISPLAY SHAPE
  ========================================= */

  const matchedCandidates = useMemo(() => {
    if (!selectedJob) return [];

    return candidates
      .map((candidate) => ({
        ...candidate,

        matchScore: candidate.ai_score ?? 0,

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
      const nameMatch = (candidate.full_name || "")
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

    // Score >= 60 -> L1
    // Score < 60 -> Rejected
    const targetStage =
      score >= GOOD_MATCH_THRESHOLD ? "L1 Interview" : "Rejected";

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
          stage: targetStage === "L1 Interview" ? "L1" : "Rejected",
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
      const targetStage = stage === "L1" ? "L1 Interview" : "Rejected";

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
          stage: stage,
        },
      }));
    } catch (error) {
      console.error("Unable to update candidate stage:", error);
      setError(error.message);
    } finally {
      setProcessingCandidateId(null);
    }
  };

  /*
    JD skills used to determine whether
    a candidate skill should be green.

    Primary + Secondary JD skills
  */

  const jobSkills = useMemo(() => {
    if (!selectedJob) return [];

    return [
      ...getJobPrimarySkills(selectedJob),
      ...getJobSecondarySkills(selectedJob),
    ];
  }, [selectedJob]);

  return (
    <PageShell
      title="Candidate Matcher"
      actions={
        selectedJobId && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleJobChange(selectedJobId)}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        )
      }
    >
      {/* =====================================
          PAGE INTRO
      ===================================== */}

      <div className="matcher-header">
        <div>
          <h2 className="matcher-title">Find the Best Candidates</h2>

          <p className="matcher-description">
            Select a job to compare candidate profiles against the job
            requirements.
          </p>
        </div>
      </div>

      {/* =====================================
          JOB SELECTOR
      ===================================== */}

      <div className="matcher-job-selector card">
        <div className="matcher-selector-label">
          <BriefcaseBusiness size={18} />

          <span>Select Job</span>
        </div>

        <div className="matcher-select-wrapper">
          <select
            value={selectedJobId}
            onChange={(event) => handleJobChange(event.target.value)}
            disabled={loadingJobs}
            className="matcher-select"
          >
            <option value="">
              {loadingJobs ? "Loading jobs..." : "Choose a job opening"}
            </option>

            {jobs.map((job) => (
              <option key={job.job_id} value={job.job_id}>
                {job.title}
                {job.department ? ` — ${job.department}` : ""}
              </option>
            ))}
          </select>

          <ChevronDown size={18} className="matcher-select-icon" />
        </div>
      </div>

      {/* =====================================
          ERROR
      ===================================== */}

      {error && <div className="error-box">{error}</div>}

      {/* =====================================
          SELECTED JOB DETAILS
      ===================================== */}

      {selectedJob && (
        <div className="matcher-job-details card">
          <div className="matcher-job-main">
            <div className="matcher-job-icon">
              <BriefcaseBusiness size={22} />
            </div>

            <div>
              <h2>{selectedJob.title}</h2>

              <div className="matcher-job-meta">
                {selectedJob.department && (
                  <span>🏢 {selectedJob.department}</span>
                )}

                {selectedJob.location && (
                  <span>
                    <MapPin size={14} />

                    {selectedJob.location}
                  </span>
                )}

                <span>
                  <Users size={14} />
                  {selectedJob.candidate_count || 0} applicants
                </span>
              </div>
            </div>
          </div>

          <div className="matcher-job-experience">
            <span>Minimum Experience</span>

            <strong>{selectedJob.min_exp || 0} years</strong>
          </div>

          {/* JD SKILLS - LEFT AS NORMAL */}

          <div className="matcher-job-skills-panel">
            {getJobPrimarySkills(selectedJob).length > 0 && (
              <div className="matcher-job-skill-group">
                <span className="matcher-job-skill-group-label">
                  Primary Skills
                </span>

                <div className="matcher-skills">
                  {getJobPrimarySkills(selectedJob).map((skill) => (
                    <span
                      key={`primary-${skill}`}
                      className="matcher-skill matcher-skill-primary"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {getJobSecondarySkills(selectedJob).length > 0 && (
              <div className="matcher-job-skill-group">
                <span className="matcher-job-skill-group-label">
                  Secondary Skills
                </span>

                <div className="matcher-skills">
                  {getJobSecondarySkills(selectedJob).map((skill) => (
                    <span
                      key={`secondary-${skill}`}
                      className="matcher-skill matcher-skill-secondary"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================
          LOADING CANDIDATES
      ===================================== */}

      {loadingCandidates && (
        <div className="card matcher-loading">
          <RefreshCw size={22} className="matcher-spinner" />

          <span>Matching candidates...</span>
        </div>
      )}

      {/* =====================================
          MATCHING RESULTS
      ===================================== */}

      {!loadingCandidates && selectedJob && candidates.length > 0 && (
        <>
          {/* SUMMARY */}

          <div className="matcher-summary-grid">
            <div className="matcher-summary-card card">
              <div className="matcher-summary-icon">
                <Users size={20} />
              </div>

              <div>
                <span>Total Candidates</span>

                <strong>{candidates.length}</strong>
              </div>
            </div>

            <div className="matcher-summary-card card">
              <div className="matcher-summary-icon">
                <Award size={20} />
              </div>

              <div>
                <span>Strong Matches</span>

                <strong>{strongMatches}</strong>
              </div>
            </div>

            <div className="matcher-summary-card card">
              <div className="matcher-summary-icon">
                <CheckCircle2 size={20} />
              </div>

              <div>
                <span>Good Matches</span>

                <strong>{goodMatches}</strong>
              </div>
            </div>
          </div>

          {/* FILTERS */}

          <div className="matcher-toolbar card">
            <div className="matcher-search">
              <Search size={18} />

              <input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>

            <select
              value={minimumScore}
              onChange={(event) => setMinimumScore(event.target.value)}
              className="matcher-score-filter"
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

          <div className="matcher-results">
            {filteredCandidates.map((candidate) => {
              const decision = candidateDecisions[candidate.candidate_id] || {};

              /*
                  Candidate skills
                */

              const candidateSkills = normalizeSkills(candidate.skills);

              return (
                <div
                  key={candidate.candidate_id}
                  className="matcher-candidate-card card"
                >
                  {/* =====================================
                        CANDIDATE INFO
                    ===================================== */}

                  <Link
                    to={`/candidate-detail/${candidate.candidate_id}`}
                    className="matcher-candidate-info-link"
                  >
                    <div className="matcher-candidate-info">
                      <div className="matcher-avatar">
                        <UserRound size={22} />
                      </div>

                      <div>
                        <h3 className="matcher-candidate-name">
                          {candidate.name || candidate.full_name || "Candidate"}
                        </h3>
                      </div>
                    </div>
                  </Link>

                  {/* =====================================
                        CANDIDATE SKILLS

                        Green = skill matches JD
                        Grey = skill does not match JD
                    ===================================== */}

                  <div className="matcher-skills">
                    {candidateSkills.slice(0, 5).map((skill) => {
                      /*
                            Check against selected Job Description
                          */

                      const matchesJD = jobSkills.some((jobSkill) =>
                        skillsMatch(skill, jobSkill),
                      );

                      return (
                        <span
                          key={skill}
                          className={
                            matchesJD
                              ? "matcher-skill matcher-skill-matched"
                              : "matcher-skill matcher-skill-unmatched"
                          }
                        >
                          {skill}
                        </span>
                      );
                    })}

                    {candidateSkills.length === 0 && (
                      <span className="matcher-no-skills">
                        No skills available
                      </span>
                    )}
                  </div>

                  {/* =====================================
                        SCORE
                    ===================================== */}

                  <div className="matcher-score">
                    <div
                      className={`matcher-score-circle ${candidate.matchDetails.className}`}
                    >
                      {candidate.matchScore}%
                    </div>

                    <span
                      className={`matcher-score-label ${candidate.matchDetails.className}`}
                    >
                      {candidate.matchDetails.label}
                    </span>
                  </div>

                  {/* =====================================
                        AI MATCH DECISION WORKFLOW
                    ===================================== */}

                  <div className="matcher-decision">
                    {/* =====================================
                            FINAL STAGE
                        ===================================== */}

                    {decision.stage ? (
                      <span
                        className={
                          decision.stage === "L1"
                            ? "matcher-decision-badge matcher-decision-badge-l1"
                            : "matcher-decision-badge matcher-decision-badge-rejected"
                        }
                      >
                        {decision.stage === "L1" ? (
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
                      <span className="matcher-decision-badge matcher-decision-badge-l1">
                        <CheckCircle2 size={14} />
                        AI Match Accepted
                      </span>
                    ) : decision.decisionType === "override" ? (
                      /*
      AI recommendation was overridden.

      The recruiter must now decide the actual outcome:
        1. Advance to L1
        2. Reject Candidate
    */
                      <div className="matcher-decision-actions">
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          disabled={
                            processingCandidateId === candidate.candidate_id
                          }
                          onClick={() =>
                            moveCandidateToStage(candidate.candidate_id, "L1")
                          }
                        >
                          <ArrowRightCircle size={14} />
                          Advance to L1
                        </button>

                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
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
                      <div className="matcher-decision-actions">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() =>
                            saveAIDecision(candidate.candidate_id, "accept")
                          }
                        >
                          <ThumbsUp size={14} />
                          Accept AI Match
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
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
              <div className="matcher-empty card">
                <AlertCircle size={30} />

                <h3>No matching candidates found</h3>

                <p>Try changing your search or score filter.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* =====================================
          NO CANDIDATES
      ===================================== */}

      {!loadingCandidates && selectedJob && candidates.length === 0 && (
        <div className="matcher-empty card">
          <Users size={32} />

          <h3>No new candidates to evaluate</h3>

          <p>
            All candidates for this job have already been evaluated or moved
            beyond the new stage.
          </p>
        </div>
      )}

      {/* =====================================
          INITIAL STATE
      ===================================== */}

      {!selectedJob && !loadingJobs && (
        <div className="matcher-empty matcher-initial card">
          <Search size={34} />

          <h3>Select a job to start matching</h3>

          <p>
            Choose a job opening above to analyze its applicants and identify
            the strongest matches.
          </p>
        </div>
      )}
    </PageShell>
  );
}

export default CandidateMatcherPage;

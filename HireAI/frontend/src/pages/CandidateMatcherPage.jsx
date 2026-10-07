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
  "Strong Match": "[background:#dcfce7] [color:#166534]",
  "Good Match": "[background:#dbeafe] [color:#1d4ed8]",
  "Moderate Match": "[background:#fef3c7] [color:#92400e]",
  "Low Match": "[background:#fee2e2] [color:#991b1b]",
};

const getMatchClassName = (category) =>
  CATEGORY_CLASS_MAP[category] || "[background:#fee2e2] [color:#991b1b]";

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
            className="btn btn-secondary [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#fff] [color:#133f7d] [border:1.5px_solid_#133f7d]"
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

      <div className="matcher-header [margin-bottom:24px]">
        <div>
          <h2 className="matcher-title [margin:0_0_6px] [font-size:22px]">Find the Best Candidates</h2>

          <p className="matcher-description [margin:0] [color:#64748b] [font-size:14px]">
            Select a job to compare candidate profiles against the job
            requirements.
          </p>
        </div>
      </div>

      {/* =====================================
          JOB SELECTOR
      ===================================== */}

      <div className="matcher-job-selector card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [padding:20px] [margin-bottom:20px]">
        <div className="matcher-selector-label [display:flex] [align-items:center] [gap:8px] [font-size:14px] [font-weight:600] [margin-bottom:10px]">
          <BriefcaseBusiness size={18} />

          <span>Select Job</span>
        </div>

        <div className="matcher-select-wrapper [position:relative]">
          <select
            value={selectedJobId}
            onChange={(event) => handleJobChange(event.target.value)}
            disabled={loadingJobs}
            className="matcher-select [font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [appearance:none] [padding:12px_42px_12px_14px] [border:1px_solid_#d1d5db] [background:white] [cursor:pointer] focus:[outline:none] focus:[border-color:#2563eb]"
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

          <ChevronDown size={18} className="matcher-select-icon [position:absolute] [right:14px] [top:50%] [transform:translateY(-50%)] [pointer-events:none] [color:#64748b]" />
        </div>
      </div>

      {/* =====================================
          ERROR
      ===================================== */}

      {error && <div className="error-box [background:#fee2e2] [color:#991b1b] [padding:10px] [border-radius:8px] [font-size:12px] [margin-bottom:10px]">{error}</div>}

      {/* =====================================
          SELECTED JOB DETAILS
      ===================================== */}

      {selectedJob && (
        <div className="matcher-job-details card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [display:flex] [align-items:center] [justify-content:space-between] [gap:20px] [padding:20px] [margin-bottom:20px] [flex-wrap:wrap] max-[700px]:[flex-direction:column] max-[700px]:[align-items:flex-start]">
          <div className="matcher-job-main [display:flex] [align-items:center] [gap:14px]">
            <div className="matcher-job-icon [width:48px] [height:48px] [display:flex] [align-items:center] [justify-content:center] [border-radius:10px] [background:#f3f4f6]">
              <BriefcaseBusiness size={22} />
            </div>

            <div>
              <h2 className="[.matcher-job-main_&]:[margin:0_0_8px] [.matcher-job-main_&]:[font-size:18px]">{selectedJob.title}</h2>

              <div className="matcher-job-meta [display:flex] [flex-wrap:wrap] [gap:14px] [color:#64748b] [font-size:13px]">
                {selectedJob.department && (
                  <span className="[.matcher-job-meta_&]:[display:flex] [.matcher-job-meta_&]:[align-items:center] [.matcher-job-meta_&]:[gap:5px]">🏢 {selectedJob.department}</span>
                )}

                {selectedJob.location && (
                  <span className="[.matcher-job-meta_&]:[display:flex] [.matcher-job-meta_&]:[align-items:center] [.matcher-job-meta_&]:[gap:5px]">
                    <MapPin size={14} />

                    {selectedJob.location}
                  </span>
                )}

                <span className="[.matcher-job-meta_&]:[display:flex] [.matcher-job-meta_&]:[align-items:center] [.matcher-job-meta_&]:[gap:5px]">
                  <Users size={14} />
                  {selectedJob.candidate_count || 0} applicants
                </span>
              </div>
            </div>
          </div>

          <div className="matcher-job-experience [display:flex] [flex-direction:column] [text-align:right] [gap:4px] max-[700px]:[text-align:left]">
            <span className="[.matcher-job-experience_&]:[font-size:12px] [.matcher-job-experience_&]:[color:#64748b]">Minimum Experience</span>

            <strong className="[font-weight:700] [.matcher-job-experience_&]:[font-size:16px]">{selectedJob.min_exp || 0} years</strong>
          </div>

          {/* JD SKILLS - LEFT AS NORMAL */}

          <div className="matcher-job-skills-panel [display:flex] [flex-wrap:wrap] [gap:20px] [flex-basis:100%] [padding-top:16px] [margin-top:4px] [border-top:1px_solid_#e2e8f0]">
            {getJobPrimarySkills(selectedJob).length > 0 && (
              <div className="matcher-job-skill-group [display:flex] [flex-direction:column] [gap:8px] [min-width:200px] [flex:1]">
                <span className="matcher-job-skill-group-label [font-size:12px] [font-weight:600] [color:#64748b] [text-transform:uppercase] [letter-spacing:0.03em]">
                  Primary Skills
                </span>

                <div className="matcher-skills [display:flex] [flex-wrap:wrap] [align-items:center] [gap:7px]">
                  {getJobPrimarySkills(selectedJob).map((skill) => (
                    <span
                      key={`primary-${skill}`}
                      className="matcher-skill matcher-skill-primary [display:inline-flex] [align-items:center] [width:fit-content] [padding:5px_10px] [border:1px_solid_#e2e8f0] [border-radius:999px] [background:#f1f5f9] [color:#475569] [font-size:12px] [line-height:1.2] [text-transform:capitalize] [white-space:nowrap] [background:#ede9fe] [color:#5b21b6]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {getJobSecondarySkills(selectedJob).length > 0 && (
              <div className="matcher-job-skill-group [display:flex] [flex-direction:column] [gap:8px] [min-width:200px] [flex:1]">
                <span className="matcher-job-skill-group-label [font-size:12px] [font-weight:600] [color:#64748b] [text-transform:uppercase] [letter-spacing:0.03em]">
                  Secondary Skills
                </span>

                <div className="matcher-skills [display:flex] [flex-wrap:wrap] [align-items:center] [gap:7px]">
                  {getJobSecondarySkills(selectedJob).map((skill) => (
                    <span
                      key={`secondary-${skill}`}
                      className="matcher-skill matcher-skill-secondary [display:inline-flex] [align-items:center] [width:fit-content] [padding:5px_10px] [border:1px_solid_#e2e8f0] [border-radius:999px] [background:#f1f5f9] [color:#475569] [font-size:12px] [line-height:1.2] [text-transform:capitalize] [white-space:nowrap] [background:#e0f2fe] [color:#075985]"
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
        <div className="card matcher-loading [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [display:flex] [align-items:center] [justify-content:center] [gap:10px] [padding:30px]">
          <RefreshCw size={22} className="matcher-spinner animate-spin" />

          <span>Matching candidates...</span>
        </div>
      )}

      {/* =====================================
          MATCHING RESULTS
      ===================================== */}

      {!loadingCandidates && selectedJob && candidates.length > 0 && (
        <>
          {/* SUMMARY */}

          <div className="matcher-summary-grid [display:grid] [grid-template-columns:repeat(3,_minmax(0,_1fr))] [gap:16px] [margin-bottom:20px] max-[700px]:[grid-template-columns:1fr]">
            <div className="matcher-summary-card card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [display:flex] [align-items:center] [gap:14px] [padding:18px]">
              <div className="matcher-summary-icon [width:42px] [height:42px] [display:flex] [align-items:center] [justify-content:center] [border-radius:10px] [background:#f3f4f6] last:[.matcher-summary-card_&]:[display:flex] last:[.matcher-summary-card_&]:[flex-direction:column] last:[.matcher-summary-card_&]:[gap:3px]">
                <Users size={20} />
              </div>

              <div className="last:[.matcher-summary-card_&]:[display:flex] last:[.matcher-summary-card_&]:[flex-direction:column] last:[.matcher-summary-card_&]:[gap:3px]">
                <span className="[.matcher-summary-card_&]:[font-size:13px] [.matcher-summary-card_&]:[color:#64748b]">Total Candidates</span>

                <strong className="[font-weight:700] [.matcher-summary-card_&]:[font-size:22px]">{candidates.length}</strong>
              </div>
            </div>

            <div className="matcher-summary-card card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [display:flex] [align-items:center] [gap:14px] [padding:18px]">
              <div className="matcher-summary-icon [width:42px] [height:42px] [display:flex] [align-items:center] [justify-content:center] [border-radius:10px] [background:#f3f4f6] last:[.matcher-summary-card_&]:[display:flex] last:[.matcher-summary-card_&]:[flex-direction:column] last:[.matcher-summary-card_&]:[gap:3px]">
                <Award size={20} />
              </div>

              <div className="last:[.matcher-summary-card_&]:[display:flex] last:[.matcher-summary-card_&]:[flex-direction:column] last:[.matcher-summary-card_&]:[gap:3px]">
                <span className="[.matcher-summary-card_&]:[font-size:13px] [.matcher-summary-card_&]:[color:#64748b]">Strong Matches</span>

                <strong className="[font-weight:700] [.matcher-summary-card_&]:[font-size:22px]">{strongMatches}</strong>
              </div>
            </div>

            <div className="matcher-summary-card card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [display:flex] [align-items:center] [gap:14px] [padding:18px]">
              <div className="matcher-summary-icon [width:42px] [height:42px] [display:flex] [align-items:center] [justify-content:center] [border-radius:10px] [background:#f3f4f6] last:[.matcher-summary-card_&]:[display:flex] last:[.matcher-summary-card_&]:[flex-direction:column] last:[.matcher-summary-card_&]:[gap:3px]">
                <CheckCircle2 size={20} />
              </div>

              <div className="last:[.matcher-summary-card_&]:[display:flex] last:[.matcher-summary-card_&]:[flex-direction:column] last:[.matcher-summary-card_&]:[gap:3px]">
                <span className="[.matcher-summary-card_&]:[font-size:13px] [.matcher-summary-card_&]:[color:#64748b]">Good Matches</span>

                <strong className="[font-weight:700] [.matcher-summary-card_&]:[font-size:22px]">{goodMatches}</strong>
              </div>
            </div>
          </div>

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

          <div className="matcher-results [display:flex] [flex-direction:column] [gap:14px]">
            {filteredCandidates.map((candidate) => {
              const decision = candidateDecisions[candidate.candidate_id] || {};

              /*
                  Candidate skills
                */

              const candidateSkills = normalizeSkills(candidate.skills);

              return (
                <div
                  key={candidate.candidate_id}
                  className="matcher-candidate-card card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [display:grid] [grid-template-columns:minmax(220px,_1.5fr)_minmax(200px,_1fr)_120px_auto] [align-items:center] [gap:20px] [padding:18px] max-[900px]:[grid-template-columns:1fr] max-[900px]:[align-items:flex-start]"
                >
                  {/* =====================================
                        CANDIDATE INFO
                    ===================================== */}

                  <Link
                    to={`/candidate-detail/${candidate.candidate_id}`}
                    className="block text-inherit no-underline"
                  >
                    <div className="matcher-candidate-info [display:flex] [align-items:center] [gap:12px]">
                      <div className="matcher-avatar [width:46px] [height:46px] [display:flex] [align-items:center] [justify-content:center] [border-radius:50%] [background:#f3f4f6]">
                        <UserRound size={22} />
                      </div>

                      <div>
                        <h3 className="matcher-candidate-name [.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px] [.matcher-candidate-info_&]:[margin:0_0_4px] [.matcher-candidate-info_&]:[font-size:15px] [font-size:18px] [font-weight:700] [color:#133f7d] [margin:0_0_4px]">
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

                  <div className="matcher-skills [display:flex] [flex-wrap:wrap] [align-items:center] [gap:7px]">
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
                          className={`${(matchesJD
                              ? "matcher-skill matcher-skill-matched"
                              : "matcher-skill matcher-skill-unmatched")} [&.matcher-skill]:[display:inline-flex] [&.matcher-skill]:[align-items:center] [&.matcher-skill]:[width:fit-content] [&.matcher-skill]:[padding:5px_10px] [&.matcher-skill]:[border:1px_solid_#e2e8f0] [&.matcher-skill]:[border-radius:999px] [&.matcher-skill]:[background:#f1f5f9] [&.matcher-skill]:[color:#475569] [&.matcher-skill]:[font-size:12px] [&.matcher-skill]:[line-height:1.2] [&.matcher-skill]:[text-transform:capitalize] [&.matcher-skill]:[white-space:nowrap] [&.matcher-skill-matched]:[background:#dcfce7] [&.matcher-skill-matched]:[color:#166534] [&.matcher-skill-matched]:[font-weight:600] [&.matcher-skill-matched]:[box-shadow:inset_0_0_0_1px_#86efac]`}
                        >
                          {skill}
                        </span>
                      );
                    })}

                    {candidateSkills.length === 0 && (
                      <span className="matcher-no-skills [font-size:13px] [color:#64748b]">
                        No skills available
                      </span>
                    )}
                  </div>

                  {/* =====================================
                        SCORE
                    ===================================== */}

                  <div className="matcher-score [display:flex] [flex-direction:column] [align-items:center] [gap:6px] max-[900px]:[align-items:flex-start]">
                    <div
                      className={`${(`matcher-score-circle ${candidate.matchDetails.className}`)} [width:62px] [height:62px] [display:flex] [align-items:center] [justify-content:center] [border-radius:50%] [font-size:15px] [font-weight:700]`}
                    >
                      {candidate.matchScore}%
                    </div>

                    <span
                      className={`${(`matcher-score-label ${candidate.matchDetails.className}`)} [font-size:12px] [font-weight:600] [text-align:center]`}
                    >
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
                        className={`${(decision.stage === "L1"
                            ? "matcher-decision-badge matcher-decision-badge-l1"
                            : "matcher-decision-badge matcher-decision-badge-rejected")} [&.matcher-decision-badge]:[display:inline-flex] [&.matcher-decision-badge]:[align-items:center] [&.matcher-decision-badge]:[justify-content:center] [&.matcher-decision-badge]:[gap:6px] [&.matcher-decision-badge]:[min-height:36px] [&.matcher-decision-badge]:[padding:8px_10px] [&.matcher-decision-badge]:[border-radius:8px] [&.matcher-decision-badge]:[font-size:11px] [&.matcher-decision-badge]:[font-weight:700] [&.matcher-decision-badge]:[text-align:center] [&.matcher-decision-badge-l1]:[background:#dcfce7] [&.matcher-decision-badge-l1]:[color:#166534] [&.matcher-decision-badge-rejected]:[background:#fee2e2] [&.matcher-decision-badge-rejected]:[color:#991b1b]`}
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
                      <span className="matcher-decision-badge matcher-decision-badge-l1 [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [min-height:36px] [padding:8px_10px] [border-radius:8px] [font-size:11px] [font-weight:700] [text-align:center] [background:#dcfce7] [color:#166534]">
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
                      <div className="matcher-decision-actions [display:flex] [flex-direction:column] [align-items:stretch] [gap:8px]">
                        <button
                          type="button"
                          className="btn btn-success btn-sm [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#22c55e] [color:#fff] [padding:6px_14px] [font-size:12px] [.matcher-decision_&]:[width:100%] [.matcher-decision_&]:[min-height:36px] [.matcher-decision_&]:[justify-content:center] [.matcher-decision_&]:[white-space:normal] [.matcher-decision_&]:[line-height:1.25] disabled:[.matcher-decision_&]:[cursor:wait] disabled:[.matcher-decision_&]:[opacity:0.6]"
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
                          className="btn btn-primary btn-sm [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#133f7d] [color:#fff] [padding:6px_14px] [font-size:12px] [.matcher-decision_&]:[width:100%] [.matcher-decision_&]:[min-height:36px] [.matcher-decision_&]:[justify-content:center] [.matcher-decision_&]:[white-space:normal] [.matcher-decision_&]:[line-height:1.25] disabled:[.matcher-decision_&]:[cursor:wait] disabled:[.matcher-decision_&]:[opacity:0.6]"
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
              <div className="matcher-empty card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center] [text-align:center] [padding:50px_20px] [color:#64748b]">
                <AlertCircle size={30} />

                <h3 className="[.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px] [.matcher-empty_&]:[margin:14px_0_6px] [.matcher-empty_&]:[color:inherit]">No matching candidates found</h3>

                <p className="[.matcher-empty_&]:[margin:0] [.matcher-empty_&]:[max-width:450px]">Try changing your search or score filter.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* =====================================
          NO CANDIDATES
      ===================================== */}

      {!loadingCandidates && selectedJob && candidates.length === 0 && (
        <div className="matcher-empty card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center] [text-align:center] [padding:50px_20px] [color:#64748b]">
          <Users size={32} />

          <h3 className="[.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px] [.matcher-empty_&]:[margin:14px_0_6px] [.matcher-empty_&]:[color:inherit]">No new candidates to evaluate</h3>

          <p className="[.matcher-empty_&]:[margin:0] [.matcher-empty_&]:[max-width:450px]">
            All candidates for this job have already been evaluated or moved
            beyond the new stage.
          </p>
        </div>
      )}

      {/* =====================================
          INITIAL STATE
      ===================================== */}

      {!selectedJob && !loadingJobs && (
        <div className="matcher-empty matcher-initial card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center] [text-align:center] [padding:50px_20px] [color:#64748b] [margin-top:20px]">
          <Search size={34} />

          <h3 className="[.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px] [.matcher-empty_&]:[margin:14px_0_6px] [.matcher-empty_&]:[color:inherit]">Select a job to start matching</h3>

          <p className="[.matcher-empty_&]:[margin:0] [.matcher-empty_&]:[max-width:450px]">
            Choose a job opening above to analyze its applicants and identify
            the strongest matches.
          </p>
        </div>
      )}
    </PageShell>
  );
}

export default CandidateMatcherPage;

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
} from "lucide-react";

import PageShell from "./PageShell";


/* =========================================
   HELPER FUNCTIONS
========================================= */

const normalizeSkills = (skills) => {
  if (!skills) return [];

  if (Array.isArray(skills)) {
    return skills
      .map((skill) => String(skill).trim().toLowerCase())
      .filter(Boolean);
  }

  return String(skills)
    .split(/[;,|]/)
    .map((skill) => skill.trim().toLowerCase())
    .filter(Boolean);
};


const calculateMatchScore = (candidate, job) => {
  const candidateSkills = normalizeSkills(candidate.skills);

  const mandatorySkills = normalizeSkills(job.mandatory_skills);

  const requiredSkills = normalizeSkills(job.required_skills);

  let score = 0;

  /*
    Mandatory Skills
    Maximum: 40 points
  */

  if (mandatorySkills.length > 0) {
    const matchedMandatory = mandatorySkills.filter((skill) =>
      candidateSkills.some(
        (candidateSkill) =>
          candidateSkill.includes(skill) ||
          skill.includes(candidateSkill)
      )
    );

    score +=
      (matchedMandatory.length / mandatorySkills.length) * 40;
  } else {
    score += 40;
  }


  /*
    Required Skills
    Maximum: 30 points
  */

  if (requiredSkills.length > 0) {
    const matchedRequired = requiredSkills.filter((skill) =>
      candidateSkills.some(
        (candidateSkill) =>
          candidateSkill.includes(skill) ||
          skill.includes(candidateSkill)
      )
    );

    score +=
      (matchedRequired.length / requiredSkills.length) * 30;
  } else {
    score += 30;
  }


  /*
    Experience
    Maximum: 20 points
  */

  const candidateExperience =
    Number(candidate.experience_years) || 0;

  const requiredExperience =
    Number(job.min_exp) || 0;

  if (requiredExperience === 0) {
    score += 20;
  } else if (candidateExperience >= requiredExperience) {
    score += 20;
  } else {
    score +=
      (candidateExperience / requiredExperience) * 20;
  }


  /*
    Role Relevance
    Maximum: 10 points
  */

  const jobTitle = (job.title || "").toLowerCase();

  const candidateRole =
    `${candidate.current_role || ""} ${candidate.applied_role || ""}`
      .toLowerCase();

  if (
    jobTitle &&
    candidateRole &&
    (
      candidateRole.includes(jobTitle) ||
      jobTitle.includes(candidateRole)
    )
  ) {
    score += 10;
  }


  return Math.min(100, Math.round(score));
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

const isSkillMatched = (skill, jobSkills) =>
  jobSkills.some(
    (jobSkill) =>
      skill.includes(jobSkill) || jobSkill.includes(skill)
  );

const getMatchDetails = (score) => {
  if (score >= 80) {
    return {
      label: "Strong Match",
      className: "match-strong",
    };
  }

  if (score >= 60) {
    return {
      label: "Good Match",
      className: "match-good",
    };
  }

  if (score >= 40) {
    return {
      label: "Moderate Match",
      className: "match-moderate",
    };
  }

  return {
    label: "Low Match",
    className: "match-low",
  };
};


function CandidateMatcherPage() {
  const [jobs, setJobs] = useState([]);

  const [selectedJobId, setSelectedJobId] = useState("");

  const [selectedJob, setSelectedJob] = useState(null);

  const [candidates, setCandidates] = useState([]);

  const [loadingJobs, setLoadingJobs] = useState(true);

  const [loadingCandidates, setLoadingCandidates] =
    useState(false);

  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const [minimumScore, setMinimumScore] =
    useState("All");


  /* =========================================
     LOAD JOBS
  ========================================= */

  useEffect(() => {
    fetchJobs();
  }, []);


  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);

      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5001/api/jobs",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token
              ? `Bearer ${token}`
              : "",
          },
        }
      );

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
  };


  /* =========================================
     LOAD CANDIDATES FOR JOB
  ========================================= */

  const handleJobChange = async (jobId) => {
    setSelectedJobId(jobId);

    setCandidates([]);

    setSearchQuery("");

    setMinimumScore("All");

    if (!jobId) {
      setSelectedJob(null);
      return;
    }

    const job = jobs.find(
      (item) => String(item.job_id) === String(jobId)
    );

    setSelectedJob(job || null);

    try {
      setLoadingCandidates(true);

      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5001/api/jobs/${jobId}/candidates`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token
              ? `Bearer ${token}`
              : "",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load candidates for this job."
        );
      }

      const data = await response.json();

      setCandidates(data.candidates || []);

    } catch (error) {
      console.error(
        "Error loading job candidates:",
        error
      );

      setError(error.message);

    } finally {
      setLoadingCandidates(false);
    }
  };


  /* =========================================
     CALCULATE MATCHED CANDIDATES
  ========================================= */

  const matchedCandidates = useMemo(() => {
    if (!selectedJob) return [];

    return candidates
      .map((candidate) => {
        const matchScore = calculateMatchScore(
          candidate,
          selectedJob
        );

        return {
          ...candidate,
          matchScore,
          matchDetails:
            getMatchDetails(matchScore),
        };
      })
      .sort(
        (a, b) =>
          b.matchScore - a.matchScore
      );

  }, [candidates, selectedJob]);


  /* =========================================
     FILTER RESULTS
  ========================================= */

  const filteredCandidates = useMemo(() => {
    return matchedCandidates.filter(
      (candidate) => {

        const nameMatch =
          (candidate.full_name || "")
            .toLowerCase()
            .includes(
              searchQuery.toLowerCase()
            );

        const roleMatch =
          (candidate.current_role || "")
            .toLowerCase()
            .includes(
              searchQuery.toLowerCase()
            );

        const searchMatch =
          nameMatch || roleMatch;


        const scoreMatch =
          minimumScore === "All" ||
          candidate.matchScore >=
            Number(minimumScore);


        return searchMatch && scoreMatch;
      }
    );

  }, [
    matchedCandidates,
    searchQuery,
    minimumScore,
  ]);


  /* =========================================
     SUMMARY COUNTS
  ========================================= */

  const strongMatches =
    matchedCandidates.filter(
      (candidate) =>
        candidate.matchScore >= 80
    ).length;


  const goodMatches =
    matchedCandidates.filter(
      (candidate) =>
        candidate.matchScore >= 60 &&
        candidate.matchScore < 80
    ).length;


  /* =========================================
     COMBINED JOB SKILLS (for highlighting)
  ========================================= */

  const jobAllSkills = useMemo(() => {
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
            onClick={() =>
              handleJobChange(selectedJobId)
            }
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
          <h2 className="matcher-title">
            Find the Best Candidates
          </h2>

          <p className="matcher-description">
            Select a job to compare candidate
            profiles against the job requirements.
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
            onChange={(event) =>
              handleJobChange(event.target.value)
            }
            disabled={loadingJobs}
            className="matcher-select"
          >

            <option value="">
              {loadingJobs
                ? "Loading jobs..."
                : "Choose a job opening"}
            </option>


            {jobs.map((job) => (

              <option
                key={job.job_id}
                value={job.job_id}
              >

                {job.title}
                {job.department
                  ? ` — ${job.department}`
                  : ""}

              </option>

            ))}

          </select>

          <ChevronDown
            size={18}
            className="matcher-select-icon"
          />

        </div>

      </div>


      {/* =====================================
          ERROR
      ===================================== */}

      {error && (

        <div className="error-box">

          {error}

        </div>

      )}


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

              <h2>
                {selectedJob.title}
              </h2>


              <div className="matcher-job-meta">

                {selectedJob.department && (
                  <span>
                    🏢 {selectedJob.department}
                  </span>
                )}

                {selectedJob.location && (
                  <span>
                    <MapPin size={14} />

                    {selectedJob.location}
                  </span>
                )}

                <span>
                  <Users size={14} />

                  {selectedJob.candidate_count || 0}
                  {" "}
                  applicants
                </span>

              </div>

            </div>

          </div>


          <div className="matcher-job-experience">

            <span>Minimum Experience</span>

            <strong>
              {selectedJob.min_exp || 0} years
            </strong>

          </div>


          <div className="matcher-job-skills-panel">

            {getJobPrimarySkills(selectedJob).length > 0 && (

              <div className="matcher-job-skill-group">

                <span className="matcher-job-skill-group-label">
                  Primary Skills
                </span>

                <div className="matcher-skills">

                  {getJobPrimarySkills(selectedJob).map(
                    (skill) => (
                      <span
                        key={`primary-${skill}`}
                        className="matcher-skill matcher-skill-primary"
                      >
                        {skill}
                      </span>
                    )
                  )}

                </div>

              </div>

            )}

            {getJobSecondarySkills(selectedJob).length > 0 && (

              <div className="matcher-job-skill-group">

                <span className="matcher-job-skill-group-label">
                  Secondary Skills
                </span>

                <div className="matcher-skills">

                  {getJobSecondarySkills(selectedJob).map(
                    (skill) => (
                      <span
                        key={`secondary-${skill}`}
                        className="matcher-skill matcher-skill-secondary"
                      >
                        {skill}
                      </span>
                    )
                  )}

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

          <RefreshCw
            size={22}
            className="matcher-spinner"
          />

          <span>
            Matching candidates...
          </span>

        </div>

      )}


      {/* =====================================
          MATCHING RESULTS
      ===================================== */}

      {!loadingCandidates &&
        selectedJob &&
        candidates.length > 0 && (
          <>

            {/* SUMMARY */}

            <div className="matcher-summary-grid">

              <div className="matcher-summary-card card">

                <div className="matcher-summary-icon">
                  <Users size={20} />
                </div>

                <div>

                  <span>
                    Total Candidates
                  </span>

                  <strong>
                    {candidates.length}
                  </strong>

                </div>

              </div>


              <div className="matcher-summary-card card">

                <div className="matcher-summary-icon">
                  <Award size={20} />
                </div>

                <div>

                  <span>
                    Strong Matches
                  </span>

                  <strong>
                    {strongMatches}
                  </strong>

                </div>

              </div>


              <div className="matcher-summary-card card">

                <div className="matcher-summary-icon">
                  <CheckCircle2 size={20} />
                </div>

                <div>

                  <span>
                    Good Matches
                  </span>

                  <strong>
                    {goodMatches}
                  </strong>

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
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value
                    )
                  }
                />

              </div>


              <select
                value={minimumScore}
                onChange={(event) =>
                  setMinimumScore(
                    event.target.value
                  )
                }
                className="matcher-score-filter"
              >

                <option value="All">
                  All Scores
                </option>

                <option value="80">
                  80% and above
                </option>

                <option value="60">
                  60% and above
                </option>

                <option value="40">
                  40% and above
                </option>

              </select>

            </div>


            {/* CANDIDATE RESULTS */}

            <div className="matcher-results">

              {filteredCandidates.map(
                (candidate) => (

                  <div
                    key={
                      candidate.candidate_id
                    }
                    className="matcher-candidate-card card"
                  >

                    {/* CANDIDATE INFO */}

                    <div className="matcher-candidate-info">

                      <div className="matcher-avatar">

                        <UserRound size={22} />

                      </div>


                      <div>

                        <h3>
                          {candidate.full_name}
                        </h3>


                        <p>
                          {candidate.current_role ||
                            candidate.applied_role ||
                            "Candidate"}
                        </p>


                        <div className="matcher-candidate-meta">

                          {candidate.location && (
                            <span>

                              <MapPin size={13} />

                              {
                                candidate.location
                              }

                            </span>
                          )}


                          <span>

                            <BriefcaseBusiness
                              size={13}
                            />

                            {
                              candidate.experience_years ||
                              0
                            }
                            {" "}
                            years

                          </span>

                        </div>

                      </div>

                    </div>


                    {/* SKILLS */}

                    <div className="matcher-skills">

                      {normalizeSkills(
                        candidate.skills
                      )
                        .slice(0, 5)
                        .map((skill) => {

                          const matched = isSkillMatched(
                            skill,
                            jobAllSkills
                          );

                          return (

                            <span
                              key={skill}
                              className={
                                matched
                                  ? "matcher-skill matcher-skill-matched"
                                  : "matcher-skill"
                              }
                            >

                              {skill}

                            </span>

                          );

                        })}


                      {normalizeSkills(
                        candidate.skills
                      ).length === 0 && (

                        <span className="matcher-no-skills">

                          No skills available

                        </span>

                      )}

                    </div>


                    {/* SCORE */}

                    <div className="matcher-score">

                      <div
                        className={
                          `matcher-score-circle ` +
                          candidate.matchDetails.className
                        }
                      >

                        {candidate.matchScore}%

                      </div>


                      <span
                        className={
                          `matcher-score-label ` +
                          candidate.matchDetails.className
                        }
                      >

                        {
                          candidate.matchDetails.label
                        }

                      </span>

                    </div>


                    {/* ACTION */}

                    <Link
                      to={
                        `/candidates/${candidate.candidate_id}`
                      }
                      className="btn btn-secondary btn-sm"
                    >

                      View Profile

                    </Link>

                  </div>

                )
              )}


              {filteredCandidates.length === 0 && (

                <div className="matcher-empty card">

                  <AlertCircle size={30} />

                  <h3>
                    No matching candidates found
                  </h3>

                  <p>
                    Try changing your search
                    or score filter.
                  </p>

                </div>

              )}

            </div>

          </>
        )}


      {/* =====================================
          NO CANDIDATES
      ===================================== */}

      {!loadingCandidates &&
        selectedJob &&
        candidates.length === 0 && (

          <div className="matcher-empty card">

            <Users size={32} />

            <h3>
              No candidates found
            </h3>

            <p>
              There are currently no
              candidates associated with
              this job.
            </p>

          </div>

        )}


      {/* =====================================
          INITIAL STATE
      ===================================== */}

      {!selectedJob &&
        !loadingJobs && (

          <div className="matcher-empty matcher-initial card">

            <Search size={34} />

            <h3>
              Select a job to start matching
            </h3>

            <p>
              Choose a job opening above to
              analyze its applicants and
              identify the strongest matches.
            </p>

          </div>

        )}

    </PageShell>
  );
}

export default CandidateMatcherPage;
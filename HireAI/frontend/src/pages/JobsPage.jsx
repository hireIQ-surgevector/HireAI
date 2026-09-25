import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BriefcaseBusiness, Plus } from "lucide-react";

import PageShell from "../components/PageShell";
import JobsIntro from "../components/JobsIntro";
import JobsStatStrip from "../components/JobsStatStrip";
import JobsToolbar from "../components/JobsToolbar";
import JobsEmptyState from "../components/JobsEmptyState";
import JobCard from "../components/JobCard";

import { getJobStatusDetails } from "../utils/jobStatus";
import { API_URL, getAuthHeader } from "../utils/auth";

function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  /* =========================
     FETCH JOBS
  ========================= */

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/jobs`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch jobs from database.");
      }

      const data = await response.json();

      setJobs(Array.isArray(data) ? data : data.jobs || []);
    } catch (err) {
      console.error("Error loading jobs:", err);

      setError(err.message || "Unable to load jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  /* =========================
     DEPARTMENTS
  ========================= */

  const departments = useMemo(() => {
    const uniqueDepartments = [
      ...new Set(jobs.map((job) => job.department).filter(Boolean)),
    ];

    return ["All", ...uniqueDepartments.sort()];
  }, [jobs]);

  /* =========================
     FILTERED JOBS
  ========================= */

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const departmentMatches =
        selectedDept === "All" ||
        (job.department || "").toLowerCase().trim() ===
          selectedDept.toLowerCase().trim();

      const status = getJobStatusDetails(job.due_date).label;

      const statusMatches =
        selectedStatus === "All" || status === selectedStatus;

      return departmentMatches && statusMatches;
    });
  }, [jobs, selectedDept, selectedStatus]);

  /* =========================
     SUMMARY COUNTS
  ========================= */

  const { activeJobsCount, closingSoonCount, overdueCount } = useMemo(() => {
    let active = 0;
    let closingSoon = 0;
    let overdue = 0;

    jobs.forEach((job) => {
      const status = getJobStatusDetails(job.due_date).label;

      if (status !== "Overdue") active += 1;

      if (status === "Closing Soon") closingSoon += 1;

      if (status === "Overdue") overdue += 1;
    });

    return { activeJobsCount: active, closingSoonCount: closingSoon, overdueCount: overdue };
  }, [jobs]);

  const hasActiveFilters = selectedDept !== "All" || selectedStatus !== "All";

  const clearFilters = () => {
    setSelectedDept("All");
    setSelectedStatus("All");
  };

  return (
    <PageShell hideTopbar>
      <div className="jobs-page">
        <JobsIntro
          eyebrow="RECRUITMENT WORKSPACE"
          title="Build the team you need"
          description="Track open roles, candidate flow, and hiring deadlines from one place."
          icon={BriefcaseBusiness}
          actions={
            <Link to="/post-job" className="btn btn-primary">
              + Post New Job
            </Link>
          }
        />

        {!loading && jobs.length > 0 && (
          <JobsStatStrip
            totalJobs={jobs.length}
            activeJobsCount={activeJobsCount}
            closingSoonCount={closingSoonCount}
            overdueCount={overdueCount}
          />
        )}

        {/* =========================
            FILTER BAR
        ========================= */}

        {!loading && jobs.length > 0 && (
          <JobsToolbar
            departments={departments}
            selectedDept={selectedDept}
            onSelectDept={setSelectedDept}
            selectedStatus={selectedStatus}
            onSelectStatus={setSelectedStatus}
            filteredCount={filteredJobs.length}
            totalCount={jobs.length}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />
        )}

        {/* =========================
            LOADING
        ========================= */}

        {loading && (
          <div className="jobs-loading">
            <div className="loading-spinner" />

            <p>Loading job openings...</p>
          </div>
        )}

        {/* =========================
            ERROR
        ========================= */}

        {!loading && error && (
          <div className="error-box">
            <p>{error}</p>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={fetchJobs}
            >
              Try Again
            </button>
          </div>
        )}

        {/* =========================
            EMPTY STATE
        ========================= */}

        {!loading && !error && jobs.length === 0 && (
          <JobsEmptyState
            title="No job openings yet"
            description="Get started by creating your first job opening."
          >
            <Link to="/post-job" className="btn btn-primary">
              <Plus size={15} />
              Post New Job
            </Link>
          </JobsEmptyState>
        )}

        {/* =========================
            NO FILTER RESULTS
        ========================= */}

        {!loading && !error && jobs.length > 0 && filteredJobs.length === 0 && (
          <JobsEmptyState
            title="No matching jobs"
            description="Try changing your filters."
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={clearFilters}
            >
              Reset Filters
            </button>
          </JobsEmptyState>
        )}

        {/* =========================
            JOB LIST
        ========================= */}

        {!loading && !error && filteredJobs.length > 0 && (
          <div className="stack jobs-list">
            {filteredJobs.map((job) => (
              <JobCard key={job.job_id || job.id || job.title} job={job} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

export default JobsPage;
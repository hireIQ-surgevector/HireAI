import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "./PageShell";
import {
  CalendarDays,
  Users,
  X,
  BriefcaseBusiness,
  MapPin,
  Building2,
  Plus,
} from "lucide-react";

import { API_URL } from "../utils/auth";

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

      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/jobs`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
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
    const taskId = window.setTimeout(fetchJobs, 0);

    return () => window.clearTimeout(taskId);
  }, [fetchJobs]);

  /* =========================
     DATE FORMATTING
  ========================= */

  const formatDate = (dateString) => {
    if (!dateString) return null;

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  /* =========================
     JOB STATUS
  ========================= */

  const getJobStatusDetails = (dueDateStr) => {
    if (!dueDateStr) {
      return {
        label: "Active",
        badgeClass: "badge-green",
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0, 0, 0, 0);

    const difference = dueDate.getTime() - today.getTime();

    const daysRemaining = Math.ceil(difference / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return {
        label: "Expired",
        badgeClass: "badge-red",
      };
    }

    if (daysRemaining <= 14) {
      return {
        label: "Closing Soon",
        badgeClass: "badge-yellow",
      };
    }

    return {
      label: "Active",
      badgeClass: "badge-green",
    };
  };

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
     ACTIVE JOB COUNT
  ========================= */

  const activeJobsCount = useMemo(() => {
    return jobs.filter((job) => {
      const status = getJobStatusDetails(job.due_date).label;

      return status !== "Expired";
    }).length;
  }, [jobs]);

  const hasActiveFilters = selectedDept !== "All" || selectedStatus !== "All";

  const clearFilters = () => {
    setSelectedDept("All");
    setSelectedStatus("All");
  };

  return (
    <PageShell
      title="Job Openings"
      active="jobs"
      actions={
        <Link to="/post-job" className="btn btn-primary">
          + Post New Job
        </Link>
      }
    >
      <div className="jobs-page">
      <div className="jobs-intro">
        <div>
          <p className="jobs-eyebrow">RECRUITMENT WORKSPACE</p>
          <h2>Build the team you need</h2>
          <p>Track open roles, candidate flow, and hiring deadlines from one place.</p>
        </div>
        <div className="jobs-intro-mark"><BriefcaseBusiness size={28} /></div>
      </div>

      {!loading && jobs.length > 0 && (
        <div className="jobs-stat-strip">
          <div><span>Total openings</span><strong>{jobs.length}</strong></div>
          <div><span>Active roles</span><strong>{activeJobsCount}</strong></div>
          <div><span>Closing soon</span><strong>{jobs.filter((job) => getJobStatusDetails(job.due_date).label === "Closing Soon").length}</strong></div>
          <div><span>Departments</span><strong>{departments.length - 1}</strong></div>
        </div>
      )}

      {/* =========================
          HEADER / FILTER BAR
      ========================= */}

      {!loading && jobs.length > 0 && (
        <div className="jobs-toolbar">
          <div className="jobs-summary">
            <div className="jobs-summary-icon">
              <BriefcaseBusiness size={18} />
            </div>

            <div>
              <strong>{filteredJobs.length}</strong>

              <span> of {jobs.length} jobs</span>
            </div>
          </div>

          <div className="jobs-filters">
            {/* DEPARTMENT FILTER */}

            <div className="jobs-filter-group">
              <label htmlFor="dept-filter">Department</label>

              <select
                id="dept-filter"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="select-input"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* STATUS FILTER */}

            <div className="jobs-filter-group">
              <label htmlFor="status-filter">Status</label>

              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="select-input"
              >
                <option value="All">All Statuses</option>

                <option value="Active">Active</option>

                <option value="Closing Soon">Closing Soon</option>

                <option value="Expired">Expired</option>
              </select>
            </div>

            {/* CLEAR FILTERS */}

            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={clearFilters}
              >
                <X size={14} />
                Clear
              </button>
            )}
          </div>
        </div>
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
        <div className="jobs-empty-state">
          <div className="jobs-empty-icon">
            <BriefcaseBusiness size={30} />
          </div>

          <h3>No job openings yet</h3>

          <p>Get started by creating your first job opening.</p>

          <Link to="/post-job" className="btn btn-primary">
                <Plus size={15} />
                Post New Job
          </Link>
        </div>
      )}

      {/* =========================
          NO FILTER RESULTS
      ========================= */}

      {!loading && !error && jobs.length > 0 && filteredJobs.length === 0 && (
        <div className="jobs-empty-state">
          <div className="jobs-empty-icon">
            <BriefcaseBusiness size={30} />
          </div>

          <h3>No matching jobs</h3>

          <p>Try changing your filters.</p>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={clearFilters}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* =========================
          JOB LIST
      ========================= */}

      {!loading && !error && filteredJobs.length > 0 && (
        <div className="stack jobs-list">
          {filteredJobs.map((job) => {
            const jobId = job.job_id || job.id;

            const title = job.title || "Untitled Position";

            const department = job.department || "General";

            const location = job.location || "Remote";

            const candidateCount = job.candidate_count ?? job.count ?? 0;

            const formattedDueDate = formatDate(job.due_date);

            const statusInfo = getJobStatusDetails(job.due_date);

            const isExpired = statusInfo.label === "Expired";

            return (
              <div
                key={jobId || title}
                className={`card job-card ${
                  isExpired ? "job-card-expired" : ""
                }`}
              >
                <div className="job-main">
                  {/* JOB ICON */}

                  <div className="job-icon">
                    <BriefcaseBusiness size={22} />
                  </div>

                  {/* JOB DETAILS */}

                  <div className="job-body">
                    <div className="job-title-row">
                      <div>
                        <h3>{title}</h3>
                      </div>

                      <span className={`badge ${statusInfo.badgeClass}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* META */}

                    <div className="job-meta">
                      <span>
                        <Building2 size={14} />
                        {department}
                      </span>

                      <span>
                        <MapPin size={14} />
                        {location}
                      </span>

                      <span>
                        <Users size={14} />
                        {candidateCount}{" "}
                        {candidateCount === 1 ? "candidate" : "candidates"}
                      </span>

                      <span>
                        <CalendarDays size={14} />

                        {formattedDueDate
                          ? `Target: ${formattedDueDate}`
                          : "No target date"}
                      </span>
                    </div>
                  </div>

                  {/* ACTIONS */}

                  <div className="job-actions">
                    <Link
                      to={`/jobs/${jobId}/candidates`}
                      className="btn btn-secondary btn-sm"
                    >
                      View Candidates
                    </Link>

                    <Link
                      to={`/edit-job/${jobId}`}
                      className="btn btn-ghost btn-sm"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </PageShell>
  );
}

export default JobsPage;

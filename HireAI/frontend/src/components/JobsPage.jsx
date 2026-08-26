import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import PageShell from "./PageShell";
import { CalendarDays, Users, X } from "lucide-react";

const CandidatesIcon = (props) => <Users {...props} />;
const CalendarIcon = (props) => <CalendarDays {...props} />;

function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter state
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5001/api/jobs", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch jobs from database.");
      }

      const data = await response.json();
      const jobList = Array.isArray(data) ? data : data.jobs || [];
      setJobs(jobList);
    } catch (err) {
      console.error("Error loading jobs:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Helper to calculate job status and badge style dynamically based on due date
  const getJobStatusDetails = (dueDateStr) => {
    if (!dueDateStr) {
      return { label: "Active", badgeClass: "badge-green" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: "Expired", badgeClass: "badge-red" };
    } else if (diffDays <= 14) {
      return { label: "Closing Soon", badgeClass: "badge-yellow" };
    } else {
      return { label: "Active", badgeClass: "badge-green" };
    }
  };

  // Dynamically extract unique departments from jobs list
  const departments = useMemo(() => {
    const depts = new Set(jobs.map((j) => j.department).filter(Boolean));
    return ["All", ...Array.from(depts)];
  }, [jobs]);

  // Filter jobs dynamically based on selected filters
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Department Filter
      const deptMatch =
        selectedDept === "All" ||
        (job.department || "").toLowerCase() === selectedDept.toLowerCase();

      // Status Tag Filter
      const statusDetails = getJobStatusDetails(job.due_date);
      const statusMatch =
        selectedStatus === "All" ||
        statusDetails.label.toLowerCase() === selectedStatus.toLowerCase();

      return deptMatch && statusMatch;
    });
  }, [jobs, selectedDept, selectedStatus]);

  const hasActiveFilters = selectedDept !== "All" || selectedStatus !== "All";

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
      {/* Dynamic Header Toolbar: Counts + Single-Line Inline Filters */}
      {!loading && jobs.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "20px",
            padding: "12px 16px",
            background: "var(--bg-surface, #f9fafb)",
            borderRadius: "8px",
            border: "1px solid var(--border-color, #e5e7eb)",
          }}
        >
          {/* Job Count Indicator */}
          <div
            style={{
              fontSize: "14px",
              fontWeight: "500",
              color: "var(--muted)",
            }}
          >
            Showing <strong>{filteredJobs.length}</strong> of{" "}
            <strong>{jobs.length}</strong> open positions
          </div>

          {/* Single-Line Controls Group */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {/* Department Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <label
                htmlFor="dept-filter"
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "var(--muted)",
                }}
              >
                Department:
              </label>
              <select
                id="dept-filter"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="select-input"
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  border: "1px solid var(--border-color, #d1d5db)",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <label
                htmlFor="status-filter"
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "var(--muted)",
                }}
              >
                Status:
              </label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="select-input"
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  border: "1px solid var(--border-color, #d1d5db)",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                {["All", "Active", "Closing Soon", "Expired"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button (Shows only when filters are active) */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDept("All");
                  setSelectedStatus("All");
                }}
                className="btn btn-ghost btn-sm"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  color: "var(--muted)",
                  fontSize: "12px",
                  padding: "4px 8px",
                }}
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="card" style={{ padding: "24px", textAlign: "center" }}>
          Loading jobs...
        </div>
      )}

      {error && (
        <div className="error-box" style={{ marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {!loading && jobs.length === 0 && !error && (
        <div className="card" style={{ padding: "32px", textAlign: "center" }}>
          <h3>No jobs found</h3>
          <p className="muted" style={{ marginBottom: "16px" }}>
            Get started by posting your first job opening.
          </p>
          <Link to="/post-job" className="btn btn-primary">
            + Post New Job
          </Link>
        </div>
      )}

      {!loading && jobs.length > 0 && filteredJobs.length === 0 && (
        <div className="card" style={{ padding: "32px", textAlign: "center" }}>
          <h3>No matching jobs</h3>
          <p className="muted" style={{ marginBottom: "16px" }}>
            Try adjusting your department or status filters.
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSelectedDept("All");
              setSelectedStatus("All");
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      <div className="stack">
        {filteredJobs.map((job) => {
          const jobId = job.job_id || job.id;
          const title = job.title || "Untitled Position";
          const department = job.department || "General";
          const location = job.location || "Remote";
          const candidateCount = job.candidate_count ?? job.count ?? 0;
          const postedDate = formatDate(job.created_at) || "Recently";
          const formattedDueDate = formatDate(job.due_date);

          const statusInfo = getJobStatusDetails(job.due_date);
          const isExpired = statusInfo.label === "Expired";

          return (
            <div key={jobId || title} className="card job-card">
              <div className="job-main">
                <div className="job-icon">💼</div>
                <div className="job-body">
                  <div
                    className="job-title-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <h3 style={{ margin: 0 }}>{title}</h3>
                    {/* <span className={`badge ${statusInfo.badgeClass}`}>
                      {statusInfo.label}
                    </span> */}
                    {!isExpired && (
                      <span className={`badge ${statusInfo.badgeClass}`}>
                        {statusInfo.label}
                      </span>
                    )}
                  </div>

                  <div
                    className="job-meta"
                    style={{
                      marginTop: "8px",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "16px",
                    }}
                  >
                    <span>🏢 {department}</span>
                    <span>📍 {location}</span>
                    <span>
                      <CandidatesIcon size={13} /> {candidateCount} candidates
                      in pipeline
                    </span>

                    {formattedDueDate ? (
                      <span>
                        <CalendarIcon size={13} /> Target Fill Date:{" "}
                        {formattedDueDate}
                      </span>
                    ) : (
                      <span>
                        <CalendarIcon size={13} /> No Target Date Set
                      </span>
                    )}
                  </div>
                </div>

                <div className="job-actions">
                  {isExpired ? (
                    <span className={`badge ${statusInfo.badgeClass}`}>
                      {statusInfo.label}
                    </span>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}

export default JobsPage;

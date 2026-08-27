// import React, { useState, useEffect, useMemo } from "react";
// import { Link } from "react-router-dom";
// import PageShell from "./PageShell";
// import { CalendarDays, Users, X } from "lucide-react";

// const CandidatesIcon = (props) => <Users {...props} />;
// const CalendarIcon = (props) => <CalendarDays {...props} />;

// function JobsPage() {
//   const [jobs, setJobs] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // Filter state
//   const [selectedDept, setSelectedDept] = useState("All");
//   const [selectedStatus, setSelectedStatus] = useState("All");

//   useEffect(() => {
//     fetchJobs();
//   }, []);

//   const fetchJobs = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem("token");

//       const response = await fetch("http://localhost:5001/api/jobs", {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: token ? `Bearer ${token}` : "",
//         },
//       });

//       if (!response.ok) {
//         throw new Error("Failed to fetch jobs from database.");
//       }

//       const data = await response.json();
//       const jobList = Array.isArray(data) ? data : data.jobs || [];
//       setJobs(jobList);
//     } catch (err) {
//       console.error("Error loading jobs:", err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Format date helper
//   const formatDate = (dateString) => {
//     if (!dateString) return null;
//     const date = new Date(dateString);
//     if (isNaN(date.getTime())) return null;
//     return date.toLocaleDateString("en-US", {
//       month: "short",
//       day: "numeric",
//       year: "numeric",
//     });
//   };

//   // Helper to calculate job status and badge style dynamically based on due date
//   const getJobStatusDetails = (dueDateStr) => {
//     if (!dueDateStr) {
//       return { label: "Active", badgeClass: "badge-green" };
//     }

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const dueDate = new Date(dueDateStr);
//     dueDate.setHours(0, 0, 0, 0);

//     const diffTime = dueDate.getTime() - today.getTime();
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

//     if (diffDays < 0) {
//       return { label: "Expired", badgeClass: "badge-red" };
//     } else if (diffDays <= 14) {
//       return { label: "Closing Soon", badgeClass: "badge-yellow" };
//     } else {
//       return { label: "Active", badgeClass: "badge-green" };
//     }
//   };

//   // Dynamically extract unique departments from jobs list
//   const departments = useMemo(() => {
//     const depts = new Set(jobs.map((j) => j.department).filter(Boolean));
//     return ["All", ...Array.from(depts)];
//   }, [jobs]);

//   // Filter jobs dynamically based on selected filters
//   const filteredJobs = useMemo(() => {
//     return jobs.filter((job) => {
//       // Department Filter
//       const deptMatch =
//         selectedDept === "All" ||
//         (job.department || "").toLowerCase() === selectedDept.toLowerCase();

//       // Status Tag Filter
//       const statusDetails = getJobStatusDetails(job.due_date);
//       const statusMatch =
//         selectedStatus === "All" ||
//         statusDetails.label.toLowerCase() === selectedStatus.toLowerCase();

//       return deptMatch && statusMatch;
//     });
//   }, [jobs, selectedDept, selectedStatus]);

//   const hasActiveFilters = selectedDept !== "All" || selectedStatus !== "All";

//   return (
//     <PageShell
//       title="Job Openings"
//       active="jobs"
//       actions={
//         <Link to="/post-job" className="btn btn-primary">
//           + Post New Job
//         </Link>
//       }
//     >
//       {/* Dynamic Header Toolbar: Counts + Single-Line Inline Filters */}
//       {!loading && jobs.length > 0 && (
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             flexWrap: "wrap",
//             gap: "12px",
//             marginBottom: "20px",
//             padding: "12px 16px",
//             background: "var(--bg-surface, #f9fafb)",
//             borderRadius: "8px",
//             border: "1px solid var(--border-color, #e5e7eb)",
//           }}
//         >
//           {/* Job Count Indicator */}
//           <div
//             style={{
//               fontSize: "14px",
//               fontWeight: "500",
//               color: "var(--muted)",
//             }}
//           >
//             Showing <strong>{filteredJobs.length}</strong> of{" "}
//             <strong>{jobs.length}</strong> open positions
//           </div>

//           {/* Single-Line Controls Group */}
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: "12px",
//               flexWrap: "wrap",
//             }}
//           >
//             {/* Department Selector */}
//             <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
//               <label
//                 htmlFor="dept-filter"
//                 style={{
//                   fontSize: "12px",
//                   fontWeight: "600",
//                   color: "var(--muted)",
//                 }}
//               >
//                 Department:
//               </label>
//               <select
//                 id="dept-filter"
//                 value={selectedDept}
//                 onChange={(e) => setSelectedDept(e.target.value)}
//                 className="select-input"
//                 style={{
//                   padding: "6px 10px",
//                   borderRadius: "6px",
//                   fontSize: "13px",
//                   border: "1px solid var(--border-color, #d1d5db)",
//                   background: "#fff",
//                   cursor: "pointer",
//                 }}
//               >
//                 {departments.map((dept) => (
//                   <option key={dept} value={dept}>
//                     {dept}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Status Selector */}
//             <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
//               <label
//                 htmlFor="status-filter"
//                 style={{
//                   fontSize: "12px",
//                   fontWeight: "600",
//                   color: "var(--muted)",
//                 }}
//               >
//                 Status:
//               </label>
//               <select
//                 id="status-filter"
//                 value={selectedStatus}
//                 onChange={(e) => setSelectedStatus(e.target.value)}
//                 className="select-input"
//                 style={{
//                   padding: "6px 10px",
//                   borderRadius: "6px",
//                   fontSize: "13px",
//                   border: "1px solid var(--border-color, #d1d5db)",
//                   background: "#fff",
//                   cursor: "pointer",
//                 }}
//               >
//                 {["All", "Active", "Closing Soon", "Expired"].map((status) => (
//                   <option key={status} value={status}>
//                     {status}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Clear Filters Button (Shows only when filters are active) */}
//             {hasActiveFilters && (
//               <button
//                 type="button"
//                 onClick={() => {
//                   setSelectedDept("All");
//                   setSelectedStatus("All");
//                 }}
//                 className="btn btn-ghost btn-sm"
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: "4px",
//                   color: "var(--muted)",
//                   fontSize: "12px",
//                   padding: "4px 8px",
//                 }}
//               >
//                 <X size={14} /> Clear
//               </button>
//             )}
//           </div>
//         </div>
//       )}

//       {loading && (
//         <div className="card" style={{ padding: "24px", textAlign: "center" }}>
//           Loading jobs...
//         </div>
//       )}

//       {error && (
//         <div className="error-box" style={{ marginBottom: "16px" }}>
//           {error}
//         </div>
//       )}

//       {!loading && jobs.length === 0 && !error && (
//         <div className="card" style={{ padding: "32px", textAlign: "center" }}>
//           <h3>No jobs found</h3>
//           <p className="muted" style={{ marginBottom: "16px" }}>
//             Get started by posting your first job opening.
//           </p>
//           <Link to="/post-job" className="btn btn-primary">
//             + Post New Job
//           </Link>
//         </div>
//       )}

//       {!loading && jobs.length > 0 && filteredJobs.length === 0 && (
//         <div className="card" style={{ padding: "32px", textAlign: "center" }}>
//           <h3>No matching jobs</h3>
//           <p className="muted" style={{ marginBottom: "16px" }}>
//             Try adjusting your department or status filters.
//           </p>
//           <button
//             type="button"
//             className="btn btn-secondary btn-sm"
//             onClick={() => {
//               setSelectedDept("All");
//               setSelectedStatus("All");
//             }}
//           >
//             Reset Filters
//           </button>
//         </div>
//       )}

//       <div className="stack">
//         {filteredJobs.map((job) => {
//           const jobId = job.job_id || job.id;
//           const title = job.title || "Untitled Position";
//           const department = job.department || "General";
//           const location = job.location || "Remote";
//           const candidateCount = job.candidate_count ?? job.count ?? 0;
//           const postedDate = formatDate(job.created_at) || "Recently";
//           const formattedDueDate = formatDate(job.due_date);

//           const statusInfo = getJobStatusDetails(job.due_date);
//           const isExpired = statusInfo.label === "Expired";

//           return (
//             <div key={jobId || title} className="card job-card">
//               <div className="job-main">
//                 <div className="job-icon">💼</div>
//                 <div className="job-body">
//                   <div
//                     className="job-title-row"
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       gap: "12px",
//                     }}
//                   >
//                     <h3 style={{ margin: 0 }}>{title}</h3>
//                     {/* <span className={`badge ${statusInfo.badgeClass}`}>
//                       {statusInfo.label}
//                     </span> */}
//                     {!isExpired && (
//                       <span className={`badge ${statusInfo.badgeClass}`}>
//                         {statusInfo.label}
//                       </span>
//                     )}
//                   </div>

//                   <div
//                     className="job-meta"
//                     style={{
//                       marginTop: "8px",
//                       display: "flex",
//                       flexWrap: "wrap",
//                       gap: "16px",
//                     }}
//                   >
//                     <span>🏢 {department}</span>
//                     <span>📍 {location}</span>
//                     <span>
//                       <CandidatesIcon size={13} /> {candidateCount} candidates
//                       in pipeline
//                     </span>

//                     {formattedDueDate ? (
//                       <span>
//                         <CalendarIcon size={13} /> Target Fill Date:{" "}
//                         {formattedDueDate}
//                       </span>
//                     ) : (
//                       <span>
//                         <CalendarIcon size={13} /> No Target Date Set
//                       </span>
//                     )}
//                   </div>
//                 </div>

//                 <div className="job-actions">
//                   {isExpired ? (
//                     <span className={`badge ${statusInfo.badgeClass}`}>
//                       {statusInfo.label}
//                     </span>
//                   ) : (
//                     <>
//                       <Link
//                         to={`/jobs/${jobId}/candidates`}
//                         className="btn btn-secondary btn-sm"
//                       >
//                         View Candidates
//                       </Link>
//                       <Link
//                         to={`/edit-job/${jobId}`}
//                         className="btn btn-ghost btn-sm"
//                       >
//                         Edit
//                       </Link>
//                     </>
//                   )}
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </PageShell>
//   );
// }

// export default JobsPage;



import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "./PageShell";
import {
  CalendarDays,
  Users,
  X,
  BriefcaseBusiness,
  MapPin,
  Building2,
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

      setJobs(
        Array.isArray(data)
          ? data
          : data.jobs || []
      );
    } catch (err) {
      console.error("Error loading jobs:", err);

      setError(
        err.message ||
          "Unable to load jobs. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
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

    const difference =
      dueDate.getTime() -
      today.getTime();

    const daysRemaining = Math.ceil(
      difference /
        (1000 * 60 * 60 * 24)
    );

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
      ...new Set(
        jobs
          .map((job) => job.department)
          .filter(Boolean)
      ),
    ];

    return [
      "All",
      ...uniqueDepartments.sort(),
    ];
  }, [jobs]);

  /* =========================
     FILTERED JOBS
  ========================= */

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const departmentMatches =
        selectedDept === "All" ||
        (job.department || "")
          .toLowerCase()
          .trim() ===
          selectedDept
            .toLowerCase()
            .trim();

      const status =
        getJobStatusDetails(
          job.due_date
        ).label;

      const statusMatches =
        selectedStatus === "All" ||
        status === selectedStatus;

      return (
        departmentMatches &&
        statusMatches
      );
    });
  }, [
    jobs,
    selectedDept,
    selectedStatus,
  ]);

  /* =========================
     ACTIVE JOB COUNT
  ========================= */

  const activeJobsCount = useMemo(() => {
    return jobs.filter((job) => {
      const status =
        getJobStatusDetails(
          job.due_date
        ).label;

      return status !== "Expired";
    }).length;
  }, [jobs]);

  const hasActiveFilters =
    selectedDept !== "All" ||
    selectedStatus !== "All";

  const clearFilters = () => {
    setSelectedDept("All");
    setSelectedStatus("All");
  };

  return (
    <PageShell
      title="Job Openings"
      active="jobs"
      actions={
        <Link
          to="/post-job"
          className="btn btn-primary"
        >
          + Post New Job
        </Link>
      }
    >
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
              <strong>
                {filteredJobs.length}
              </strong>

              <span>
                {" "}of {jobs.length} jobs
              </span>
            </div>
          </div>

          <div className="jobs-filters">

            {/* DEPARTMENT FILTER */}

            <div className="jobs-filter-group">
              <label htmlFor="dept-filter">
                Department
              </label>

              <select
                id="dept-filter"
                value={selectedDept}
                onChange={(e) =>
                  setSelectedDept(
                    e.target.value
                  )
                }
                className="select-input"
              >
                {departments.map((dept) => (
                  <option
                    key={dept}
                    value={dept}
                  >
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* STATUS FILTER */}

            <div className="jobs-filter-group">
              <label htmlFor="status-filter">
                Status
              </label>

              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(
                    e.target.value
                  )
                }
                className="select-input"
              >
                <option value="All">
                  All Statuses
                </option>

                <option value="Active">
                  Active
                </option>

                <option value="Closing Soon">
                  Closing Soon
                </option>

                <option value="Expired">
                  Expired
                </option>
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

          <p>
            Loading job openings...
          </p>
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

      {!loading &&
        !error &&
        jobs.length === 0 && (
          <div className="jobs-empty-state">

            <div className="jobs-empty-icon">
              <BriefcaseBusiness size={30} />
            </div>

            <h3>
              No job openings yet
            </h3>

            <p>
              Get started by creating your
              first job opening.
            </p>

            <Link
              to="/post-job"
              className="btn btn-primary"
            >
              + Post New Job
            </Link>

          </div>
        )}

      {/* =========================
          NO FILTER RESULTS
      ========================= */}

      {!loading &&
        !error &&
        jobs.length > 0 &&
        filteredJobs.length === 0 && (
          <div className="jobs-empty-state">

            <div className="jobs-empty-icon">
              <BriefcaseBusiness size={30} />
            </div>

            <h3>
              No matching jobs
            </h3>

            <p>
              Try changing your filters.
            </p>

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

      {!loading &&
        !error &&
        filteredJobs.length > 0 && (
          <div className="stack">

            {filteredJobs.map((job) => {
              const jobId =
                job.job_id || job.id;

              const title =
                job.title ||
                "Untitled Position";

              const department =
                job.department ||
                "General";

              const location =
                job.location ||
                "Remote";

              const candidateCount =
                job.candidate_count ??
                job.count ??
                0;

              const postedDate =
                formatDate(
                  job.created_at
                ) || "Recently";

              const formattedDueDate =
                formatDate(
                  job.due_date
                );

              const statusInfo =
                getJobStatusDetails(
                  job.due_date
                );

              const isExpired =
                statusInfo.label ===
                "Expired";

              return (
                <div
                  key={jobId || title}
                  className={`card job-card ${
                    isExpired
                      ? "job-card-expired"
                      : ""
                  }`}
                >

                  <div className="job-main">

                    {/* JOB ICON */}

                    <div className="job-icon">
                      <BriefcaseBusiness
                        size={22}
                      />
                    </div>

                    {/* JOB DETAILS */}

                    <div className="job-body">

                      <div className="job-title-row">

                        <div>
                          <h3>
                            {title}
                          </h3>
                        </div>

                        <span
                          className={`badge ${statusInfo.badgeClass}`}
                        >
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
                          {candidateCount === 1
                            ? "candidate"
                            : "candidates"}
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

                      {isExpired ? (

                        <span className="job-expired-text">
                          This job is no longer active
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
        )}

    </PageShell>
  );
}

export default JobsPage;
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../components/PageShell";
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
        badgeClass: "[background:#dcfce7] [color:#166534]",
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0, 0, 0, 0);

    const difference = dueDate.getTime() - today.getTime();

    const daysRemaining = Math.ceil(difference / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) { return { label: "Overdue", badgeClass: "[background:#fee2e2] [color:#991b1b]", }; }

    if (daysRemaining <= 14) {
      return {
        label: "Closing Soon",
        badgeClass: "[background:#fef9c3] [color:#78350f]",
      };
    }

    return {
      label: "Active",
      badgeClass: "[background:#dcfce7] [color:#166534]",
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

  const activeJobsCount = useMemo(() => { return jobs.filter((job) => { const status = getJobStatusDetails(job.due_date).label; return status !== "Overdue"; }).length; }, [jobs]);

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
        <Link to="/post-job" className="btn btn-primary [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#133f7d] [color:#fff]">
          + Post New Job
        </Link>
      }
    >
      <div className="jobs-page [max-width:1180px] [margin:0_auto]">
      <div className="jobs-intro [display:flex] [justify-content:space-between] [align-items:center] [gap:24px] [margin-bottom:18px] [padding:24px_26px] [border:1px_solid_#d8e5f5] [border-radius:14px] [background:linear-gradient(115deg,_#eef5ff_0%,_#f8fbff_58%,_#e8f7f5_100%)] max-[768px]:[align-items:flex-start] max-[768px]:[padding:20px]">
        <div>
          <p className="jobs-eyebrow [margin-bottom:7px] [color:#00b4d8] [font-size:10px] [font-weight:800] [letter-spacing:1.2px] last:[.jobs-intro_&]:[margin:0] last:[.jobs-intro_&]:[color:#64748b] last:[.jobs-intro_&]:[font-size:13px]">RECRUITMENT WORKSPACE</p>
          <h2 className="[.jobs-intro_&]:[margin:0_0_5px] [.jobs-intro_&]:[color:#1e293b] [.jobs-intro_&]:[font-size:23px] [.jobs-intro_&]:[font-weight:800]">Build the team you need</h2>
          <p className="last:[.jobs-intro_&]:[margin:0] last:[.jobs-intro_&]:[color:#64748b] last:[.jobs-intro_&]:[font-size:13px]">Track open roles, candidate flow, and hiring deadlines from one place.</p>
        </div>
        <div className="jobs-intro-mark [width:64px] [height:64px] [display:flex] [align-items:center] [justify-content:center] [flex-shrink:0] [border-radius:16px] [background:#133f7d] [color:#fff] [box-shadow:0_8px_18px_rgba(19,_63,_125,_0.18)] max-[520px]:[width:48px] max-[520px]:[height:48px] max-[520px]:[border-radius:12px]"><BriefcaseBusiness size={28} /></div>
      </div>

      {!loading && jobs.length > 0 && (
        <div className="jobs-stat-strip [display:grid] [grid-template-columns:repeat(4,_1fr)] [gap:12px] [margin-bottom:18px] max-[768px]:[grid-template-columns:repeat(2,_1fr)] max-[520px]:[grid-template-columns:1fr_1fr]">
          <div className="[.jobs-stat-strip_&]:[display:flex] [.jobs-stat-strip_&]:[align-items:center] [.jobs-stat-strip_&]:[justify-content:space-between] [.jobs-stat-strip_&]:[padding:14px_16px] [.jobs-stat-strip_&]:[border:1px_solid_#e2e8f0] [.jobs-stat-strip_&]:[border-radius:10px] [.jobs-stat-strip_&]:[background:#fff]"><span className="[.jobs-stat-strip_&]:[color:#64748b] [.jobs-stat-strip_&]:[font-size:11px] [.jobs-stat-strip_&]:[font-weight:700] [.jobs-stat-strip_&]:[text-transform:uppercase] [.jobs-stat-strip_&]:[letter-spacing:.4px]">Total openings</span><strong className="[font-weight:700] [.jobs-stat-strip_&]:[color:#1e293b] [.jobs-stat-strip_&]:[font-size:23px] [.jobs-stat-strip_&]:[line-height:1]">{jobs.length}</strong></div>
          <div className="[.jobs-stat-strip_&]:[display:flex] [.jobs-stat-strip_&]:[align-items:center] [.jobs-stat-strip_&]:[justify-content:space-between] [.jobs-stat-strip_&]:[padding:14px_16px] [.jobs-stat-strip_&]:[border:1px_solid_#e2e8f0] [.jobs-stat-strip_&]:[border-radius:10px] [.jobs-stat-strip_&]:[background:#fff]"><span className="[.jobs-stat-strip_&]:[color:#64748b] [.jobs-stat-strip_&]:[font-size:11px] [.jobs-stat-strip_&]:[font-weight:700] [.jobs-stat-strip_&]:[text-transform:uppercase] [.jobs-stat-strip_&]:[letter-spacing:.4px]">Active roles</span><strong className="[font-weight:700] [.jobs-stat-strip_&]:[color:#1e293b] [.jobs-stat-strip_&]:[font-size:23px] [.jobs-stat-strip_&]:[line-height:1]">{activeJobsCount}</strong></div>
          <div className="[.jobs-stat-strip_&]:[display:flex] [.jobs-stat-strip_&]:[align-items:center] [.jobs-stat-strip_&]:[justify-content:space-between] [.jobs-stat-strip_&]:[padding:14px_16px] [.jobs-stat-strip_&]:[border:1px_solid_#e2e8f0] [.jobs-stat-strip_&]:[border-radius:10px] [.jobs-stat-strip_&]:[background:#fff]"><span className="[.jobs-stat-strip_&]:[color:#64748b] [.jobs-stat-strip_&]:[font-size:11px] [.jobs-stat-strip_&]:[font-weight:700] [.jobs-stat-strip_&]:[text-transform:uppercase] [.jobs-stat-strip_&]:[letter-spacing:.4px]">Closing soon</span><strong className="[font-weight:700] [.jobs-stat-strip_&]:[color:#1e293b] [.jobs-stat-strip_&]:[font-size:23px] [.jobs-stat-strip_&]:[line-height:1]">{jobs.filter((job) => getJobStatusDetails(job.due_date).label === "Closing Soon").length}</strong></div>
          <div className="[.jobs-stat-strip_&]:[display:flex] [.jobs-stat-strip_&]:[align-items:center] [.jobs-stat-strip_&]:[justify-content:space-between] [.jobs-stat-strip_&]:[padding:14px_16px] [.jobs-stat-strip_&]:[border:1px_solid_#e2e8f0] [.jobs-stat-strip_&]:[border-radius:10px] [.jobs-stat-strip_&]:[background:#fff]"><span className="[.jobs-stat-strip_&]:[color:#64748b] [.jobs-stat-strip_&]:[font-size:11px] [.jobs-stat-strip_&]:[font-weight:700] [.jobs-stat-strip_&]:[text-transform:uppercase] [.jobs-stat-strip_&]:[letter-spacing:.4px]">Departments</span><strong className="[font-weight:700] [.jobs-stat-strip_&]:[color:#1e293b] [.jobs-stat-strip_&]:[font-size:23px] [.jobs-stat-strip_&]:[line-height:1]">{departments.length - 1}</strong></div>
        </div>
      )}

      {/* =========================
          HEADER / FILTER BAR
      ========================= */}

      {!loading && jobs.length > 0 && (
        <div className="jobs-toolbar [display:flex] [align-items:center] [justify-content:space-between] [gap:20px] [flex-wrap:wrap] [margin-bottom:20px] [padding:16px] [background:initial] [border:1px_solid_initial] [border-radius:10px] max-[768px]:[align-items:stretch]">
          <div className="jobs-summary [display:flex] [align-items:center] [gap:12px]">
            <div className="jobs-summary-icon [display:flex] [align-items:center] [justify-content:center] [width:38px] [height:38px] [border-radius:8px] [background:#e8f0fb] [color:#133f7d]">
              <BriefcaseBusiness size={18} />
            </div>

            <div>
              <strong className="[font-weight:700]">{filteredJobs.length}</strong>

              <span> of {jobs.length} jobs</span>
            </div>
          </div>

          <div className="jobs-filters [display:flex] [align-items:flex-end] [gap:12px] [flex-wrap:wrap] max-[768px]:[width:100%]">
            {/* DEPARTMENT FILTER */}

            <div className="jobs-filter-group [display:flex] [flex-direction:column] [gap:5px]">
              <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold] [.jobs-filter-group_&]:[font-size:12px] [.jobs-filter-group_&]:[font-weight:600] [.jobs-filter-group_&]:[color:#64748b]" htmlFor="dept-filter">Department</label>

              <select
                id="dept-filter"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="select-input [font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* STATUS FILTER */}

            <div className="jobs-filter-group [display:flex] [flex-direction:column] [gap:5px]">
              <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold] [.jobs-filter-group_&]:[font-size:12px] [.jobs-filter-group_&]:[font-weight:600] [.jobs-filter-group_&]:[color:#64748b]" htmlFor="status-filter">Status</label>

              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="select-input [font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]"
              >
                <option value="All">All Statuses</option>

                <option value="Active">Active</option>

                <option value="Closing Soon">Closing Soon</option>

                <option value="Overdue">Overdue</option>
              </select>
            </div>

            {/* CLEAR FILTERS */}

            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-ghost btn-sm [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:transparent] [color:#64748b] [border:1px_solid_#e2e8f0] [padding:6px_14px] [font-size:12px]"
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
        <div className="jobs-loading [padding:48px_24px] [text-align:center] [background:initial] [border:1px_solid_initial] [border-radius:12px]">
          <div className="loading-spinner [width:30px] [height:30px] [border:3px_solid_#e2e8f0] [border-top-color:#133f7d] [border-radius:50%] animate-spin" />

          <p>Loading job openings...</p>
        </div>
      )}

      {/* =========================
          ERROR
      ========================= */}

      {!loading && error && (
        <div className="error-box [background:#fee2e2] [color:#991b1b] [padding:10px] [border-radius:8px] [font-size:12px] [margin-bottom:10px]">
          <p>{error}</p>

          <button
            type="button"
            className="btn btn-primary btn-sm [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#133f7d] [color:#fff] [padding:6px_14px] [font-size:12px]"
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
        <div className="jobs-empty-state [padding:48px_24px] [text-align:center] [background:initial] [border:1px_solid_initial] [border-radius:12px]">
          <div className="jobs-empty-icon [display:inline-flex] [align-items:center] [justify-content:center] [width:58px] [height:58px] [margin-bottom:16px] [border-radius:50%] [background:#e8f0fb] [color:#133f7d]">
            <BriefcaseBusiness size={30} />
          </div>

          <h3>No job openings yet</h3>

          <p>Get started by creating your first job opening.</p>

          <Link to="/post-job" className="btn btn-primary [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#133f7d] [color:#fff]">
                <Plus size={15} />
                Post New Job
          </Link>
        </div>
      )}

      {/* =========================
          NO FILTER RESULTS
      ========================= */}

      {!loading && !error && jobs.length > 0 && filteredJobs.length === 0 && (
        <div className="jobs-empty-state [padding:48px_24px] [text-align:center] [background:initial] [border:1px_solid_initial] [border-radius:12px]">
          <div className="jobs-empty-icon [display:inline-flex] [align-items:center] [justify-content:center] [width:58px] [height:58px] [margin-bottom:16px] [border-radius:50%] [background:#e8f0fb] [color:#133f7d]">
            <BriefcaseBusiness size={30} />
          </div>

          <h3>No matching jobs</h3>

          <p>Try changing your filters.</p>

          <button
            type="button"
            className="btn btn-secondary [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#fff] [color:#133f7d] [border:1.5px_solid_#133f7d]"
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
        <div className="stack jobs-list [gap:12px]">
          {filteredJobs.map((job) => {
            const jobId = job.job_id || job.id;

            const title = job.title || "Untitled Position";

            const department = job.department || "General";

            const location = job.location || "Remote";

            const candidateCount = job.candidate_count ?? job.count ?? 0;

            const formattedDueDate = formatDate(job.due_date);

            const statusInfo = getJobStatusDetails(job.due_date);

            const isExpired = statusInfo.label === "Overdue";

            return (
              <div
                key={jobId || title}
                className={`${(`card job-card ${
                  isExpired ? "job-card-expired" : ""
                }`)} [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [padding:18px] [.jobs-list_&]:[border-radius:12px] [.jobs-list_&]:[padding:20px] [.jobs-list_&]:[box-shadow:0_2px_8px_rgba(15,_23,_42,_0.03)] hover:[.jobs-list_&]:[border-color:#bfd2eb] hover:[.jobs-list_&]:[box-shadow:0_8px_22px_rgba(19,_63,_125,_0.09)] [transition:transform_0.2s_ease,_box-shadow_0.2s_ease] hover:[transform:translateY(-2px)] [&.job-card-expired]:[opacity:0.8]`}
              >
                <div className="job-main [display:flex] [align-items:center] [gap:14px]">
                  {/* JOB ICON */}

                  <div className="job-icon [width:46px] [height:46px] [border-radius:10px] [background:#e8f0fb] [display:flex] [align-items:center] [justify-content:center] [font-size:20px]">
                    <BriefcaseBusiness size={22} />
                  </div>

                  {/* JOB DETAILS */}

                  <div className="job-body [flex:1]">
                    <div className="job-title-row [display:flex] [align-items:center] [gap:10px] [margin-bottom:4px] [align-items:flex-start] [justify-content:space-between] [gap:16px] max-[768px]:[align-items:flex-start]">
                      <div>
                        <h3 className="[.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px] [.job-title-row_&]:[margin:0] [.job-title-row_&]:[font-size:14px] [.job-title-row_&]:[font-weight:700] [.job-title-row_&]:[color:#1e293b]">{title}</h3>
                      </div>

                      <span className={`${(`badge ${statusInfo.badgeClass}`)} [font-size:11px] [font-weight:700] [padding:3px_9px] [border-radius:20px] [white-space:nowrap] [display:inline-block]`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* META */}

                    <div className="job-meta [display:flex] [gap:14px] [font-size:12px] [color:#64748b] [flex-wrap:wrap] [gap:16px] [margin-top:14px] max-[768px]:[gap:10px]">
                      <span className="[.job-meta_&]:[display:inline-flex] [.job-meta_&]:[align-items:center] [.job-meta_&]:[gap:6px] [.job-meta_&]:[color:#64748b] [.job-meta_&]:[font-size:13px]">
                        <Building2 size={14} />
                        {department}
                      </span>

                      <span className="[.job-meta_&]:[display:inline-flex] [.job-meta_&]:[align-items:center] [.job-meta_&]:[gap:6px] [.job-meta_&]:[color:#64748b] [.job-meta_&]:[font-size:13px]">
                        <MapPin size={14} />
                        {location}
                      </span>

                      <span className="[.job-meta_&]:[display:inline-flex] [.job-meta_&]:[align-items:center] [.job-meta_&]:[gap:6px] [.job-meta_&]:[color:#64748b] [.job-meta_&]:[font-size:13px]">
                        <Users size={14} />
                        {candidateCount}{" "}
                        {candidateCount === 1 ? "candidate" : "candidates"}
                      </span>

                      <span className="[.job-meta_&]:[display:inline-flex] [.job-meta_&]:[align-items:center] [.job-meta_&]:[gap:6px] [.job-meta_&]:[color:#64748b] [.job-meta_&]:[font-size:13px]">
                        <CalendarDays size={14} />

                        {formattedDueDate
                          ? `Target: ${formattedDueDate}`
                          : "No target date"}
                      </span>
                    </div>
                  </div>

                  {/* ACTIONS */}

                  <div className="job-actions [display:flex] [gap:8px]">
                    <Link
                      to={`/jobs/${jobId}/candidates`}
                      className="btn btn-secondary btn-sm [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#fff] [color:#133f7d] [border:1.5px_solid_#133f7d] [padding:6px_14px] [font-size:12px]"
                    >
                      View Candidates
                    </Link>

                    <Link
                      to={`/edit-job/${jobId}`}
                      className="btn btn-ghost btn-sm [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:transparent] [color:#64748b] [border:1px_solid_#e2e8f0] [padding:6px_14px] [font-size:12px]"
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

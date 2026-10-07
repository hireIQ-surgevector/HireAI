import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../components/common/PageShell";
import Button from "../components/common/Button";
import { Select } from "../components/common/FormField";
import PageState from "../components/common/PageState";
import JobCard from "../components/jobs/JobCard";
import {
  Search,
  BriefcaseBusiness,
  X,
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
        <Button as={Link} to="/post-job">
          + Post New Job
        </Button>
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

              <Select
                className="min-w-40"
                id="dept-filter"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </Select>
            </div>

            {/* STATUS FILTER */}

            <div className="jobs-filter-group [display:flex] [flex-direction:column] [gap:5px]">
              <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold] [.jobs-filter-group_&]:[font-size:12px] [.jobs-filter-group_&]:[font-weight:600] [.jobs-filter-group_&]:[color:#64748b]" htmlFor="status-filter">Status</label>

              <Select
                className="min-w-40"
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="All">All Statuses</option>

                <option value="Active">Active</option>

                <option value="Closing Soon">Closing Soon</option>

                <option value="Overdue">Overdue</option>
              </Select>
            </div>

            {/* CLEAR FILTERS */}

            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                <X size={14} />
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      {/* =========================
          LOADING
      ========================= */}

      {loading && <PageState variant="loading" title="Loading job openings" rows={5} />}

      {/* =========================
          ERROR
      ========================= */}

      {!loading && error && (
        <PageState
          variant="error"
          title="Couldn't load job openings"
          description={error}
          onRetry={fetchJobs}
        />
      )}

      {/* =========================
          EMPTY STATE
      ========================= */}

      {!loading && !error && jobs.length === 0 && (
        <PageState
          variant="empty"
          title="No job openings yet"
          description="Create your first opening to start building a hiring pipeline."
          icon={BriefcaseBusiness}
          action={
            <Button as={Link} to="/post-job">
              <Plus size={15} />
              Post new job
            </Button>
          }
        />
      )}

      {/* =========================
          NO FILTER RESULTS
      ========================= */}

      {!loading && !error && jobs.length > 0 && filteredJobs.length === 0 && (
        <PageState
          variant="empty"
          title="No jobs match these filters"
          description="Adjust your department or status filters and try again."
          icon={Search}
          action={
            <Button type="button" variant="secondary" onClick={clearFilters}>
              Reset filters
            </Button>
          }
        />
      )}

      {/* =========================
          JOB LIST
      ========================= */}

      {!loading && !error && filteredJobs.length > 0 && (
        <div className="stack jobs-list [gap:12px]">
          {filteredJobs.map((job) => {
            const status = getJobStatusDetails(job.due_date).label;

            return (
              <JobCard
                key={job.job_id || job.id || job.title}
                job={job}
                formattedDueDate={formatDate(job.due_date)}
                status={status}
              />
            );
          })}
        </div>
      )}
      </div>
    </PageShell>
  );
}

export default JobsPage;

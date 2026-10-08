import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  SlidersHorizontal,
} from "lucide-react";

import { API_URL } from "../utils/auth";

function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("status_active_first");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef(null);

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

  useEffect(() => {
    if (!filtersOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!filtersRef.current?.contains(event.target)) {
        setFiltersOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [filtersOpen]);

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
    const query = searchQuery.trim().toLowerCase();

    const matchingJobs = jobs.filter((job) => {
      const departmentMatches =
        selectedDept === "All" ||
        (job.department || "").toLowerCase().trim() ===
          selectedDept.toLowerCase().trim();

      const status = getJobStatusDetails(job.due_date).label;

      const statusMatches =
        selectedStatus === "All" || status === selectedStatus;

      const searchMatches =
        !query ||
        [job.title, job.department, job.location]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      return departmentMatches && statusMatches && searchMatches;
    });

    const statusPriority = {
      Active: 0,
      "Closing Soon": 1,
      Overdue: 2,
    };

    return matchingJobs.sort((first, second) => {
      if (sortOrder === "created_newest" || sortOrder === "created_oldest") {
        const firstTimestamp = new Date(first.created_at || 0).getTime();
        const secondTimestamp = new Date(second.created_at || 0).getTime();
        const firstDate = Number.isFinite(firstTimestamp) ? firstTimestamp : 0;
        const secondDate = Number.isFinite(secondTimestamp)
          ? secondTimestamp
          : 0;
        const direction = sortOrder === "created_newest" ? -1 : 1;
        return (firstDate - secondDate) * direction;
      }

      const direction = sortOrder === "status_active_first" ? 1 : -1;
      const firstPriority =
        statusPriority[getJobStatusDetails(first.due_date).label] ?? 3;
      const secondPriority =
        statusPriority[getJobStatusDetails(second.due_date).label] ?? 3;

      return (firstPriority - secondPriority) * direction;
    });
  }, [jobs, searchQuery, selectedDept, selectedStatus, sortOrder]);

  /* =========================
     ACTIVE JOB COUNT
  ========================= */

  const activeJobsCount = useMemo(() => { return jobs.filter((job) => { const status = getJobStatusDetails(job.due_date).label; return status !== "Overdue"; }).length; }, [jobs]);

  const hasActiveFilters =
    selectedDept !== "All" ||
    selectedStatus !== "All" ||
    sortOrder !== "status_active_first";

  const clearFilters = () => {
    setSelectedDept("All");
    setSelectedStatus("All");
    setSortOrder("status_active_first");
  };

  return (
    <PageShell
      title="Job Openings"
      active="jobs"
      eyebrow="RECRUITMENT WORKSPACE"
      description="Build the team you need. Track open roles, candidate flow, and hiring deadlines from one place."
      headerIcon={BriefcaseBusiness}
      actions={
        <Button as={Link} to="/post-job">
          + Post New Job
        </Button>
      }
    >
      <div className="jobs-page [max-width:1180px] [margin:0_auto]">

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
        <div className="jobs-toolbar [display:flex] [align-items:center] [gap:12px] [margin-bottom:20px]">
          <label className="[position:relative] [display:flex] [min-width:0] [height:44px] [flex:1] [align-items:center] [gap:10px] [border:1px_solid_#dbe2ea] [border-radius:10px] [background:#fff] [padding:0_14px] [color:#64748b] focus-within:[border-color:#00b4d8] focus-within:[box-shadow:0_0_0_3px_rgba(0,180,216,0.12)]">
            <Search size={18} aria-hidden="true" />
            <span className="[position:absolute] [width:1px] [height:1px] [padding:0] [margin:-1px] [overflow:hidden] [clip:rect(0,0,0,0)] [white-space:nowrap] [border:0]">
              Search job openings
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search jobs by title, department, or location"
              className="[width:100%] [min-width:0] [border:none] [outline:none] [background:transparent] [font:inherit] [font-size:14px] [color:#1e293b]"
            />
          </label>

          <div ref={filtersRef} className="[position:relative] [flex-shrink:0]">
            <Button
              type="button"
              variant={filtersOpen || hasActiveFilters ? "primary" : "secondary"}
              aria-expanded={filtersOpen}
              aria-controls="jobs-filter-panel"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <SlidersHorizontal size={16} />
              Filters
              {hasActiveFilters && (
                <span className="[display:inline-flex] [min-width:19px] [height:19px] [align-items:center] [justify-content:center] [border-radius:999px] [background:#00b4d8] [padding:0_5px] [font-size:11px] [color:#fff]">
                  {Number(selectedDept !== "All") +
                    Number(selectedStatus !== "All") +
                    Number(sortOrder !== "status_active_first")}
                </span>
              )}
            </Button>

            {filtersOpen && (
              <div
                id="jobs-filter-panel"
                role="dialog"
                aria-label="Filter and sort job openings"
                className="[position:absolute] [z-index:30] [top:calc(100%_+_8px)] [right:0] [width:min(340px,calc(100vw-32px))] [border:1px_solid_#e2e8f0] [border-radius:12px] [background:#fff] [padding:18px] [box-shadow:0_16px_40px_rgba(15,23,42,0.16)]"
              >
                <div className="[margin-bottom:16px] [display:flex] [align-items:center] [justify-content:space-between]">
                  <h3 className="[margin:0] [font-size:15px] [font-weight:700] [color:#1e293b]">
                    Filters & sorting
                  </h3>
                  <button
                    type="button"
                    aria-label="Close filters"
                    onClick={() => setFiltersOpen(false)}
                    className="[display:inline-flex] [width:32px] [height:32px] [align-items:center] [justify-content:center] [border:0] [border-radius:8px] [background:transparent] [color:#64748b] hover:[background:#f1f5f9]"
                  >
                    <X size={17} />
                  </button>
                </div>

                <div className="[display:grid] [gap:14px]">
                  <Select
                    label="Department"
                    optional
                    id="dept-filter"
                    value={selectedDept}
                    onChange={(event) => setSelectedDept(event.target.value)}
                  >
                    {departments.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </Select>

                  <Select
                    label="Status"
                    optional
                    id="status-filter"
                    value={selectedStatus}
                    onChange={(event) => setSelectedStatus(event.target.value)}
                  >
                    <option value="All">All statuses</option>
                    <option value="Active">Active</option>
                    <option value="Closing Soon">Closing soon</option>
                    <option value="Overdue">Overdue</option>
                  </Select>

                  <Select
                    label="Sort jobs by"
                    optional
                    id="job-sort"
                    value={sortOrder}
                    onChange={(event) => setSortOrder(event.target.value)}
                  >
                    <option value="status_active_first">
                      Status: Active → Closing soon → Overdue
                    </option>
                    <option value="status_overdue_first">
                      Status: Overdue → Closing soon → Active
                    </option>
                    <option value="created_newest">Created date: newest first</option>
                    <option value="created_oldest">Created date: oldest first</option>
                  </Select>
                </div>

                <div className="[margin-top:18px] [display:flex] [justify-content:space-between] [gap:10px]">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setFiltersOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              </div>
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
          description="Try another search, adjust the filters, or reset the sort order."
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

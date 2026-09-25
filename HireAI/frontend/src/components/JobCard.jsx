import { Link } from "react-router-dom";
import {
  BriefcaseBusiness,
  Building2,
  MapPin,
  Users,
  CalendarDays,
} from "lucide-react";

import { formatDate, getJobStatusDetails } from "../utils/jobStatus";

function JobCard({ job }) {
  const jobId = job.job_id || job.id;

  const title = job.title || "Untitled Position";

  const department = job.department || "General";

  const location = job.location || "Remote";

  const candidateCount = job.candidate_count ?? job.count ?? 0;

  const formattedDueDate = formatDate(job.due_date);

  const statusInfo = getJobStatusDetails(job.due_date);

  const isExpired = statusInfo.label === "Overdue";

  return (
    <div className={`card job-card ${isExpired ? "job-card-expired" : ""}`}>
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

          <Link to={`/edit-job/${jobId}`} className="btn btn-ghost btn-sm">
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
}

export default JobCard;
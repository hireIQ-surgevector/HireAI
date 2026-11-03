import { Link } from "react-router-dom";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  MapPin,
  Users,
} from "lucide-react";

import Button from "../common/Button";
import Card from "../common/Card";
import StatusBadge from "../common/StatusBadge";

function JobCard({ job, formattedDueDate, status }) {
  const jobId = job.job_id || job.id;
  const title = job.title || "Untitled Position";
  const department = job.department || "General";
  const location = job.location || "Remote";
  const candidateCount = job.candidate_count ?? job.count ?? 0;
  const isExpired = status === "Overdue";

  return (
    <Card
      className={`${`card job-card ${isExpired ? "job-card-expired" : ""}`} [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [padding:18px] [.jobs-list_&]:[border-radius:12px] [.jobs-list_&]:[padding:20px] [.jobs-list_&]:[box-shadow:0_2px_8px_rgba(15,_23,_42,_0.03)] hover:[.jobs-list_&]:[border-color:#bfd2eb] hover:[.jobs-list_&]:[box-shadow:0_8px_22px_rgba(19,_63,_125,_0.09)] [transition:transform_0.2s_ease,_box-shadow_0.2s_ease] hover:[transform:translateY(-2px)] [&.job-card-expired]:[opacity:0.8]`}
    >
      <div className="job-main [display:flex] [align-items:center] [gap:14px]">
        <div className="job-icon [width:46px] [height:46px] [border-radius:10px] [background:#e8f0fb] [display:flex] [align-items:center] [justify-content:center] [font-size:20px]">
          <BriefcaseBusiness size={22} />
        </div>

        <div className="job-body [flex:1]">
          <div className="job-title-row [display:flex] [align-items:center] [gap:10px] [margin-bottom:4px] [align-items:flex-start] [justify-content:space-between] [gap:16px] max-[768px]:[align-items:flex-start]">
            <div>
              <h3 className="[.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px] [.job-title-row_&]:[margin:0] [.job-title-row_&]:[font-size:14px] [.job-title-row_&]:[font-weight:700] [.job-title-row_&]:[color:#1e293b]">
                {title}
              </h3>
            </div>
            <StatusBadge status={status} />
          </div>

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
              {candidateCount} {candidateCount === 1 ? "candidate" : "candidates"}
            </span>
            <span className="[.job-meta_&]:[display:inline-flex] [.job-meta_&]:[align-items:center] [.job-meta_&]:[gap:6px] [.job-meta_&]:[color:#64748b] [.job-meta_&]:[font-size:13px]">
              <CalendarDays size={14} />
              {formattedDueDate
                ? `Target: ${formattedDueDate}`
                : "No target date"}
            </span>
          </div>
        </div>

        <div className="job-actions [display:flex] [gap:8px]">
          <Button
            as={Link}
            to={`/jobs/${jobId}/candidates`}
            variant="secondary"
            size="sm"
          >
            View Candidates
          </Button>
          <Button
            as={Link}
            to={`/edit-job/${jobId}`}
            variant="ghost"
            size="sm"
          >
            Edit
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default JobCard;

import { BriefcaseBusiness, ChevronDown } from "lucide-react";

function JobSelector({ jobs, selectedJobId, onJobChange, loading }) {
  return (
    <div className="matcher-job-selector card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [padding:20px] [margin-bottom:20px]">
      <div className="matcher-selector-label [display:flex] [align-items:center] [gap:8px] [font-size:14px] [font-weight:600] [margin-bottom:10px]">
        <BriefcaseBusiness size={18} />
        <span>Select Job</span>
      </div>

      <div className="matcher-select-wrapper [position:relative]">
        <select
          value={selectedJobId}
          onChange={(event) => onJobChange(event.target.value)}
          disabled={loading}
          className="matcher-select [font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [appearance:none] [padding:12px_42px_12px_14px] [border:1px_solid_#d1d5db] [background:white] [cursor:pointer] focus:[outline:none] focus:[border-color:#2563eb]"
        >
          <option value="">
            {loading ? "Loading jobs..." : "Choose a job opening"}
          </option>
          {jobs.map((job) => (
            <option key={job.job_id} value={job.job_id}>
              {job.title}
              {job.department ? ` — ${job.department}` : ""}
            </option>
          ))}
        </select>
        <ChevronDown
          size={18}
          className="matcher-select-icon [position:absolute] [right:14px] [top:50%] [transform:translateY(-50%)] [pointer-events:none] [color:#64748b]"
        />
      </div>
    </div>
  );
}

export default JobSelector;

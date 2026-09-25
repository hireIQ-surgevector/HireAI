import { BriefcaseBusiness, X } from "lucide-react";

function JobsToolbar({
  departments,
  selectedDept,
  onSelectDept,
  selectedStatus,
  onSelectStatus,
  filteredCount,
  totalCount,
  hasActiveFilters,
  onClearFilters,
}) {
  return (
    <div className="jobs-toolbar">
      <div className="jobs-summary">
        <div className="jobs-summary-icon">
          <BriefcaseBusiness size={18} />
        </div>

        <div>
          <strong>{filteredCount}</strong>
          <span> of {totalCount} jobs</span>
        </div>
      </div>

      <div className="jobs-filters">
        {/* DEPARTMENT FILTER */}

        <div className="jobs-filter-group">
          <label htmlFor="dept-filter">Department</label>

          <select
            id="dept-filter"
            value={selectedDept}
            onChange={(e) => onSelectDept(e.target.value)}
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
            onChange={(e) => onSelectStatus(e.target.value)}
            className="select-input"
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
            className="btn btn-ghost btn-sm"
            onClick={onClearFilters}
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

export default JobsToolbar;
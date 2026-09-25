function JobsStatStrip({
  totalJobs,
  activeJobsCount,
  closingSoonCount,
  overdueCount,
}) {
  return (
    <div className="jobs-stat-strip">
      <div>
        <span>Total openings</span>
        <strong>{totalJobs}</strong>
      </div>

      <div>
        <span>Active roles</span>
        <strong>{activeJobsCount}</strong>
      </div>

      <div>
        <span>Closing soon</span>
        <strong>{closingSoonCount}</strong>
      </div>

      <div>
        <span>Overdue roles</span>
        <strong>{overdueCount}</strong>
      </div>
    </div>
  );
}

export default JobsStatStrip;
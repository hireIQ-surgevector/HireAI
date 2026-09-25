import { BriefcaseBusiness } from "lucide-react";

function JobsEmptyState({ title, description, children }) {
  return (
    <div className="jobs-empty-state">
      <div className="jobs-empty-icon">
        <BriefcaseBusiness size={30} />
      </div>

      <h3>{title}</h3>

      <p>{description}</p>

      {children}
    </div>
  );
}

export default JobsEmptyState;
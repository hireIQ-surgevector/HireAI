import PageShell from "./PageShell";
import { Link } from "react-router-dom";

function ScheduleInterviewPage() {
  return (
    <PageShell
      title="Schedule Interview"
      active="interviews"
      backTo="/candidates"
    >
      <div className="card large-card">
        <h3>Select Interview Slot</h3>
        <div className="grid2">
          <div className="field">
            <label>Interview Round</label>
            <select>
              <option>L2 – Advanced Technical</option>
            </select>
          </div>
          <div className="field">
            <label>Duration</label>
            <select>
              <option>60 minutes</option>
            </select>
          </div>
        </div>
        <div className="slot-grid">
          {[
            "Dec 22 · 10:00 AM",
            "Dec 22 · 2:00 PM",
            "Dec 23 · 11:00 AM",
            "Dec 24 · 4:00 PM",
          ].map((slot, index) => (
            <div
              key={slot}
              className={`slot-card ${index === 0 ? "selected" : ""}`}
            >
              {slot}
            </div>
          ))}
        </div>
        <div className="info-box">
          ✨ Calendar invites auto-sent to candidate and interviewer on
          scheduling.
        </div>
        <div className="text-right">
          <Link to="/interviews" className="btn btn-primary">
            Next →
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

export default ScheduleInterviewPage;
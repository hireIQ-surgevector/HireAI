import { Link } from "react-router-dom";
import PageShell from "./PageShell";
import { Plus, Check } from "lucide-react";

const PlusIcon = (props) => <Plus {...props} />
const CheckIcon = (props) => <Check {...props} />

function EvaluationsPage() {
  return (
    <PageShell
      title="Interview Evaluations — Priya Sharma"
      active="evaluations"
    >
      <div className="grid2">
        <div className="card">
          <h3>Score Summary</h3>
          {[
            ["Technical Skills", 88],
            ["Communication", 82],
            ["Problem Solving", 90],
            ["Role Fitment", 85],
            ["Culture Fit", 78],
          ].map(([label, value]) => (
            <div key={label} className="progress-row">
              <div className="row-label">{label}</div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${value}%`,
                    background: `hsl(${value * 1.2}, 65%, 40%)`,
                  }}
                />
              </div>
              <span>{value}%</span>
            </div>
          ))}
          <div className="score-box large">84.6</div>
          <Link to="/send-offer" className="btn btn-success full-width">
            <CheckIcon size={14} /> Advance Candidate
          </Link>
          <Link to="/reject-candidate" className="btn btn-danger full-width">
            <PlusIcon size={14} style={{ transform: "rotate(45deg)" }} /> Reject
            Candidate
          </Link>
        </div>
        <div className="card">
          <h3>Evaluation Feedback</h3>
          <div className="field">
            <label>Strengths</label>
            <div className="info-box success">
              Strong React internals and hooks understanding.
            </div>
          </div>
          <div className="field">
            <label>Areas of Improvement</label>
            <div className="info-box warning">
              System design depth could be stronger.
            </div>
          </div>
          <div className="field">
            <label>Final Recommendation</label>
            <textarea
              rows="3"
              defaultValue="Priya demonstrates strong senior-level frontend skills."
            />
          </div>
          <button type="button" className="btn btn-primary btn-sm">
            Save Evaluation
          </button>
        </div>
      </div>
    </PageShell>
  );
}

export default EvaluationsPage;
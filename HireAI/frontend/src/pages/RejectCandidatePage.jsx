import PageShell from "../components/PageShell";
import { Link } from "react-router-dom";
import { Plus, FileText } from "lucide-react";

const PlusIcon = (props) => <Plus {...props} />;
const DocumentIcon = (props) => <FileText {...props} />;

function RejectCandidatePage() {
  return (
    <PageShell
      title="Reject Candidate"
      active="candidates"
      backTo="/candidates"
    >
      <div className="card reject-card">
        <div className="reject-head">
          <div className="reject-icon">
            <PlusIcon size={18} style={{ transform: "rotate(45deg)" }} />
          </div>
          <div>
            <div className="strong">Priya Sharma</div>
            <div className="muted">
              Senior Frontend Dev · L2 Interview Stage
            </div>
          </div>
        </div>
        <div className="field">
          <label>Rejection Reason *</label>
          <select>
            <option>Select reason</option>
            <option>Skill gap / Technical mismatch</option>
            <option>Experience not matching</option>
          </select>
        </div>
        <div className="field">
          <label>Internal Notes</label>
          <textarea rows="3" />
        </div>
        <div className="field">
          <label>Rejection Email Preview</label>
          <div className="email-preview">Dear Priya, ...</div>
        </div>
        <div className="inline-actions end">
          <Link to="/candidates" className="btn btn-ghost">
            Cancel
          </Link>
          <Link to="/reject-done" className="btn btn-danger">
            <DocumentIcon size={14} /> Send Rejection & Close
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

export default RejectCandidatePage;

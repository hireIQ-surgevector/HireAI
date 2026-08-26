import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

const DocumentIcon = (props) => <FileText {...props} />

function RejectDonePage() {
  return (
    <div className="screen confirm active">
      <div className="card confirm-card">
        <div className="success-icon">
          <DocumentIcon size={32} />
        </div>
        <h2>Rejection Email Sent</h2>
        <p>
          Priya Sharma has been notified. The application is closed and profile
          archived.
        </p>
        <div className="info-box">Reason: Better candidate selected</div>
        <div className="inline-actions center">
          <Link to="/candidates" className="btn btn-primary">
            Back to Candidates
          </Link>
          <Link to="/dashboard" className="btn btn-secondary">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RejectDonePage;
import { Link } from "react-router-dom";

function OfferDeclinedPage() {
  return (
    <div className="screen confirm active">
      <div className="card confirm-card">
        <div className="success-icon">😔</div>
        <h2>Offer Declined</h2>
        <p>
          We&apos;re sorry to hear that. Your response has been sent to
          surgevector.ai HR.
        </p>
        <div className="field">
          <label>Reason for declining (optional)</label>
          <select>
            <option>Select reason</option>
          </select>
        </div>
        <Link to="/candidate-home" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default OfferDeclinedPage;

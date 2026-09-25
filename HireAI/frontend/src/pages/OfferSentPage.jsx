import { Link } from "react-router-dom";
import { Check } from "lucide-react";

const CheckIcon = (props) => <Check {...props} />;

function OfferSentPage() {
  return (
    <div className="screen confirm active">
      <div className="card confirm-card">
        <div className="success-icon">
          <CheckIcon size={32} />
        </div>
        <h2>Offer Letter Sent!</h2>
        <p>
          The offer has been emailed to priya.sharma@email.com. Candidate has
          until Dec 27 to respond.
        </p>
        <div className="info-box">
          What Happens Next? Offer letter emailed with secure signing link.
        </div>
        <div className="inline-actions center">
          <Link to="/offers" className="btn btn-primary">
            View All Offers
          </Link>
          <Link to="/dashboard" className="btn btn-secondary">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OfferSentPage;

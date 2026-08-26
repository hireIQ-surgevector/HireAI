import { Link } from "react-router-dom";
import PageShell from "./PageShell";

function SendOfferPage() {
  return (
    <PageShell
      title="Create Offer Letter"
      active="offers"
      backTo="/candidates"
    >
      <div className="card large-card">
        <h3>Offer Details</h3>
        <div className="grid2">
          <div className="field">
            <label>Candidate Name</label>
            <input defaultValue="Priya Sharma" />
          </div>
          <div className="field">
            <label>Position</label>
            <input defaultValue="Senior Frontend Developer" />
          </div>
        </div>
        <div className="text-right">
          <Link to="/offer-sent" className="btn btn-primary">
            Next →
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

export default SendOfferPage;

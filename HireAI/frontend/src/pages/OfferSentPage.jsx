import { Link } from "react-router-dom";
import { Check } from "lucide-react";

const CheckIcon = (props) => <Check {...props} />;

function OfferSentPage() {
  return (
    <div className="screen confirm active [min-height:100vh] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center] [background:#f8fafc]">
      <div className="card confirm-card [max-width:440px] [text-align:center] [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px]">
        <div className="success-icon [width:72px] [height:72px] [border-radius:50%] [background:#dcfce7] [display:flex] [align-items:center] [justify-content:center] [margin:0_auto_18px] [font-size:32px]">
          <CheckIcon size={32} />
        </div>
        <h2>Offer Letter Sent!</h2>
        <p>
          The offer has been emailed to priya.sharma@email.com. Candidate has
          until Dec 27 to respond.
        </p>
        <div className="info-box [background:#e0f7fa] [border:1px_solid_#b2ebf2] [border-radius:8px] [padding:12px] [font-size:13px] [color:#006064] [margin-bottom:16px]">
          What Happens Next? Offer letter emailed with secure signing link.
        </div>
        <div className="inline-actions center [justify-content:center] [display:flex] [gap:10px] [margin-top:8px]">
          <Link to="/offers" className="btn btn-primary [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#133f7d] [color:#fff]">
            View All Offers
          </Link>
          <Link to="/dashboard" className="btn btn-secondary [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#fff] [color:#133f7d] [border:1.5px_solid_#133f7d]">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OfferSentPage;

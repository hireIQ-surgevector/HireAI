import CandidateLayout from "./CandidateLayout";
import { Link } from "react-router-dom";
import { Check, Plus } from "lucide-react";

const CheckIcon = (props) => <Check {...props} />;
const PlusIcon = (props) => <Plus {...props} />;

function CandidateOfferPage() {
  return (
    <CandidateLayout title="Offer Letter" active="candidate-offer">
      <div className="card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px]">
        <h3 className="[.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px]">Offer of Employment</h3>
        <p>Dear Rahul Kumar,</p>
        <p>We are delighted to offer you the position of DevOps Engineer.</p>
        <div className="inline-actions center [justify-content:center] [display:flex] [gap:10px] [margin-top:8px]">
          <Link to="/offer-accepted" className="btn btn-success [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#22c55e] [color:#fff]">
            <CheckIcon size={14} /> Accept Offer
          </Link>
          <Link to="/offer-declined" className="btn btn-danger [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#ef4444] [color:#fff]">
            <PlusIcon className="[transform:rotate(45deg)]" size={14}  />{" "}
            Decline Offer
          </Link>
        </div>
      </div>
    </CandidateLayout>
  );
}

export default CandidateOfferPage;

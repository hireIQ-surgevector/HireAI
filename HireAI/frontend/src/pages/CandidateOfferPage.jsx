import CandidateLayout from "./CandidateLayout";
import { Link } from "react-router-dom";
import { Check, Plus } from "lucide-react";

const CheckIcon = (props) => <Check {...props} />;
const PlusIcon = (props) => <Plus {...props} />;

function CandidateOfferPage() {
  return (
    <CandidateLayout title="Offer Letter" active="candidate-offer">
      <div className="card">
        <h3>Offer of Employment</h3>
        <p>Dear Rahul Kumar,</p>
        <p>We are delighted to offer you the position of DevOps Engineer.</p>
        <div className="inline-actions center">
          <Link to="/offer-accepted" className="btn btn-success">
            <CheckIcon size={14} /> Accept Offer
          </Link>
          <Link to="/offer-declined" className="btn btn-danger">
            <PlusIcon size={14} style={{ transform: "rotate(45deg)" }} />{" "}
            Decline Offer
          </Link>
        </div>
      </div>
    </CandidateLayout>
  );
}

export default CandidateOfferPage;

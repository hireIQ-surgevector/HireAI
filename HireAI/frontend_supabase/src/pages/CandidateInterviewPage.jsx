import CandidateLayout from "./CandidateLayout";
import { Link } from "react-router-dom";

function CandidateInterviewPage() {
  return (
    <CandidateLayout title="Upcoming Interview" active="candidate-interview">
      <div className="card interview-card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [max-width:640px] [margin:0_auto] [max-width:760px] max-[640px]:[max-width:100%]">
        <h3 className="[.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px]">L2 Technical Interview</h3>
        <p>December 22, 2025 · 10:00 AM IST · 60 minutes</p>
        <p>Interviewer: Rakesh Nair (Senior Engineer)</p>
        <Link to="/interview-room" className="btn btn-teal [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#00b4d8] [color:#fff]">
          Join Now
        </Link>
      </div>
    </CandidateLayout>
  );
}

export default CandidateInterviewPage;

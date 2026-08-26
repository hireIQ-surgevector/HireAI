import CandidateLayout from "./CandidateLayout";
import { Link } from "react-router-dom";

function CandidateInterviewPage() {
  return (
    <CandidateLayout title="Upcoming Interview" active="candidate-interview">
      <div className="card interview-card">
        <h3>L2 Technical Interview</h3>
        <p>December 22, 2025 · 10:00 AM IST · 60 minutes</p>
        <p>Interviewer: Rakesh Nair (Senior Engineer)</p>
        <Link to="/interview-room" className="btn btn-teal">
          Join Now
        </Link>
      </div>
    </CandidateLayout>
  );
}

export default CandidateInterviewPage;

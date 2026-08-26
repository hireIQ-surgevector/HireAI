import CandidateLayout from "./CandidateLayout";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const ArrowRightIcon = (props) => <ArrowRight {...props} />;

function CandidateHomePage() {
  return (
    <CandidateLayout title="My Application" active="candidate-home">
      <div className="hero-banner">
        <div className="avatar large">RK</div>
        <div>
          <h2>Welcome back, Rahul! 👋</h2>
          <p>DevOps Engineer Application · surgevector.ai.</p>
        </div>
        <div className="score-pill">
          <div>91%</div>
          <span>AI Match Score</span>
        </div>
      </div>
      <div className="grid2">
        <div className="card">
          <h3>Application Progress</h3>
          {[
            "Applied",
            "AI Screening",
            "Shortlisted",
            "L1 Interview",
            "L2 Interview",
            "HR Round",
            "Offer",
          ].map((stage, index) => (
            <div key={stage} className="progress-step">
              {stage}
            </div>
          ))}
        </div>
        <div className="card">
          <h3>Upcoming: L2 Interview</h3>
          <p>Dec 22, 2025 · 10:00 AM IST · 60 mins</p>
          <Link to="/candidate-interview" className="btn btn-teal btn-sm">
            Prepare <ArrowRightIcon size={14} />
          </Link>
        </div>
      </div>
    </CandidateLayout>
  );
}

export default CandidateHomePage;

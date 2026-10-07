import CandidateLayout from "./CandidateLayout";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const ArrowRightIcon = (props) => <ArrowRight {...props} />;

function CandidateHomePage() {
  return (
    <CandidateLayout title="My Application" active="candidate-home">
      <div className="hero-banner [background:linear-gradient(135deg,_#0d2d5e,_#133f7d)] [border-radius:12px] [padding:22px] [color:#fff] [display:flex] [align-items:center] [gap:16px] [margin-bottom:20px]">
        <div className="avatar large [width:34px] [height:34px] [border-radius:50%] [display:flex] [align-items:center] [justify-content:center] [font-weight:700] [font-size:12px] [width:58px] [height:58px] [font-size:22px]">RK</div>
        <div>
          <h2 className="[.hero-banner_&]:[color:#fff] [.hero-banner_&]:[margin:0_0_4px] [.hero-banner_&]:[font-size:19px] [.hero-banner_&]:[font-weight:800]">Welcome back, Rahul! 👋</h2>
          <p className="[.hero-banner_&]:[margin:0] [.hero-banner_&]:[color:rgba(255,255,255,0.65)] [.hero-banner_&]:[font-size:13px]">DevOps Engineer Application · surgevector.ai.</p>
        </div>
        <div className="score-pill [margin-left:auto] [background:rgba(255,255,255,0.15)] [border-radius:10px] [padding:12px_18px] [text-align:center]">
          <div className="[.score-pill_&]:[color:#fff] [.score-pill_&]:[font-size:24px] [.score-pill_&]:[font-weight:800]">91%</div>
          <span className="[.score-pill_&]:[color:rgba(255,255,255,0.6)] [.score-pill_&]:[font-size:11px]">AI Match Score</span>
        </div>
      </div>
      <div className="grid2 [display:grid] [grid-template-columns:1fr_1fr] [gap:14px] max-[960px]:[grid-template-columns:1fr] max-[960px]:[flex-direction:column]">
        <div className="card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px]">
          <h3 className="[.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px]">Application Progress</h3>
          {[
            "Applied",
            "AI Screening",
            "Shortlisted",
            "L1 Interview",
            "L2 Interview",
            "HR Round",
            "Offer",
          ].map((stage, index) => (
            <div key={stage} className="progress-step [display:flex] [align-items:center] [gap:10px] [padding:8px_0] [font-size:13px] [color:#64748b]">
              {stage}
            </div>
          ))}
        </div>
        <div className="card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px]">
          <h3 className="[.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px]">Upcoming: L2 Interview</h3>
          <p>Dec 22, 2025 · 10:00 AM IST · 60 mins</p>
          <Link to="/candidate-interview" className="btn btn-teal btn-sm [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#00b4d8] [color:#fff] [padding:6px_14px] [font-size:12px]">
            Prepare <ArrowRightIcon size={14} />
          </Link>
        </div>
      </div>
    </CandidateLayout>
  );
}

export default CandidateHomePage;

import CandidateLayout from "./CandidateLayout";

function CandidateFeedbackPage() {
  return (
    <CandidateLayout title="My Interview Feedback" active="candidate-feedback">
      <div className="card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px]">
        <h3 className="[.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px]">L1 Technical Round</h3>
        <p>by Vikram Singh · Dec 15, 2025</p>
        <span className="badge badge-green [font-size:11px] [font-weight:700] [padding:3px_9px] [border-radius:20px] [white-space:nowrap] [display:inline-block] [background:#dcfce7] [color:#166534]">Passed</span>
      </div>
    </CandidateLayout>
  );
}

export default CandidateFeedbackPage;

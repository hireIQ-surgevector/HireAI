import CandidateLayout from "./CandidateLayout";

function CandidateFeedbackPage() {
  return (
    <CandidateLayout title="My Interview Feedback" active="candidate-feedback">
      <div className="card">
        <h3>L1 Technical Round</h3>
        <p>by Vikram Singh · Dec 15, 2025</p>
        <span className="badge badge-green">Passed</span>
      </div>
    </CandidateLayout>
  );
}

export default CandidateFeedbackPage;

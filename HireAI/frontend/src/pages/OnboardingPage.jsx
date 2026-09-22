import CandidateLayout from "./CandidateLayout";

function OnboardingPage() {
  return (
    <CandidateLayout title="Onboarding" active="candidate-offer">
      <div className="card">
        <h3>Onboarding Checklist</h3>
        {[
          "Documents to Submit",
          "Background Verification",
          "Day 1 Preparation",
        ].map((section) => (
          <div key={section} className="onboarding-section">
            <h4>{section}</h4>
            {["Aadhaar Card", "PAN Card"].map((item) => (
              <div key={item} className="check-row">
                {item}
              </div>
            ))}
          </div>
        ))}
      </div>
    </CandidateLayout>
  );
}

export default OnboardingPage;

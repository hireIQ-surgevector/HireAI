import CandidateLayout from "./CandidateLayout";

function OnboardingPage() {
  return (
    <CandidateLayout title="Onboarding" active="candidate-offer">
      <div className="card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px]">
        <h3 className="[.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px]">Onboarding Checklist</h3>
        {[
          "Documents to Submit",
          "Background Verification",
          "Day 1 Preparation",
        ].map((section) => (
          <div key={section} className="onboarding-section [margin-bottom:16px]">
            <h4>{section}</h4>
            {["Aadhaar Card", "PAN Card"].map((item) => (
              <div key={item} className="check-row [padding:8px_0] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [color:#1e293b]">
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

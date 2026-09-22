import { ArrowRight } from "lucide-react";

const ArrowRightIcon = (props) => <ArrowRight {...props} />;

function OfferAcceptedPage() {
  return (
    <div className="screen confirm active">
      <div className="card confirm-card">
        <div className="success-icon">🎊</div>
        <h2>Offer Accepted!</h2>
        <p>
          Congratulations Rahul! You&apos;ve accepted the DevOps Engineer offer
          at surgevector.ai.
        </p>
        <button
          type="button"
          className="btn btn-success btn-lg"
          onClick={() => window.location.assign("/onboarding")}
        >
          Proceed to Onboarding <ArrowRightIcon size={16} />
        </button>
      </div>
    </div>
  );
}

export default OfferAcceptedPage;

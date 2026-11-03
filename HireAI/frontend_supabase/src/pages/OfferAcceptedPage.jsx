import { ArrowRight } from "lucide-react";

const ArrowRightIcon = (props) => <ArrowRight {...props} />;

function OfferAcceptedPage() {
  return (
    <div className="screen confirm active [min-height:100vh] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center] [background:#f8fafc]">
      <div className="card confirm-card [max-width:440px] [text-align:center] [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px]">
        <div className="success-icon [width:72px] [height:72px] [border-radius:50%] [background:#dcfce7] [display:flex] [align-items:center] [justify-content:center] [margin:0_auto_18px] [font-size:32px]">🎊</div>
        <h2>Offer Accepted!</h2>
        <p>
          Congratulations Rahul! You&apos;ve accepted the DevOps Engineer offer
          at surgevector.ai.
        </p>
        <button
          type="button"
          className="btn btn-success btn-lg [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#22c55e] [color:#fff] [padding:13px_28px] [font-size:15px]"
          onClick={() => window.location.assign("/onboarding")}
        >
          Proceed to Onboarding <ArrowRightIcon size={16} />
        </button>
      </div>
    </div>
  );
}

export default OfferAcceptedPage;

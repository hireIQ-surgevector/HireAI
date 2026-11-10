import { Link } from "react-router-dom";

function OfferDeclinedPage() {
  return (
    <div className="screen confirm active [min-height:100vh] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center] [background:#f8fafc]">
      <div className="card confirm-card [max-width:440px] [text-align:center] [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px]">
        <div className="success-icon [width:72px] [height:72px] [border-radius:50%] [background:#dcfce7] [display:flex] [align-items:center] [justify-content:center] [margin:0_auto_18px] [font-size:32px]">😔</div>
        <h2>Offer Declined</h2>
        <p>
          We&apos;re sorry to hear that. Your response has been sent to
          surgevector.ai HR.
        </p>
        <div className="field [margin-bottom:14px]">
          <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]">Reason for declining (optional)</label>
          <select className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]">
            <option>Select reason</option>
          </select>
        </div>
        <Link to="/candidate-home" className="btn btn-primary [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#133f7d] [color:#fff]">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default OfferDeclinedPage;

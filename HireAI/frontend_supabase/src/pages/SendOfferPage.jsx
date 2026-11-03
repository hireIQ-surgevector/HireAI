import { Link } from "react-router-dom";
import PageShell from "../components/common/PageShell";

function SendOfferPage() {
  return (
    <PageShell title="Create Offer Letter" active="offers" backTo="/candidates">
      <div className="card large-card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [max-width:760px] [margin:0_auto]">
        <h3 className="[.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px]">Offer Details</h3>
        <div className="grid2 [display:grid] [grid-template-columns:1fr_1fr] [gap:14px] max-[960px]:[grid-template-columns:1fr] max-[960px]:[flex-direction:column]">
          <div className="field [margin-bottom:14px]">
            <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]">Candidate Name</label>
            <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]" defaultValue="Priya Sharma" />
          </div>
          <div className="field [margin-bottom:14px]">
            <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]">Position</label>
            <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]" defaultValue="Senior Frontend Developer" />
          </div>
        </div>
        <div className="text-right [text-align:right]">
          <Link to="/offer-sent" className="btn btn-primary [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#133f7d] [color:#fff]">
            Next →
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

export default SendOfferPage;

import PageShell from "../components/common/PageShell";
import { Link } from "react-router-dom";
import { Plus, FileText } from "lucide-react";

const PlusIcon = (props) => <Plus {...props} />;
const DocumentIcon = (props) => <FileText {...props} />;

function RejectCandidatePage() {
  return (
    <PageShell
      title="Reject Candidate"
      active="candidates"
      backTo="/candidates"
    >
      <div className="card reject-card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [max-width:580px] [margin:0_auto] [border:1.5px_solid_#fecaca]">
        <div className="reject-head [display:flex] [align-items:center] [gap:14px] [margin-bottom:22px] [padding:14px] [background:#fef2f2] [border-radius:8px]">
          <div className="reject-icon [width:46px] [height:46px] [border-radius:50%] [background:#fee2e2] [display:flex] [align-items:center] [justify-content:center] [font-size:18px]">
            <PlusIcon className="[transform:rotate(45deg)]" size={18}  />
          </div>
          <div>
            <div className="font-bold">Priya Sharma</div>
            <div className="muted [font-size:12px] [color:#64748b]">
              Senior Frontend Dev · L2 Interview Stage
            </div>
          </div>
        </div>
        <div className="field [margin-bottom:14px]">
          <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]">Rejection Reason *</label>
          <select className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]">
            <option>Select reason</option>
            <option>Skill gap / Technical mismatch</option>
            <option>Experience not matching</option>
          </select>
        </div>
        <div className="field [margin-bottom:14px]">
          <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]">Internal Notes</label>
          <textarea className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]" rows="3" />
        </div>
        <div className="field [margin-bottom:14px]">
          <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]">Rejection Email Preview</label>
          <div className="email-preview [background:#f8fafc] [border-radius:8px] [padding:14px] [font-size:13px] [color:#1e293b] [line-height:1.75] [border:1px_solid_#e2e8f0]">Dear Priya, ...</div>
        </div>
        <div className="inline-actions end [justify-content:flex-end] [display:flex] [gap:10px] [margin-top:8px]">
          <Link to="/candidates" className="btn btn-ghost [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:transparent] [color:#64748b] [border:1px_solid_#e2e8f0]">
            Cancel
          </Link>
          <Link to="/reject-done" className="btn btn-danger [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#ef4444] [color:#fff]">
            <DocumentIcon size={14} /> Send Rejection & Close
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

export default RejectCandidatePage;

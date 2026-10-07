import PageShell from "../components/PageShell";

function SettingsPage() {
  return (
    <PageShell title="Settings" active="settings">
      <div className="card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px]">
        <h3 className="[.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px]">Company Profile</h3>
        <div className="grid2 [display:grid] [grid-template-columns:1fr_1fr] [gap:14px] max-[960px]:[grid-template-columns:1fr] max-[960px]:[flex-direction:column]">
          <div className="field [margin-bottom:14px]">
            <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]">Company Name</label>
            <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]" defaultValue="surgevector.ai." />
          </div>
          <div className="field [margin-bottom:14px]">
            <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]">Industry</label>
            <select className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]">
              <option>Technology</option>
            </select>
          </div>
        </div>
        <div className="field [margin-bottom:14px]">
          <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]">Company Website</label>
          <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]" defaultValue="https://surgevector.ai.io" />
        </div>
        <button type="button" className="btn btn-primary btn-sm [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#133f7d] [color:#fff] [padding:6px_14px] [font-size:12px]">
          Save Changes
        </button>
      </div>
      <div className="card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px]">
        <h3 className="[.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px]">Notification Preferences</h3>
        {[
          "New candidate applied",
          "Interview scheduled",
          "Evaluation submitted",
          "Offer accepted/rejected",
        ].map((item) => (
          <div key={item} className="setting-row [display:flex] [justify-content:space-between] [align-items:center] [padding:8px_0]">
            <span>{item}</span>
            <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]" type="checkbox" defaultChecked />
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export default SettingsPage;

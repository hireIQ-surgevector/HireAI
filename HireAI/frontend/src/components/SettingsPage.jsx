import PageShell from "./PageShell";

function SettingsPage() {
  return (
    <PageShell title="Settings" active="settings">
      <div className="card">
        <h3>Company Profile</h3>
        <div className="grid2">
          <div className="field">
            <label>Company Name</label>
            <input defaultValue="surgevector.ai." />
          </div>
          <div className="field">
            <label>Industry</label>
            <select>
              <option>Technology</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Company Website</label>
          <input defaultValue="https://surgevector.ai.io" />
        </div>
        <button type="button" className="btn btn-primary btn-sm">
          Save Changes
        </button>
      </div>
      <div className="card">
        <h3>Notification Preferences</h3>
        {[
          "New candidate applied",
          "Interview scheduled",
          "Evaluation submitted",
          "Offer accepted/rejected",
        ].map((item) => (
          <div key={item} className="setting-row">
            <span>{item}</span>
            <input type="checkbox" defaultChecked />
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export default SettingsPage;

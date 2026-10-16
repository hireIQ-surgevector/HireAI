import { Link } from "react-router-dom";

function InterviewRoomPage() {
  return (
    <div className="interview-room [min-height:100vh] [background:#0f172a] [color:#fff]">
      <div className="interview-topbar [padding:12px_22px] [border-bottom:1px_solid_rgba(255,255,255,0.1)] [display:flex] [align-items:center] [gap:12px]">
        <div className="brand-pill light [display:flex] [align-items:center] [justify-content:center] [gap:8px] [margin-bottom:8px] [justify-content:flex-start]">
          <div className="brand-badge [width:36px] [height:36px] [border-radius:9px] [background:#133f7d] [display:flex] [align-items:center] [justify-content:center] [font-weight:800] [color:#fff] [font-size:15px]">SV</div>
          <span className="brand-title white [font-weight:800] [color:#133f7d] [font-size:22px] [color:#fff]">TalentSync</span>
        </div>
        <span className="room-subtitle [color:rgba(255,255,255,0.4)] [font-size:12px]">
          IncVid · L2 Technical Interview — Priya Sharma
        </span>
        <div className="room-actions [margin-left:auto] [display:flex] [align-items:center] [gap:12px]">
          <span className="live-pill [background:rgba(239,68,68,0.2)] [border:1px_solid_rgba(239,68,68,0.4)] [border-radius:20px] [padding:4px_12px] [font-size:12px] [color:#fca5a5]">● LIVE · 00:00:00</span>
          <Link to="/evaluations" className="btn btn-danger btn-sm [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#ef4444] [color:#fff] [padding:6px_14px] [font-size:12px]">
            End Interview
          </Link>
        </div>
      </div>
      <div className="room-body max-[960px]:[grid-template-columns:1fr] max-[960px]:[flex-direction:column] [display:flex] [min-height:calc(100vh_-_60px)]">
        <div className="video-panel [flex:1] [padding:18px] [display:flex] [flex-direction:column] [gap:14px]">
          <div className="video-card [flex:1] [background:#1e293b] [border-radius:10px] [display:flex] [align-items:center] [justify-content:center] [flex-direction:column] [min-height:240px]">
            <div className="video-avatar [width:72px] [height:72px] [border-radius:50%] [background:#133f7d] [margin-bottom:10px] [display:flex] [align-items:center] [justify-content:center] [font-weight:800] [color:#fff] [font-size:24px]">PS</div>
            <div className="video-name [color:#fff] [font-weight:600]">Priya Sharma</div>
            <div className="video-meta [color:rgba(255,255,255,0.4)] [font-size:12px]">Candidate · Camera On</div>
          </div>
          <div className="room-tools [display:flex] [gap:8px]">
            {["🎤 Mute", "📷 Camera", "💻 Share"].map((tool) => (
              <button key={tool} className="room-tool [font:inherit] [background:rgba(255,255,255,0.12)] [border:none] [border-radius:8px] [color:#fff] [padding:7px_14px] [cursor:pointer] [font-size:12px]">
                {tool}
              </button>
            ))}
          </div>
        </div>
        <div className="room-sidebar max-[960px]:[width:100%] [width:280px] [background:#1e293b] [border-left:1px_solid_rgba(255,255,255,0.07)] [padding:16px] [overflow-y:auto]">
          <div className="sidebar-section [margin-bottom:20px]">
            <div className="sidebar-title [color:rgba(255,255,255,0.4)] [font-size:10px] [text-transform:uppercase] [letter-spacing:1px] [margin-bottom:10px]">AI Questions</div>
            {[
              "Explain React virtual DOM reconciliation",
              "How do you handle state management in large React apps?",
              "Describe performance optimization strategies in React.",
            ].map((question, index) => (
              <div
                key={question}
                className={`${(`question-card ${index === 1 ? "active" : ""}`)} [background:rgba(255,255,255,0.05)] [border-radius:8px] [padding:10px] [margin-bottom:7px] [border:1px_solid_rgba(255,255,255,0.06)] [color:rgba(255,255,255,0.7)] [font-size:11px] [line-height:1.5] [&.active]:[background:rgba(19,63,125,0.4)] [&.active]:[border-color:rgba(19,63,125,0.6)] [&.active]:[color:#fff]`}
              >
                {question}
              </div>
            ))}
          </div>
          <div className="sidebar-section [margin-bottom:20px]">
            <div className="sidebar-title [color:rgba(255,255,255,0.4)] [font-size:10px] [text-transform:uppercase] [letter-spacing:1px] [margin-bottom:10px]">AI Live Scoring</div>
            {[
              ["Technical Depth", 78],
              ["Communication", 85],
              ["Problem Approach", 72],
            ].map(([label, value]) => (
              <div key={label} className="score-row [margin-bottom:10px]">
                <div className="score-row-label [display:flex] [justify-content:space-between] [font-size:11px] [margin-bottom:4px] [color:rgba(255,255,255,0.7)]">{label}</div>
                <div className="score-row-value [color:#00b4d8] [font-weight:700]">{value}%</div>
                <div className="progress-bar [height:6px] [background:#e2e8f0] [border-radius:3px] [overflow:hidden] [margin-top:4px]">
                  <div
                    className="progress-fill [background:#00b4d8] [height:100%] [border-radius:3px] [transition:width_0.4s] [background:#133f7d] [border-radius:inherit] [transition:width_0.3s_ease]"
                    style={{width: `${value}%`}}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InterviewRoomPage;

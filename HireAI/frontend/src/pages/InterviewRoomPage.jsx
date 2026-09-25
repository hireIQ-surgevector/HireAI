import { Link } from "react-router-dom";

function InterviewRoomPage() {
  return (
    <div className="interview-room">
      <div className="interview-topbar">
        <div className="brand-pill light">
          <div className="brand-badge">SV</div>
          <span className="brand-title white">TalentSync</span>
        </div>
        <span className="room-subtitle">
          IncVid · L2 Technical Interview — Priya Sharma
        </span>
        <div className="room-actions">
          <span className="live-pill">● LIVE · 00:00:00</span>
          <Link to="/evaluations" className="btn btn-danger btn-sm">
            End Interview
          </Link>
        </div>
      </div>
      <div className="room-body">
        <div className="video-panel">
          <div className="video-card">
            <div className="video-avatar">PS</div>
            <div className="video-name">Priya Sharma</div>
            <div className="video-meta">Candidate · Camera On</div>
          </div>
          <div className="room-tools">
            {["🎤 Mute", "📷 Camera", "💻 Share"].map((tool) => (
              <button key={tool} className="room-tool">
                {tool}
              </button>
            ))}
          </div>
        </div>
        <div className="room-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-title">AI Questions</div>
            {[
              "Explain React virtual DOM reconciliation",
              "How do you handle state management in large React apps?",
              "Describe performance optimization strategies in React.",
            ].map((question, index) => (
              <div
                key={question}
                className={`question-card ${index === 1 ? "active" : ""}`}
              >
                {question}
              </div>
            ))}
          </div>
          <div className="sidebar-section">
            <div className="sidebar-title">AI Live Scoring</div>
            {[
              ["Technical Depth", 78],
              ["Communication", 85],
              ["Problem Approach", 72],
            ].map(([label, value]) => (
              <div key={label} className="score-row">
                <div className="score-row-label">{label}</div>
                <div className="score-row-value">{value}%</div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${value}%`, background: "var(--teal)" }}
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

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageShell from "./PageShell";

function ScheduleInterviewPage() {
  const navigate = useNavigate();

  const [selectedSlot, setSelectedSlot] = useState("Dec 22 · 10:00 AM");
  const [round, setRound] = useState("L2 – Advanced Technical");
  const [duration, setDuration] = useState("60 minutes");
  const [interviewer, setInterviewer] = useState("Rahul Kumar");

  const slots = [
    {
      date: "Monday, December 22",
      slots: [
        "10:00 AM",
        "2:00 PM",
      ],
    },
    {
      date: "Tuesday, December 23",
      slots: [
        "11:00 AM",
      ],
    },
    {
      date: "Wednesday, December 24",
      slots: [
        "4:00 PM",
      ],
    },
  ];

  const handleSchedule = () => {
    navigate("/interviews");
  };

  return (
    <PageShell
      title="Schedule Interview"
      active="interviews"
      backTo="/candidates"
    >
      <div className="stepbar">
        <div className="step-dot-wrap">
          <div className="step-dot done">✓</div>
          <span>Candidate</span>
        </div>

        <div className="step-dot-wrap">
          <div className="step-dot active">2</div>
          <span>Schedule</span>
        </div>

        <div className="step-dot-wrap">
          <div className="step-dot pending">3</div>
          <span>Review</span>
        </div>

        <div className="step-dot-wrap">
          <div className="step-dot pending">4</div>
          <span>Confirmation</span>
        </div>
      </div>

      <div className="interview-card">
        <div className="card">
          <div className="section-header">
            <div>
              <h3 style={{ marginBottom: "4px" }}>
                Select Interview Slot
              </h3>
              <p className="muted">
                Choose a suitable time for the candidate's interview.
              </p>
            </div>

            <span className="badge badge-blue">
              L2 Technical
            </span>
          </div>

          <div className="info-box">
            <strong>Candidate:</strong> Arjun Reddy
            <br />
            <span className="muted">
              Senior Software Engineer · Hyderabad
            </span>
          </div>

          <div className="grid2">
            <div className="field">
              <label>Interview Round</label>
              <select
                value={round}
                onChange={(e) => setRound(e.target.value)}
              >
                <option>L1 – Initial Technical</option>
                <option>L2 – Advanced Technical</option>
                <option>L3 – Managerial</option>
                <option>HR – Final Discussion</option>
              </select>
            </div>

            <div className="field">
              <label>Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                <option>30 minutes</option>
                <option>45 minutes</option>
                <option>60 minutes</option>
                <option>90 minutes</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Interviewer</label>
            <select
              value={interviewer}
              onChange={(e) => setInterviewer(e.target.value)}
            >
              <option>Rahul Kumar</option>
              <option>Rakesh Nair</option>
              <option>Priya Sharma</option>
              <option>Vikram Singh</option>
            </select>
          </div>

          <div className="field">
            <label>Available Slots</label>

            {slots.map((day) => (
              <div key={day.date} style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "var(--text)",
                    marginBottom: "8px",
                  }}
                >
                  {day.date}
                </div>

                <div className="slot-grid">
                  {day.slots.map((time) => {
                    const slot = `${day.date.split(",")[0]
                      ? day.date.replace(
                          /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), /,
                          ""
                        )
                      : day.date} · ${time}`;

                    const isSelected = selectedSlot === slot;

                    return (
                      <button
                        type="button"
                        key={slot}
                        className={`slot-card ${
                          isSelected ? "selected" : ""
                        }`}
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          background: isSelected
                            ? "var(--brand-light)"
                            : "var(--white)",
                          color: isSelected
                            ? "var(--brand)"
                            : "var(--text)",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: isSelected ? "700" : "600",
                            marginBottom: "3px",
                          }}
                        >
                          {time}
                        </div>

                        <div
                          style={{
                            fontSize: "10px",
                            color: "var(--muted)",
                          }}
                        >
                          {duration}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="detail-row">
            <span className="muted">Selected Slot</span>
            <strong>{selectedSlot}</strong>
          </div>

          <div className="detail-row">
            <span className="muted">Interviewer</span>
            <strong>{interviewer}</strong>
          </div>

          <div
            className="detail-row"
            style={{
              borderBottom: "none",
              marginBottom: "16px",
            }}
          >
            <span className="muted">Timezone</span>
            <strong>IST (UTC +5:30)</strong>
          </div>

          <div className="info-box success">
            <strong>Calendar invite</strong>
            <br />
            A calendar invitation will be automatically sent to the
            candidate and interviewer after the interview is scheduled.
          </div>

          <div
            className="flex-row"
            style={{
              justifyContent: "space-between",
              marginTop: "18px",
            }}
          >
            <Link to="/candidates" className="btn btn-secondary">
              ← Back
            </Link>

            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleSchedule}
            >
              Schedule Interview
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export default ScheduleInterviewPage;
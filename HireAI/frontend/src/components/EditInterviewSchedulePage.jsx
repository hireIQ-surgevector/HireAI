import { useEffect, useMemo, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import PageShell from "./PageShell";

import { API_URL, getAuthHeader } from "../utils/auth";

function EditInterviewSchedulePage() {
  const navigate = useNavigate();

  const { interviewId } = useParams();

  /* =========================
     STATE
  ========================= */

  const [interview, setInterview] = useState(null);

  const [interviewDate, setInterviewDate] = useState("");

  const [interviewTime, setInterviewTime] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  /* =========================
     GET INTERVIEW
  ========================= */

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${API_URL}/api/interviews`, {
          headers: {
            ...getAuthHeader(),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load interview.");
        }

        const interviews = await response.json();

        const selectedInterview = interviews.find(
          (item) => String(item.id) === String(interviewId),
        );

        if (!selectedInterview) {
          throw new Error("Interview not found.");
        }

        setInterview(selectedInterview);

        /* =========================
           SPLIT DATE AND TIME
        ========================= */

        if (selectedInterview.scheduled_at) {
          const date = new Date(selectedInterview.scheduled_at);

          const formattedDate = date.toISOString().split("T")[0];

          const formattedTime = date.toTimeString().slice(0, 5);

          setInterviewDate(formattedDate);

          setInterviewTime(formattedTime);
        }
      } catch (error) {
        console.error("Error loading interview:", error);

        setError(error.message || "Unable to load interview.");
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [interviewId]);

  /* =========================
     TODAY
  ========================= */

  const today = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  /* =========================
     SAVE CHANGES
  ========================= */

  const handleSave = async () => {
    if (!interviewDate) {
      alert("Please select an interview date.");
      return;
    }

    if (!interviewTime) {
      alert("Please select an interview time.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_URL}/api/interviews/${interviewId}/schedule`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",

            ...getAuthHeader(),
          },

          body: JSON.stringify({
            interview_date: interviewDate,

            interview_time: interviewTime,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update interview schedule.");
      }

      navigate("/interviews");
    } catch (error) {
      console.error("Error updating interview:", error);

      alert(error.message || "Failed to update interview schedule.");
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <PageShell title="Edit Interview" backTo="/interviews">
        <div
          className="card"
          style={{
            padding: "32px",
            textAlign: "center",
          }}
        >
          Loading interview...
        </div>
      </PageShell>
    );
  }

  /* =========================
     ERROR
  ========================= */

  if (error) {
    return (
      <PageShell title="Edit Interview" backTo="/interviews">
        <div className="error-box">{error}</div>
      </PageShell>
    );
  }

  /* =========================
     PAGE
  ========================= */

  return (
    <PageShell title="Edit Interview Schedule" backTo="/interviews">
      <div className="interview-card">
        <div className="card">
          {/* HEADER */}

          <div className="section-header">
            <div>
              <h3
                style={{
                  marginBottom: "4px",
                }}
              >
                Edit Interview Schedule
              </h3>

              <p className="muted">
                You can only change the interview date and time.
              </p>
            </div>
          </div>

          {/* INTERVIEW DETAILS */}

          <div
            className="info-box"
            style={{
              marginBottom: "24px",
            }}
          >
            <strong>{interview?.candidate_name}</strong>

            <br />

            <span>
              Position: <strong>{interview?.role_name}</strong>
            </span>

            <br />

            <span>
              Interview Round: <strong>{interview?.round}</strong>
            </span>
          </div>

          {/* READ ONLY INFORMATION */}

          <div className="grid2">
            <div className="field">
              <label>Candidate</label>

              <input
                type="text"
                value={interview?.candidate_name || ""}
                readOnly
                style={{
                  background: "var(--gray)",

                  cursor: "not-allowed",
                }}
              />
            </div>

            <div className="field">
              <label>Interview Round</label>

              <input
                type="text"
                value={interview?.round || ""}
                readOnly
                style={{
                  background: "var(--gray)",

                  cursor: "not-allowed",
                }}
              />
            </div>
          </div>

          {/* EDITABLE SCHEDULE */}

          <div
            style={{
              marginTop: "24px",
              marginBottom: "12px",
            }}
          >
            <h3
              style={{
                marginBottom: "4px",
              }}
            >
              Schedule
            </h3>

            <p className="muted">Update the interview date and time.</p>
          </div>

          <div className="grid2">
            {/* DATE */}

            <div className="field">
              <label>Interview Date</label>

              <input
                type="date"
                min={today}
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
              />
            </div>

            {/* TIME */}

            <div className="field">
              <label>Interview Time</label>

              <input
                type="time"
                value={interviewTime}
                onChange={(e) => setInterviewTime(e.target.value)}
              />
            </div>
          </div>

          {/* SUMMARY */}

          {(interviewDate || interviewTime) && (
            <div
              className="info-box success"
              style={{
                marginTop: "20px",
              }}
            >
              <strong>Updated Schedule</strong>
              <br />
              Date: {interviewDate || "Not selected"}
              <br />
              Time: {interviewTime || "Not selected"}
            </div>
          )}

          {/* ACTIONS */}

          <div
            className="flex-row"
            style={{
              justifyContent: "space-between",

              marginTop: "24px",
            }}
          >
            <Link to="/interviews" className="btn btn-secondary">
              Cancel
            </Link>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{
                opacity: saving ? 0.6 : 1,

                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export default EditInterviewSchedulePage;

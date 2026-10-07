import { useEffect, useMemo, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import PageShell from "../components/PageShell";

import { API_URL, getAuthHeader } from "../utils/auth";
import toast from "react-hot-toast";

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
        toast.error(error.message || "Unable to load interview.");
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
      toast.error("Please select an interview date.");
      return;
    }

    if (!interviewTime) {
      toast.error("Please select an interview time.");
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

      toast.success("Interview schedule updated successfully.");
      navigate("/interviews");
    } catch (error) {
      console.error("Error updating interview:", error);

      toast.error(error.message || "Failed to update interview schedule.");
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
          className="card [padding:32px] [text-align:center] [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px]"

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
        <div className="error-box [background:#fee2e2] [color:#991b1b] [padding:10px] [border-radius:8px] [font-size:12px] [margin-bottom:10px]">{error}</div>
      </PageShell>
    );
  }

  /* =========================
     PAGE
  ========================= */

  return (
    <PageShell title="Edit Interview Schedule" backTo="/interviews">
      <div className="interview-card [max-width:640px] [margin:0_auto] [max-width:760px] max-[640px]:[max-width:100%]">
        <div className="card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [.interview-card_&]:[width:100%]">
          {/* HEADER */}

          <div className="section-header [display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:14px]">
            <div>
              <h3 className="[margin-bottom:4px] [.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px]"

              >
                Edit Interview Schedule
              </h3>

              <p className="muted [font-size:12px] [color:#64748b]">
                You can only change the interview date and time.
              </p>
            </div>
          </div>

          {/* INTERVIEW DETAILS */}

          <div
            className="info-box [margin-bottom:24px] [background:#e0f7fa] [border:1px_solid_#b2ebf2] [border-radius:8px] [padding:12px] [font-size:13px] [color:#006064] [margin-bottom:16px]"

          >
            <strong className="[font-weight:700]">{interview?.candidate_name}</strong>

            <br />

            <span>
              Position: <strong className="[font-weight:700]">{interview?.role_name}</strong>
            </span>

            <br />

            <span>
              Interview Round: <strong className="[font-weight:700]">{interview?.round}</strong>
            </span>
          </div>

          {/* READ ONLY INFORMATION */}

          <div className="grid2 [display:grid] [grid-template-columns:1fr_1fr] [gap:14px] max-[960px]:[grid-template-columns:1fr] max-[960px]:[flex-direction:column] max-[640px]:[.interview-card_&]:[grid-template-columns:1fr]">
            <div className="field [margin-bottom:14px]">
              <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]">Candidate</label>

              <input className="[background:#f8fafc] [cursor:not-allowed] [font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [.interview-card_&]:[opacity:0.95] [.interview-card_&]:[cursor:pointer] focus:[.interview-card_&]:[border-color:#133f7d] focus:[.interview-card_&]:[box-shadow:0_0_0_3px_rgba(19,_63,_125,_0.08)] [.interview-card_&]:[border-color:#e2e8f0]"
                type="text"
                value={interview?.candidate_name || ""}
                readOnly

              />
            </div>

            <div className="field [margin-bottom:14px]">
              <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]">Interview Round</label>

              <input className="[background:#f8fafc] [cursor:not-allowed] [font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [.interview-card_&]:[opacity:0.95] [.interview-card_&]:[cursor:pointer] focus:[.interview-card_&]:[border-color:#133f7d] focus:[.interview-card_&]:[box-shadow:0_0_0_3px_rgba(19,_63,_125,_0.08)] [.interview-card_&]:[border-color:#e2e8f0]"
                type="text"
                value={interview?.round || ""}
                readOnly

              />
            </div>
          </div>

          {/* EDITABLE SCHEDULE */}

          <div className="[margin-top:24px] [margin-bottom:12px]"

          >
            <h3 className="[margin-bottom:4px] [.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px]"

            >
              Schedule
            </h3>

            <p className="muted [font-size:12px] [color:#64748b]">Update the interview date and time.</p>
          </div>

          <div className="grid2 [display:grid] [grid-template-columns:1fr_1fr] [gap:14px] max-[960px]:[grid-template-columns:1fr] max-[960px]:[flex-direction:column] max-[640px]:[.interview-card_&]:[grid-template-columns:1fr]">
            {/* DATE */}

            <div className="field [margin-bottom:14px]">
              <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]">Interview Date</label>

              <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [.interview-card_&]:[opacity:0.95] [.interview-card_&]:[cursor:pointer] focus:[.interview-card_&]:[border-color:#133f7d] focus:[.interview-card_&]:[box-shadow:0_0_0_3px_rgba(19,_63,_125,_0.08)] [.interview-card_&]:[border-color:#e2e8f0]"
                type="date"
                min={today}
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
              />
            </div>

            {/* TIME */}

            <div className="field [margin-bottom:14px]">
              <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]">Interview Time</label>

              <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [.interview-card_&]:[opacity:0.95] [.interview-card_&]:[cursor:pointer] focus:[.interview-card_&]:[border-color:#133f7d] focus:[.interview-card_&]:[box-shadow:0_0_0_3px_rgba(19,_63,_125,_0.08)] [.interview-card_&]:[border-color:#e2e8f0]"
                type="time"
                value={interviewTime}
                onChange={(e) => setInterviewTime(e.target.value)}
              />
            </div>
          </div>

          {/* SUMMARY */}

          {(interviewDate || interviewTime) && (
            <div
              className="info-box success [margin-top:20px] [background:#e0f7fa] [border:1px_solid_#b2ebf2] [border-radius:8px] [padding:12px] [font-size:13px] [color:#006064] [margin-bottom:16px] [background:#dcfce7] [border-color:#86efac] [color:#166534]"

            >
              <strong className="[font-weight:700]">Updated Schedule</strong>
              <br />
              Date: {interviewDate || "Not selected"}
              <br />
              Time: {interviewTime || "Not selected"}
            </div>
          )}

          {/* ACTIONS */}

          <div
            className="flex-row [justify-content:space-between] [margin-top:24px] [display:flex] [align-items:center] [gap:10px]"

          >
            <Link to="/interviews" className="btn btn-secondary [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#fff] [color:#133f7d] [border:1.5px_solid_#133f7d]">
              Cancel
            </Link>

            <button
              type="button"
              className={`btn btn-primary [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#133f7d] [color:#fff] ${saving ? "[opacity:0.6] [cursor:not-allowed]" : "[opacity:1] [cursor:pointer]"}`}
              onClick={handleSave}
              disabled={saving}
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

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageShell from "../components/common/PageShell";
import PageState from "../components/common/PageState";
import { API_URL, getAuthHeader } from "../utils/auth";
import toast from "react-hot-toast";

function ScheduleInterviewPage() {
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState("");

  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [duration, setDuration] = useState("60");

  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [candidateError, setCandidateError] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  /*
   * Fetch candidates from the existing API.
   */
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoadingCandidates(true);
        setCandidateError("");

        const response = await fetch(`${API_URL}/api/candidates`, {
          headers: {
            ...getAuthHeader(),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch candidates.");
        }

        const data = await response.json();

        console.log("Candidates API response:", data);

        if (!Array.isArray(data)) {
          throw new Error("Invalid candidate data received.");
        }

        setCandidates(data);
      } catch (error) {
        console.error("Error fetching candidates:", error);

        setCandidateError(error.message || "Unable to load candidates.");
        toast.error(error.message || "Unable to load candidates.");
      } finally {
        setLoadingCandidates(false);
      }
    };

    fetchCandidates();
  }, [loadAttempt]);

  /* Show candidates when their next round is available and not already booked. */
  const eligibleCandidates = useMemo(() => {
    const allowedStages = new Set(["shortlisted", "l1 interview"]);

    return candidates.filter((candidate) => {
      const stage = String(candidate.stage || candidate.current_status || "")
        .trim()
        .toLowerCase();
      const nextRound =
        stage === "shortlisted"
          ? "L1 Interview"
          : stage === "l1 interview"
            ? "L2 Interview"
            : stage === "l2 interview"
              ? "Client Interview"
              : "";
      const alreadyScheduled = (candidate.scheduled_interviews || []).some(
        (interview) =>
          interview.round === nextRound &&
          interview.scheduled_at &&
          new Date(interview.scheduled_at) >= new Date(),
      );

      return (
        candidate.candidate_id &&
        candidate.name &&
        nextRound &&
        !alreadyScheduled &&
        (allowedStages.has(stage) || stage === "l2 interview")
      );
    });
  }, [candidates]);

  /*
   * Find selected candidate.
   */
  const selectedCandidate = useMemo(() => {
    return eligibleCandidates.find(
      (candidate) =>
        String(candidate.candidate_id) === String(selectedCandidateId),
    );
  }, [eligibleCandidates, selectedCandidateId]);

  /* This is based on the candidate's CURRENT stage. */
  const nextInterviewRound = useMemo(() => {
    if (!selectedCandidate) {
      return "";
    }

    const stage = String(selectedCandidate.stage || "")
      .trim()
      .toLowerCase();

    switch (stage) {
      /*
       * Candidate has been shortlisted
       * → Next interview is L1
       */
      case "shortlisted":
        return "L1 Interview";

      /*
       * Candidate has completed or is at L1
       * → Next interview is L2
       */
      case "l1 interview":
      case "l1 cleared":
        return "L2 Interview";

      /*
       * Candidate has completed or is at L2
       * → Next interview is Client Interview
       */
      case "l2 interview":
      case "l2 cleared":
        return "Client Interview";

      /*
       * Candidate has completed Client Interview
       * → Next stage can be Offer
       *
       * Since there is no further interview,
       * return empty.
       */
      case "client interview":
      case "client cleared":
        return "";

      default:
        return "";
    }
  }, [selectedCandidate]);

  /*
   * Get today's date.
   *
   * Used to prevent past date selection.
   */
  const today = new Date().toISOString().split("T")[0];

  /*
   * Reset schedule fields when candidate changes.
   */
  const handleCandidateChange = (event) => {
    const candidateId = event.target.value;

    setSelectedCandidateId(candidateId);
    setInterviewDate("");
    setInterviewTime("");
  };

  /*
   * Schedule interview.
   */
  const handleSchedule = async () => {
    if (!selectedCandidate) {
      toast.error("Please select a candidate.");
      return;
    }

    if (!nextInterviewRound) {
      toast.error("There is no next interview round available for this candidate.");
      return;
    }

    if (!interviewDate) {
      toast.error("Please select an interview date.");
      return;
    }

    if (!interviewTime) {
      toast.error("Please select an interview time.");
      return;
    }

    try {
      setScheduling(true);

      const payload = {
        candidate_id: selectedCandidate.candidate_id,
        interview_round: nextInterviewRound,
        interview_date: interviewDate,
        interview_time: interviewTime,
        duration: Number(duration),
      };

      console.log("Interview payload:", payload);

      const response = await fetch(`${API_URL}/api/interviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to schedule interview.");
      }

      toast.success("Interview scheduled successfully.");
      navigate("/interviews");
    } catch (error) {
      console.error("Error scheduling interview:", error);

      toast.error(error.message || "Failed to schedule interview.");
    } finally {
      setScheduling(false);
    }
  };

  return (
    <PageShell
      title="Schedule Interview"
      active="interviews"
      backTo="/interviews"
    >
      <div className="interview-card [max-width:640px] [margin:0_auto] [max-width:760px] max-[640px]:[max-width:100%]">
        <div className="card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [.interview-card_&]:[width:100%]">
          {/* HEADER */}
          <div className="section-header [display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:14px]">
            <div>
              <h3 className="[margin-bottom:4px] [.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px]" >Schedule Interview</h3>

              <p className="muted [font-size:12px] [color:#64748b]">
                Select a candidate and schedule their next interview round.
              </p>
            </div>
          </div>

          {/* CANDIDATE */}
          <div className="field [margin-bottom:14px]">
            <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]">Candidate</label>

            {loadingCandidates ? (
              <PageState
                variant="loading"
                title="Loading eligible candidates"
                rows={2}
              />
            ) : candidateError ? (
              <PageState
                variant="error"
                title="Couldn't load candidates"
                description={candidateError}
                onRetry={() => setLoadAttempt((attempt) => attempt + 1)}
              />
            ) : (
              <select className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] focus:[.interview-card_&]:[border-color:#133f7d] focus:[.interview-card_&]:[box-shadow:0_0_0_3px_rgba(19,_63,_125,_0.08)] [.interview-card_&]:[cursor:pointer]"
                value={selectedCandidateId}
                onChange={handleCandidateChange}
              >
                <option value="">Select a candidate</option>

                {eligibleCandidates.map((candidate) => (
                  <option
                    key={candidate.candidate_id}
                    value={candidate.candidate_id}
                  >
                    {candidate.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* NO ELIGIBLE CANDIDATES */}
          {!loadingCandidates &&
            !candidateError &&
            eligibleCandidates.length === 0 && (
              <PageState
                variant="empty"
                title="No candidates available"
                description="There are currently no candidates eligible for another interview round."
                className="my-4"
              />
            )}

          {/* SELECTED CANDIDATE */}
          {selectedCandidate && (
            <>
              <div
                className="info-box [margin-top:4px] [background:#e0f7fa] [border:1px_solid_#b2ebf2] [border-radius:8px] [padding:12px] [font-size:13px] [color:#006064] [margin-bottom:16px]"

              >
                <strong className="[font-weight:700]">{selectedCandidate.name}</strong>

                <br />

                <span>
                  Current Stage: <strong className="[font-weight:700]">{selectedCandidate.stage}</strong>
                </span>
              </div>

              {/* INTERVIEW DETAILS */}
              <div className="[margin-top:22px] [margin-bottom:12px]"

              >
                <h3 className="[margin-bottom:4px] [.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px]"

                >
                  Interview Details
                </h3>

                <p className="muted [font-size:12px] [color:#64748b]">
                  The next interview round is automatically determined from the
                  candidate's current stage.
                </p>
              </div>

              <div className="grid2 [display:grid] [grid-template-columns:1fr_1fr] [gap:14px] max-[960px]:[grid-template-columns:1fr] max-[960px]:[flex-direction:column] max-[640px]:[.interview-card_&]:[grid-template-columns:1fr]">
                {/* CURRENT STAGE */}
                <div className="field [margin-bottom:14px]">
                  <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]">Current Stage</label>

                  <input className="[background:#f8fafc] [cursor:not-allowed] [font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [.interview-card_&]:[opacity:0.95] [.interview-card_&]:[cursor:pointer] focus:[.interview-card_&]:[border-color:#133f7d] focus:[.interview-card_&]:[box-shadow:0_0_0_3px_rgba(19,_63,_125,_0.08)] [.interview-card_&]:[border-color:#e2e8f0]"
                    type="text"
                    value={selectedCandidate.stage || ""}
                    readOnly

                  />
                </div>

                {/* NEXT ROUND */}
                <div className="field [margin-bottom:14px]">
                  <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]">Next Interview Round</label>

                  <input className="[background:#e8f0fb] [color:#133f7d] [font-weight:700] [cursor:not-allowed] [font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [.interview-card_&]:[opacity:0.95] [.interview-card_&]:[cursor:pointer] focus:[.interview-card_&]:[border-color:#133f7d] focus:[.interview-card_&]:[box-shadow:0_0_0_3px_rgba(19,_63,_125,_0.08)] [.interview-card_&]:[border-color:#e2e8f0]"
                    type="text"
                    value={nextInterviewRound}
                    readOnly

                  />
                </div>
              </div>

              {/* DURATION */}
              <div className="field [margin-bottom:14px]">
                <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]">Duration</label>

                <select className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] focus:[.interview-card_&]:[border-color:#133f7d] focus:[.interview-card_&]:[box-shadow:0_0_0_3px_rgba(19,_63,_125,_0.08)] [.interview-card_&]:[cursor:pointer]"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="30">30 minutes</option>

                  <option value="45">45 minutes</option>

                  <option value="60">60 minutes</option>

                  <option value="90">90 minutes</option>
                </select>
              </div>

              {/* SCHEDULE */}
              <div className="[margin-top:22px] [margin-bottom:12px]"

              >
                <h3 className="[margin-bottom:4px] [.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px]"

                >
                  Schedule
                </h3>

                <p className="muted [font-size:12px] [color:#64748b]">
                  Select the date and time for the interview.
                </p>
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
                <div className="info-box success [background:#e0f7fa] [border:1px_solid_#b2ebf2] [border-radius:8px] [padding:12px] [font-size:13px] [color:#006064] [margin-bottom:16px] [background:#dcfce7] [border-color:#86efac] [color:#166534]">
                  <strong className="[font-weight:700]">Interview Details</strong>
                  <br />
                  Candidate: {selectedCandidate.name}
                  <br />
                  Round: {nextInterviewRound || "No further interview"}
                  <br />
                  Date: {interviewDate || "Not selected"}
                  <br />
                  Time: {interviewTime || "Not selected"}
                  <br />
                  Duration: {duration} minutes
                </div>
              )}

              {/* CALENDAR INFO */}
              <div className="info-box [background:#e0f7fa] [border:1px_solid_#b2ebf2] [border-radius:8px] [padding:12px] [font-size:13px] [color:#006064] [margin-bottom:16px]">
                <strong className="[font-weight:700]">Calendar invite</strong>
                <br />A calendar invitation will be automatically sent to the
                candidate after the interview is scheduled.
              </div>

              {/* ACTIONS */}
              <div
                className="flex-row [justify-content:space-between] [margin-top:18px] [display:flex] [align-items:center] [gap:10px]"

              >
                <Link to="/candidates" className="btn btn-secondary [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#fff] [color:#133f7d] [border:1.5px_solid_#133f7d]">
                  ← Back
                </Link>

                <button
                  type="button"
                  className={`btn btn-primary btn-lg [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#133f7d] [color:#fff] [padding:13px_28px] [font-size:15px] ${scheduling || !nextInterviewRound ? "[opacity:0.6] [cursor:not-allowed]" : "[opacity:1] [cursor:pointer]"}`}
                  onClick={handleSchedule}
                  disabled={scheduling || !nextInterviewRound}
                >
                  {scheduling ? "Scheduling..." : "Schedule Interview"}
                </button>
              </div>
            </>
          )}

          {/* NO CANDIDATE SELECTED */}
          {!selectedCandidate &&
            !loadingCandidates &&
            !candidateError &&
            eligibleCandidates.length > 0 && (
              <div className="[margin-top:18px]"

              >
                <div className="candidate-empty-state [min-height:280px] [padding:40px_20px] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center] [text-align:center]">
                  <div className="empty-icon [width:58px] [height:58px] [border-radius:50%] [background:#e8f0fb] [color:#133f7d] [display:flex] [align-items:center] [justify-content:center]">
                    <span className="[font-size:24px]"

                    >
                      👤
                    </span>
                  </div>

                  <h3 className="[.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px] [.candidate-empty-state_&]:[margin:14px_0_5px] [.candidate-empty-state_&]:[font-size:16px]">Select a candidate</h3>

                  <p className="[.candidate-empty-state_&]:[color:#64748b] [.candidate-empty-state_&]:[font-size:13px] [.candidate-empty-state_&]:[margin-bottom:16px]">
                    Choose a candidate above to schedule their next interview
                    round.
                  </p>
                </div>
              </div>
            )}
        </div>
      </div>
    </PageShell>
  );
}

export default ScheduleInterviewPage;

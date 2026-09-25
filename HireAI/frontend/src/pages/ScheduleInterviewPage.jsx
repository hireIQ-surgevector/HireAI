import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell";
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
  }, []);

  /* Only candidates at the scheduling entry stages should be displayed. */
  const eligibleCandidates = useMemo(() => {
    const allowedStages = new Set(["shortlisted", "l1 interview"]);

    return candidates.filter((candidate) => {
      const stage = String(candidate.stage || candidate.current_status || "")
        .trim()
        .toLowerCase();

      return (
        candidate.candidate_id &&
        candidate.name &&
        !candidate.has_interview &&
        allowedStages.has(stage)
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
      <div className="interview-card">
        <div className="card">
          {/* HEADER */}
          <div className="section-header">
            <div>
              <h3 style={{ marginBottom: "4px" }}>Schedule Interview</h3>

              <p className="muted">
                Select a candidate and schedule their next interview round.
              </p>
            </div>
          </div>

          {/* CANDIDATE */}
          <div className="field">
            <label>Candidate</label>

            {loadingCandidates ? (
              <div
                style={{
                  padding: "10px 12px",
                  border: "1.5px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--muted)",
                  background: "var(--gray)",
                }}
              >
                Loading candidates...
              </div>
            ) : candidateError ? (
              <div className="error-box">{candidateError}</div>
            ) : (
              <select
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
              <div className="candidate-empty-state">
                <div className="empty-icon">
                  <span
                    style={{
                      fontSize: "24px",
                    }}
                  >
                    👤
                  </span>
                </div>

                <h3>No candidates available</h3>

                <p>
                  There are currently no candidates eligible for another
                  interview round.
                </p>
              </div>
            )}

          {/* SELECTED CANDIDATE */}
          {selectedCandidate && (
            <>
              <div
                className="info-box"
                style={{
                  marginTop: "4px",
                }}
              >
                <strong>{selectedCandidate.name}</strong>

                <br />

                <span>
                  Current Stage: <strong>{selectedCandidate.stage}</strong>
                </span>
              </div>

              {/* INTERVIEW DETAILS */}
              <div
                style={{
                  marginTop: "22px",
                  marginBottom: "12px",
                }}
              >
                <h3
                  style={{
                    marginBottom: "4px",
                  }}
                >
                  Interview Details
                </h3>

                <p className="muted">
                  The next interview round is automatically determined from the
                  candidate's current stage.
                </p>
              </div>

              <div className="grid2">
                {/* CURRENT STAGE */}
                <div className="field">
                  <label>Current Stage</label>

                  <input
                    type="text"
                    value={selectedCandidate.stage || ""}
                    readOnly
                    style={{
                      background: "var(--gray)",
                      cursor: "not-allowed",
                    }}
                  />
                </div>

                {/* NEXT ROUND */}
                <div className="field">
                  <label>Next Interview Round</label>

                  <input
                    type="text"
                    value={nextInterviewRound}
                    readOnly
                    style={{
                      background: "var(--brand-light)",
                      color: "var(--brand)",
                      fontWeight: "700",
                      cursor: "not-allowed",
                    }}
                  />
                </div>
              </div>

              {/* DURATION */}
              <div className="field">
                <label>Duration</label>

                <select
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
              <div
                style={{
                  marginTop: "22px",
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

                <p className="muted">
                  Select the date and time for the interview.
                </p>
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
                <div className="info-box success">
                  <strong>Interview Details</strong>
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
              <div className="info-box">
                <strong>Calendar invite</strong>
                <br />A calendar invitation will be automatically sent to the
                candidate after the interview is scheduled.
              </div>

              {/* ACTIONS */}
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
                  disabled={scheduling || !nextInterviewRound}
                  style={{
                    opacity: scheduling || !nextInterviewRound ? 0.6 : 1,
                    cursor:
                      scheduling || !nextInterviewRound
                        ? "not-allowed"
                        : "pointer",
                  }}
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
              <div
                style={{
                  marginTop: "18px",
                }}
              >
                <div className="candidate-empty-state">
                  <div className="empty-icon">
                    <span
                      style={{
                        fontSize: "24px",
                      }}
                    >
                      👤
                    </span>
                  </div>

                  <h3>Select a candidate</h3>

                  <p>
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

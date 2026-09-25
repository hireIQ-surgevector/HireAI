import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

import PageShell from "../components/PageShell";
import { API_URL, getAuthHeader } from "../utils/auth";

const STAGES = [
  "Shortlisted",
  "L1 Interview",
  "L2 Interview",
  "Client Interview",
  "Offer Sent",
];

function getStage(candidate) {
  return candidate.stage || candidate.current_status || candidate.status || "Shortlisted";
}

function EvaluationsPage() {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const loadCandidates = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/api/candidates`, {
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load candidates");

      const activeCandidates = (Array.isArray(data) ? data : []).filter((candidate) => {
        const stage = getStage(candidate);
        const hasPersistedScore = candidate.ai_score !== null && candidate.ai_score !== undefined;

        return (
          hasPersistedScore &&
          stage !== "New" &&
          !["Rejected", "Offer Sent"].includes(stage)
        );
      });
      setCandidates(activeCandidates);
      setSelectedCandidateId((current) =>
        activeCandidates.some((candidate) => String(candidate.candidate_id) === String(current))
          ? current
          : String(activeCandidates[0]?.candidate_id || ""),
      );
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const taskId = window.setTimeout(loadCandidates, 0);
    return () => window.clearTimeout(taskId);
  }, []);

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => String(candidate.candidate_id) === String(selectedCandidateId)),
    [candidates, selectedCandidateId],
  );
  const currentStage = selectedCandidate ? getStage(selectedCandidate) : "Shortlisted";
  const currentIndex = STAGES.indexOf(currentStage);
  const nextStage = currentIndex >= 0 ? STAGES[currentIndex + 1] : null;

  const updateStage = async (stage) => {
    if (!selectedCandidate) return;
    try {
      setSaving(true);
      setError("");
      setFeedback("");
      const response = await fetch(`${API_URL}/api/candidates/${selectedCandidate.candidate_id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ stage }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update candidate stage");

      setFeedback(stage === "Rejected" ? "Candidate rejected." : `Candidate moved to ${stage}.`);
      await loadCandidates();
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell title="Candidate Evaluations">
      <div className="evaluation-page">
        <div className="evaluation-header">
          <div>
            <p className="evaluation-eyebrow">CANDIDATE EVALUATION</p>
            <h2>Review and advance candidates</h2>
            <p>Select a candidate, review their current stage, and make only the next valid decision.</p>
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}
        {feedback && <div className="info-box success">{feedback}</div>}

        <div className="evaluation-selector card">
          <label htmlFor="evaluation-candidate">Select candidate</label>
          <div className="evaluation-select-wrap">
            <select
              id="evaluation-candidate"
              value={selectedCandidateId}
              onChange={(event) => setSelectedCandidateId(event.target.value)}
              disabled={loading || candidates.length === 0}
            >
              <option value="">{loading ? "Loading candidates..." : "Choose a candidate"}</option>
              {candidates.map((candidate) => (
                <option key={candidate.candidate_id} value={candidate.candidate_id}>
                  {candidate.name || "Unknown candidate"} - {getStage(candidate)}
                </option>
              ))}
            </select>
            <ChevronDown size={17} />
          </div>
        </div>

        {selectedCandidate ? (
          <div className="evaluation-layout">
            <div className="evaluation-main-card">
              <div className="evaluation-card-header">
                <div>
                  <h3>{selectedCandidate.name || "Unknown candidate"}</h3>
                  <p>{selectedCandidate.role || selectedCandidate.current_role || "Role not specified"}</p>
                </div>
                <span className="evaluation-status">{currentStage}</span>
              </div>

              <div className="evaluation-summary">
                <div className="overall-score">
                  <div className="overall-score-circle">
                    <span>{selectedCandidate.score || 0}</span>
                    <small>/100</small>
                  </div>
                  <div className="overall-score-info">
                    <span className="overall-label">AI match score</span>
                    <strong>{nextStage ? `Next: ${nextStage}` : "Final stage"}</strong>
                    <p>Only the immediate next stage is available from the current stage.</p>
                  </div>
                </div>
              </div>

              <div className="evaluation-stage-track">
                {STAGES.map((stage, index) => (
                  <span key={stage} className={index <= currentIndex ? "active" : ""}>
                    {stage.replace(" Interview", "")}
                  </span>
                ))}
              </div>

              <div className="evaluation-actions">
                {nextStage ? (
                  <button type="button" className="evaluation-advance-btn" onClick={() => updateStage(nextStage)} disabled={saving}>
                    <Check size={17} />
                    Advance to {nextStage}
                  </button>
                ) : (
                  <span className="info-box">This candidate has reached the final stage.</span>
                )}
                <button type="button" className="evaluation-reject-btn" onClick={() => updateStage("Rejected")} disabled={saving}>
                  <X size={17} />
                  Reject candidate
                </button>
              </div>
            </div>

            <div className="evaluation-feedback-card">
              <div className="evaluation-card-header">
                <div>
                  <h3>Evaluation notes</h3>
                  <p>Capture the reasoning behind this stage decision.</p>
                </div>
              </div>
              <div className="final-recommendation-section">
                <label htmlFor="evaluation-notes">Notes</label>
                <textarea id="evaluation-notes" rows="8" value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Add evaluation notes..." />
              </div>
            </div>
          </div>
        ) : !loading ? (
          <div className="evaluation-empty card">No active candidates are available for evaluation.</div>
        ) : null}
      </div>
    </PageShell>
  );
}

export default EvaluationsPage;

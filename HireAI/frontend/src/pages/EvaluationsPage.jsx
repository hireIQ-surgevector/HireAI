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
      <div className="evaluation-page [width:100%] [max-width:1300px] [margin:0_auto]">
        <div className="evaluation-header [display:flex] [align-items:flex-start] [justify-content:space-between] [gap:24px] [padding:6px_2px_24px] max-[700px]:[flex-direction:column]">
          <div>
            <p className="evaluation-eyebrow [font-size:10px] [font-weight:800] [letter-spacing:1.2px] [color:#00b4d8] [margin-bottom:7px] [&:not(.evaluation-eyebrow)]:[.evaluation-header_&]:[font-size:13px] [&:not(.evaluation-eyebrow)]:[.evaluation-header_&]:[color:#64748b] [&:not(.evaluation-eyebrow)]:[.evaluation-header_&]:[max-width:600px] [&:not(.evaluation-eyebrow)]:[.evaluation-header_&]:[line-height:1.6]">CANDIDATE EVALUATION</p>
            <h2 className="[.evaluation-header_&]:[font-size:24px] [.evaluation-header_&]:[font-weight:750] [.evaluation-header_&]:[color:#1e293b] [.evaluation-header_&]:[margin-bottom:7px] max-[700px]:[.evaluation-header_&]:[font-size:21px]">Review and advance candidates</h2>
            <p>Select a candidate, review their current stage, and make only the next valid decision.</p>
          </div>
        </div>

        {error && <div className="error-box [background:#fee2e2] [color:#991b1b] [padding:10px] [border-radius:8px] [font-size:12px] [margin-bottom:10px]">{error}</div>}
        {feedback && <div className="info-box success [background:#e0f7fa] [border:1px_solid_#b2ebf2] [border-radius:8px] [padding:12px] [font-size:13px] [color:#006064] [margin-bottom:16px] [background:#dcfce7] [border-color:#86efac] [color:#166534]">{feedback}</div>}

        <div className="evaluation-selector card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [margin-bottom:20px]">
          <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold] [.evaluation-selector_&]:[margin-bottom:8px]" htmlFor="evaluation-candidate">Select candidate</label>
          <div className="evaluation-select-wrap [position:relative]">
            <select className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [.evaluation-select-wrap_&]:[appearance:none] [.evaluation-select-wrap_&]:[padding-right:42px] [.evaluation-select-wrap_&]:[cursor:pointer]"
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
          <div className="evaluation-layout [display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:20px] [align-items:stretch] max-[1050px]:[grid-template-columns:1fr]">
            <div className="evaluation-main-card [background:#ffffff] [border:1px_solid_#e2e8f0] [border-radius:16px] [box-shadow:0_1px_2px_rgba(15,_23,_42,_0.03),_0_8px_24px_rgba(15,_23,_42,_0.04)] [overflow:hidden] [display:flex] [flex-direction:column] [height:100%] [padding:22px] max-[520px]:[padding:18px]">
              <div className="evaluation-card-header [display:flex] [align-items:flex-start] [justify-content:space-between] [gap:16px] [padding-bottom:16px] [border-bottom:1px_solid_#edf0f3]">
                <div>
                  <h3 className="[.evaluation-card-header_&]:[margin:0_0_5px] [.evaluation-card-header_&]:[font-size:17px] [.evaluation-card-header_&]:[font-weight:750] [.evaluation-card-header_&]:[color:#1e293b]">{selectedCandidate.name || "Unknown candidate"}</h3>
                  <p className="[.evaluation-card-header_&]:[margin:0] [.evaluation-card-header_&]:[font-size:12px] [.evaluation-card-header_&]:[color:#64748b]">{selectedCandidate.role || selectedCandidate.current_role || "Role not specified"}</p>
                </div>
                <span className="evaluation-status [display:inline-flex] [align-items:center] [gap:8px] [white-space:nowrap] [padding:8px_13px] [border-radius:999px] [background:#ecfdf5] [border:1px_solid_#bbf7d0] [color:#15803d] [font-size:12px] [font-weight:700] max-[700px]:[align-self:flex-start]">{currentStage}</span>
              </div>

              <div className="evaluation-summary [display:flex] [align-items:center] [justify-content:space-between] [gap:14px] [padding:15px] [margin-top:4px] [border-radius:13px] [background:linear-gradient(_135deg,_#f7faff,_#eef5ff_)] [border:1px_solid_#dce8f8] max-[700px]:[flex-direction:column] max-[700px]:[align-items:flex-start]">
                <div className="overall-score [display:flex] [align-items:center] [gap:12px]">
                  <div className="overall-score-circle [width:68px] [height:68px] [flex-shrink:0] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center] [border-radius:50%] [background:#ffffff] [border:5px_solid_#133f7d] [box-shadow:0_5px_15px_rgba(19,_63,_125,_0.1)]">
                    <span className="[.overall-score-circle_&]:[font-size:17px] [.overall-score-circle_&]:[font-weight:800] [.overall-score-circle_&]:[line-height:1] [.overall-score-circle_&]:[color:#133f7d]">{selectedCandidate.score || 0}</span>
                    <small className="[.overall-score-circle_&]:[margin-top:2px] [.overall-score-circle_&]:[font-size:8px] [.overall-score-circle_&]:[color:#64748b]">/100</small>
                  </div>
                  <div className="overall-score-info [display:flex] [flex-direction:column] [gap:3px]">
                    <span className="overall-label [font-size:9px] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.7px] [color:#64748b]">AI match score</span>
                    <strong className="[font-weight:700] [.overall-score-info_&]:[font-size:14px] [.overall-score-info_&]:[color:#1e293b]">{nextStage ? `Next: ${nextStage}` : "Final stage"}</strong>
                    <p className="[.overall-score-info_&]:[margin:0] [.overall-score-info_&]:[max-width:230px] [.overall-score-info_&]:[font-size:11px] [.overall-score-info_&]:[line-height:1.4] [.overall-score-info_&]:[color:#64748b]">Only the immediate next stage is available from the current stage.</p>
                  </div>
                </div>
              </div>

              <div className="evaluation-stage-track [display:grid] [grid-template-columns:repeat(5,_minmax(0,_1fr))] [gap:8px] [margin:20px_0]">
                {STAGES.map((stage, index) => (
                  <span key={stage} className={`${(index <= currentIndex ? "active" : "")} [.evaluation-stage-track_&]:[padding:8px_6px] [.evaluation-stage-track_&]:[border-radius:8px] [.evaluation-stage-track_&]:[background:#f1f5f9] [.evaluation-stage-track_&]:[color:#64748b] [.evaluation-stage-track_&]:[font-size:11px] [.evaluation-stage-track_&]:[font-weight:700] [.evaluation-stage-track_&]:[text-align:center] [&.active]:[.evaluation-stage-track_&]:[background:#e8f0fb] [&.active]:[.evaluation-stage-track_&]:[color:#133f7d]`}>
                    {stage.replace(" Interview", "")}
                  </span>
                ))}
              </div>

              <div className="evaluation-actions [display:grid] [grid-template-columns:1fr_1fr] [gap:10px] [margin-top:auto] [padding-top:16px] [border-top:1px_solid_#edf0f3] max-[520px]:[grid-template-columns:1fr]">
                {nextStage ? (
                  <button type="button" className="evaluation-advance-btn [font:inherit] [min-height:40px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:7px] [border-radius:9px] [font-size:12px] [font-weight:700] [transition:transform_0.18s_ease,_box-shadow_0.18s_ease,_background_0.18s_ease] [background:#133f7d] [color:#ffffff] hover:[background:#0d2d5e] hover:[transform:translateY(-1px)] hover:[box-shadow:0_6px_16px_rgba(19,_63,_125,_0.22)]" onClick={() => updateStage(nextStage)} disabled={saving}>
                    <Check size={17} />
                    Advance to {nextStage}
                  </button>
                ) : (
                  <span className="info-box [background:#e0f7fa] [border:1px_solid_#b2ebf2] [border-radius:8px] [padding:12px] [font-size:13px] [color:#006064] [margin-bottom:16px]">This candidate has reached the final stage.</span>
                )}
                <button type="button" className="evaluation-reject-btn [font:inherit] [min-height:40px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:7px] [border-radius:9px] [font-size:12px] [font-weight:700] [transition:transform_0.18s_ease,_box-shadow_0.18s_ease,_background_0.18s_ease] [background:#ffffff] [border:1px_solid_#fecaca] [color:#dc2626] hover:[background:#fef2f2] hover:[border-color:#fca5a5]" onClick={() => updateStage("Rejected")} disabled={saving}>
                  <X size={17} />
                  Reject candidate
                </button>
              </div>
            </div>

            <div className="evaluation-feedback-card [background:#ffffff] [border:1px_solid_#e2e8f0] [border-radius:16px] [box-shadow:0_1px_2px_rgba(15,_23,_42,_0.03),_0_8px_24px_rgba(15,_23,_42,_0.04)] [overflow:hidden] [display:flex] [flex-direction:column] [height:100%] [padding:22px] max-[520px]:[padding:18px]">
              <div className="evaluation-card-header [display:flex] [align-items:flex-start] [justify-content:space-between] [gap:16px] [padding-bottom:16px] [border-bottom:1px_solid_#edf0f3]">
                <div>
                  <h3 className="[.evaluation-card-header_&]:[margin:0_0_5px] [.evaluation-card-header_&]:[font-size:17px] [.evaluation-card-header_&]:[font-weight:750] [.evaluation-card-header_&]:[color:#1e293b]">Evaluation notes</h3>
                  <p className="[.evaluation-card-header_&]:[margin:0] [.evaluation-card-header_&]:[font-size:12px] [.evaluation-card-header_&]:[color:#64748b]">Capture the reasoning behind this stage decision.</p>
                </div>
              </div>
              <div className="final-recommendation-section [margin-top:18px]">
                <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold] [.final-recommendation-section_&]:[margin-bottom:8px] [.final-recommendation-section_&]:[font-size:12px] [.final-recommendation-section_&]:[font-weight:750] [.final-recommendation-section_&]:[color:#1e293b]" htmlFor="evaluation-notes">Notes</label>
                <textarea className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [.final-recommendation-section_&]:[min-height:110px] [.final-recommendation-section_&]:[resize:vertical] [.final-recommendation-section_&]:[line-height:1.6] [.final-recommendation-section_&]:[border-color:#dce2ea] [.final-recommendation-section_&]:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease] focus:[.final-recommendation-section_&]:[border-color:#133f7d] focus:[.final-recommendation-section_&]:[box-shadow:0_0_0_3px_rgba(19,_63,_125,_0.08)]" id="evaluation-notes" rows="8" value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Add evaluation notes..." />
              </div>
            </div>
          </div>
        ) : !loading ? (
          <div className="evaluation-empty card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [padding:48px_24px] [color:#64748b] [text-align:center]">No active candidates are available for evaluation.</div>
        ) : null}
      </div>
    </PageShell>
  );
}

export default EvaluationsPage;

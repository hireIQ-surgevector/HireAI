import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleCheck,
  ClipboardCheck,
  UserRoundCheck,
  X,
} from "lucide-react";

import PageShell from "../components/common/PageShell";
import PageState from "../components/common/PageState";
import Button from "../components/common/Button";
import { API_URL, getAuthHeader } from "../utils/auth";

const STAGES = [
  "Shortlisted",
  "L1 Interview",
  "L2 Interview",
  "Client Interview",
  "Offer Sent",
  "Onboarded",
];

const NEXT_INTERVIEW_ROUND = {
  Shortlisted: "L1 Interview",
  "L1 Interview": "L2 Interview",
  "L2 Interview": "Client Interview",
};

function getStage(candidate) {
  return candidate.stage || candidate.current_status || candidate.status || "Shortlisted";
}

function normalizeRound(round) {
  return String(round || "")
    .trim()
    .toLowerCase()
    .replace(/\s+interview$/, "");
}

function getRoundLabel(round) {
  const labels = { l1: "L1", l2: "L2", client: "Client" };
  return labels[normalizeRound(round)] || round;
}

function getScheduledInterview(candidate) {
  const expectedRound = NEXT_INTERVIEW_ROUND[getStage(candidate)];
  if (!expectedRound) return null;

  return (candidate.scheduled_interviews || []).find(
    (interview) =>
      !interview.is_completed &&
      normalizeRound(interview.round) === normalizeRound(expectedRound),
  ) || null;
}

function formatScheduledAt(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function EvaluationsPage() {
  const [allCandidates, setAllCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [evaluationNotes, setEvaluationNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  const loadCandidates = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/api/candidates`, {
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to load candidates");
      }

      const loadedCandidates = Array.isArray(data) ? data : [];
      setAllCandidates(loadedCandidates);
      const eligibleCandidates = loadedCandidates.filter(
        (candidate) => getScheduledInterview(candidate) !== null,
      );
      setSelectedCandidateId((current) =>
        eligibleCandidates.some(
          (candidate) =>
            String(candidate.candidate_id) === String(current),
        )
          ? current
          : String(eligibleCandidates[0]?.candidate_id || ""),
      );
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const taskId = window.setTimeout(loadCandidates, 0);
    return () => window.clearTimeout(taskId);
  }, [loadCandidates, reloadCount]);

  const eligibleCandidates = useMemo(
    () =>
      allCandidates.filter(
        (candidate) => getScheduledInterview(candidate) !== null,
      ),
    [allCandidates],
  );

  const scheduledInterviewsNeedingStageReview = useMemo(
    () =>
      allCandidates.flatMap((candidate) => {
        if (getScheduledInterview(candidate)) return [];
        const upcomingInterviews = (candidate.scheduled_interviews || []).filter(
          (interview) =>
            !interview.is_completed &&
            interview.scheduled_at &&
            new Date(interview.scheduled_at).getTime() >= Date.now(),
        );
        return upcomingInterviews.map((interview) => ({
          candidate,
          interview,
        }));
      }),
    [allCandidates],
  );

  const selectedCandidate = useMemo(
    () =>
      eligibleCandidates.find(
        (candidate) =>
          String(candidate.candidate_id) === String(selectedCandidateId),
      ),
    [eligibleCandidates, selectedCandidateId],
  );

  const currentStage = selectedCandidate ? getStage(selectedCandidate) : "";
  const currentIndex = STAGES.indexOf(currentStage);
  const interviewToReview = selectedCandidate
    ? getScheduledInterview(selectedCandidate)
    : null;
  const nextStage = NEXT_INTERVIEW_ROUND[currentStage] || null;

  const pipelineCandidates = useMemo(
    () =>
      allCandidates.filter((candidate) => {
        const stage = getStage(candidate);
        if (stage === "L2 Interview") {
          return (candidate.scheduled_interviews || []).every(
            (interview) =>
              normalizeRound(interview.round) !== "client",
          );
        }
        return ["Client Interview", "Offer Sent"].includes(stage);
      }),
    [allCandidates],
  );

  const updateStage = async (stage, includeEvaluation = false) => {
    if (!selectedCandidate) return;

    const note = evaluationNotes.trim();
    if (includeEvaluation && !note) {
      setError("Add evaluation notes before submitting this decision.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setFeedback("");
      const response = await fetch(
        `${API_URL}/api/candidates/${selectedCandidate.candidate_id}/stage`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
          body: JSON.stringify({
            stage,
            ...(includeEvaluation ? { evaluation_notes: note } : {}),
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to update candidate stage");
      }

      setEvaluationNotes("");
      setFeedback(
        includeEvaluation
          ? `Evaluation saved. Candidate moved to ${stage}.`
          : `Candidate moved to ${stage}.`,
      );
      await loadCandidates();
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setSaving(false);
    }
  };

  const updatePipelineStage = async (candidate, stage) => {
    try {
      setSaving(true);
      setError("");
      setFeedback("");
      const response = await fetch(
        `${API_URL}/api/candidates/${candidate.candidate_id}/stage`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
          body: JSON.stringify({ stage }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to update candidate stage");
      }
      setFeedback(`Candidate moved to ${stage}.`);
      await loadCandidates();
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title="Candidate Evaluations"
      heading="Review scheduled interviews"
      eyebrow="CANDIDATE EVALUATION"
      description="Record interview feedback and advance candidates through the hiring pipeline."
    >
      <div className="evaluation-page [width:100%] [max-width:1300px] [margin:0_auto]">
        {error && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span>{error}</span>
            {loading ? null : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setReloadCount((count) => count + 1)}
              >
                Retry
              </Button>
            )}
          </div>
        )}
        {feedback && (
          <div
            role="status"
            className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
          >
            <CircleCheck size={17} />
            {feedback}
          </div>
        )}

        {loading ? (
          <PageState
            variant="loading"
            title="Loading scheduled interviews"
            rows={4}
          />
        ) : (
          <>
            {eligibleCandidates.length > 0 ? (
              <>
                <div className="evaluation-selector [display:flex] [align-items:flex-end] [justify-content:space-between] [gap:18px] [margin-bottom:18px] [border:1px_solid_#e2e8f0] [border-radius:14px] [background:#fff] [padding:18px_20px] max-[640px]:[align-items:stretch] max-[640px]:[flex-direction:column]">
                  <div className="[min-width:0] [flex:1]">
                    <label
                      className="[margin-bottom:7px] [display:block] [font-size:12px] [font-weight:700] [color:#334155]"
                      htmlFor="evaluation-candidate"
                    >
                      Candidate with a scheduled interview
                    </label>
                    <div className="[position:relative]">
                      <select
                        className="[width:100%] [appearance:none] [border:1px_solid_#dbe2ea] [border-radius:9px] [background:#fff] [padding:11px_40px_11px_12px] [font:inherit] [font-size:13px] [color:#1e293b] focus:[outline:2px_solid_#00b4d8] focus:[outline-offset:1px]"
                        id="evaluation-candidate"
                        value={selectedCandidateId}
                        onChange={(event) => {
                          setSelectedCandidateId(event.target.value);
                          setEvaluationNotes("");
                          setError("");
                        }}
                      >
                        {eligibleCandidates.map((candidate) => {
                          const interview = getScheduledInterview(candidate);
                          return (
                            <option
                              key={candidate.candidate_id}
                              value={candidate.candidate_id}
                            >
                              {candidate.name || "Unknown candidate"} — {interview.round}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown
                        size={17}
                        className="[position:absolute] [right:12px] [top:50%] [pointer-events:none] [color:#64748b] [transform:translateY(-50%)]"
                      />
                    </div>
                  </div>
                  <div className="[display:flex] [align-items:center] [gap:8px] [border:1px_solid_#dbeafe] [border-radius:9px] [background:#eff6ff] [padding:10px_12px] [font-size:12px] [font-weight:650] [color:#1d4ed8] max-[640px]:[align-self:flex-start]">
                    <CalendarDays size={16} />
                    {eligibleCandidates.length} interview
                    {eligibleCandidates.length === 1 ? "" : "s"} ready for review
                  </div>
                </div>

                {selectedCandidate && (
                  <div className="evaluation-layout [display:grid] [grid-template-columns:minmax(0,_1.05fr)_minmax(0,_0.95fr)] [gap:18px] [align-items:stretch] max-[1050px]:[grid-template-columns:1fr]">
                    <section className="[overflow:hidden] [border:1px_solid_#e2e8f0] [border-radius:15px] [background:#fff] [box-shadow:0_8px_24px_rgba(15,23,42,0.04)]">
                      <div className="[padding:22px] max-[520px]:[padding:18px]">
                        <div className="[display:flex] [align-items:flex-start] [justify-content:space-between] [gap:16px] [border-bottom:1px_solid_#edf0f3] [padding-bottom:17px]">
                          <div>
                            <p className="[margin:0_0_5px] [font-size:10px] [font-weight:800] [letter-spacing:1px] [color:#00a6c7]">
                              INTERVIEW REVIEW
                            </p>
                            <h2 className="[margin:0] [font-size:19px] [font-weight:800] [color:#172033]">
                              {selectedCandidate.name || "Unknown candidate"}
                            </h2>
                            <p className="[margin:5px_0_0] [font-size:12px] [color:#64748b]">
                              {selectedCandidate.role ||
                                selectedCandidate.current_role ||
                                "Role not specified"}
                            </p>
                          </div>
                          <span className="[flex-shrink:0] [border:1px_solid_#dbeafe] [border-radius:999px] [background:#eff6ff] [padding:6px_10px] [font-size:11px] [font-weight:750] [color:#1d4ed8]">
                            {currentStage}
                          </span>
                        </div>

                        <div className="[display:flex] [align-items:center] [justify-content:space-between] [gap:16px] [margin-top:17px] [border-radius:11px] [background:#f8fafc] [padding:13px_15px] max-[560px]:[align-items:flex-start] max-[560px]:[flex-direction:column]">
                          <div>
                            <div className="[font-size:10px] [font-weight:800] [letter-spacing:.7px] [color:#64748b]">
                              SCHEDULED ROUND
                            </div>
                            <div className="[margin-top:4px] [font-size:14px] [font-weight:750] [color:#1e293b]">
                              {interviewToReview?.round}
                            </div>
                            {formatScheduledAt(interviewToReview?.scheduled_at) && (
                              <div className="[margin-top:4px] [font-size:11px] [color:#64748b]">
                                {formatScheduledAt(interviewToReview.scheduled_at)}
                              </div>
                            )}
                          </div>
                          <div className="[text-align:right] max-[560px]:[text-align:left]">
                            <div className="[font-size:10px] [font-weight:800] [letter-spacing:.7px] [color:#64748b]">
                              AI MATCH SCORE
                            </div>
                            <div className="[margin-top:3px] [font-size:24px] [font-weight:800] [line-height:1] [color:#133f7d]">
                              {selectedCandidate.ai_score ?? "—"}
                              {selectedCandidate.ai_score !== null &&
                                selectedCandidate.ai_score !== undefined && (
                                  <span className="[font-size:11px] [font-weight:650]"> / 100</span>
                                )}
                            </div>
                          </div>
                        </div>

                        <div className="[margin-top:20px]">
                          <div className="[margin-bottom:11px] [font-size:11px] [font-weight:800] [letter-spacing:.7px] [color:#64748b]">
                            PIPELINE
                          </div>
                          <div className="[display:grid] [grid-template-columns:repeat(6,_minmax(0,_1fr))] [gap:6px] max-[640px]:[grid-template-columns:repeat(3,_minmax(0,_1fr))]">
                            {STAGES.map((stage, index) => {
                              const reached = currentIndex >= index;
                              const isCurrent = index === currentIndex;
                              return (
                                <div
                                  key={stage}
                                  className={`${reached ? "[border-color:#c7d9ef] [background:#eff6ff] [color:#133f7d]" : "[border-color:#edf0f3] [background:#f8fafc] [color:#94a3b8]"} ${isCurrent ? "[box-shadow:0_0_0_1px_#133f7d] [font-weight:800]" : "[font-weight:650]"} [min-height:45px] [display:flex] [align-items:center] [justify-content:center] [border:1px_solid] [border-radius:8px] [padding:6px] [font-size:10px] [line-height:1.3] [text-align:center]`}
                                >
                                  {stage.replace(" Interview", "")}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="[border-top:1px_solid_#edf0f3] [background:#fbfcfe] [padding:18px_22px] max-[520px]:[padding:16px_18px]">
                        <div className="[margin-bottom:8px] [display:flex] [align-items:center] [justify-content:space-between] [gap:12px]">
                          <label
                            className="[font-size:12px] [font-weight:750] [color:#1e293b]"
                            htmlFor="evaluation-notes"
                          >
                            Interview notes
                            <span className="[margin-left:4px] [color:#dc2626]">*</span>
                          </label>
                          <span className="[font-size:10px] [color:#64748b]">
                            Saved to candidate profile
                          </span>
                        </div>
                        <textarea
                          className="[min-height:116px] [width:100%] [resize:vertical] [border:1px_solid_#dbe2ea] [border-radius:9px] [background:#fff] [padding:11px_12px] [font:inherit] [font-size:13px] [line-height:1.6] [color:#1e293b] outline-none focus:[border-color:#133f7d] focus:[box-shadow:0_0_0_3px_rgba(19,63,125,0.08)]"
                          id="evaluation-notes"
                          rows="4"
                          required
                          value={evaluationNotes}
                          onChange={(event) =>
                            setEvaluationNotes(event.target.value)
                          }
                          placeholder={`Summarize the ${interviewToReview?.round || "interview"} and your recommendation...`}
                        />
                        {selectedCandidate.interview_notes && (
                          <div className="[margin-top:12px]">
                            <div className="[margin-bottom:5px] [font-size:10px] [font-weight:800] [letter-spacing:.6px] [color:#64748b]">
                              PREVIOUS INTERVIEW NOTES
                            </div>
                            <div className="[max-height:120px] [overflow-y:auto] [white-space:pre-wrap] [border:1px_solid_#e8eef6] [border-radius:8px] [background:#fff] [padding:10px] [font-size:11px] [line-height:1.6] [color:#475569]">
                              {selectedCandidate.interview_notes}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="[display:flex] [justify-content:space-between] [gap:10px] [border-top:1px_solid_#edf0f3] [padding:14px_22px] max-[520px]:[padding:14px_18px]">
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          disabled={saving || !evaluationNotes.trim()}
                          onClick={() => updateStage("Rejected", true)}
                        >
                          <X size={15} />
                          Reject candidate
                        </Button>
                        <Button
                          type="button"
                          disabled={saving || !evaluationNotes.trim() || !nextStage}
                          onClick={() => updateStage(nextStage, true)}
                        >
                          <Check size={15} />
                          {saving ? "Saving..." : `Submit & advance`}
                          <ArrowRight size={15} />
                        </Button>
                      </div>
                    </section>

                    <aside className="[display:flex] [flex-direction:column] [gap:14px]">
                      <div className="[border:1px_solid_#dbeafe] [border-radius:14px] [background:linear-gradient(135deg,_#eff6ff,_#f8fbff)] [padding:20px]">
                        <div className="[display:flex] [align-items:center] [gap:10px]">
                          <span className="[width:34px] [height:34px] [display:flex] [align-items:center] [justify-content:center] [border-radius:10px] [background:#fff] [color:#133f7d]">
                            <ClipboardCheck size={18} />
                          </span>
                          <h3 className="[margin:0] [font-size:14px] [font-weight:800] [color:#1e293b]">
                            Decision guidance
                          </h3>
                        </div>
                        <p className="[margin:12px_0_0] [font-size:12px] [line-height:1.65] [color:#475569]">
                          Submitting this review saves the notes under{" "}
                          <strong>
                            {getRoundLabel(interviewToReview?.round)}:
                          </strong>{" "}
                          and advances the candidate to{" "}
                          <strong>{nextStage || "the next stage"}</strong>.
                        </p>
                        <div className="[margin-top:12px] [display:flex] [align-items:center] [gap:7px] [font-size:11px] [font-weight:650] [color:#1d4ed8]">
                          <Check size={14} />
                          Evaluation is enabled only for a scheduled interview
                        </div>
                      </div>

                      <div className="[flex:1] [border:1px_solid_#e2e8f0] [border-radius:14px] [background:#fff] [padding:20px]">
                        <h3 className="[margin:0] [font-size:14px] [font-weight:800] [color:#1e293b]">
                          Next step
                        </h3>
                        <p className="[margin:7px_0_0] [font-size:12px] [line-height:1.6] [color:#64748b]">
                          {currentStage === "L2 Interview"
                            ? "A client interview is optional. After recording this interview decision, you can either schedule a client round or proceed directly to an offer."
                            : currentStage === "Client Interview"
                              ? "The client round is complete. Move the candidate to Offer Sent when the hiring decision is approved."
                              : `After ${nextStage || "this review"}, schedule the next interview round before evaluating again.`}
                        </p>
                        {nextStage && (
                          <div className="[margin-top:16px] [border-top:1px_solid_#edf0f3] [padding-top:14px] [font-size:11px] [color:#64748b]">
                            <span className="[font-weight:700] [color:#334155]">Next pipeline stage</span>
                            <div className="[margin-top:6px] [display:flex] [align-items:center] [gap:8px] [font-size:13px] [font-weight:750] [color:#133f7d]">
                              {nextStage}
                              <ArrowRight size={15} />
                            </div>
                          </div>
                        )}
                      </div>
                    </aside>
                  </div>
                )}
              </>
            ) : (
              <PageState
                variant="empty"
                title="No scheduled interviews to evaluate"
                description="Candidates appear here when they have a scheduled interview for their current pipeline stage. Evaluation notes are required before submitting a decision."
                icon={CalendarDays}
              />
            )}

            {scheduledInterviewsNeedingStageReview.length > 0 && (
              <section className="[margin-top:18px] [overflow:hidden] [border:1px_solid_#fed7aa] [border-radius:13px] [background:#fff7ed]">
                <div className="[border-bottom:1px_solid_#fed7aa] [padding:16px_18px]">
                  <h2 className="[margin:0] [font-size:14px] [font-weight:800] [color:#9a3412]">
                    Booked interviews need a stage check
                  </h2>
                  <p className="[margin:5px_0_0] [font-size:12px] [line-height:1.5] [color:#9a3412]">
                    These future bookings are present, but their round does not match the candidate&apos;s current pipeline stage. They are shown here rather than silently omitted; update the stage only after confirming the candidate&apos;s evaluation history.
                  </p>
                </div>
                <div className="[divide-y:1px_solid_#fed7aa]">
                  {scheduledInterviewsNeedingStageReview.map(
                    ({ candidate, interview }) => (
                      <div
                        key={`${candidate.candidate_id}-${interview.round}-${interview.scheduled_at}`}
                        className="[display:flex] [align-items:center] [justify-content:space-between] [gap:14px] [padding:12px_18px] max-[600px]:[align-items:flex-start] max-[600px]:[flex-direction:column]"
                      >
                        <div>
                          <div className="[font-size:13px] [font-weight:750] [color:#7c2d12]">
                            {candidate.name || "Unknown candidate"} · {interview.round}
                          </div>
                          <div className="[margin-top:3px] [font-size:11px] [color:#9a3412]">
                            Current stage: {getStage(candidate)}
                          </div>
                        </div>
                        <div className="[font-size:12px] [font-weight:650] [color:#7c2d12]">
                          {formatScheduledAt(interview.scheduled_at)}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </section>
            )}

            {pipelineCandidates.length > 0 && (
              <section className="[margin-top:22px] [overflow:hidden] [border:1px_solid_#e2e8f0] [border-radius:14px] [background:#fff]">
                <div className="[border-bottom:1px_solid_#edf0f3] [padding:18px_20px]">
                  <div className="[display:flex] [align-items:center] [gap:9px]">
                    <UserRoundCheck size={18} className="[color:#133f7d]" />
                    <h2 className="[margin:0] [font-size:15px] [font-weight:800] [color:#1e293b]">
                      Pipeline decisions
                    </h2>
                  </div>
                  <p className="[margin:5px_0_0] [font-size:12px] [color:#64748b]">
                    Non-interview transitions: skip the optional client round, send an offer, or mark a candidate onboarded.
                  </p>
                </div>
                <div className="[divide-y:1px_solid_#edf0f3]">
                  {pipelineCandidates.map((candidate) => {
                    const stage = getStage(candidate);
                    const targetStage =
                      stage === "Offer Sent" ? "Onboarded" : "Offer Sent";
                    return (
                      <div
                        key={candidate.candidate_id}
                        className="[display:flex] [align-items:center] [justify-content:space-between] [gap:14px] [padding:13px_20px] max-[640px]:[align-items:flex-start] max-[640px]:[flex-direction:column]"
                      >
                        <div>
                          <div className="[font-size:13px] [font-weight:750] [color:#1e293b]">
                            {candidate.name || "Unknown candidate"}
                          </div>
                          <div className="[margin-top:3px] [font-size:11px] [color:#64748b]">
                            {candidate.role || candidate.current_role || "Role not specified"} · {stage}
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={saving}
                          onClick={() =>
                            updatePipelineStage(candidate, targetStage)
                          }
                        >
                          {stage === "L2 Interview"
                            ? "Skip client & send offer"
                            : stage === "Client Interview"
                              ? "Send offer"
                              : "Mark onboarded"}
                          <ArrowRight size={14} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}

export default EvaluationsPage;

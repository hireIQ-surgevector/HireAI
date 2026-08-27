// import { Link } from "react-router-dom";
// import PageShell from "./PageShell";
// import { Plus, Check } from "lucide-react";

// const PlusIcon = (props) => <Plus {...props} />
// const CheckIcon = (props) => <Check {...props} />

// function EvaluationsPage() {
//   return (
//     <PageShell
//       title="Interview Evaluations — Priya Sharma"
//       active="evaluations"
//     >
//       <div className="grid2">
//         <div className="card">
//           <h3>Score Summary</h3>
//           {[
//             ["Technical Skills", 88],
//             ["Communication", 82],
//             ["Problem Solving", 90],
//             ["Role Fitment", 85],
//             ["Culture Fit", 78],
//           ].map(([label, value]) => (
//             <div key={label} className="progress-row">
//               <div className="row-label">{label}</div>
//               <div className="progress-bar">
//                 <div
//                   className="progress-fill"
//                   style={{
//                     width: `${value}%`,
//                     background: `hsl(${value * 1.2}, 65%, 40%)`,
//                   }}
//                 />
//               </div>
//               <span>{value}%</span>
//             </div>
//           ))}
//           <div className="score-box large">84.6</div>
//           <Link to="/send-offer" className="btn btn-success full-width">
//             <CheckIcon size={14} /> Advance Candidate
//           </Link>
//           <Link to="/reject-candidate" className="btn btn-danger full-width">
//             <PlusIcon size={14} style={{ transform: "rotate(45deg)" }} /> Reject
//             Candidate
//           </Link>
//         </div>
//         <div className="card">
//           <h3>Evaluation Feedback</h3>
//           <div className="field">
//             <label>Strengths</label>
//             <div className="info-box success">
//               Strong React internals and hooks understanding.
//             </div>
//           </div>
//           <div className="field">
//             <label>Areas of Improvement</label>
//             <div className="info-box warning">
//               System design depth could be stronger.
//             </div>
//           </div>
//           <div className="field">
//             <label>Final Recommendation</label>
//             <textarea
//               rows="3"
//               defaultValue="Priya demonstrates strong senior-level frontend skills."
//             />
//           </div>
//           <button type="button" className="btn btn-primary btn-sm">
//             Save Evaluation
//           </button>
//         </div>
//       </div>
//     </PageShell>
//   );
// }

// export default EvaluationsPage;


import { Link } from "react-router-dom";
import PageShell from "./PageShell";
import {
  Check,
  X,
  Trophy,
  MessageSquare,
  Brain,
  Target,
  Users,
  TrendingUp,
  Save,
} from "lucide-react";

const evaluationScores = [
  {
    label: "Technical Skills",
    value: 88,
    icon: <Brain size={17} />,
    className: "technical",
  },
  {
    label: "Communication",
    value: 82,
    icon: <MessageSquare size={17} />,
    className: "communication",
  },
  {
    label: "Problem Solving",
    value: 90,
    icon: <TrendingUp size={17} />,
    className: "problem-solving",
  },
  {
    label: "Role Fitment",
    value: 85,
    icon: <Target size={17} />,
    className: "role-fit",
  },
  {
    label: "Culture Fit",
    value: 78,
    icon: <Users size={17} />,
    className: "culture-fit",
  },
];

function EvaluationsPage() {
  return (
    <PageShell
      title="Interview Evaluations — Priya Sharma"
      active="evaluations"
    >
      <div className="evaluation-page">

        {/* HEADER */}
        <div className="evaluation-header">
          <div>
            <p className="evaluation-eyebrow">
              INTERVIEW EVALUATION
            </p>

            <h2>Candidate Performance Overview</h2>

            <p>
              Review the interview results and make a final hiring
              recommendation for Priya Sharma.
            </p>
          </div>

          <div className="evaluation-status">
            <span className="evaluation-status-dot"></span>
            Evaluation Completed
          </div>
        </div>

        <div className="evaluation-layout">

          {/* LEFT SIDE */}
          <div className="evaluation-main-card">

            <div className="evaluation-card-header">
              <div>
                <h3>Score Breakdown</h3>
                <p>Performance across key evaluation criteria</p>
              </div>

              <div className="evaluation-trophy">
                <Trophy size={20} />
              </div>
            </div>

            <div className="evaluation-scores">
              {evaluationScores.map(
                ({ label, value, icon, className }) => (
                  <div
                    key={label}
                    className="evaluation-score-row"
                  >
                    <div className="evaluation-score-top">

                      <div className="evaluation-score-label">
                        <div
                          className={`evaluation-score-icon ${className}`}
                        >
                          {icon}
                        </div>

                        <span>{label}</span>
                      </div>

                      <strong>{value}%</strong>
                    </div>

                    <div className="evaluation-progress">
                      <div
                        className={`evaluation-progress-fill ${className}`}
                        style={{
                          width: `${value}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="evaluation-summary">

              <div className="overall-score">

                <div className="overall-score-circle">
                  <span>84.6</span>
                  <small>/100</small>
                </div>

                <div className="overall-score-info">
                  <span className="overall-label">
                    Overall Evaluation Score
                  </span>

                  <strong>Strong Candidate</strong>

                  <p>
                    Priya has demonstrated strong technical and
                    problem-solving abilities.
                  </p>
                </div>

              </div>

              <div className="evaluation-recommendation">
                <span>Recommendation</span>

                <div className="recommendation-badge">
                  <Check size={15} />
                  Recommended to Advance
                </div>
              </div>

            </div>

            <div className="evaluation-actions">

              <Link
                to="/send-offer"
                className="evaluation-advance-btn"
              >
                <Check size={17} />
                Advance Candidate
              </Link>

              <Link
                to="/reject-candidate"
                className="evaluation-reject-btn"
              >
                <X size={17} />
                Reject Candidate
              </Link>

            </div>

          </div>


          {/* RIGHT SIDE */}
          <div className="evaluation-feedback-card">

            <div className="evaluation-card-header">
              <div>
                <h3>Evaluation Feedback</h3>
                <p>Key observations from the interview</p>
              </div>
            </div>


            <div className="feedback-section">

              <div className="feedback-label success">
                <Check size={15} />
                Strengths
              </div>

              <div className="feedback-box feedback-success">
                Strong React internals and hooks understanding.
              </div>

            </div>


            <div className="feedback-section">

              <div className="feedback-label warning">
                <TrendingUp size={15} />
                Areas of Improvement
              </div>

              <div className="feedback-box feedback-warning">
                System design depth could be stronger.
              </div>

            </div>


            <div className="final-recommendation-section">

              <label>
                Final Recommendation
              </label>

              <textarea
                rows="5"
                defaultValue="Priya demonstrates strong senior-level frontend skills. She has excellent knowledge of React, component architecture, and problem-solving. She is recommended to proceed to the next stage."
              />

            </div>


            <div className="evaluation-save-area">

              <p>
                Changes will be saved to the candidate's evaluation
                record.
              </p>

              <button
                type="button"
                className="evaluation-save-btn"
              >
                <Save size={15} />
                Save Evaluation
              </button>

            </div>

          </div>

        </div>

      </div>
    </PageShell>
  );
}

export default EvaluationsPage;
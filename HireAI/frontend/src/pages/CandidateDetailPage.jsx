import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Check,
  FileText,
  Sparkles,
  Clock3,
  Mail,
  Phone,
  MapPin,
  BriefcaseBusiness,
  CalendarDays,
  IndianRupee,
} from "lucide-react";

import PageShell from "../components/PageShell";
import badgeClass from "../components/badgeClass";
import { API_URL, getAuthHeader } from "../utils/auth";

const SparkIcon = (props) => <Sparkles {...props} />;
const ClockIcon = (props) => <Clock3 {...props} />;
const MailIcon = (props) => <Mail {...props} />;
const PhoneIcon = (props) => <Phone {...props} />;
const LocationIcon = (props) => <MapPin {...props} />;
const JobsIcon = (props) => <BriefcaseBusiness {...props} />;
const CalendarIcon = (props) => <CalendarDays {...props} />;
const CurrencyIcon = (props) => <IndianRupee {...props} />;

function CandidateDetailPage() {
  const { candidateId } = useParams();

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    if (!candidateId) {
      setError("No candidate selected");
      setLoading(false);
      return () => controller.abort();
    }

    const loadCandidate = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/candidates/${candidateId}`,
          {
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeader(),
            },
            signal: controller.signal,
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load candidate profile");
        }

        setCandidate(data);
      } catch (err) {
        if (err.name !== "AbortError" && localStorage.getItem("token")) {
          console.error("Unable to load candidate", err);
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    loadCandidate();

    return () => controller.abort();
  }, [candidateId]);

  const candidateName = candidate?.name || candidate?.full_name || "Candidate";

  const candidateStage =
    candidate?.stage || candidate?.current_status || candidate?.status || "New";

  const initials = candidateName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const unifiedDetails = [
    {
      label: "Email",
      value: candidate?.email || "—",
      icon: <MailIcon size={15} />,
    },
    {
      label: "Phone",
      value: candidate?.phone || "—",
      icon: <PhoneIcon size={15} />,
    },
    {
      label: "Location",
      value: candidate?.location || "—",
      icon: <LocationIcon size={15} />,
    },
    {
      label: "Experience",
      value: candidate?.experience || "—",
      icon: <BriefcaseBusiness size={15} />,
    },
    {
      label: "Current Role",
      value: candidate?.current_role || "—",
      icon: <JobsIcon size={15} />,
    },
    {
      label: "Applied For",
      value: candidate?.role || "—",
      icon: <JobsIcon size={15} />,
    },
    {
      label: "Notice Period",
      value: candidate?.notice_period ? `${candidate.notice_period}` : "—",
      icon: <CalendarIcon size={15} />,
    },
    {
      label: "Current CTC",
      value: candidate?.current_ctc ? `${candidate.current_ctc} LPA` : "—",
      icon: <CurrencyIcon size={15} />,
    },
  ];

  const skills =
    Array.isArray(candidate?.skills) && candidate.skills.length > 0
      ? candidate.skills
      : [];

  const score = candidate?.ai_score ?? 0;

  const breakdown = [
    ["Technical Skills", Math.min(100, score + 5)],
    ["Communication", 82],
    ["Problem Solving", 90],
    ["Role Fitment", 85],
  ];

  const stages = [
    "Shortlisted",
    "L1 Interview",
    "L2 Interview",
    "Client Interview",
    "Offer Sent",
  ];

  const currentStageIndex = stages.indexOf(candidateStage);

  return (
    <PageShell
      title="Candidate Profile"
      active="candidates"
      backTo="/candidates"
      actions={
        <Link
          to={`/candidates/${candidateId}/edit`}
          className="btn btn-primary btn-sm [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#133f7d] [color:#fff] [padding:6px_14px] [font-size:12px]"
        >
          Edit Candidate
        </Link>
      }
    >
      {loading ? (
        <div
          className="card [padding:40px] [text-align:center] [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px]"

        >
          Loading candidate profile...
        </div>
      ) : error ? (
        <div className="error-box [background:#fee2e2] [color:#991b1b] [padding:10px] [border-radius:8px] [font-size:12px] [margin-bottom:10px]">{error}</div>
      ) : (
        <>
          {/* Candidate Header */}

          <div className="card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px]">
            <div className="profile-head [display:flex] [align-items:center] [gap:18px] [margin-bottom:18px] max-[640px]:[align-items:flex-start] max-[640px]:[flex-wrap:wrap]">
              <div
                className="avatar large [background:#e8f0fb] [color:#133f7d] [width:34px] [height:34px] [border-radius:50%] [display:flex] [align-items:center] [justify-content:center] [font-weight:700] [font-size:12px] [width:58px] [height:58px] [font-size:22px]"

              >
                {initials}
              </div>

              <div className="profile-main [flex:1]">
                <div className="profile-title-row [display:flex] [align-items:center] [gap:12px] [margin-bottom:6px] [flex-wrap:wrap]">
                  <h2 className="[.profile-title-row_&]:[margin:0] [.profile-title-row_&]:[font-size:19px] [.profile-title-row_&]:[font-weight:800] [.profile-title-row_&]:[color:#1e293b]">{candidateName}</h2>

                  <span
                    className={`${(`badge ${badgeClass(
                      candidateStage.toLowerCase(),
                    )}`)} [font-size:11px] [font-weight:700] [padding:3px_9px] [border-radius:20px] [white-space:nowrap] [display:inline-block]`}
                  >
                    {candidateStage}
                  </span>
                </div>

                <p className="muted [font-size:12px] [color:#64748b]">
                  {candidate?.current_role || "Role not specified"}
                </p>

                <p className="muted [margin-top:4px] [font-size:12px] [color:#64748b]" >
                  Applied for <strong className="[font-weight:700]">{candidate?.role || "Position"}</strong>
                </p>
              </div>

              <div className="score-box [background:#f8fafc] [border-radius:10px] [padding:12px_18px] [text-align:center] [flex-shrink:0] max-[640px]:[margin-left:0]">
                <div className="score-value [font-size:34px] [font-weight:800] [color:#133f7d]">
                  {candidate?.ai_score === null || candidate?.ai_score === undefined
                    ? "—"
                    : candidate.ai_score}
                </div>

                <div className="score-label [font-size:10px] [color:#64748b] [font-weight:700]">
                  {candidate?.ai_score === null || candidate?.ai_score === undefined
                    ? "NOT EVALUATED"
                    : "AI SCORE"}
                </div>
              </div>
            </div>
          </div>

          <div className="[height:16px]"  />

          <div className="grid2 [display:grid] [grid-template-columns:1fr_1fr] [gap:14px] max-[960px]:[grid-template-columns:1fr] max-[960px]:[flex-direction:column]">
            {/* Candidate Details */}

            <div className="card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px]">
              <div className="section-header [display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:14px]">
                <div>
                  <h3 className="[margin:0px] [.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px]" >Candidate Details</h3>

                  <p className="muted [margin-top:4px] [font-size:12px] [color:#64748b]" >
                    Personal and professional information
                  </p>
                </div>
              </div>

              {unifiedDetails.map((item) => (
                <div className="detail-row [display:flex] [justify-content:space-between] [padding:7px_0] [border-bottom:1px_solid_#e2e8f0] [font-size:12px] max-[640px]:[gap:15px]" key={item.label}>
                  <div
                    className="flex-row [gap:7px] [color:#64748b] [display:flex] [align-items:center] [gap:10px]"

                  >
                    {item.icon}

                    <span>{item.label}</span>
                  </div>

                  <strong className="[font-weight:700]">{item.value}</strong>
                </div>
              ))}
            </div>

            {/* AI Assessment */}

            <div className="card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px]">
              <div className="section-header [display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:14px]">
                <div>
                  <div className="flex-row [gap:7px] [display:flex] [align-items:center] [gap:10px]" >
                    <SparkIcon className="[color:#133f7d]"
                      size={17}

                    />

                    <h3 className="[margin:0px] [.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px]" >AI Assessment</h3>
                  </div>

                  <p className="muted [margin-top:4px] [font-size:12px] [color:#64748b]" >
                    Candidate evaluation summary
                  </p>
                </div>
              </div>

              <div className="tag-row [display:flex] [flex-wrap:wrap] [gap:8px] [margin-bottom:18px]">
                {skills.length > 0 ? (
                  skills.map((skill) => (
                    <span key={skill} className="tag [background:#e8f0fb] [color:#133f7d] [font-size:12px] [font-weight:600] [padding:4px_12px] [border-radius:20px] [display:inline-block]">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="muted [font-size:12px] [color:#64748b]">No skills listed</span>
                )}
              </div>

              <div className="[margin-top:18px]"

              >
                {breakdown.map(([label, value]) => (
                  <div className="mb-3" key={label}>
                    <div className="[display:flex] [justify-content:space-between]"

                    >
                      <span className="row-label [font-size:12px] [color:#1e293b] [margin-bottom:3px]">{label}</span>

                      <span className="[font-size:12px] [font-weight:700]"

                      >
                        {value}%
                      </span>
                    </div>

                    <div className="progress-bar [height:6px] [background:#e2e8f0] [border-radius:3px] [overflow:hidden] [margin-top:4px]">
                      <div
                        className="progress-fill [background:#133f7d] [height:100%] [border-radius:3px] [transition:width_0.4s] [border-radius:inherit] [transition:width_0.3s_ease]"
                        style={{width: `${value}%`}}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="[height:16px]"  />

          {/* Recruitment Pipeline */}

          <div className="card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px]">
            <div className="section-header [display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:14px]">
              <div>
                <h3 className="[margin:0px] [.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px]" >Recruitment Progress</h3>

                <p className="muted [margin-top:4px] [font-size:12px] [color:#64748b]" >
                  Track and manage the candidate's recruitment journey
                </p>
              </div>

              <span
                className={`${(`badge ${badgeClass(candidateStage.toLowerCase())}`)} [font-size:11px] [font-weight:700] [padding:3px_9px] [border-radius:20px] [white-space:nowrap] [display:inline-block]`}
              >
                {candidateStage}
              </span>
            </div>

            <div className="stepbar [display:flex] [align-items:center] [justify-content:space-between] [margin-bottom:24px] [gap:8px] [overflow-x:auto] [padding-bottom:4px]">
              {stages.map((stage, index) => {
                let status = "pending";

                if (currentStageIndex >= 0 && index < currentStageIndex) {
                  status = "done";
                }

                if (index === currentStageIndex) {
                  status = "active";
                }

                return (
                  <div className="step-dot-wrap [display:flex] [flex-direction:column] [align-items:center] [gap:4px] [flex:1] [min-width:90px]" key={stage}>
                    <div className={`${(`step-dot ${status}`)} [width:30px] [height:30px] [border-radius:50%] [display:flex] [align-items:center] [justify-content:center] [font-weight:700] [font-size:12px] ${status === "active" ? "[background:#133f7d] [color:#fff]" : status === "done" ? "[background:#22c55e] [color:#fff]" : "[background:#e2e8f0] [color:#64748b]"}`}>
                      {status === "done" ? <Check size={15} /> : index + 1}
                    </div>

                    <span className="[.step-dot-wrap_&]:[font-size:11px] [.step-dot-wrap_&]:[color:#64748b] [.step-dot-wrap_&]:[text-align:center]">{stage.replace(" Interview", "")}</span>
                  </div>
                );
              })}
            </div>

            <div className="info-box [background:#e0f7fa] [border:1px_solid_#b2ebf2] [border-radius:8px] [padding:12px] [font-size:13px] [color:#006064] [margin-bottom:16px]">
              Stage decisions are managed from the Evaluations page. Candidates
              can only advance one stage at a time.
            </div>
          </div>

          <div className="[height:16px]"  />

          {/* Interview Notes */}

          <div className="card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px]">
            <div className="section-header [display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:14px]">
              <div className="flex-row [gap:8px] [display:flex] [align-items:center] [gap:10px]" >
                <ClockIcon className="[color:#133f7d]"
                  size={17}

                />

                <h3 className="[margin:0px] [.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px]" >Interview Notes</h3>
              </div>

              <FileText size={18} className="[color:#64748b]" />
            </div>

            <div className="email-preview [background:#f8fafc] [border-radius:8px] [padding:14px] [font-size:13px] [color:#1e293b] [line-height:1.75] [border:1px_solid_#e2e8f0]">
              {candidate?.interview_notes ||
                "No interview notes have been added yet."}
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}

export default CandidateDetailPage;

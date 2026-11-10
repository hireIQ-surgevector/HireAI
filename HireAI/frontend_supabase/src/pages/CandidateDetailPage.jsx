import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import {
  Check,
  FileText,
  Clock3,
  Mail,
  Phone,
  MapPin,
  BriefcaseBusiness,
  CalendarDays,
  IndianRupee,
  Eye,
  Download,
  X,
} from "lucide-react";

import PageShell from "../components/common/PageShell";
import PageState from "../components/common/PageState";
import badgeClass from "../components/common/badgeClass";
import { API_URL, getAuthHeader } from "../utils/auth";

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
  const [loading, setLoading] = useState(Boolean(candidateId));
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const [resumePreview, setResumePreview] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState("");

  useEffect(
    () => () => {
      if (resumePreview?.url) {
        URL.revokeObjectURL(resumePreview.url);
      }
    },
    [resumePreview],
  );

  useEffect(() => {
    if (!resumePreview) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setResumePreview(null);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [resumePreview]);

  useEffect(() => {
    const controller = new AbortController();

    if (!candidateId) {
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
        if (err.name !== "AbortError") {
          console.error("Unable to load candidate", err);
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    loadCandidate();

    return () => controller.abort();
  }, [candidateId, reloadCount]);

  const candidateName = candidate?.name || candidate?.full_name || "Candidate";
  const profileError = candidateId ? error : "No candidate selected";

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

  const stages = [
    "Shortlisted",
    "L1 Interview",
    "L2 Interview",
    "Client Interview",
    "Offer Sent",
    "Onboarded",
  ];

  const currentStageIndex = stages.findIndex((stage) =>
    candidateStage.toLowerCase().includes(stage.toLowerCase()),
  );
  const hasScore =
    candidate?.ai_score !== null && candidate?.ai_score !== undefined;
  const score = hasScore ? Number(candidate.ai_score) : null;
  const resumeExtension = (candidate?.resume_file_name || "")
    .split(".")
    .pop()
    .toLowerCase();

  const showResume = async () => {
    if (!candidate?.resume_available || resumeLoading) return;

    try {
      setResumeLoading(true);
      setResumeError("");
      const response = await fetch(
        `${API_URL}/api/candidates/${candidateId}/resume`,
        { headers: getAuthHeader() },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Unable to load candidate resume.");
      }

      const file = await response.blob();
      const preview = {
        fileName: candidate.resume_file_name || "Candidate resume",
      };

      if (resumeExtension === "docx") {
        const mammoth = await import("mammoth");
        const { value } = await mammoth.convertToHtml({
          arrayBuffer: await file.arrayBuffer(),
        });
        preview.html = DOMPurify.sanitize(value);
      } else if (resumeExtension === "txt") {
        preview.text = await file.text();
      }

      preview.url = URL.createObjectURL(file);
      setResumePreview(preview);
    } catch (resumeLoadError) {
      console.error("Unable to load candidate resume", resumeLoadError);
      setResumeError(resumeLoadError.message);
    } finally {
      setResumeLoading(false);
    }
  };

  const closeResumePreview = () => setResumePreview(null);

  return (
    <PageShell
      title="Candidate Profile"
      active="candidates"
      backTo="/candidates"
      eyebrow="CANDIDATE PROFILE"
      description="Review candidate details, skills, and recruitment progress."
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
        <PageState variant="loading" title="Loading candidate profile" rows={4} />
      ) : profileError ? (
        <PageState
          variant="error"
          title="Couldn't load candidate profile"
          description={profileError}
          onRetry={() => setReloadCount((count) => count + 1)}
        />
      ) : (
        <>
          {/* Candidate Header */}

          <div className="card [background:linear-gradient(120deg,_#fff_0%,_#f8fbff_100%)] [border:1px_solid_#dbe5f0] [border-radius:16px] [padding:26px] [box-shadow:0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="profile-head [display:flex] [align-items:center] [gap:18px] max-[640px]:[align-items:flex-start] max-[640px]:[flex-wrap:wrap]">
              <div
                className="[width:68px] [height:68px] [flex-shrink:0] [border:4px_solid_#fff] [border-radius:50%] [display:flex] [align-items:center] [justify-content:center] [background:#e8f0fb] [color:#133f7d] [box-shadow:0_0_0_1px_#dbe5f0] [font-size:21px] [font-weight:800]"
              >
                {initials}
              </div>

              <div className="profile-main [min-width:0] [flex:1]">
                <div className="profile-title-row [display:flex] [align-items:center] [gap:10px] [margin-bottom:5px] [flex-wrap:wrap]">
                  <h2 className="[.profile-title-row_&]:[margin:0] [.profile-title-row_&]:[font-size:22px] [.profile-title-row_&]:[font-weight:800] [.profile-title-row_&]:[letter-spacing:-.02em] [.profile-title-row_&]:[color:#172033]">{candidateName}</h2>

                  <span
                    className={`${(`badge ${badgeClass(
                      candidateStage.toLowerCase(),
                    )}`)} [font-size:11px] [font-weight:700] [padding:4px_10px] [border-radius:999px] [white-space:nowrap] [display:inline-block]`}
                  >
                    {candidateStage}
                  </span>
                </div>

                <p className="[margin:0] [font-size:14px] [font-weight:600] [color:#475569]">
                  {candidate?.current_role || "Current role not specified"}
                </p>
                <div className="[display:flex] [align-items:center] [gap:7px] [margin-top:9px] [color:#64748b] [font-size:12px]">
                  <BriefcaseBusiness size={14} aria-hidden="true" />
                  <span>Applied for</span>
                  <strong className="[font-weight:700] [color:#334155]">{candidate?.role || "Position not specified"}</strong>
                </div>
              </div>

              <div className="[min-width:112px] [flex-shrink:0] [border:1px_solid_#e2e8f0] [border-radius:12px] [background:#fff] [padding:12px_16px] [text-align:center] max-[640px]:[margin-left:86px] max-[640px]:[margin-top:-4px]">
                <div className="[font-size:25px] [font-weight:800] [line-height:1] [color:#133f7d]">
                  {hasScore && Number.isFinite(score) ? score : "—"}
                  {hasScore && Number.isFinite(score) && <span className="[font-size:12px] [font-weight:700]"> / 100</span>}
                </div>
                <div className="[margin-top:6px] [font-size:9px] [font-weight:800] [letter-spacing:.7px] [color:#64748b]">
                  {hasScore ? "AI MATCH SCORE" : "NOT EVALUATED"}
                </div>
              </div>
            </div>
          </div>

          <div className="grid2 [display:grid] [grid-template-columns:minmax(0,_1.05fr)_minmax(0,_0.95fr)] [gap:18px] [margin-top:18px] max-[960px]:[grid-template-columns:1fr]">
            {/* Candidate Details */}

            <div className="card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:14px] [padding:22px]">
              <div className="section-header [display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:18px]">
                <div>
                  <h3 className="[margin:0] [font-size:16px] [font-weight:750] [color:#1e293b]">Candidate details</h3>
                  <p className="[margin:5px_0_0] [font-size:12px] [color:#64748b]">
                    Personal and professional information
                  </p>
                </div>
              </div>

              <div className="[display:grid] [grid-template-columns:1fr_1fr] [gap:12px] max-[520px]:[grid-template-columns:1fr]">
                {unifiedDetails.map((item) => (
                  <div className="[min-width:0] [border:1px_solid_#edf1f5] [border-radius:10px] [background:#fbfcfe] [padding:12px]" key={item.label}>
                    <div className="[display:flex] [align-items:center] [gap:7px] [color:#64748b] [font-size:11px] [font-weight:600]">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <strong className="[display:block] [overflow-wrap:anywhere] [margin-top:7px] [font-size:13px] [font-weight:700] [line-height:1.45] [color:#1e293b]">
                      {item.value}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills and Resume */}

            <div className="card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:14px] [padding:22px]">
              <div className="section-header [display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:18px]">
                <div>
                  <div className="[display:flex] [align-items:center] [gap:9px]">
                    <span className="[width:30px] [height:30px] [display:flex] [align-items:center] [justify-content:center] [border-radius:9px] [background:#eef4fc] [color:#133f7d]">
                      <BriefcaseBusiness size={16} />
                    </span>
                    <h3 className="[margin:0] [font-size:16px] [font-weight:750] [color:#1e293b]">Skills</h3>
                  </div>
                  <p className="[margin:7px_0_0] [font-size:12px] [color:#64748b]">
                    Skills extracted from the candidate profile
                  </p>
                </div>
              </div>

              <div className="[margin-bottom:12px] [font-size:12px] [font-weight:700] [color:#334155]">
                {skills.length} {skills.length === 1 ? "skill" : "skills"}
              </div>

              <div className="[display:flex] [min-height:88px] [flex-wrap:wrap] [align-content:flex-start] [gap:7px]">
                {skills.length > 0 ? skills.map((skill) => (
                  <span key={skill} className="[border:1px_solid_#dbe7f5] [border-radius:999px] [background:#f1f6fc] [padding:5px_10px] [font-size:11px] [font-weight:650] [color:#234b78]">
                    {skill}
                  </span>
                )) : (
                  <span className="[font-size:12px] [color:#64748b]">No skills listed</span>
                )}
              </div>

              <div className="[margin-top:18px] [border-top:1px_solid_#edf1f5] [padding-top:16px]">
                <button
                  type="button"
                  onClick={showResume}
                  disabled={!candidate?.resume_available || resumeLoading}
                  className="[display:inline-flex] [min-height:38px] [align-items:center] [justify-content:center] [gap:8px] [border:1px_solid_#d5e0ed] [border-radius:9px] [background:#fff] [padding:0_13px] [font:inherit] [font-size:12px] [font-weight:700] [color:#133f7d] [cursor:pointer] hover:[background:#f1f6fc] disabled:[cursor:not-allowed] disabled:[opacity:.55]"
                  title={
                    candidate?.resume_available
                      ? `Show ${candidate.resume_file_name || "candidate resume"}`
                      : "No resume file is linked to this candidate"
                  }
                >
                  <Eye size={15} />
                  {resumeLoading
                    ? "Loading resume..."
                    : candidate?.resume_available
                      ? "Show Resume"
                      : "Resume unavailable"}
                </button>
                {resumeError && (
                  <p role="alert" className="[margin:8px_0_0] [font-size:12px] [color:#b91c1c]">
                    {resumeError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Recruitment Pipeline */}

          <div className="card [margin-top:18px] [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:14px] [padding:22px]">
            <div className="section-header [display:flex] [justify-content:space-between] [align-items:center] [gap:16px] [margin-bottom:20px]">
              <div>
                <h3 className="[margin:0] [font-size:16px] [font-weight:750] [color:#1e293b]">Recruitment progress</h3>
                <p className="[margin:5px_0_0] [font-size:12px] [color:#64748b]">
                  Candidate journey through the hiring process
                </p>
              </div>

              <span
                className={`${(`badge ${badgeClass(candidateStage.toLowerCase())}`)} [font-size:11px] [font-weight:700] [padding:5px_10px] [border-radius:999px] [white-space:nowrap] [display:inline-block]`}
              >
                {candidateStage}
              </span>
            </div>

            <div className="stepbar [display:flex] [align-items:flex-start] [justify-content:space-between] [gap:8px] [overflow-x:auto] [padding:4px_0_12px]">
              {stages.map((stage, index) => {
                let status = "pending";

                if (currentStageIndex >= 0 && index < currentStageIndex) {
                  status = "done";
                }

                if (index === currentStageIndex) {
                  status = "active";
                }

                return (
                  <div className="step-dot-wrap [position:relative] [display:flex] [min-width:88px] [flex:1] [flex-direction:column] [align-items:center] [gap:8px]" key={stage}>
                    {index > 0 && (
                      <div className={`${currentStageIndex >= index ? "[background:#22c55e]" : "[background:#e2e8f0]"} [position:absolute] [top:14px] [right:50%] [z-index:0] [height:2px] [width:100%]`} />
                    )}
                    <div className={`${(`step-dot ${status}`)} [position:relative] [z-index:1] [width:30px] [height:30px] [border:3px_solid_#fff] [border-radius:50%] [display:flex] [align-items:center] [justify-content:center] [font-weight:700] [font-size:11px] [box-shadow:0_0_0_1px_#e2e8f0] ${status === "active" ? "[background:#133f7d] [color:#fff] [box-shadow:0_0_0_1px_#133f7d]" : status === "done" ? "[background:#22c55e] [color:#fff] [box-shadow:0_0_0_1px_#22c55e]" : "[background:#f1f5f9] [color:#64748b]"}`}>
                      {status === "done" ? <Check size={14} /> : index + 1}
                    </div>

                    <span className={`${status === "active" ? "[color:#133f7d] [font-weight:750]" : status === "done" ? "[color:#334155] [font-weight:650]" : "[color:#94a3b8] [font-weight:500]"} [font-size:11px] [text-align:center] [white-space:nowrap]`}>
                      {stage.replace(" Interview", "")}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="[display:flex] [align-items:flex-start] [gap:9px] [border:1px_solid_#e2e8f0] [border-radius:9px] [background:#f8fafc] [padding:11px_12px] [font-size:12px] [line-height:1.6] [color:#64748b]">
              <ClockIcon size={15} className="[margin-top:1px] [flex-shrink:0] [color:#64748b]" />
              Stage decisions are managed from the Evaluations page. Candidates can only advance one stage at a time.
            </div>
          </div>

          {/* Interview Notes */}

          <div className="card [margin-top:18px] [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:14px] [padding:22px]">
            <div className="section-header [display:flex] [align-items:center] [gap:10px] [margin-bottom:14px]">
              <span className="[width:30px] [height:30px] [display:flex] [align-items:center] [justify-content:center] [border-radius:9px] [background:#f1f5f9] [color:#475569]">
                <FileText size={16} />
              </span>
              <div>
                <h3 className="[margin:0] [font-size:16px] [font-weight:750] [color:#1e293b]">Interview notes</h3>
                <p className="[margin:3px_0_0] [font-size:12px] [color:#64748b]">Shared context from the interview process</p>
              </div>
            </div>

            <div className="[min-height:64px] [white-space:pre-wrap] [overflow-wrap:anywhere] [border:1px_solid_#e8eef6] [border-radius:10px] [background:#f8fafc] [padding:15px] [font-size:13px] [line-height:1.75] [color:#334155]">
              {candidate?.interview_notes ||
                "No interview notes have been added yet."}
            </div>
          </div>

          {resumePreview && createPortal(
            <div
              className="[position:fixed] [inset:0] [z-index:1000] [display:flex] [align-items:center] [justify-content:center] [background:rgba(15,23,42,0.6)] [padding:20px]"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) closeResumePreview();
              }}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="resume-preview-title"
                className="[display:flex] [width:100%] [max-width:1000px] [max-height:calc(100dvh_-_40px)] [height:min(88dvh,900px)] [flex-direction:column] [overflow:hidden] [border-radius:14px] [background:#fff] [box-shadow:0_24px_70px_rgba(15,23,42,0.3)]"
              >
                <div className="[display:flex] [align-items:center] [justify-content:space-between] [gap:12px] [border-bottom:1px_solid_#e2e8f0] [padding:14px_18px]">
                  <div className="[min-width:0]">
                    <h2 id="resume-preview-title" className="[margin:0] [overflow:hidden] [font-size:14px] [font-weight:750] [text-overflow:ellipsis] [whitespace:nowrap] [color:#1e293b]">
                      {resumePreview.fileName}
                    </h2>
                    <p className="[margin:4px_0_0] [font-size:11px] [color:#64748b]">
                      Candidate resume
                    </p>
                  </div>
                  <div className="[display:flex] [flex-shrink:0] [align-items:center] [gap:8px]">
                    {resumeExtension !== "pdf" && (
                      <a
                        href={resumePreview.url}
                        download={resumePreview.fileName}
                        className="[display:inline-flex] [min-height:34px] [align-items:center] [gap:6px] [border-radius:8px] [background:#133f7d] [padding:0_10px] [font-size:11px] [font-weight:700] [color:#fff] [text-decoration:none]"
                      >
                        <Download size={14} />
                        Download
                      </a>
                    )}
                    <button
                      type="button"
                      aria-label="Close resume preview"
                      onClick={closeResumePreview}
                      className="[display:flex] [height:34px] [width:34px] [align-items:center] [justify-content:center] [border:0] [border-radius:8px] [background:#f1f5f9] [color:#475569] hover:[background:#e2e8f0]"
                    >
                      <X size={17} />
                    </button>
                  </div>
                </div>
                {resumePreview.html !== undefined ? (
                  <div
                    className="[min-height:0] [flex:1] [overflow:auto] [background:#f1f5f9] [p-6] [sm:p-8]"
                  >
                    <article
                      className="[mx-auto] [max-w-[760px]] [min-h-full] [bg-white] [p-8] [text-slate-800] [shadow-sm] [&_h1]:[margin:0_0_1rem] [&_h1]:[font-size:1.5rem] [&_h1]:[font-weight:700] [&_h2]:[margin:1rem_0_0.5rem] [&_h2]:[font-size:1.15rem] [&_h2]:[font-weight:700] [&_p]:[margin:0_0_0.75rem] [&_p]:[font-size:0.875rem] [&_p]:[line-height:1.7] [&_ul]:[list-style:disc] [&_ul]:[padding-left:1.5rem] [&_ol]:[list-style:decimal] [&_ol]:[padding-left:1.5rem] [&_table]:[width:100%] [&_td]:[border:1px_solid_#cbd5e1] [&_td]:[padding:0.5rem]"
                      dangerouslySetInnerHTML={{ __html: resumePreview.html }}
                    />
                  </div>
                ) : resumePreview.text !== undefined ? (
                  <pre className="[min-height:0] [flex:1] [overflow:auto] [whitespace-pre-wrap] [overflow-wrap:anywhere] [margin:0] [background:#f8fafc] [p-6] [text-sm] [leading-7] [text-slate-800]">
                    {resumePreview.text}
                  </pre>
                ) : resumeExtension === "pdf" ? (
                  <iframe
                    title={`Resume preview: ${resumePreview.fileName}`}
                    src={resumePreview.url}
                    className="[min-height:0] [width:100%] [flex:1] [border:0] [background:#f1f5f9]"
                  />
                ) : (
                  <div className="[display:flex] [flex:1] [flex-direction:column] [align-items:center] [justify-content:center] [gap:12px] [padding:24px] [text-align:center]">
                    <FileText size={34} className="[color:#133f7d]" />
                    <p className="[margin:0] [font-size:14px] [font-weight:650] [color:#334155]">
                      This file type can&apos;t be previewed in the browser.
                    </p>
                    <a
                      href={resumePreview.url}
                      download={resumePreview.fileName}
                      className="[display:inline-flex] [align-items:center] [gap:7px] [border-radius:8px] [background:#133f7d] [padding:9px_13px] [font-size:12px] [font-weight:700] [color:#fff] [text-decoration:none]"
                    >
                      <Download size={15} />
                      Download resume
                    </a>
                  </div>
                )}
              </section>
            </div>,
            document.body,
          )}

        </>
      )}
    </PageShell>
  );
}

export default CandidateDetailPage;

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
import toast from "react-hot-toast";

import PageShell from "./PageShell";
import badgeClass from "./badgeClass";
import {
  API_URL,
  getAuthHeader,
} from "../utils/auth";

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
  const [updatingStage, setUpdatingStage] = useState(false);

  useEffect(() => {
    if (!candidateId) {
      setError("No candidate selected");
      setLoading(false);
      return;
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
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load candidate profile"
          );
        }

        setCandidate(data);
      } catch (err) {
        console.error("Unable to load candidate", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCandidate();
  }, [candidateId]);

  const candidateName =
    candidate?.name ||
    candidate?.full_name ||
    "Candidate";

  const candidateStage =
    candidate?.stage ||
    candidate?.current_status ||
    candidate?.status ||
    "New";

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
      value: candidate?.notice_period
        ? `${candidate.notice_period} Days`
        : "—",
      icon: <CalendarIcon size={15} />,
    },
    {
      label: "Current CTC",
      value: candidate?.current_ctc
        ? `${candidate.current_ctc} LPA`
        : "—",
      icon: <CurrencyIcon size={15} />,
    },
  ];

  const skills =
    Array.isArray(candidate?.skills) &&
    candidate.skills.length > 0
      ? candidate.skills
      : [];

  const score = candidate?.score || 0;

  const breakdown = [
    [
      "Technical Skills",
      Math.min(100, score + 5),
    ],
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

  const handleStageChange = async (action) => {
    if (!candidateId) return;

    setUpdatingStage(true);

    try {
      const response = await fetch(
        `${API_URL}/api/candidates/${candidateId}/stage`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
          body: JSON.stringify({ action }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to update stage"
        );
      }

      setCandidate(data);

      if (action === "offer") {
        toast.success("Offer sent successfully!");
      } else if (action === "reject") {
        toast.success("Candidate rejected");
      } else {
        toast.success(
          `Stage updated to ${data.stage}`
        );
      }
    } catch (err) {
      toast.error(
        err.message || "Failed to update stage"
      );
    } finally {
      setUpdatingStage(false);
    }
  };

  return (
    <PageShell
      title="Candidate Profile"
      active="candidates"
      backTo="/candidates"
    >
      {loading ? (
        <div
          className="card"
          style={{
            padding: "40px",
            textAlign: "center",
          }}
        >
          Loading candidate profile...
        </div>
      ) : error ? (
        <div className="error-box">
          {error}
        </div>
      ) : (
        <>
          {/* Candidate Header */}

          <div className="card">
            <div className="profile-head">
              <div
                className="avatar large"
                style={{
                  background: "var(--brand-light)",
                  color: "var(--brand)",
                }}
              >
                {initials}
              </div>

              <div className="profile-main">
                <div className="profile-title-row">
                  <h2>{candidateName}</h2>

                  <span
                    className={`badge ${badgeClass(
                      candidateStage.toLowerCase()
                    )}`}
                  >
                    {candidateStage}
                  </span>
                </div>

                <p className="muted">
                  {candidate?.current_role || "Role not specified"}
                </p>

                <p
                  className="muted"
                  style={{ marginTop: "4px" }}
                >
                  Applied for{" "}
                  <strong>
                    {candidate?.role || "Position"}
                  </strong>
                </p>
              </div>

              <div className="score-box">
                <div className="score-value">
                  {score}
                </div>

                <div className="score-label">
                  AI SCORE
                </div>
              </div>
            </div>
          </div>

          <div style={{ height: "16px" }} />

          <div className="grid2">

            {/* Candidate Details */}

            <div className="card">
              <div className="section-header">
                <div>
                  <h3 style={{ margin: 0 }}>
                    Candidate Details
                  </h3>

                  <p
                    className="muted"
                    style={{ marginTop: "4px" }}
                  >
                    Personal and professional information
                  </p>
                </div>
              </div>

              {unifiedDetails.map((item) => (
                <div
                  className="detail-row"
                  key={item.label}
                >
                  <div
                    className="flex-row"
                    style={{
                      gap: "7px",
                      color: "var(--muted)",
                    }}
                  >
                    {item.icon}

                    <span>
                      {item.label}
                    </span>
                  </div>

                  <strong>
                    {item.value}
                  </strong>
                </div>
              ))}
            </div>

            {/* AI Assessment */}

            <div className="card">
              <div className="section-header">
                <div>
                  <div
                    className="flex-row"
                    style={{ gap: "7px" }}
                  >
                    <SparkIcon
                      size={17}
                      style={{
                        color: "var(--brand)",
                      }}
                    />

                    <h3 style={{ margin: 0 }}>
                      AI Assessment
                    </h3>
                  </div>

                  <p
                    className="muted"
                    style={{ marginTop: "4px" }}
                  >
                    Candidate evaluation summary
                  </p>
                </div>
              </div>

              {/* <div
                className="score-box large"
                style={{
                  marginTop: "8px",
                  marginBottom: "20px",
                }}
              >
                <div className="score-value">
                  {score}
                </div>

                <div className="score-label">
                  OVERALL SCORE
                </div>
              </div> */}

              <div className="tag-row">
                {skills.length > 0 ? (
                  skills.map((skill) => (
                    <span
                      key={skill}
                      className="tag"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="muted">
                    No skills listed
                  </span>
                )}
              </div>

              <div
                style={{
                  marginTop: "18px",
                }}
              >
                {breakdown.map(
                  ([label, value]) => (
                    <div
                      className="progress-row"
                      key={label}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                        }}
                      >
                        <span className="row-label">
                          {label}
                        </span>

                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        >
                          {value}%
                        </span>
                      </div>

                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${value}%`,
                            background:
                              "var(--brand)",
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          <div style={{ height: "16px" }} />

          {/* Recruitment Pipeline */}

          <div className="card">
            <div className="section-header">
              <div>
                <h3 style={{ margin: 0 }}>
                  Recruitment Progress
                </h3>

                <p
                  className="muted"
                  style={{ marginTop: "4px" }}
                >
                  Track and manage the candidate's
                  recruitment journey
                </p>
              </div>

              <span
                className={`badge ${badgeClass(
                  candidateStage.toLowerCase()
                )}`}
              >
                {candidateStage}
              </span>
            </div>

            <div className="stepbar">
              {stages.map((stage, index) => {
                let status = "pending";

                if (
                  currentStageIndex >= 0 &&
                  index < currentStageIndex
                ) {
                  status = "done";
                }

                if (index === currentStageIndex) {
                  status = "active";
                }

                return (
                  <div
                    className="step-dot-wrap"
                    key={stage}
                  >
                    <div
                      className={`step-dot ${status}`}
                    >
                      {status === "done" ? (
                        <Check size={15} />
                      ) : (
                        index + 1
                      )}
                    </div>

                    <span>
                      {stage.replace(
                        " Interview",
                        ""
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            <div
              className="inline-actions"
              style={{
                flexWrap: "wrap",
                marginTop: "10px",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() =>
                  handleStageChange("schedule")
                }
                disabled={
                  updatingStage ||
                  candidateStage === "L1 Interview"
                }
              >
                Move to L1
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() =>
                  handleStageChange("l2")
                }
                disabled={
                  updatingStage ||
                  candidateStage !== "L1 Interview"
                }
              >
                Move to L2
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() =>
                  handleStageChange("client")
                }
                disabled={
                  updatingStage ||
                  candidateStage !== "L2 Interview"
                }
              >
                Move to Client
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() =>
                  handleStageChange("offer")
                }
                disabled={
                  updatingStage ||
                  candidateStage === "Offer Sent"
                }
              >
                Send Offer
              </button>

              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() =>
                  handleStageChange("reject")
                }
                disabled={
                  updatingStage ||
                  candidateStage === "Rejected"
                }
              >
                Reject
              </button>
            </div>
          </div>

          <div style={{ height: "16px" }} />

          {/* Interview Notes */}

          <div className="card">
            <div className="section-header">
              <div
                className="flex-row"
                style={{ gap: "8px" }}
              >
                <ClockIcon
                  size={17}
                  style={{
                    color: "var(--brand)",
                  }}
                />

                <h3 style={{ margin: 0 }}>
                  Interview Notes
                </h3>
              </div>

              <FileText
                size={18}
                color="var(--muted)"
              />
            </div>

            <div className="email-preview">
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
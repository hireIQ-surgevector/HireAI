import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import PageShell from "./PageShell";
import badgeClass from "./badgeClass";
import {
  API_URL,
  canAccessSensitive,
  getAuthHeader,
  getSession,
} from "../utils/auth";

function getCandidateInitials(name) {
  if (!name) return "?";

  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function normalizeStatus(candidate) {
  return (
    candidate.current_status || candidate.status || candidate.stage || "New"
  );
}

function JobCandidatesPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const session = getSession();

  const [jobTitle, setJobTitle] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchJobCandidates = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/jobs/${jobId}/candidates`,
          {
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeader(),
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch job candidates");
        }

        setJobTitle(data.job_title || "");

        setCandidates(Array.isArray(data.candidates) ? data.candidates : []);
      } catch (err) {
        console.error("Unable to load job candidates", err);

        setError(err.message);
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJobCandidates();
    }
  }, [jobId]);

  const totalCandidates = candidates.length;

  const newCandidates = candidates.filter((candidate) =>
    normalizeStatus(candidate).toLowerCase().includes("new"),
  ).length;

  const shortlistedCandidates = candidates.filter((candidate) => {
    const status = normalizeStatus(candidate).toLowerCase();

    return status.includes("shortlist") || status.includes("interview");
  }).length;

  const selectedCandidates = candidates.filter((candidate) => {
    const status = normalizeStatus(candidate).toLowerCase();

    return (
      status.includes("select") ||
      status.includes("offer") ||
      status.includes("hire")
    );
  }).length;

  return (
    <PageShell title="Job Candidates" backTo="/jobs">
      <div className="section-header">
        <div>
          <h2 className="page-heading">{jobTitle || `Job #${jobId}`}</h2>

          <p className="muted" style={{ marginTop: "5px" }}>
            Candidates who have applied for this position
          </p>
        </div>
      </div>

      <div className="grid4">
        <div className="stat-card">
          <div className="stat-label">Total Candidates</div>

          <div className="stat-num">{totalCandidates}</div>

          <div
            className="stat-icon"
            style={{
              background: "var(--brand-light)",
              color: "var(--brand)",
            }}
          >
            👥
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">New Applications</div>

          <div className="stat-num">{newCandidates}</div>

          <div
            className="stat-icon"
            style={{
              background: "#e0f7fa",
              color: "var(--teal)",
            }}
          >
            📩
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">In Progress</div>

          <div className="stat-num">{shortlistedCandidates}</div>

          <div
            className="stat-icon"
            style={{
              background: "#fef3c7",
              color: "var(--orange)",
            }}
          >
            ⏳
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Selected / Offered</div>

          <div className="stat-num">{selectedCandidates}</div>

          <div
            className="stat-icon"
            style={{
              background: "#dcfce7",
              color: "var(--green)",
            }}
          >
            ✓
          </div>
        </div>
      </div>

      <div style={{ height: "20px" }} />

      <div className="section-header">
        <div>
          <h3 style={{ margin: 0 }}>Applied Candidates</h3>

          <p className="muted" style={{ marginTop: "4px" }}>
            {totalCandidates} candidate
            {totalCandidates !== 1 ? "s" : ""} found
          </p>
        </div>
      </div>

      <div className="card table-card">
        {loading ? (
          <div
            style={{
              padding: "30px",
              textAlign: "center",
            }}
          >
            Loading candidates...
          </div>
        ) : error ? (
          <div className="error-box" style={{ margin: "16px" }}>
            {error}
          </div>
        ) : candidates.length === 0 ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "32px",
                marginBottom: "10px",
              }}
            >
              👥
            </div>

            <div className="strong">No candidates yet</div>

            <div className="muted" style={{ marginTop: "5px" }}>
              No candidates have applied to this job yet.
            </div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Email</th>
                <th>Status</th>
                <th>Applied Date</th>
              </tr>
            </thead>

            <tbody>
              {candidates.map((candidate) => {
                const status = normalizeStatus(candidate);

                return (
                  <tr
                    key={candidate.candidate_id}
                    onClick={() =>
                      canAccessSensitive(session) &&
                      navigate(`/candidate-detail/${candidate.candidate_id}`)
                    }
                    style={{
                      cursor: canAccessSensitive(session)
                        ? "pointer"
                        : "default",
                    }}
                  >
                    <td>
                      <div className="flex-row">
                        <div
                          className="avatar"
                          style={{
                            background: "var(--brand-light)",
                            color: "var(--brand)",
                          }}
                        >
                          {getCandidateInitials(
                            candidate.full_name || candidate.name,
                          )}
                        </div>

                        <div>
                          <div className="strong">
                            {candidate.full_name ||
                              candidate.name ||
                              "Unknown Candidate"}
                          </div>

                          {candidate.current_role && (
                            <div className="muted">
                              {candidate.current_role}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>{candidate.email || "—"}</td>

                    <td>
                      <span
                        className={`badge ${badgeClass(status.toLowerCase())}`}
                      >
                        {status}
                      </span>
                    </td>

                    <td>
                      {candidate.applied_date
                        ? new Date(candidate.applied_date).toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  );
}

export default JobCandidatesPage;

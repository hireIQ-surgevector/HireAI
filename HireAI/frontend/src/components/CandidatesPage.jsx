import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import PageShell from "./PageShell";
import scoreBar from "./scoreBar";
import badgeClass from "./badgeClass";
import {
  API_URL,
  canAccessSensitive,
  canManageCandidates,
  getAuthHeader,
  getSession,
} from "../utils/auth";

function matchesFilter(candidate, filter) {
  if (filter === "all") return true;
  if (filter === "offered")
    return (
      (candidate.status || "").toLowerCase().includes("offer") ||
      (candidate.stage || "").toLowerCase().includes("offer")
    );
  if (filter === "rejected")
    return (
      (candidate.status || "").toLowerCase().includes("reject") ||
      (candidate.stage || "").toLowerCase().includes("reject")
    );
  return (
    (candidate.status || "").toLowerCase() === filter ||
    (candidate.stage || "").toLowerCase() === filter
  );
}

function CandidatesPage() {
  const [filter, setFilter] = useState("all");
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const session = getSession();
  const navigate = useNavigate();

  useEffect(() => {
    const loadCandidates = async () => {
      try {
        const response = await fetch(`${API_URL}/api/candidates`, {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to load candidates");
        }
        if (Array.isArray(data)) {
          setCandidates(data);
        } else {
          setCandidates([]);
        }
      } catch (err) {
        console.error("Unable to load candidates", err);
        setError(err.message);
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    };
    loadCandidates();
  }, []);

  const visible = candidates.filter((item) => matchesFilter(item, filter));

  return (
    <PageShell
      title="Candidates"
      active="candidates"
      actions={
        <>
          {canManageCandidates(session) && (
            <Link to="/upload-resume" className="btn btn-ghost btn-sm">
              📤 Upload Resumes
            </Link>
          )}
        </>
      }
    >
      <div className="pill-row">
        {["all", "active", "offered", "rejected"].map((value) => (
          <button
            key={value}
            type="button"
            className={`pill-tab ${filter === value ? "active" : ""}`}
            onClick={() => setFilter(value)}
          >
            {value === "all"
              ? `All (${candidates.length})`
              : value.charAt(0).toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>
      <div className="card table-card">
        {loading ? (
          <div
            className="card"
            style={{ padding: "24px", textAlign: "center" }}
          >
            Loading candidates...
          </div>
        ) : error ? (
          <div className="error-box" style={{ margin: "16px" }}>
            {error}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Role</th>
                <th>Exp</th>
                <th>AI Score</th>
                <th>Notice Period</th>
                <th>Stage</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((candidate) => (
                <tr
                  key={candidate.candidate_id || candidate.name}
                  onClick={() =>
                    canAccessSensitive(session) &&
                    navigate(`/candidate-detail/${candidate.candidate_id}`)
                  }
                  style={{
                    cursor: canAccessSensitive(session) ? "pointer" : "default",
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
                        {(candidate.name || "")
                          .split(" ")
                          .map((word) => word[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <span className="strong">{candidate.name}</span>
                    </div>
                  </td>
                  <td>{candidate.role}</td>
                  <td>{candidate.experience}</td>
                  <td>{scoreBar(candidate.score || 0)}</td>
                  <td>{candidate.notice_period || "—"}</td>
                  <td>
                    <span
                      className={`badge ${badgeClass(candidate.status || "active")}`}
                    >
                      {candidate.stage}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  );
}

export default CandidatesPage;

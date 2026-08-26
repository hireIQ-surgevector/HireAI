import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Users,
  UserCheck,
  Send,
  UserX,
  Filter,
  RotateCcw,
} from "lucide-react";

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

function CandidatesPage() {
  const [stageFilter, setStageFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const session = getSession();
  const navigate = useNavigate();

  useEffect(() => {
    const loadCandidates = async () => {
      try {
        setLoading(true);
        setError("");

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

        setCandidates(Array.isArray(data) ? data : []);
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

  const getCandidateStage = (candidate) => {
    return (
      candidate.stage ||
      candidate.status ||
      "Applied"
    );
  };

  const stageCounts = useMemo(() => {
    return {
      all: candidates.length,

      active: candidates.filter((candidate) => {
        const stage = getCandidateStage(candidate).toLowerCase();

        return (
          !stage.includes("offer") &&
          !stage.includes("reject")
        );
      }).length,

      offered: candidates.filter((candidate) =>
        getCandidateStage(candidate)
          .toLowerCase()
          .includes("offer")
      ).length,

      rejected: candidates.filter((candidate) =>
        getCandidateStage(candidate)
          .toLowerCase()
          .includes("reject")
      ).length,
    };
  }, [candidates]);

  const availableStages = useMemo(() => {
    const stages = candidates
      .map((candidate) => getCandidateStage(candidate))
      .filter(Boolean);

    return [...new Set(stages)];
  }, [candidates]);

  const visibleCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      const stage = getCandidateStage(candidate).toLowerCase();

      const search = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !search ||
        (candidate.name || "").toLowerCase().includes(search) ||
        (candidate.role || "").toLowerCase().includes(search) ||
        (candidate.email || "").toLowerCase().includes(search);

      let matchesStage = true;

      if (stageFilter === "active") {
        matchesStage =
          !stage.includes("offer") &&
          !stage.includes("reject");
      } else if (stageFilter === "offered") {
        matchesStage = stage.includes("offer");
      } else if (stageFilter === "rejected") {
        matchesStage = stage.includes("reject");
      } else if (stageFilter !== "all") {
        matchesStage =
          getCandidateStage(candidate) === stageFilter;
      }

      return matchesSearch && matchesStage;
    });
  }, [candidates, stageFilter, searchTerm]);

  const clearFilters = () => {
    setStageFilter("all");
    setSearchTerm("");
  };

  const initials = (name = "") =>
    name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <PageShell
      title="Candidates"
      active="candidates"
      actions={
        canManageCandidates(session) && (
          <Link to="/upload-resume" className="btn btn-primary btn-sm">
            📤 Upload Resumes
          </Link>
        )
      }
    >
      {/* Summary Cards */}

      <div className="candidate-summary-grid">
        <button
          type="button"
          className={`candidate-summary-card ${
            stageFilter === "all" ? "selected" : ""
          }`}
          onClick={() => setStageFilter("all")}
        >
          <div className="candidate-summary-icon icon-blue">
            <Users size={20} />
          </div>

          <div>
            <div className="candidate-summary-label">
              Total Candidates
            </div>

            <div className="candidate-summary-value">
              {stageCounts.all}
            </div>
          </div>
        </button>

        <button
          type="button"
          className={`candidate-summary-card ${
            stageFilter === "active" ? "selected" : ""
          }`}
          onClick={() => setStageFilter("active")}
        >
          <div className="candidate-summary-icon icon-teal">
            <UserCheck size={20} />
          </div>

          <div>
            <div className="candidate-summary-label">
              Active Pipeline
            </div>

            <div className="candidate-summary-value">
              {stageCounts.active}
            </div>
          </div>
        </button>

        <button
          type="button"
          className={`candidate-summary-card ${
            stageFilter === "offered" ? "selected" : ""
          }`}
          onClick={() => setStageFilter("offered")}
        >
          <div className="candidate-summary-icon icon-green">
            <Send size={20} />
          </div>

          <div>
            <div className="candidate-summary-label">
              Offers Sent
            </div>

            <div className="candidate-summary-value">
              {stageCounts.offered}
            </div>
          </div>
        </button>

        <button
          type="button"
          className={`candidate-summary-card ${
            stageFilter === "rejected" ? "selected" : ""
          }`}
          onClick={() => setStageFilter("rejected")}
        >
          <div className="candidate-summary-icon icon-red">
            <UserX size={20} />
          </div>

          <div>
            <div className="candidate-summary-label">
              Rejected
            </div>

            <div className="candidate-summary-value">
              {stageCounts.rejected}
            </div>
          </div>
        </button>
      </div>

      {/* Search and Filters */}

      <div className="candidate-toolbar">
        <div className="candidate-search">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search by candidate, role or email..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="candidate-filter">
          <Filter size={16} />

          <select
            value={stageFilter}
            onChange={(event) => setStageFilter(event.target.value)}
          >
            <option value="all">All Stages</option>
            <option value="active">Active Candidates</option>
            <option value="offered">Offer Sent</option>
            <option value="rejected">Rejected</option>

            {availableStages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>

        {(stageFilter !== "all" || searchTerm) && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={clearFilters}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        )}
      </div>

      {/* Result Information */}

      {!loading && !error && (
        <div className="candidate-results-info">
          Showing <strong>{visibleCandidates.length}</strong> of{" "}
          <strong>{candidates.length}</strong> candidates
        </div>
      )}

      {/* Candidates Table */}

      <div className="card table-card">
        {loading ? (
          <div className="candidate-empty-state">
            <div className="loading-spinner" />
            <p>Loading candidates...</p>
          </div>
        ) : error ? (
          <div className="error-box" style={{ margin: "16px" }}>
            {error}
          </div>
        ) : visibleCandidates.length === 0 ? (
          <div className="candidate-empty-state">
            <div className="empty-icon">
              <Users size={30} />
            </div>

            <h3>No candidates found</h3>

            <p>
              Try changing your search or filter criteria.
            </p>

            {(stageFilter !== "all" || searchTerm) && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Role</th>
                <th>Experience</th>
                <th>AI Score</th>
                <th>Notice Period</th>
                <th>Stage</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {visibleCandidates.map((candidate) => {
                const stage = getCandidateStage(candidate);

                return (
                  <tr
                    key={candidate.candidate_id || candidate.name}
                    className="candidate-table-row"
                    onClick={() =>
                      canAccessSensitive(session) &&
                      navigate(
                        `/candidate-detail/${candidate.candidate_id}`
                      )
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
                          {initials(candidate.name)}
                        </div>

                        <div className="candidate-name-cell">
                          <span className="strong">
                            {candidate.name || "Unknown Candidate"}
                          </span>

                          <span className="muted">
                            {candidate.email || "No email available"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="candidate-role">
                        {candidate.role || "—"}
                      </span>
                    </td>

                    <td>
                      {candidate.experience || "—"}
                    </td>

                    <td>
                      {scoreBar(candidate.score || 0)}
                    </td>

                    <td>
                      {candidate.notice_period || "—"}
                    </td>

                    <td>
                      <span
                        className={`badge ${badgeClass(
                          candidate.status || stage
                        )}`}
                      >
                        {stage}
                      </span>
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

export default CandidatesPage;
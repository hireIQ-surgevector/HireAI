import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import PageShell from "../components/common/PageShell";
import PageState from "../components/common/PageState";
import StatusBadge from "../components/common/StatusBadge";
import StatCard from "../components/common/StatCard";
import { CheckCircle2, Clock3, UserPlus, Users } from "lucide-react";
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
  const [reloadCount, setReloadCount] = useState(0);

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
  }, [jobId, reloadCount]);

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
      <div className="section-header [display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:14px]">
        <div>
          <h2 className="page-heading [font-size:20px] [font-weight:800] [color:#1e293b] [margin:0]">{jobTitle || `Job #${jobId}`}</h2>

          <p className="muted [margin-top:5px] [font-size:12px] [color:#64748b]" >
            Candidates who have applied for this position
          </p>
        </div>
      </div>

      <div className="grid4 [display:grid] [grid-template-columns:repeat(4,_1fr)] [gap:14px] max-[960px]:[grid-template-columns:1fr] max-[960px]:[flex-direction:column]">
        <StatCard
          label="Total Candidates"
          value={totalCandidates}
          icon={<Users size={18} />}
          color="brand"
        />
        <StatCard
          label="New Applications"
          value={newCandidates}
          icon={<UserPlus size={18} />}
          color="teal"
        />
        <StatCard
          label="In Progress"
          value={shortlistedCandidates}
          icon={<Clock3 size={18} />}
          color="orange"
        />
        <StatCard
          label="Selected / Offered"
          value={selectedCandidates}
          icon={<CheckCircle2 size={18} />}
          color="green"
        />
      </div>

      <div className="[height:20px]"  />

      <div className="section-header [display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:14px]">
        <div>
          <h3 className="[margin:0px]" >Applied Candidates</h3>

          <p className="muted [margin-top:4px] [font-size:12px] [color:#64748b]" >
            {totalCandidates} candidate
            {totalCandidates !== 1 ? "s" : ""} found
          </p>
        </div>
      </div>

      <div className="card table-card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [padding:0] [overflow:hidden]">
        {loading ? (
          <PageState variant="loading" title="Loading job candidates" rows={5} />
        ) : error ? (
          <PageState
            variant="error"
            title="Couldn't load job candidates"
            description={error}
            onRetry={() => setReloadCount((count) => count + 1)}
          />
        ) : candidates.length === 0 ? (
          <PageState
            variant="empty"
            title="No applicants yet"
            description="Candidates who apply to this job will appear here."
          />
        ) : (
          <table className="[width:100%] [border-collapse:collapse]">
            <thead>
              <tr>
                <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]">Candidate</th>
                <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]">Email</th>
                <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]">Status</th>
                <th className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [text-align:left] [font-size:11px] [color:#64748b] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.4px] [background:#f8fafc]">Applied Date</th>
              </tr>
            </thead>

            <tbody>
              {candidates.map((candidate) => {
                const status = normalizeStatus(candidate);

                return (
                  <tr
                    key={candidate.candidate_id}
                    className={canAccessSensitive(session) ? "cursor-pointer" : "cursor-default"}
                    onClick={() =>
                      canAccessSensitive(session) &&
                      navigate(`/candidate-detail/${candidate.candidate_id}`)
                    }
                  >
                    <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc]">
                      <div className="flex-row [display:flex] [align-items:center] [gap:10px]">
                        <div
                          className="avatar [background:#e8f0fb] [color:#133f7d] [width:34px] [height:34px] [border-radius:50%] [display:flex] [align-items:center] [justify-content:center] [font-weight:700] [font-size:12px]"

                        >
                          {getCandidateInitials(
                            candidate.full_name || candidate.name,
                          )}
                        </div>

                        <div>
                          <div className="font-bold">
                            {candidate.full_name ||
                              candidate.name ||
                              "Unknown Candidate"}
                          </div>

                          {candidate.current_role && (
                            <div className="muted [font-size:12px] [color:#64748b]">
                              {candidate.current_role}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc]">{candidate.email || "—"}</td>

                    <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc]">
                      <StatusBadge status={status} />
                    </td>

                    <td className="[padding:11px_14px] [border-bottom:1px_solid_#e2e8f0] [font-size:13px] [tr:hover_&]:[background:#f8fafc]">
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

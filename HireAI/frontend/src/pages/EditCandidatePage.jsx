import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BriefcaseBusiness,
  CalendarDays,
  IndianRupee,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";

import PageShell from "./PageShell";
import { API_URL, getAuthHeader } from "../utils/auth";

function EditCandidatePage() {
  const { candidateId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    current_role: "",
    skills: "",
    notice_period: "",
    current_ctc: "",
  });

  useEffect(() => {
    if (!candidateId) {
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
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load candidate");
        }

        setCandidateName(data.name || data.full_name || "Candidate");

        setCandidateEmail(data.email || "");

        setFormData({
          full_name: data.name || data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          location: data.location || "",
          current_role: data.current_role || "",
          skills: Array.isArray(data.skills)
            ? data.skills.join(", ")
            : data.skills || "",
          notice_period: data.notice_period ?? "",
          current_ctc: data.current_ctc ?? "",
        });
      } catch (err) {
        console.error("Unable to load candidate:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCandidate();
  }, [candidateId]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/api/candidates/${candidateId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          full_name: formData.full_name.trim(),
          location: formData.location.trim(),
          current_role: formData.current_role.trim(),
          skills: formData.skills,
          notice_period:
            formData.notice_period === ""
              ? null
              : Number(formData.notice_period),
          current_ctc:
            formData.current_ctc === "" ? null : Number(formData.current_ctc),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update candidate");
      }

      toast.success("Candidate details updated successfully");

      navigate(`/candidate-detail/${candidateId}`);
    } catch (err) {
      console.error("Unable to update candidate:", err);

      toast.error(err.message || "Failed to update candidate details");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageShell title="Edit Candidate" backTo={`/candidates/${candidateId}`}>
        <div
          className="card"
          style={{
            padding: "40px",
            textAlign: "center",
          }}
        >
          Loading candidate details...
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Edit Candidate" backTo={`/candidates/${candidateId}`}>
        <div className="error-box">{error}</div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Edit Candidate"
      backTo={`/candidate-detail/${candidateId}`}
    >
      <div className="candidate-edit-container">
        <div className="candidate-edit-info">
          <div className="candidate-edit-avatar">
            {candidateName.charAt(0).toUpperCase()}
          </div>

          <div>
            <div className="candidate-edit-label">Editing Candidate</div>

            <h3 className="candidate-edit-name">{candidateName}</h3>

            {candidateEmail && (
              <p className="candidate-edit-email">{candidateEmail}</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <div>
              <h3 style={{ margin: 0 }}>Edit Candidate Details</h3>

              <p className="muted" style={{ marginTop: "4px" }}>
                Update the candidate's current professional information.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="edit-candidate-grid">
              <div className="form-group">
                <label htmlFor="full_name">Candidate Name</label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Priya Sharma"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. candidate@gmail.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Mobile Number</label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +91 9876543210"
                />
              </div>

              <div className="form-group">
                <label htmlFor="skills">Skills</label>
                <input
                  id="skills"
                  name="skills"
                  type="text"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="e.g. Python, SQL, React"
                />
              </div>

              {/* Location */}

              <div className="form-group">
                <label htmlFor="location">
                  <MapPin size={15} />
                  Location
                </label>

                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Hyderabad"
                />
              </div>

              {/* Current Role */}

              <div className="form-group">
                <label htmlFor="current_role">
                  <BriefcaseBusiness size={15} />
                  Current Role
                </label>

                <input
                  id="current_role"
                  name="current_role"
                  type="text"
                  value={formData.current_role}
                  onChange={handleChange}
                  placeholder="e.g. Senior React Developer"
                />
              </div>

              {/* Notice Period */}

              <div className="form-group">
                <label htmlFor="notice_period">
                  <CalendarDays size={15} />
                  Notice Period
                </label>

                <div className="input-with-suffix">
                  <input
                    id="notice_period"
                    name="notice_period"
                    type="number"
                    min="0"
                    value={formData.notice_period}
                    onChange={handleChange}
                    placeholder="e.g. 30"
                  />

                  <span>Days</span>
                </div>
              </div>

              {/* Current CTC */}

              <div className="form-group">
                <label htmlFor="current_ctc">
                  <IndianRupee size={15} />
                  Current CTC
                </label>

                <div className="input-with-suffix">
                  <input
                    id="current_ctc"
                    name="current_ctc"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.current_ctc}
                    onChange={handleChange}
                    placeholder="e.g. 12.5"
                  />

                  <span>LPA</span>
                </div>
              </div>
            </div>

            <div className="edit-candidate-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(`/candidate-detail/${candidateId}`)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
}

export default EditCandidatePage;

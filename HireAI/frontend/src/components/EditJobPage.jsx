import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import PageShell from "./PageShell";

function EditJobPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    description: "",
    mandatory_skills: "",
    required_skills: "",
    min_exp: 0,
    min_salary: "",
    max_salary: "",
    due_date: "",
    interview_mode: "Video Interview (IncVid)",
  });

  // Read-only metadata
  const [meta, setMeta] = useState({
    created_at: "",
    created_by: "",
  });

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`http://localhost:5001/api/jobs/${jobId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load job details.");
      }

      const data = await response.json();

      setFormData({
        title: data.title || "",
        department: data.department || "",
        location: data.location || "",
        description: data.description || "",
        mandatory_skills: data.mandatory_skills || "",
        required_skills: data.required_skills || "",
        min_exp: data.min_exp || 0,
        min_salary: data.min_salary ?? "",
        max_salary: data.max_salary ?? "",
        due_date: data.due_date || "",
        interview_mode: data.interview_mode || "Video Interview (IncVid)",
      });

      setMeta({
        created_at: data.created_at
          ? new Date(data.created_at).toLocaleDateString()
          : "N/A",
        created_by: data.created_by || "System",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      formData.min_salary &&
      formData.max_salary &&
      Number(formData.min_salary) > Number(formData.max_salary)
    ) {
      setError("Minimum salary cannot be greater than maximum salary.");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      const payload = {
        title: formData.title,
        department: formData.department,
        location: formData.location,
        description: formData.description,
        mandatory_skills: formData.mandatory_skills,
        required_skills: formData.required_skills,
        min_exp: Number(formData.min_exp),
        min_salary: formData.min_salary ? Number(formData.min_salary) : null,
        max_salary: formData.max_salary ? Number(formData.max_salary) : null,
        due_date: formData.due_date || null,
        interview_mode: formData.interview_mode,
      };

      const response = await fetch(`http://localhost:5001/api/jobs/${jobId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update job posting.");
      }

      setSuccess("Job updated successfully! Redirecting...");
      setTimeout(() => {
        navigate("/jobs");
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageShell title="Edit Job Opening" active="jobs">
        <div className="card" style={{ padding: "24px", textAlign: "center" }}>
          Loading job details...
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={`Edit Job`} active="jobs">
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <div style={{ marginBottom: "16px" }}>
          <Link to="/jobs" className="btn btn-ghost btn-sm">
            ← Back to Jobs
          </Link>
        </div>

        {error && (
          <div
            className="error-box"
            style={{ marginBottom: "16px", color: "red" }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="success-box"
            style={{ marginBottom: "16px", color: "green" }}
          >
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="card"
          style={{ padding: "24px" }}
        >
          <h3>Edit Job Details</h3>
          <p className="muted" style={{ marginBottom: "20px" }}>
            Update requirements, compensation, location, or job specifications.
          </p>

          {/* Read-only Metadata Banner */}
          <div
            style={{
              padding: "12px",
              backgroundColor: "#f5f5f5",
              borderRadius: "6px",
              marginBottom: "20px",
              fontSize: "0.85rem",
              display: "flex",
              gap: "24px",
            }}
          >
            <div>
              <strong>Job ID:</strong> {jobId}
            </div>
            <div>
              <strong>Posted On:</strong> {meta.created_at}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: "6px",
              }}
            >
              Job Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="form-control"
              style={{ width: "100%", padding: "8px" }}
            />
          </div>

          <div
            className="form-row"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  marginBottom: "6px",
                }}
              >
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="form-control"
                style={{ width: "100%", padding: "8px" }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  marginBottom: "6px",
                }}
              >
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="form-control"
                style={{ width: "100%", padding: "8px" }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: "6px",
              }}
            >
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={5}
              className="form-control"
              style={{ width: "100%", padding: "8px" }}
            />
          </div>

          <div
            className="form-row"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  marginBottom: "6px",
                }}
              >
                Mandatory Skills
              </label>
              <input
                type="text"
                name="mandatory_skills"
                value={formData.mandatory_skills}
                onChange={handleChange}
                placeholder="e.g. React, Node.js"
                className="form-control"
                style={{ width: "100%", padding: "8px" }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  marginBottom: "6px",
                }}
              >
                Required / Desired Skills
              </label>
              <input
                type="text"
                name="required_skills"
                value={formData.required_skills}
                onChange={handleChange}
                placeholder="e.g. Docker, AWS"
                className="form-control"
                style={{ width: "100%", padding: "8px" }}
              />
            </div>
          </div>

          <div
            className="form-row"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  marginBottom: "6px",
                }}
              >
                Min Experience (Years)
              </label>
              <input
                type="number"
                name="min_exp"
                value={formData.min_exp}
                onChange={handleChange}
                min="0"
                className="form-control"
                style={{ width: "100%", padding: "8px" }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  marginBottom: "6px",
                }}
              >
                Target Fill Date / Due Date
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="form-control"
                style={{ width: "100%", padding: "8px" }}
              />
            </div>
          </div>

          <div
            className="form-row"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  marginBottom: "6px",
                }}
              >
                Min Salary (LPA)
              </label>
              <input
                type="number"
                name="min_salary"
                value={formData.min_salary}
                onChange={handleChange}
                min="0"
                placeholder="e.g. 80000"
                className="form-control"
                style={{ width: "100%", padding: "8px" }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  marginBottom: "6px",
                }}
              >
                Max Salary (LPA)
              </label>
              <input
                type="number"
                name="max_salary"
                value={formData.max_salary}
                onChange={handleChange}
                min="0"
                placeholder="e.g. 120000"
                className="form-control"
                style={{ width: "100%", padding: "8px" }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: "6px",
              }}
            >
              Interview Mode
            </label>
            <select
              name="interview_mode"
              value={formData.interview_mode}
              onChange={handleChange}
              className="form-control"
              style={{ width: "100%", padding: "8px" }}
            >
              <option value="Video Interview (IncVid)">
                Video Interview (IncVid)
              </option>
              <option value="AI Interview (IncBot)">
                AI Interview (IncBot)
              </option>
            </select>
          </div>

          <div
            style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}
          >
            <Link to="/jobs" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}

export default EditJobPage;

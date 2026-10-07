import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import PageShell from "../components/common/PageShell";
import PageState from "../components/common/PageState";

function EditJobPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);

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

  const fetchJobDetails = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
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
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    const taskId = window.setTimeout(fetchJobDetails, 0);
    return () => window.clearTimeout(taskId);
  }, [fetchJobDetails, loadAttempt]);

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
        <PageState variant="loading" title="Loading job details" rows={4} />
      </PageShell>
    );
  }

  if (loadError) {
    return (
      <PageShell title="Edit Job Opening" active="jobs">
        <PageState
          variant="error"
          title="Couldn't load job details"
          description={loadError}
          onRetry={() => setLoadAttempt((attempt) => attempt + 1)}
        />
      </PageShell>
    );
  }

  return (
    <PageShell title={`Edit Job`} active="jobs">
      <div className="[max-width:720px] [margin:0_auto]" >
        <div className="[margin-bottom:16px]" >
          <Link to="/jobs" className="btn btn-ghost btn-sm [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:transparent] [color:#64748b] [border:1px_solid_#e2e8f0] [padding:6px_14px] [font-size:12px]">
            ← Back to Jobs
          </Link>
        </div>

        {error && (
          <div
            className="error-box [margin-bottom:16px] [color:red] [background:#fee2e2] [color:#991b1b] [padding:10px] [border-radius:8px] [font-size:12px] [margin-bottom:10px]"

          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="mb-4 rounded-lg bg-green-100 p-2.5 text-xs text-green-800"

          >
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="card [padding:24px] [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px]"

        >
          <h3 className="[.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px]">Edit Job Details</h3>
          <p className="muted [margin-bottom:20px] [font-size:12px] [color:#64748b]" >
            Update requirements, compensation, location, or job specifications.
          </p>

          {/* Read-only Metadata Banner */}
          <div className="[padding:12px] [background-color:#f5f5f5] [border-radius:6px] [margin-bottom:20px] [font-size:0.85rem] [display:flex] [gap:24px]"

          >
            <div>
              <strong className="[font-weight:700]">Job ID:</strong> {jobId}
            </div>
            <div>
              <strong className="[font-weight:700]">Posted On:</strong> {meta.created_at}
            </div>
          </div>

          <div className="form-group [margin-bottom:16px] [display:flex] [flex-direction:column] [gap:8px]" >
            <label className="[display:block] [font-weight:bold] [margin-bottom:6px] [font-size:13px] [font-weight:600] [color:#1e293b] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold] [.form-group_&]:[display:flex] [.form-group_&]:[align-items:center] [.form-group_&]:[gap:6px] [.form-group_&]:[font-size:13px] [.form-group_&]:[font-weight:600] [.form-group_&]:[color:#1e293b]"

            >
              Job Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="form-control [width:100%] [padding:8px] [font:inherit] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [.form-group_&]:[width:100%] [.form-group_&]:[height:42px] [.form-group_&]:[padding:0_12px] [.form-group_&]:[border:1px_solid_#dfe3e8] [.form-group_&]:[border-radius:8px] [.form-group_&]:[background:#ffffff] [.form-group_&]:[color:#1e293b] [.form-group_&]:[font-size:14px] [.form-group_&]:[outline:none] [.form-group_&]:[box-sizing:border-box] [.form-group_&]:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease] focus:[.form-group_&]:[border-color:#133f7d] focus:[.form-group_&]:[box-shadow:0_0_0_3px_rgba(19,_63,_125,_0.08)]"

            />
          </div>

          <div
            className="form-row [display:grid] [grid-template-columns:1fr_1fr] [gap:16px] [margin-bottom:16px]"

          >
            <div>
              <label className="[display:block] [font-weight:bold] [margin-bottom:6px] [font-size:13px] [font-weight:600] [color:#1e293b] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]"

              >
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="form-control [width:100%] [padding:8px] [font:inherit] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]"

              />
            </div>
            <div>
              <label className="[display:block] [font-weight:bold] [margin-bottom:6px] [font-size:13px] [font-weight:600] [color:#1e293b] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]"

              >
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="form-control [width:100%] [padding:8px] [font:inherit] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]"

              />
            </div>
          </div>

          <div className="form-group [margin-bottom:16px] [display:flex] [flex-direction:column] [gap:8px]" >
            <label className="[display:block] [font-weight:bold] [margin-bottom:6px] [font-size:13px] [font-weight:600] [color:#1e293b] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold] [.form-group_&]:[display:flex] [.form-group_&]:[align-items:center] [.form-group_&]:[gap:6px] [.form-group_&]:[font-size:13px] [.form-group_&]:[font-weight:600] [.form-group_&]:[color:#1e293b]"

            >
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={5}
              className="form-control [width:100%] [padding:8px] [font:inherit] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]"

            />
          </div>

          <div
            className="form-row [display:grid] [grid-template-columns:1fr_1fr] [gap:16px] [margin-bottom:16px]"

          >
            <div>
              <label className="[display:block] [font-weight:bold] [margin-bottom:6px] [font-size:13px] [font-weight:600] [color:#1e293b] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]"

              >
                Mandatory Skills
              </label>
              <input
                type="text"
                name="mandatory_skills"
                value={formData.mandatory_skills}
                onChange={handleChange}
                placeholder="e.g. React, Node.js"
                className="form-control [width:100%] [padding:8px] [font:inherit] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]"

              />
            </div>
            <div>
              <label className="[display:block] [font-weight:bold] [margin-bottom:6px] [font-size:13px] [font-weight:600] [color:#1e293b] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]"

              >
                Required / Desired Skills
              </label>
              <input
                type="text"
                name="required_skills"
                value={formData.required_skills}
                onChange={handleChange}
                placeholder="e.g. Docker, AWS"
                className="form-control [width:100%] [padding:8px] [font:inherit] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]"

              />
            </div>
          </div>

          <div
            className="form-row [display:grid] [grid-template-columns:1fr_1fr] [gap:16px] [margin-bottom:16px]"

          >
            <div>
              <label className="[display:block] [font-weight:bold] [margin-bottom:6px] [font-size:13px] [font-weight:600] [color:#1e293b] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]"

              >
                Min Experience (Years)
              </label>
              <input
                type="number"
                name="min_exp"
                value={formData.min_exp}
                onChange={handleChange}
                min="0"
                className="form-control [width:100%] [padding:8px] [font:inherit] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]"

              />
            </div>
            <div>
              <label className="[display:block] [font-weight:bold] [margin-bottom:6px] [font-size:13px] [font-weight:600] [color:#1e293b] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]"

              >
                Target Fill Date / Due Date
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="form-control [width:100%] [padding:8px] [font:inherit] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]"

              />
            </div>
          </div>

          <div
            className="form-row [display:grid] [grid-template-columns:1fr_1fr] [gap:16px] [margin-bottom:16px]"

          >
            <div>
              <label className="[display:block] [font-weight:bold] [margin-bottom:6px] [font-size:13px] [font-weight:600] [color:#1e293b] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]"

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
                className="form-control [width:100%] [padding:8px] [font:inherit] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]"

              />
            </div>
            <div>
              <label className="[display:block] [font-weight:bold] [margin-bottom:6px] [font-size:13px] [font-weight:600] [color:#1e293b] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]"

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
                className="form-control [width:100%] [padding:8px] [font:inherit] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]"

              />
            </div>
          </div>

          <div className="form-group [margin-bottom:24px] [display:flex] [flex-direction:column] [gap:8px]" >
            <label className="[display:block] [font-weight:bold] [margin-bottom:6px] [font-size:13px] [font-weight:600] [color:#1e293b] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold] [.form-group_&]:[display:flex] [.form-group_&]:[align-items:center] [.form-group_&]:[gap:6px] [.form-group_&]:[font-size:13px] [.form-group_&]:[font-weight:600] [.form-group_&]:[color:#1e293b]"

            >
              Interview Mode
            </label>
            <select
              name="interview_mode"
              value={formData.interview_mode}
              onChange={handleChange}
              className="form-control [width:100%] [padding:8px] [font:inherit] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]"

            >
              <option value="Video Interview (IncVid)">
                Video Interview (IncVid)
              </option>
              <option value="AI Interview (IncBot)">
                AI Interview (IncBot)
              </option>
            </select>
          </div>

          <div className="[display:flex] [gap:12px] [justify-content:flex-end]"

          >
            <Link to="/jobs" className="btn btn-secondary [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#fff] [color:#133f7d] [border:1.5px_solid_#133f7d]">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#133f7d] [color:#fff]" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}

export default EditJobPage;

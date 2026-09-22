import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell";
import toast from "react-hot-toast";

function PostJobPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    department: "Engineering",
    location: "",
    description: "",
    mandatoryInput: "",
    mandatorySkills: [],
    requiredInput: "",
    requiredSkills: [],
    minExp: "",
    minSalary: "",
    maxSalary: "",
    dueDate: "",
    interviewMode: "Video Interview (IncVid)",
  });

  const [jobUrl, setJobUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const today = new Date().toISOString().split("T")[0];

  // ==========================================
  // HANDLE FORM CHANGES
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // SCRAPE JOB FROM URL
  // ==========================================

  const handleScrapeJob = async () => {
    setErrorMsg("");

    if (!jobUrl.trim()) {
      const message = "Please enter a job posting URL.";
      setErrorMsg(message);
      toast.error(message);
      return;
    }

    try {
      new URL(jobUrl.trim());
    } catch {
      const message = "Please enter a valid job posting URL.";
      setErrorMsg(message);
      toast.error(message);
      return;
    }

    setScraping(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5001/api/scrape-job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },
        body: JSON.stringify({
          url: jobUrl.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import job details.");
      }

      const job = data.job || data;

      // Populate the manual form
      setFormData((prev) => ({
        ...prev,

        title: job.title || "",

        department: job.department || "Engineering",

        location: job.location || "",

        description: job.description || "",

        mandatoryInput: "",
        requiredInput: "",

        mandatorySkills: Array.isArray(job.mandatorySkills)
          ? job.mandatorySkills
          : [],

        requiredSkills: Array.isArray(job.requiredSkills)
          ? job.requiredSkills
          : [],

        minExp:
          job.minExp !== null && job.minExp !== undefined
            ? String(job.minExp)
            : "",

        minSalary:
          job.minSalary !== null && job.minSalary !== undefined
            ? String(job.minSalary)
            : "",

        maxSalary:
          job.maxSalary !== null && job.maxSalary !== undefined
            ? String(job.maxSalary)
            : "",

        dueDate: job.dueDate || "",

        interviewMode: job.interviewMode || "Video Interview (IncVid)",
      }));

      toast.success("Job details imported successfully!");
    } catch (err) {
      console.error("Error scraping job:", err);

      const message = err.message || "Failed to import job details.";

      setErrorMsg(message);
      toast.error(message);
    } finally {
      setScraping(false);
    }
  };

  // ==========================================
  // MANDATORY SKILLS
  // ==========================================

  const addMandatorySkill = () => {
    const trimmed = formData.mandatoryInput.trim().replace(/^,|,$/g, "");

    if (
      trimmed &&
      !formData.mandatorySkills.some(
        (skill) => skill.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      setFormData((prev) => ({
        ...prev,
        mandatorySkills: [...prev.mandatorySkills, trimmed],
        mandatoryInput: "",
      }));
    }
  };

  const handleMandatoryKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addMandatorySkill();
    }
  };

  const removeMandatorySkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      mandatorySkills: prev.mandatorySkills.filter(
        (skill) => skill !== skillToRemove,
      ),
    }));
  };

  // ==========================================
  // OPTIONAL SKILLS
  // ==========================================

  const addRequiredSkill = () => {
    const trimmed = formData.requiredInput.trim().replace(/^,|,$/g, "");

    if (
      trimmed &&
      !formData.requiredSkills.some(
        (skill) => skill.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      setFormData((prev) => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, trimmed],
        requiredInput: "",
      }));
    }
  };

  const handleRequiredKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addRequiredSkill();
    }
  };

  const removeRequiredSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(
        (skill) => skill !== skillToRemove,
      ),
    }));
  };

  // ==========================================
  // FORM SUBMISSION
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMsg("");

    if (formData.mandatorySkills.length === 0) {
      const message = "Please add at least one mandatory skill.";

      setErrorMsg(message);
      toast.error(message);
      return;
    }

    if (
      formData.minSalary &&
      formData.maxSalary &&
      Number(formData.minSalary) > Number(formData.maxSalary)
    ) {
      const message = "Minimum salary cannot be greater than maximum salary.";

      setErrorMsg(message);
      toast.error(message);
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5001/api/jobs", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },

        body: JSON.stringify({
          title: formData.title,
          department: formData.department,
          location: formData.location,
          description: formData.description,

          mandatory_skills: formData.mandatorySkills.join(", "),

          required_skills: formData.requiredSkills.join(", "),

          min_exp: formData.minExp ? Number(formData.minExp) : 0,

          min_salary: formData.minSalary ? Number(formData.minSalary) : 0,

          max_salary: formData.maxSalary ? Number(formData.maxSalary) : 0,

          due_date: formData.dueDate || null,

          interview_mode: formData.interviewMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to publish job.");
      }

      toast.success("Job published successfully!");

      navigate("/jobs");
    } catch (err) {
      console.error("Error publishing job:", err);

      const message = err.message || "Failed to publish job.";

      setErrorMsg(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <PageShell title="Post New Job" active="jobs" backTo="/jobs">
      <div className="post-job-container">
        {/* =====================================
          IMPORT JOB FROM WEBSITE
      ====================================== */}

        <div className="card large-card post-job-card">
          <div className="form-section">
            <div className="form-section-header">
              <h2>Import Job From Website</h2>

              <p>
                Paste a job posting URL and automatically populate the job
                details. You can review and edit everything before publishing.
              </p>
            </div>

            <div className="field">
              <label htmlFor="jobUrl">Job Posting URL</label>

              <div
                className="skill-input-row"
                style={{
                  alignItems: "stretch",
                }}
              >
                <input
                  id="jobUrl"
                  type="url"
                  placeholder="https://example.com/jobs/geospatial-engineer"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleScrapeJob();
                    }
                  }}
                  disabled={scraping}
                />

                <button
                  type="button"
                  className="btn btn-secondary skill-add-btn"
                  onClick={handleScrapeJob}
                  disabled={scraping}
                  style={{
                    minWidth: "180px",
                    opacity: scraping ? 0.7 : 1,
                    cursor: scraping ? "not-allowed" : "pointer",
                  }}
                >
                  {scraping ? "Importing..." : "🔍 Import Job Details"}
                </button>
              </div>

              <small
                style={{
                  display: "block",
                  marginTop: "8px",
                  color: "#6b7280",
                }}
              >
                Paste the URL of a job posting. The job details will be
                extracted and placed into the form below.
              </small>
            </div>
          </div>
        </div>

        {/* =====================================
          OR DIVIDER
      ====================================== */}

        <div
          className="job-entry-divider"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            margin: "20px 0",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "#e5e7eb",
            }}
          />

          <span
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            OR
          </span>

          <div
            style={{
              flex: 1,
              height: "1px",
              background: "#e5e7eb",
            }}
          />
        </div>

        {/* =====================================
          MANUAL JOB FORM
      ====================================== */}

        <div className="card large-card post-job-card">
          <form onSubmit={handleSubmit}>
            {/* =====================================
              FORM HEADER
          ====================================== */}

            <div className="post-job-header">
              <h2>Create a New Job</h2>

              <p>
                Add the job details, requirements, compensation, and interview
                configuration manually.
              </p>
            </div>

            {errorMsg && <div className="error-box">{errorMsg}</div>}

            {/* =====================================
              BASIC INFORMATION
          ====================================== */}

            <div className="form-section">
              <div className="form-section-header">
                <h3>Basic Job Information</h3>

                <p>Enter the main details for the position.</p>
              </div>

              <div className="field">
                <label htmlFor="title">Job Title</label>

                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. Senior Frontend Developer"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>

              <div className="grid2">
                <div className="field">
                  <label htmlFor="department">Department</label>

                  <select
                    id="department"
                    name="department"
                    required
                    value={formData.department}
                    onChange={handleChange}
                  >
                    <option value="Engineering">Engineering</option>

                    <option value="Product">Product</option>

                    <option value="Design">Design</option>

                    <option value="Marketing">Marketing</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="location">Location</label>

                  <input
                    id="location"
                    name="location"
                    type="text"
                    required
                    placeholder="e.g. Bangalore / Remote"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="description">Job Description</label>

                <textarea
                  id="description"
                  name="description"
                  rows="8"
                  required
                  placeholder="Describe the role, responsibilities, and expectations..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* =====================================
              SKILLS
          ====================================== */}

            <div className="form-section">
              <div className="form-section-header">
                <h3>Skills & Requirements</h3>

                <p>Add the skills required for this position.</p>
              </div>

              {/* MANDATORY SKILLS */}

              <div className="field">
                <label htmlFor="mandatoryInput">Mandatory Skills</label>

                <div className="skill-input-row">
                  <input
                    id="mandatoryInput"
                    name="mandatoryInput"
                    type="text"
                    placeholder="Type a skill and press Enter"
                    value={formData.mandatoryInput}
                    onChange={handleChange}
                    onKeyDown={handleMandatoryKeyDown}
                  />

                  <button
                    type="button"
                    className="btn btn-secondary skill-add-btn"
                    onClick={addMandatorySkill}
                  >
                    + Add
                  </button>
                </div>

                {formData.mandatorySkills.length > 0 && (
                  <div className="skill-tags">
                    {formData.mandatorySkills.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        className="tag skill-tag"
                        onClick={() => removeMandatorySkill(skill)}
                        title="Click to remove"
                      >
                        {skill} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* NICE-TO-HAVE SKILLS */}

              <div className="field">
                <label htmlFor="requiredInput">Nice-to-Have Skills</label>

                <div className="skill-input-row">
                  <input
                    id="requiredInput"
                    name="requiredInput"
                    type="text"
                    placeholder="Type an optional skill and press Enter"
                    value={formData.requiredInput}
                    onChange={handleChange}
                    onKeyDown={handleRequiredKeyDown}
                  />

                  <button
                    type="button"
                    className="btn btn-secondary skill-add-btn"
                    onClick={addRequiredSkill}
                  >
                    + Add
                  </button>
                </div>

                {formData.requiredSkills.length > 0 && (
                  <div className="skill-tags">
                    {formData.requiredSkills.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        className="tag skill-tag required-skill-tag"
                        onClick={() => removeRequiredSkill(skill)}
                        title="Click to remove"
                      >
                        {skill} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid2">
                <div className="field">
                  <label htmlFor="minExp">Minimum Experience</label>

                  <input
                    id="minExp"
                    name="minExp"
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 5"
                    value={formData.minExp}
                    onChange={handleChange}
                  />
                </div>

                <div className="field">
                  <label htmlFor="dueDate">Target Fill Date</label>

                  <input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    min={today}
                    required
                    value={formData.dueDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* =====================================
              COMPENSATION
          ====================================== */}

            <div className="form-section">
              <div className="form-section-header">
                <h3>Allocated CTC Range</h3>

                <p>Specify the compensation range for this role.</p>
              </div>

              <div className="grid2">
                <div className="field">
                  <label htmlFor="minSalary">Minimum CTC (LPA)</label>

                  <div className="salary-input">
                    <span className="salary-prefix">₹</span>

                    <input
                      id="minSalary"
                      name="minSalary"
                      type="number"
                      min="0"
                      required
                      placeholder="e.g. 8"
                      value={formData.minSalary}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="maxSalary">Maximum CTC (LPA)</label>

                  <div className="salary-input">
                    <span className="salary-prefix">₹</span>

                    <input
                      id="maxSalary"
                      name="maxSalary"
                      type="number"
                      min="0"
                      required
                      placeholder="e.g. 15"
                      value={formData.maxSalary}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* =====================================
              ACTIONS
          ====================================== */}

            <div className="form-footer">
              <span className="form-footer-info">
                All required fields must be completed before publishing.
              </span>

              <div className="inline-actions">
                <Link to="/jobs" className="btn btn-ghost">
                  Cancel
                </Link>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg publish-btn"
                  disabled={loading}
                  style={{
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Publishing..." : "🚀 Publish Job"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
}

export default PostJobPage;

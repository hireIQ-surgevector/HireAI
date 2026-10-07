import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageShell from "../components/common/PageShell";
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
      <div className="w-full">
        {/* =====================================
          IMPORT JOB FROM WEBSITE
      ====================================== */}

        <div className="card large-card post-job-card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [max-width:760px] [margin:0_auto] [max-width:860px] max-[640px]:[max-width:100%]">
          <div className="form-section [padding:22px_0] [border-bottom:1px_solid_#e2e8f0] [&:first-of-type]:[padding-top:0] [&:last-of-type]:[border-bottom:none] [&:last-of-type]:[padding-bottom:0]">
            <div className="form-section-header [margin-bottom:18px]">
              <h2>Import Job From Website</h2>

              <p className="[.form-section-header_&]:[font-size:12px] [.form-section-header_&]:[color:#64748b]">
                Paste a job posting URL and automatically populate the job
                details. You can review and edit everything before publishing.
              </p>
            </div>

            <div className="field [margin-bottom:14px]">
              <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]" htmlFor="jobUrl">Job Posting URL</label>

              <div
                className="skill-input-row [align-items:stretch] [display:flex] [gap:8px] max-[640px]:[flex-direction:column]"

              >
                <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [.skill-input-row_&]:[flex:1]"
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
                  className={`btn btn-secondary skill-add-btn [min-width:180px] [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#fff] [color:#133f7d] [border:1.5px_solid_#133f7d] [min-width:85px] max-[640px]:[width:100%] ${scraping ? "[opacity:0.7] [cursor:not-allowed]" : "[opacity:1] [cursor:pointer]"}`}
                  onClick={handleScrapeJob}
                  disabled={scraping}
                >
                  {scraping ? "Importing..." : "🔍 Import Job Details"}
                </button>
              </div>

              <small className="[display:block] [margin-top:8px] [color:#6b7280]"

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
          className="job-entry-divider [display:flex] [align-items:center] [gap:16px] [margin:20px_0]"

        >
          <div className="[flex:1] [height:1px] [background:#e5e7eb]"

          />

          <span className="[font-size:13px] [font-weight:600] [color:#6b7280] [text-transform:uppercase] [letter-spacing:0.08em]"

          >
            OR
          </span>

          <div className="[flex:1] [height:1px] [background:#e5e7eb]"

          />
        </div>

        {/* =====================================
          MANUAL JOB FORM
      ====================================== */}

        <div className="card large-card post-job-card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [max-width:760px] [margin:0_auto] [max-width:860px] max-[640px]:[max-width:100%]">
          <form onSubmit={handleSubmit}>
            {/* =====================================
              FORM HEADER
          ====================================== */}

            <div className="post-job-header [margin-bottom:24px]">
              <h2 className="[.post-job-header_&]:[font-size:22px] [.post-job-header_&]:[font-weight:800] [.post-job-header_&]:[color:#1e293b] [.post-job-header_&]:[margin-bottom:6px]">Create a New Job</h2>

              <p className="[.post-job-header_&]:[color:#64748b] [.post-job-header_&]:[font-size:13px]">
                Add the job details, requirements, compensation, and interview
                configuration manually.
              </p>
            </div>

            {errorMsg && <div className="error-box [background:#fee2e2] [color:#991b1b] [padding:10px] [border-radius:8px] [font-size:12px] [margin-bottom:10px]">{errorMsg}</div>}

            {/* =====================================
              BASIC INFORMATION
          ====================================== */}

            <div className="form-section [padding:22px_0] [border-bottom:1px_solid_#e2e8f0] [&:first-of-type]:[padding-top:0] [&:last-of-type]:[border-bottom:none] [&:last-of-type]:[padding-bottom:0]">
              <div className="form-section-header [margin-bottom:18px]">
                <h3 className="[.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px] [.form-section-header_&]:[margin-bottom:5px] [.form-section-header_&]:[font-size:16px]">Basic Job Information</h3>

                <p className="[.form-section-header_&]:[font-size:12px] [.form-section-header_&]:[color:#64748b]">Enter the main details for the position.</p>
              </div>

              <div className="field [margin-bottom:14px]">
                <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]" htmlFor="title">Job Title</label>

                <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]"
                  id="title"
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. Senior Frontend Developer"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>

              <div className="grid2 [display:grid] [grid-template-columns:1fr_1fr] [gap:14px] max-[960px]:[grid-template-columns:1fr] max-[960px]:[flex-direction:column]">
                <div className="field [margin-bottom:14px]">
                  <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]" htmlFor="department">Department</label>

                  <select className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]"
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

                <div className="field [margin-bottom:14px]">
                  <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]" htmlFor="location">Location</label>

                  <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]"
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

              <div className="field [margin-bottom:14px]">
                <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]" htmlFor="description">Job Description</label>

                <textarea className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]"
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

            <div className="form-section [padding:22px_0] [border-bottom:1px_solid_#e2e8f0] [&:first-of-type]:[padding-top:0] [&:last-of-type]:[border-bottom:none] [&:last-of-type]:[padding-bottom:0]">
              <div className="form-section-header [margin-bottom:18px]">
                <h3 className="[.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px] [.form-section-header_&]:[margin-bottom:5px] [.form-section-header_&]:[font-size:16px]">Skills & Requirements</h3>

                <p className="[.form-section-header_&]:[font-size:12px] [.form-section-header_&]:[color:#64748b]">Add the skills required for this position.</p>
              </div>

              {/* MANDATORY SKILLS */}

              <div className="field [margin-bottom:14px]">
                <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]" htmlFor="mandatoryInput">Mandatory Skills</label>

                <div className="skill-input-row [display:flex] [gap:8px] [align-items:stretch] max-[640px]:[flex-direction:column]">
                  <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [.skill-input-row_&]:[flex:1]"
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
                    className="btn btn-secondary skill-add-btn [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#fff] [color:#133f7d] [border:1.5px_solid_#133f7d] [min-width:85px] max-[640px]:[width:100%]"
                    onClick={addMandatorySkill}
                  >
                    + Add
                  </button>
                </div>

                {formData.mandatorySkills.length > 0 && (
                  <div className="skill-tags [display:flex] [flex-wrap:wrap] [gap:8px] [margin-top:10px]">
                    {formData.mandatorySkills.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        className="tag skill-tag [font:inherit] [background:#e8f0fb] [color:#133f7d] [font-size:12px] [font-weight:600] [padding:4px_12px] [border-radius:20px] [display:inline-block] [display:inline-flex] [align-items:center] [gap:6px] [border:none] [cursor:pointer] [font-family:inherit] hover:[opacity:0.8]"
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

              <div className="field [margin-bottom:14px]">
                <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]" htmlFor="requiredInput">Nice-to-Have Skills</label>

                <div className="skill-input-row [display:flex] [gap:8px] [align-items:stretch] max-[640px]:[flex-direction:column]">
                  <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [.skill-input-row_&]:[flex:1]"
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
                    className="btn btn-secondary skill-add-btn [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#fff] [color:#133f7d] [border:1.5px_solid_#133f7d] [min-width:85px] max-[640px]:[width:100%]"
                    onClick={addRequiredSkill}
                  >
                    + Add
                  </button>
                </div>

                {formData.requiredSkills.length > 0 && (
                  <div className="skill-tags [display:flex] [flex-wrap:wrap] [gap:8px] [margin-top:10px]">
                    {formData.requiredSkills.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        className="tag skill-tag required-skill-tag [font:inherit] [background:#e8f0fb] [color:#133f7d] [font-size:12px] [font-weight:600] [padding:4px_12px] [border-radius:20px] [display:inline-block] [display:inline-flex] [align-items:center] [gap:6px] [border:none] [cursor:pointer] [font-family:inherit] hover:[opacity:0.8] [background:#f1f5f9] [color:#475569]"
                        onClick={() => removeRequiredSkill(skill)}
                        title="Click to remove"
                      >
                        {skill} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid2 [display:grid] [grid-template-columns:1fr_1fr] [gap:14px] max-[960px]:[grid-template-columns:1fr] max-[960px]:[flex-direction:column]">
                <div className="field [margin-bottom:14px]">
                  <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]" htmlFor="minExp">Minimum Experience</label>

                  <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]"
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

                <div className="field [margin-bottom:14px]">
                  <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]" htmlFor="dueDate">Target Fill Date</label>

                  <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]"
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

            <div className="form-section [padding:22px_0] [border-bottom:1px_solid_#e2e8f0] [&:first-of-type]:[padding-top:0] [&:last-of-type]:[border-bottom:none] [&:last-of-type]:[padding-bottom:0]">
              <div className="form-section-header [margin-bottom:18px]">
                <h3 className="[.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px] [.form-section-header_&]:[margin-bottom:5px] [.form-section-header_&]:[font-size:16px]">Allocated CTC Range</h3>

                <p className="[.form-section-header_&]:[font-size:12px] [.form-section-header_&]:[color:#64748b]">Specify the compensation range for this role.</p>
              </div>

              <div className="grid2 [display:grid] [grid-template-columns:1fr_1fr] [gap:14px] max-[960px]:[grid-template-columns:1fr] max-[960px]:[flex-direction:column]">
                <div className="field [margin-bottom:14px]">
                  <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]" htmlFor="minSalary">Minimum CTC (LPA)</label>

                  <div className="salary-input [position:relative]">
                    <span className="salary-prefix [position:absolute] [left:13px] [top:50%] [transform:translateY(-50%)] [color:#64748b] [font-size:13px] [font-weight:600] [pointer-events:none]">₹</span>

                    <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [.salary-input_&]:[padding-left:42px]"
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

                <div className="field [margin-bottom:14px]">
                  <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]" htmlFor="maxSalary">Maximum CTC (LPA)</label>

                  <div className="salary-input [position:relative]">
                    <span className="salary-prefix [position:absolute] [left:13px] [top:50%] [transform:translateY(-50%)] [color:#64748b] [font-size:13px] [font-weight:600] [pointer-events:none]">₹</span>

                    <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [.salary-input_&]:[padding-left:42px]"
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

            <div className="form-footer [display:flex] [justify-content:space-between] [align-items:center] [gap:14px] [margin-top:28px] [padding-top:20px] [border-top:1px_solid_#e2e8f0] max-[640px]:[flex-direction:column-reverse] max-[640px]:[align-items:stretch]">
              <span className="form-footer-info [font-size:12px] [color:#64748b]">
                All required fields must be completed before publishing.
              </span>

              <div className="inline-actions [display:flex] [gap:10px] [margin-top:8px] max-[640px]:[.form-footer_&]:[width:100%]">
                <Link to="/jobs" className="btn btn-ghost [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:transparent] [color:#64748b] [border:1px_solid_#e2e8f0] max-[640px]:[.form-footer_&]:[flex:1]">
                  Cancel
                </Link>

                <button
                  type="submit"
                  className={`btn btn-primary btn-lg publish-btn [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#133f7d] [color:#fff] [padding:13px_28px] [font-size:15px] [min-width:160px] max-[640px]:[.form-footer_&]:[flex:1] ${loading ? "[opacity:0.7] [cursor:not-allowed]" : "[opacity:1] [cursor:pointer]"}`}
                  disabled={loading}
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

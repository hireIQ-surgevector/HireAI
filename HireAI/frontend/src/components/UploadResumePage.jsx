import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "./PageShell";
import { Upload, FileText, X, Briefcase } from "lucide-react";
import toast from "react-hot-toast";

function UploadResumePage() {
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");

  const [selectedFiles, setSelectedFiles] = useState([]);

  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState("");

  // ============================================================
  // LOAD JOBS
  // ============================================================

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoadingJobs(true);
        setJobsError("");

        const response = await fetch("http://localhost:5001/api/jobs");

        if (!response.ok) {
          throw new Error("Failed to load jobs");
        }

        const data = await response.json();

        setJobs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading jobs:", error);
        setJobsError("Unable to load jobs. Please try again.");
        toast.error(error.message || "Unable to load jobs.");
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchJobs();
  }, []);

  // ============================================================
  // FILE PICKER
  // ============================================================

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // ============================================================
  // ADD FILES
  // ============================================================

  const addFiles = (files) => {
    if (!files || files.length === 0) {
      return;
    }

    const validFiles = Array.from(files).filter((file) => {
      const fileName = file.name.toLowerCase();

      return (
        fileName.endsWith(".pdf") ||
        fileName.endsWith(".docx") ||
        fileName.endsWith(".doc") ||
        fileName.endsWith(".txt")
      );
    });

    setSelectedFiles((prev) => {
      const existingKeys = new Set(
        prev.map((file) => `${file.name}-${file.size}`),
      );

      const newFiles = validFiles.filter(
        (file) => !existingKeys.has(`${file.name}-${file.size}`),
      );

      return [...prev, ...newFiles];
    });
  };

  // ============================================================
  // FILE CHANGE
  // ============================================================

  const handleFileChange = (e) => {
    addFiles(e.target.files);

    // Allow selecting the same file again
    e.target.value = "";
  };

  // ============================================================
  // DRAG & DROP
  // ============================================================

  const handleDrop = (e) => {
    e.preventDefault();

    if (!selectedJobId) {
      toast.error("Please select a job first.");
      return;
    }

    addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // ============================================================
  // REMOVE FILE
  // ============================================================

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ============================================================
  // RUN AI SCREENING
  // ============================================================

  const handleRunScreening = async () => {
    if (!selectedJobId) {
      toast.error("Please select a job first.");
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error("Please upload at least one resume.");
      return;
    }

    try {
      const formData = new FormData();

      // Selected job
      formData.append("job_id", selectedJobId);

      // Multiple resumes
      selectedFiles.forEach((file) => {
        formData.append("resumes", file);
      });

      const response = await fetch(
        "http://localhost:5001/api/candidates/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload resumes");
      }

      console.log("Resume processing result:", data);

      toast.success(`${data.created_count} candidate(s) added successfully.`);

      // Clear selected files after successful upload
      setSelectedFiles([]);

      // Candidates are now in the system — send the recruiter to review them
      navigate("/candidates");
    } catch (error) {
      console.error("Resume upload error:", error);

      toast.error(error.message || "Failed to process resumes.");
    }
  };

  return (
    <PageShell
      title="AI Resume Screening & ATS"
      active="candidates"
      backTo="/candidates"
    >
      <div className="card large-card">
        <h3>Upload Resumes</h3>

        {/* ==================================================
            JOB SELECTION
        ================================================== */}

        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="job-select"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
              color: "var(--text)",
            }}
          >
            Select Job
          </label>

          <div
            style={{
              position: "relative",
            }}
          >
            <Briefcase
              size={18}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--muted)",
                pointerEvents: "none",
              }}
            />

            <select
              id="job-select"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              disabled={loadingJobs}
              style={{
                width: "100%",
                padding: "12px 12px 12px 40px",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: "14px",
                outline: "none",
              }}
            >
              <option value="">
                {loadingJobs ? "Loading jobs..." : "Select a job"}
              </option>

              {jobs.map((job) => (
                <option key={job.job_id} value={job.job_id}>
                  {job.title}
                  {job.location ? ` — ${job.location}` : ""}
                </option>
              ))}
            </select>
          </div>

          {jobsError && (
            <div
              style={{
                marginTop: "8px",
                color: "#dc2626",
                fontSize: "13px",
              }}
            >
              {jobsError}
            </div>
          )}

          {!loadingJobs && !jobsError && jobs.length === 0 && (
            <div
              style={{
                marginTop: "8px",
                color: "var(--muted)",
                fontSize: "13px",
              }}
            >
              No jobs available.
            </div>
          )}
        </div>

        {/* ==================================================
            SELECTED JOB INFO
        ================================================== */}

        {selectedJobId && (
          <div
            style={{
              padding: "12px 14px",
              marginBottom: "16px",
              borderRadius: "8px",
              background: "var(--surface-2, #f5f7fa)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "var(--muted)",
                marginBottom: "3px",
              }}
            >
              Resumes will be screened against
            </div>

            <div
              style={{
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              {
                jobs.find((job) => String(job.job_id) === String(selectedJobId))
                  ?.title
              }
            </div>
          </div>
        )}

        {/* ==================================================
            HIDDEN FILE INPUT
        ================================================== */}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept=".pdf,.docx,.doc,.txt"
          style={{ display: "none" }}
        />

        {/* ==================================================
            DROPZONE
        ================================================== */}

        <div
          className="upload-zone"
          onClick={() => {
            if (selectedJobId) {
              handleBrowseClick();
            }
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{
            cursor: "pointer",
            opacity: selectedJobId ? 1 : 0.6,
          }}
        >
          <Upload
            size={36}
            style={{
              marginBottom: "10px",
              color: "var(--brand)",
            }}
          />

          <p
            style={{
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: "4px",
            }}
          >
            Drag & Drop Resumes Here
          </p>

          <span
            style={{
              fontSize: "12px",
              color: "var(--muted)",
              display: "block",
              marginBottom: "14px",
            }}
          >
            Supports PDF, DOCX, DOC, or TXT
          </span>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={!selectedJobId}
            onClick={(e) => {
              e.stopPropagation();
              handleBrowseClick();
            }}
          >
            Browse Files
          </button>
        </div>

        {/* ==================================================
            SELECTED FILES
        ================================================== */}

        {selectedFiles.length > 0 && (
          <div
            style={{
              marginTop: "16px",
              marginBottom: "16px",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 600,
              }}
            >
              Selected Files ({selectedFiles.length})
            </label>

            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${file.size}-${index}`}
                className="list-row"
                style={{
                  justifyContent: "space-between",
                }}
              >
                <div className="flex-row">
                  <FileText
                    size={18}
                    style={{
                      color: "var(--brand)",
                    }}
                  />

                  <div>
                    <div className="list-title">{file.name}</div>

                    <div className="list-sub">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => removeFile(index)}
                  style={{
                    padding: "4px",
                    cursor: "pointer",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ==================================================
            RUN AI SCREENING
        ================================================== */}

        <button
          type="button"
          className="btn btn-primary full-width btn-lg"
          disabled={!selectedJobId || selectedFiles.length === 0}
          onClick={handleRunScreening}
          style={{
            opacity: !selectedJobId || selectedFiles.length === 0 ? 0.6 : 1,
          }}
        >
          ✨ Run AI Screening
          {selectedFiles.length > 0 && ` (${selectedFiles.length})`}
        </button>
      </div>
    </PageShell>
  );
}

export default UploadResumePage;

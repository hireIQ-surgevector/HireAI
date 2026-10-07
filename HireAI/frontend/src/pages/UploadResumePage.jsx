import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/common/PageShell";
import PageState from "../components/common/PageState";
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
  const [loadAttempt, setLoadAttempt] = useState(0);

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
  }, [loadAttempt]);

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
      <div className="card large-card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px] [max-width:760px] [margin:0_auto]">
        <h3 className="[.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px]">Upload Resumes</h3>

        {/* ==================================================
            JOB SELECTION
        ================================================== */}

        <div className="[margin-bottom:20px]" >
          <label className="[display:block] [margin-bottom:8px] [font-weight:600] [color:#1e293b] [font-size:13px] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]"
            htmlFor="job-select"

          >
            Select Job
          </label>

          <div className="[position:relative]"

          >
            <Briefcase className="[position:absolute] [left:12px] [top:50%] [transform:translateY(-50%)] [color:#64748b] [pointer-events:none]"
              size={18}

            />

            <select className="[width:100%] [padding:12px_12px_12px_40px] [border:1px_solid_#e2e8f0] [border-radius:8px] [background:initial] [color:#1e293b] [font-size:14px] [outline:none] [font:inherit] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [background:#fff]"
              id="job-select"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              disabled={loadingJobs}

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

          {loadingJobs && (
            <PageState
              variant="loading"
              title="Loading job openings"
              rows={2}
              className="mt-3"
            />
          )}

          {jobsError && (
            <PageState
              variant="error"
              title="Couldn't load job openings"
              description={jobsError}
              onRetry={() => setLoadAttempt((attempt) => attempt + 1)}
              className="mt-3"
            />
          )}

          {!loadingJobs && !jobsError && jobs.length === 0 && (
            <PageState
              variant="empty"
              title="No jobs available"
              description="Create a job opening before uploading candidate resumes."
              className="mt-3"
            />
          )}
        </div>

        {/* ==================================================
            SELECTED JOB INFO
        ================================================== */}

        {selectedJobId && (
          <div className="[padding:12px_14px] [margin-bottom:16px] [border-radius:8px] [background:#f5f7fa] [border:1px_solid_#e2e8f0]"

          >
            <div className="[font-size:12px] [color:#64748b] [margin-bottom:3px]"

            >
              Resumes will be screened against
            </div>

            <div className="[font-weight:600] [color:#1e293b]"

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

        <input className="[display:none] [font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]"
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept=".pdf,.docx,.doc,.txt"

        />

        {/* ==================================================
            DROPZONE
        ================================================== */}

        <div
          className={`upload-zone [cursor:pointer] [border:2px_dashed_#e2e8f0] [border-radius:12px] [padding:32px] [text-align:center] [margin-bottom:16px] [color:#64748b] ${selectedJobId ? "[opacity:1]" : "[opacity:0.6]"}`}
          onClick={() => {
            if (selectedJobId) {
              handleBrowseClick();
            }
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <Upload className="[margin-bottom:10px] [color:#133f7d]"
            size={36}

          />

          <p className="[font-weight:600] [color:#1e293b] [margin-bottom:4px]"

          >
            Drag & Drop Resumes Here
          </p>

          <span className="[font-size:12px] [color:#64748b] [display:block] [margin-bottom:14px]"

          >
            Supports PDF, DOCX, DOC, or TXT
          </span>

          <button
            type="button"
            className="btn btn-secondary btn-sm [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#fff] [color:#133f7d] [border:1.5px_solid_#133f7d] [padding:6px_14px] [font-size:12px]"
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
          <div className="[margin-top:16px] [margin-bottom:16px]"

          >
            <label className="[display:block] [margin-bottom:8px] [font-weight:600] [font-size:13px] [color:#1e293b] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]"

            >
              Selected Files ({selectedFiles.length})
            </label>

            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${file.size}-${index}`}
                className="list-row [justify-content:space-between] [display:flex] [align-items:center] [gap:10px] [padding:9px_0] [border-bottom:1px_solid_#e2e8f0]"

              >
                <div className="flex-row [display:flex] [align-items:center] [gap:10px]">
                  <FileText className="[color:#133f7d]"
                    size={18}

                  />

                  <div>
                    <div className="list-title [font-size:13px] [font-weight:600] [color:#1e293b]">{file.name}</div>

                    <div className="list-sub [font-size:12px] [color:#64748b]">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-ghost [padding:4px] [cursor:pointer] [font:inherit] [background:transparent] [color:#64748b] [border:1px_solid_#e2e8f0]"
                  onClick={() => removeFile(index)}

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
          className={`btn btn-primary full-width btn-lg [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#133f7d] [color:#fff] [padding:13px_28px] [font-size:15px] [width:100%] ${!selectedJobId || selectedFiles.length === 0 ? "[opacity:0.6]" : "[opacity:1]"}`}
          disabled={!selectedJobId || selectedFiles.length === 0}
          onClick={handleRunScreening}
        >
          ✨ Run AI Screening
          {selectedFiles.length > 0 && ` (${selectedFiles.length})`}
        </button>
      </div>
    </PageShell>
  );
}

export default UploadResumePage;

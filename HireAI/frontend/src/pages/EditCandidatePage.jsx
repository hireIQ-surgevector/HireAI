import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BriefcaseBusiness,
  CalendarDays,
  IndianRupee,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";

import PageShell from "../components/PageShell";
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
          className="card [padding:40px] [text-align:center] [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px]"

        >
          Loading candidate details...
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Edit Candidate" backTo={`/candidates/${candidateId}`}>
        <div className="error-box [background:#fee2e2] [color:#991b1b] [padding:10px] [border-radius:8px] [font-size:12px] [margin-bottom:10px]">{error}</div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Edit Candidate"
      backTo={`/candidate-detail/${candidateId}`}
    >
      <div className="candidate-edit-container [display:flex] [flex-direction:column] [gap:16px]">
        <div className="candidate-edit-info [display:flex] [align-items:center] [gap:14px] [padding:18px_20px] [background:#ffffff] [border:1px_solid_#e8eaed] [border-radius:10px]">
          <div className="candidate-edit-avatar [width:46px] [height:46px] [border-radius:50%] [display:flex] [align-items:center] [justify-content:center] [background:#133f7d] [color:#ffffff] [font-size:18px] [font-weight:600] [flex-shrink:0]">
            {candidateName.charAt(0).toUpperCase()}
          </div>

          <div>
            <div className="candidate-edit-label [font-size:12px] [color:#6b7280] [margin-bottom:2px]">Editing Candidate</div>

            <h3 className="candidate-edit-name [margin:0] [font-size:17px] [font-weight:600] [color:#1f2937]">{candidateName}</h3>

            {candidateEmail && (
              <p className="candidate-edit-email [margin:3px_0_0] [font-size:13px] [color:#6b7280]">{candidateEmail}</p>
            )}
          </div>
        </div>

        <div className="card [background:#fff] [border:1px_solid_#e2e8f0] [border-radius:12px] [padding:22px]">
          <div className="section-header [display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:14px]">
            <div>
              <h3 className="[margin:0px] [.card_&]:[font-size:15px] [.card_&]:[font-weight:700] [.card_&]:[color:#1e293b] [.card_&]:[margin-bottom:16px]" >Edit Candidate Details</h3>

              <p className="muted [margin-top:4px] [font-size:12px] [color:#64748b]" >
                Update the candidate's current professional information.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="edit-candidate-grid [display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:20px] [margin-top:20px] max-[768px]:[grid-template-columns:1fr]">
              <div className="form-group [display:flex] [flex-direction:column] [gap:8px]">
                <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold] [.form-group_&]:[display:flex] [.form-group_&]:[align-items:center] [.form-group_&]:[gap:6px] [.form-group_&]:[font-size:13px] [.form-group_&]:[font-weight:600] [.form-group_&]:[color:#1e293b]" htmlFor="full_name">Candidate Name</label>
                <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [.form-group_&]:[width:100%] [.form-group_&]:[height:42px] [.form-group_&]:[padding:0_12px] [.form-group_&]:[border:1px_solid_#dfe3e8] [.form-group_&]:[border-radius:8px] [.form-group_&]:[background:#ffffff] [.form-group_&]:[color:#1e293b] [.form-group_&]:[font-size:14px] [.form-group_&]:[outline:none] [.form-group_&]:[box-sizing:border-box] [.form-group_&]:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease] focus:[.form-group_&]:[border-color:#133f7d] focus:[.form-group_&]:[box-shadow:0_0_0_3px_rgba(19,_63,_125,_0.08)]"
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Priya Sharma"
                  required
                />
              </div>

              <div className="form-group [display:flex] [flex-direction:column] [gap:8px]">
                <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold] [.form-group_&]:[display:flex] [.form-group_&]:[align-items:center] [.form-group_&]:[gap:6px] [.form-group_&]:[font-size:13px] [.form-group_&]:[font-weight:600] [.form-group_&]:[color:#1e293b]" htmlFor="email">Email</label>

                <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [.form-group_&]:[width:100%] [.form-group_&]:[height:42px] [.form-group_&]:[padding:0_12px] [.form-group_&]:[border:1px_solid_#dfe3e8] [.form-group_&]:[border-radius:8px] [.form-group_&]:[background:#ffffff] [.form-group_&]:[color:#1e293b] [.form-group_&]:[font-size:14px] [.form-group_&]:[outline:none] [.form-group_&]:[box-sizing:border-box] [.form-group_&]:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease] focus:[.form-group_&]:[border-color:#133f7d] focus:[.form-group_&]:[box-shadow:0_0_0_3px_rgba(19,_63,_125,_0.08)]"
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. candidate@gmail.com"
                />
              </div>

              <div className="form-group [display:flex] [flex-direction:column] [gap:8px]">
                <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold] [.form-group_&]:[display:flex] [.form-group_&]:[align-items:center] [.form-group_&]:[gap:6px] [.form-group_&]:[font-size:13px] [.form-group_&]:[font-weight:600] [.form-group_&]:[color:#1e293b]" htmlFor="phone">Mobile Number</label>

                <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [.form-group_&]:[width:100%] [.form-group_&]:[height:42px] [.form-group_&]:[padding:0_12px] [.form-group_&]:[border:1px_solid_#dfe3e8] [.form-group_&]:[border-radius:8px] [.form-group_&]:[background:#ffffff] [.form-group_&]:[color:#1e293b] [.form-group_&]:[font-size:14px] [.form-group_&]:[outline:none] [.form-group_&]:[box-sizing:border-box] [.form-group_&]:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease] focus:[.form-group_&]:[border-color:#133f7d] focus:[.form-group_&]:[box-shadow:0_0_0_3px_rgba(19,_63,_125,_0.08)]"
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +91 9876543210"
                />
              </div>

              <div className="form-group [display:flex] [flex-direction:column] [gap:8px]">
                <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold] [.form-group_&]:[display:flex] [.form-group_&]:[align-items:center] [.form-group_&]:[gap:6px] [.form-group_&]:[font-size:13px] [.form-group_&]:[font-weight:600] [.form-group_&]:[color:#1e293b]" htmlFor="skills">Skills</label>
                <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [.form-group_&]:[width:100%] [.form-group_&]:[height:42px] [.form-group_&]:[padding:0_12px] [.form-group_&]:[border:1px_solid_#dfe3e8] [.form-group_&]:[border-radius:8px] [.form-group_&]:[background:#ffffff] [.form-group_&]:[color:#1e293b] [.form-group_&]:[font-size:14px] [.form-group_&]:[outline:none] [.form-group_&]:[box-sizing:border-box] [.form-group_&]:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease] focus:[.form-group_&]:[border-color:#133f7d] focus:[.form-group_&]:[box-shadow:0_0_0_3px_rgba(19,_63,_125,_0.08)]"
                  id="skills"
                  name="skills"
                  type="text"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="e.g. Python, SQL, React"
                />
              </div>

              {/* Location */}

              <div className="form-group [display:flex] [flex-direction:column] [gap:8px]">
                <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold] [.form-group_&]:[display:flex] [.form-group_&]:[align-items:center] [.form-group_&]:[gap:6px] [.form-group_&]:[font-size:13px] [.form-group_&]:[font-weight:600] [.form-group_&]:[color:#1e293b]" htmlFor="location">
                  <MapPin size={15} />
                  Location
                </label>

                <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [.form-group_&]:[width:100%] [.form-group_&]:[height:42px] [.form-group_&]:[padding:0_12px] [.form-group_&]:[border:1px_solid_#dfe3e8] [.form-group_&]:[border-radius:8px] [.form-group_&]:[background:#ffffff] [.form-group_&]:[color:#1e293b] [.form-group_&]:[font-size:14px] [.form-group_&]:[outline:none] [.form-group_&]:[box-sizing:border-box] [.form-group_&]:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease] focus:[.form-group_&]:[border-color:#133f7d] focus:[.form-group_&]:[box-shadow:0_0_0_3px_rgba(19,_63,_125,_0.08)]"
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Hyderabad"
                />
              </div>

              {/* Current Role */}

              <div className="form-group [display:flex] [flex-direction:column] [gap:8px]">
                <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold] [.form-group_&]:[display:flex] [.form-group_&]:[align-items:center] [.form-group_&]:[gap:6px] [.form-group_&]:[font-size:13px] [.form-group_&]:[font-weight:600] [.form-group_&]:[color:#1e293b]" htmlFor="current_role">
                  <BriefcaseBusiness size={15} />
                  Current Role
                </label>

                <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [.form-group_&]:[width:100%] [.form-group_&]:[height:42px] [.form-group_&]:[padding:0_12px] [.form-group_&]:[border:1px_solid_#dfe3e8] [.form-group_&]:[border-radius:8px] [.form-group_&]:[background:#ffffff] [.form-group_&]:[color:#1e293b] [.form-group_&]:[font-size:14px] [.form-group_&]:[outline:none] [.form-group_&]:[box-sizing:border-box] [.form-group_&]:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease] focus:[.form-group_&]:[border-color:#133f7d] focus:[.form-group_&]:[box-shadow:0_0_0_3px_rgba(19,_63,_125,_0.08)]"
                  id="current_role"
                  name="current_role"
                  type="text"
                  value={formData.current_role}
                  onChange={handleChange}
                  placeholder="e.g. Senior React Developer"
                />
              </div>

              {/* Notice Period */}

              <div className="form-group [display:flex] [flex-direction:column] [gap:8px]">
                <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold] [.form-group_&]:[display:flex] [.form-group_&]:[align-items:center] [.form-group_&]:[gap:6px] [.form-group_&]:[font-size:13px] [.form-group_&]:[font-weight:600] [.form-group_&]:[color:#1e293b]" htmlFor="notice_period">
                  <CalendarDays size={15} />
                  Notice Period
                </label>

                <div className="input-with-suffix [position:relative] [display:flex] [align-items:center]">
                  <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [.form-group_&]:[width:100%] [.form-group_&]:[height:42px] [.form-group_&]:[padding:0_12px] [.form-group_&]:[border:1px_solid_#dfe3e8] [.form-group_&]:[border-radius:8px] [.form-group_&]:[background:#ffffff] [.form-group_&]:[color:#1e293b] [.form-group_&]:[font-size:14px] [.form-group_&]:[outline:none] [.form-group_&]:[box-sizing:border-box] [.form-group_&]:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease] focus:[.form-group_&]:[border-color:#133f7d] focus:[.form-group_&]:[box-shadow:0_0_0_3px_rgba(19,_63,_125,_0.08)] [.input-with-suffix_&]:[padding-right:55px]"
                    id="notice_period"
                    name="notice_period"
                    type="number"
                    min="0"
                    value={formData.notice_period}
                    onChange={handleChange}
                    placeholder="e.g. 30"
                  />

                  <span className="[.input-with-suffix_&]:[position:absolute] [.input-with-suffix_&]:[right:12px] [.input-with-suffix_&]:[color:#64748b] [.input-with-suffix_&]:[font-size:12px] [.input-with-suffix_&]:[pointer-events:none]">Days</span>
                </div>
              </div>

              {/* Current CTC */}

              <div className="form-group [display:flex] [flex-direction:column] [gap:8px]">
                <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold] [.form-group_&]:[display:flex] [.form-group_&]:[align-items:center] [.form-group_&]:[gap:6px] [.form-group_&]:[font-size:13px] [.form-group_&]:[font-weight:600] [.form-group_&]:[color:#1e293b]" htmlFor="current_ctc">
                  <IndianRupee size={15} />
                  Current CTC
                </label>

                <div className="input-with-suffix [position:relative] [display:flex] [align-items:center]">
                  <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [.form-group_&]:[width:100%] [.form-group_&]:[height:42px] [.form-group_&]:[padding:0_12px] [.form-group_&]:[border:1px_solid_#dfe3e8] [.form-group_&]:[border-radius:8px] [.form-group_&]:[background:#ffffff] [.form-group_&]:[color:#1e293b] [.form-group_&]:[font-size:14px] [.form-group_&]:[outline:none] [.form-group_&]:[box-sizing:border-box] [.form-group_&]:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease] focus:[.form-group_&]:[border-color:#133f7d] focus:[.form-group_&]:[box-shadow:0_0_0_3px_rgba(19,_63,_125,_0.08)] [.input-with-suffix_&]:[padding-right:55px]"
                    id="current_ctc"
                    name="current_ctc"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.current_ctc}
                    onChange={handleChange}
                    placeholder="e.g. 12.5"
                  />

                  <span className="[.input-with-suffix_&]:[position:absolute] [.input-with-suffix_&]:[right:12px] [.input-with-suffix_&]:[color:#64748b] [.input-with-suffix_&]:[font-size:12px] [.input-with-suffix_&]:[pointer-events:none]">LPA</span>
                </div>
              </div>
            </div>

            <div className="edit-candidate-actions [display:flex] [justify-content:flex-end] [gap:10px] [margin-top:28px] [padding-top:20px] [border-top:1px_solid_#eef0f2]">
              <button
                type="button"
                className="btn btn-secondary [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#fff] [color:#133f7d] [border:1.5px_solid_#133f7d]"
                onClick={() => navigate(`/candidate-detail/${candidateId}`)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#133f7d] [color:#fff]"
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

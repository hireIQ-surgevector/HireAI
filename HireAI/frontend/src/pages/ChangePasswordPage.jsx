import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";

const ShieldIcon = (props) => <ShieldCheck {...props} />;

function ChangePasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, currentPassword, role } = location.state || {};
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!newPassword || !confirmPassword) {
      setError("Please fill both password fields");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to change password");
      }

      setSuccess(data.message);
      setTimeout(() => {
        if (role === "interviewer") navigate("/interviews");
        else navigate("/dashboard");
      }, 600);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen fullpage active [min-height:100vh] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center] [background:linear-gradient(135deg,_#0d2d5e,_#133f7d)]">
      <div className="auth-card compact [background:#fff] [border-radius:16px] [padding:38px] [width:420px] [box-shadow:0_20px_60px_rgba(0,0,0,0.22)] [width:400px]">
        <div className="auth-header [text-align:center] [margin-bottom:24px]">
          <div className="emoji [font-size:44px] [margin-bottom:12px]">
            <ShieldIcon size={44} />
          </div>
          <h2 className="[.auth-header_&]:[font-size:20px] [.auth-header_&]:[font-weight:800] [.auth-header_&]:[color:#1e293b] [.auth-header_&]:[margin-bottom:6px]">Set a New Password</h2>
          <p className="[.auth-header_&]:[color:#64748b] [.auth-header_&]:[font-size:13px]">For your first sign-in, choose a new password to continue.</p>
        </div>
        <div className="field [margin-bottom:14px]">
          <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]">New Password</label>
          <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="field [margin-bottom:14px]">
          <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]">Confirm New Password</label>
          <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        {error && <div className="error-box [background:#fee2e2] [color:#991b1b] [padding:10px] [border-radius:8px] [font-size:12px] [margin-bottom:10px]">{error}</div>}
        {success && <div className="mb-3 rounded-lg bg-green-100 p-2.5 text-xs text-green-800">{success}</div>}
        <button
          type="button"
          className="btn btn-primary btn-lg full-width [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#133f7d] [color:#fff] [padding:13px_28px] [font-size:15px] [width:100%]"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
}

export default ChangePasswordPage;

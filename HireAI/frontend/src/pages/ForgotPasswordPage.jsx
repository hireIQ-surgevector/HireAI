import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";

const DocumentIcon = (props) => <FileText {...props} />;

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5001";

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to process request");
      }

      setMessage(data.message);
      navigate("/reset-sent", { state: { email } });
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
            <DocumentIcon size={44} />
          </div>
          <h2 className="[.auth-header_&]:[font-size:20px] [.auth-header_&]:[font-weight:800] [.auth-header_&]:[color:#1e293b] [.auth-header_&]:[margin-bottom:6px]">Reset Password</h2>
          <p className="[.auth-header_&]:[color:#64748b] [.auth-header_&]:[font-size:13px]">Enter your registered email to receive a reset link</p>
        </div>
        <div className="field [margin-bottom:14px]">
          <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]">Registered Email</label>
          <input className="[font:inherit] [width:100%] [padding:10px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:8px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff]"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </div>
        {error && <div className="error-box [background:#fee2e2] [color:#991b1b] [padding:10px] [border-radius:8px] [font-size:12px] [margin-bottom:10px]">{error}</div>}
        {message && <div className="mb-3 rounded-lg bg-green-100 p-2.5 text-xs text-green-800">{message}</div>}
        <button
          type="button"
          className="btn btn-primary btn-lg full-width [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#133f7d] [color:#fff] [padding:13px_28px] [font-size:15px] [width:100%]"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
        <button
          type="button"
          className="btn-link [font:inherit] [color:#133f7d] [font-size:12px] [font-weight:600] [background:none] [border:none] [cursor:pointer]"
          onClick={() => navigate("/login")}
        >
          ← Back to Login
        </button>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;

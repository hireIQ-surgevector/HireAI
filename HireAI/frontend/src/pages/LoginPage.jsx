import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { saveSession } from "../utils/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5001";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("james@gmail.com");
  const [password, setPassword] = useState("Test@1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      const userRole = data.role || "manager";
      saveSession({ ...data, role: userRole }, data.token);

      if (data.require_password_change) {
        navigate("/change-password", {
          state: { email, currentPassword: password, role: userRole },
        });
        return;
      }

      if (userRole === "interviewer") navigate("/interviews");
      else navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen fullpage active [min-height:100vh] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center] [background:linear-gradient(135deg,_#0d2d5e,_#133f7d)]">
      <div className="auth-card [width:min(420px,calc(100vw-2rem))] [background:#fff] [border:1px_solid_rgba(255,255,255,0.65)] [border-radius:20px] [padding:36px] [box-shadow:0_24px_70px_rgba(7,24,54,0.28)] max-[480px]:[padding:24px]">
        {/* Brand header — uses new app-logo-mark / app-logo-text system */}
        <div className="auth-header [text-align:center] [margin-bottom:24px]">
          <div
            className="app-logo [justify-content:center] [margin-bottom:8px] [display:flex] [align-items:center] [gap:11px] [text-decoration:none] [color:inherit]"

          >
            <div className="app-logo-mark [width:38px] [height:38px] [display:flex] [align-items:center] [justify-content:center] [border-radius:10px] [background:#00b4d8] [color:white] [font-size:13px] [font-weight:700] [letter-spacing:0.5px] max-[768px]:[width:36px] max-[768px]:[height:36px]">
              <Sparkles size={16} />
            </div>
            <span className="app-logo-text [font-size:20px] [font-weight:700] [color:#1f2937]">HireIQ</span>
          </div>
          <p className="[.auth-header_&]:[color:#64748b] [.auth-header_&]:[font-size:13px]">AI-Powered Recruitment Platform</p>
        </div>

        <div className="field [margin-bottom:14px]">
          <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]">Email Address</label>
          <input className="[font:inherit] [width:100%] [padding:11px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:10px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [transition:border-color_0.18s_ease,_box-shadow_0.18s_ease] hover:[border-color:#cbd5e1] focus:[border-color:#00b4d8] focus:[box-shadow:0_0_0_3px_rgba(0,180,216,0.12)]"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field [margin-bottom:14px]">
          <label className="[font-size:13px] [font-weight:600] [color:#1e293b] [display:block] [margin-bottom:5px] [&:has(+_:required)]:[&::after]:[content:'_*'] [&:has(+_:required)]:[&::after]:[color:red] [&:has(+_:required)]:[&::after]:[font-weight:bold]">Password</label>
          <input className="[font:inherit] [width:100%] [padding:11px_12px] [border:1.5px_solid_#e2e8f0] [border-radius:10px] [font-size:14px] [color:#1e293b] [outline:none] [background:#fff] [transition:border-color_0.18s_ease,_box-shadow_0.18s_ease] hover:[border-color:#cbd5e1] focus:[border-color:#00b4d8] focus:[box-shadow:0_0_0_3px_rgba(0,180,216,0.12)]"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <div className="error-box [background:#fee2e2] [color:#991b1b] [padding:10px] [border-radius:8px] [font-size:12px] [margin-bottom:10px]">{error}</div>}

        <div className="auth-link-row [text-align:right] [margin-bottom:18px]">
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-lg full-width [font:inherit] [border:none] [border-radius:10px] [cursor:pointer] [font-weight:700] [transition:all_0.18s_ease] [display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [font-size:14px] [padding:13px_20px] [background:#133f7d] [color:#fff] [width:100%] [box-shadow:0_6px_14px_rgba(19,63,125,0.18)] hover:[background:#0d2d5e] hover:[transform:translateY(-1px)] focus-visible:[outline:2px_solid_#00b4d8] focus-visible:[outline-offset:3px] disabled:[opacity:0.65] disabled:[cursor:not-allowed]"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? (
            "Signing In..."
          ) : (
            <>
              Sign In <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default LoginPage;

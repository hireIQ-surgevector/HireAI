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
    <div className="screen fullpage active">
      <div className="auth-card">
        {/* Brand header — uses new app-logo-mark / app-logo-text system */}
        <div className="auth-header">
          <div
            className="app-logo"
            style={{ justifyContent: "center", marginBottom: 8 }}
          >
            <div className="app-logo-mark">
              <Sparkles size={16} />
            </div>
            <span className="app-logo-text">TalentSync</span>
          </div>
          <p>AI-Powered Recruitment Platform</p>
        </div>

        <div className="field">
          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="auth-link-row">
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-lg full-width"
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

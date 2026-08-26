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
    <div className="screen fullpage active">
      <div className="auth-card compact">
        <div className="auth-header">
          <div className="emoji">
            <DocumentIcon size={44} />
          </div>
          <h2>Reset Password</h2>
          <p>Enter your registered email to receive a reset link</p>
        </div>
        <div className="field">
          <label>Registered Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </div>
        {error && <div className="error-box">{error}</div>}
        {message && <div className="success-box">{message}</div>}
        <button
          type="button"
          className="btn btn-primary btn-lg full-width"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
        <button
          type="button"
          className="btn-link"
          onClick={() => navigate("/login")}
        >
          ← Back to Login
        </button>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;

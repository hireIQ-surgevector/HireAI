import { useNavigate, useLocation } from "react-router-dom";
import { Check } from "lucide-react";

const CheckIcon = (props) => <Check {...props} />;

function ResetSentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "your registered email";

  return (
    <div className="screen fullpage active [min-height:100vh] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center] [background:linear-gradient(135deg,_#0d2d5e,_#133f7d)]">
      <div className="auth-card compact text-center [width:min(400px,calc(100vw-2rem))] [background:#fff] [border:1px_solid_rgba(255,255,255,0.65)] [border-radius:20px] [padding:36px] [box-shadow:0_24px_70px_rgba(7,24,54,0.28)] [text-align:center] max-[480px]:[padding:24px]">
        <div className="success-icon [width:72px] [height:72px] [border-radius:50%] [background:#dcfce7] [display:flex] [align-items:center] [justify-content:center] [margin:0_auto_18px] [font-size:32px]">
          <CheckIcon size={32} />
        </div>
        <h2>Email Sent!</h2>
        <p>
          We&apos;ve sent a password reset confirmation for {email}. Please
          check your inbox.
        </p>
        <button
          type="button"
          className="btn btn-primary [font:inherit] [border:none] [border-radius:8px] [cursor:pointer] [font-weight:600] [transition:all_0.15s] [display:inline-flex] [align-items:center] [justify-content:center] [gap:6px] [font-size:13px] [padding:9px_18px] [background:#133f7d] [color:#fff]"
          onClick={() => navigate("/login")}
        >
          ← Back to Login
        </button>
      </div>
    </div>
  );
}

export default ResetSentPage;

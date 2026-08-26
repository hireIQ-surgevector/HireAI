import { useNavigate, useLocation } from "react-router-dom"
import { Check } from "lucide-react"

const CheckIcon = (props) => <Check {...props} />

function ResetSentPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || 'your registered email'

  return (
    <div className="screen fullpage active">
      <div className="auth-card compact text-center">
        <div className="success-icon"><CheckIcon size={32} /></div>
        <h2>Email Sent!</h2>
        <p>We&apos;ve sent a password reset confirmation for {email}. Please check your inbox.</p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/login')}>
          ← Back to Login
        </button>
      </div>
    </div>
  )
}

export default ResetSentPage
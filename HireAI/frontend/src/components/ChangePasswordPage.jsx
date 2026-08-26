import { useNavigate, useLocation } from "react-router-dom"
import { useState } from "react"
import { ShieldCheck } from "lucide-react"

const ShieldIcon = (props) => <ShieldCheck {...props} />

function ChangePasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { email, currentPassword, role } = location.state || {}
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (!newPassword || !confirmPassword) {
      setError('Please fill both password fields')
      return
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, current_password: currentPassword, new_password: newPassword }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to change password')
      }

      setSuccess(data.message)
      setTimeout(() => {
        if (role === 'interviewer') navigate('/interviews')
        else navigate('/dashboard')
      }, 600)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen fullpage active">
      <div className="auth-card compact">
        <div className="auth-header">
          <div className="emoji"><ShieldIcon size={44} /></div>
          <h2>Set a New Password</h2>
          <p>For your first sign-in, choose a new password to continue.</p>
        </div>
        <div className="field">
          <label>New Password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className="field">
          <label>Confirm New Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        {error && <div className="error-box">{error}</div>}
        {success && <div className="success-box">{success}</div>}
        <button type="button" className="btn btn-primary btn-lg full-width" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </div>
  )
}

export default ChangePasswordPage
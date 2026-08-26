import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from './PageShell'
import { API_URL, canManageCandidates, getSession } from '../utils/auth'

function InterviewsPage() {
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const session = getSession()

  useEffect(() => {
    const loadInterviews = async () => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/interviews`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      const data = await response.json()
      if (response.ok) {
        setInterviews(Array.isArray(data) ? data : [])
      }
      setLoading(false)
    }
    loadInterviews()
  }, [])

  return (
    <PageShell title="Interviews" active="interviews" actions={canManageCandidates(session) ? <Link to="/schedule-interview" className="btn btn-primary btn-sm">+ Schedule</Link> : null}>
      <div className="card table-card">
        {loading ? <div style={{ padding: '24px', textAlign: 'center' }}>Loading interviews...</div> : (
          <table>
            <thead><tr><th>Candidate</th><th>Role</th><th>Date & Time</th><th>Round</th><th>Interviewer</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {interviews.map((interview) => (
                <tr key={interview.id || interview.candidate_name}>
                  <td><div className="flex-row"><div className="avatar" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>{interview.candidate_name.split(' ').map((word) => word[0]).join('')}</div><span className="strong">{interview.candidate_name}</span></div></td>
                  <td>{interview.role_name}</td>
                  <td>{interview.scheduled_at ? new Date(interview.scheduled_at).toLocaleString() : 'Pending'}</td>
                  <td><span className="badge badge-teal">{interview.round}</span></td>
                  <td>{interview.interviewer_name || 'Unassigned'}</td>
                  <td><span className={`badge ${interview.status === 'Completed' ? 'badge-green' : interview.status === 'Cancelled' ? 'badge-red' : 'badge-blue'}`}>{interview.status}</span></td>
                  <td>{interview.status === 'Scheduled' ? <Link to="/interview-room" className="btn btn-teal btn-sm">Join</Link> : <Link to="/evaluations" className="btn btn-ghost btn-sm">View Report</Link>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  )
}

export default InterviewsPage
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Bell, BriefcaseBusiness, Users, CalendarCheck, FileText, ArrowRight } from "lucide-react"
import PageShell from "./PageShell"
import StatCard from "./StatCard"
import badgeClass from './badgeClass'
import scoreBar from './scoreBar'
import { API_URL, getSession } from '../utils/auth'


const BellIcon = (props) => <Bell {...props} />
const JobsIcon = (props) => <BriefcaseBusiness {...props} />
const CandidatesIcon = (props) => <Users {...props} />
const InterviewsIcon = (props) => <CalendarCheck {...props} />
const OffersIcon = (props) => <FileText {...props} />
const ArrowRightIcon = (props) => <ArrowRight {...props} />


function DashboardPage() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const session = getSession()

  useEffect(() => {
    const loadSummary = async () => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/dashboard-summary`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      const data = await response.json()
      if (response.ok) {
        setSummary(data)
      }
      setLoading(false)
    }
    loadSummary()
  }, [])

  const counts = summary?.counts || {}
  const recentCandidates = summary?.recent_candidates || []
  const upcomingInterviews = summary?.upcoming_interviews || []
  const canManage = session?.permissions?.can_manage_candidates || session?.role === 'manager'

  return (
    <PageShell title="Dashboard" active="dashboard" actions={<button className="btn btn-secondary btn-sm"><BellIcon size={14} /></button>}>
      <div className="grid4">
        <StatCard label="Active Jobs" value={loading ? '—' : String(counts.open_jobs || 0)} icon={<JobsIcon size={18} />} color="brand" />
        <StatCard label="Candidates" value={loading ? '—' : String(counts.candidates || 0)} icon={<CandidatesIcon size={18} />} color="purple" />
        <StatCard label="Interviews Today" value={loading ? '—' : String(counts.interviews_today || 0)} icon={<InterviewsIcon size={18} />} color="teal" />
        <StatCard label="Offers Pending" value={loading ? '—' : String(counts.offers_pending || 0)} icon={<OffersIcon size={18} />} color="orange" />
      </div>
      <div className="grid2">
        <div className="card">
          <h3>Hiring Pipeline</h3>
          {(summary?.pipeline || []).map((item) => (
            <div key={item.label} className="pipeline-row">
              <div className="pipeline-label">{item.label}</div>
              <div className="pipeline-value">{item.value}</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${Math.min(100, (item.value / Math.max(1, counts.candidates || 1)) * 100)}%`, background: item.label === 'Applied' ? '#94a3b8' : item.label === 'Screened' ? 'var(--brand)' : item.label === 'Technical Round' ? 'var(--teal)' : 'var(--orange)' }} />
              </div>
            </div>
          ))}
          {!(summary?.pipeline || []).length && (
            <div className="muted">No pipeline data yet.</div>
          )}
        </div>
        <div className="card">
          <h3>Upcoming Interviews</h3>
          {upcomingInterviews.length === 0 ? <div className="muted">No interviews scheduled.</div> : upcomingInterviews.map((interview) => (
            <div key={interview.id} className="list-row">
              <div className="avatar" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>{interview.candidate_name.split(' ').map((w) => w[0]).join('')}</div>
              <div className="list-main">
                <div className="list-title">{interview.candidate_name}</div>
                <div className="list-sub">{interview.role_name}</div>
              </div>
              <div className="text-right">
                <div className="list-time">{new Date(interview.scheduled_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
                <span className="badge badge-teal">{interview.round}</span>
              </div>
            </div>
          ))}
          <Link to="/interviews" className="btn btn-secondary btn-sm full-width">View All Interviews</Link>
        </div>
      </div>
      <div className="card">
        <div className="section-header">
          <h3>Recent Candidates</h3>
          <Link to="/candidates" className="btn btn-secondary btn-sm">View All</Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Role</th>
              <th>Status</th>
              <th>AI Score</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {recentCandidates.slice(0, 4).map((candidate) => (
              <tr key={candidate.name}>
                <td>
                  <div className="flex-row">
                    <div className="avatar" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>{candidate.name.split(' ').map((w) => w[0]).join('')}</div>
                    <span className="strong">{candidate.name}</span>
                  </div>
                </td>
                <td>{candidate.role}</td>
                <td><span className={`badge ${badgeClass(candidate.status.toLowerCase().replace(/ /g, '-'))}`}>{candidate.status}</span></td>
                <td>{scoreBar(candidate.score || 0)}</td>
                <td>{canManage ? <Link to={`/candidate-detail/${candidate.candidate_id}`} className="btn btn-ghost btn-sm">View <ArrowRightIcon size={14} /></Link> : <span className="muted">Restricted</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  )
}

export default DashboardPage
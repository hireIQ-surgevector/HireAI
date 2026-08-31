// import { useEffect, useState } from 'react'
// import { Link } from 'react-router-dom'
// import PageShell from './PageShell'
// import { API_URL, canManageCandidates, getSession } from '../utils/auth'

// function InterviewsPage() {
//   const [interviews, setInterviews] = useState([])
//   const [loading, setLoading] = useState(true)
//   const session = getSession()

//   useEffect(() => {
//     const loadInterviews = async () => {
//       const token = localStorage.getItem('token')
//       const response = await fetch(`${API_URL}/api/interviews`, {
//         headers: {
//           'Content-Type': 'application/json',
//           ...(token ? { Authorization: `Bearer ${token}` } : {}),
//         },
//       })
//       const data = await response.json()
//       if (response.ok) {
//         setInterviews(Array.isArray(data) ? data : [])
//       }
//       setLoading(false)
//     }
//     loadInterviews()
//   }, [])

//   return (
//     <PageShell title="Interviews" active="interviews" actions={canManageCandidates(session) ? <Link to="/schedule-interview" className="btn btn-primary btn-sm">+ Schedule</Link> : null}>
//       <div className="card table-card">
//         {loading ? <div style={{ padding: '24px', textAlign: 'center' }}>Loading interviews...</div> : (
//           <table>
//             <thead><tr><th>Candidate</th><th>Role</th><th>Date & Time</th><th>Round</th><th>Interviewer</th><th>Status</th><th>Actions</th></tr></thead>
//             <tbody>
//               {interviews.map((interview) => (
//                 <tr key={interview.id || interview.candidate_name}>
//                   <td><div className="flex-row"><div className="avatar" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>{interview.candidate_name.split(' ').map((word) => word[0]).join('')}</div><span className="strong">{interview.candidate_name}</span></div></td>
//                   <td>{interview.role_name}</td>
//                   <td>{interview.scheduled_at ? new Date(interview.scheduled_at).toLocaleString() : 'Pending'}</td>
//                   <td><span className="badge badge-teal">{interview.round}</span></td>
//                   <td>{interview.interviewer_name || 'Unassigned'}</td>
//                   <td><span className={`badge ${interview.status === 'Completed' ? 'badge-green' : interview.status === 'Cancelled' ? 'badge-red' : 'badge-blue'}`}>{interview.status}</span></td>
//                   <td>{interview.status === 'Scheduled' ? <Link to="/interview-room" className="btn btn-teal btn-sm">Join</Link> : <Link to="/evaluations" className="btn btn-ghost btn-sm">View Report</Link>}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </PageShell>
//   )
// }

// export default InterviewsPage


import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from './PageShell'
import {
  CalendarDays,
  Clock,
  Pencil,
  Plus,
  User,
} from 'lucide-react'
import {
  API_URL,
  canManageCandidates,
  getSession,
} from '../utils/auth'

function InterviewsPage() {
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)

  const session = getSession()

  useEffect(() => {
    const loadInterviews = async () => {
      try {
        const token = localStorage.getItem('token')

        const response = await fetch(`http://localhost:5001/api/interviews`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
        })

        const data = await response.json()

        if (response.ok) {
          setInterviews(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Failed to load interviews:', error)
      } finally {
        setLoading(false)
      }
    }

    loadInterviews()
  }, [])

  const getInitials = (name = '') => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase()
  }

  const formatDate = (date) => {
    if (!date) return 'Not scheduled'

    return new Date(date).toLocaleDateString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (date) => {
    if (!date) return ''

    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <PageShell
      title="Interviews"
      active="interviews"
      actions={
        canManageCandidates(session) ? (
          <Link
            to="/schedule-interview"
            className="btn btn-primary btn-sm interview-schedule-btn"
          >
            <Plus size={15} />
            Schedule Interview
          </Link>
        ) : null
      }
    >
      <div className="interviews-page">

        {/* PAGE HEADER */}

        <div className="interviews-header">
          <div>
            <p className="interviews-eyebrow">
              INTERVIEW MANAGEMENT
            </p>

            <h2>Scheduled Interviews</h2>

            <p>
              Manage and track all candidate interviews in one place.
            </p>
          </div>

          {!loading && (
            <div className="interviews-count">
              <CalendarDays size={16} />

              <span>
                {interviews.length}{' '}
                {interviews.length === 1
                  ? 'Interview'
                  : 'Interviews'}
              </span>
            </div>
          )}
        </div>


        {/* INTERVIEWS TABLE */}

        <div className="interviews-table-card">

          {loading ? (
            <div className="interviews-loading">
              <div className="loading-spinner" />

              <p>Loading interviews...</p>
            </div>
          ) : interviews.length === 0 ? (

            <div className="interviews-empty-state">
              <div className="interviews-empty-icon">
                <CalendarDays size={28} />
              </div>

              <h3>No interviews scheduled</h3>

              <p>
                Schedule an interview to start managing
                candidate interview sessions.
              </p>

              {canManageCandidates(session) && (
                <Link
                  to="/schedule-interview"
                  className="btn btn-primary"
                >
                  <Plus size={16} />
                  Schedule Interview
                </Link>
              )}
            </div>

          ) : (

            <div className="interviews-table-wrapper">

              <table className="interviews-table">

                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Role</th>
                    <th>Schedule</th>
                    <th>Round</th>
                    <th className="interviews-actions-heading">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {interviews.map((interview) => {

                    const interviewDate =
                      interview.scheduled_at

                    return (
                      <tr
                        key={
                          interview.id ||
                          `${interview.candidate_name}-${interview.scheduled_at}`
                        }
                      >

                        {/* CANDIDATE */}

                        <td>

                          <div className="interview-candidate">

                            <div className="interview-candidate-avatar">
                              {getInitials(
                                interview.candidate_name
                              )}
                            </div>

                            <div className="interview-candidate-info">

                              <span className="interview-candidate-name">
                                {interview.candidate_name}
                              </span>

                              <span className="interview-candidate-subtitle">
                                Candidate
                              </span>

                            </div>

                          </div>

                        </td>


                        {/* ROLE */}

                        <td>

                          <span className="interview-role-name">
                            {interview.role_name}
                          </span>

                        </td>


                        {/* DATE & TIME */}

                        <td>

                          {interviewDate ? (

                            <div className="interview-schedule">

                              <div className="interview-schedule-item">

                                <CalendarDays size={14} />

                                <span>
                                  {formatDate(interviewDate)}
                                </span>

                              </div>

                              <div className="interview-schedule-item interview-time">

                                <Clock size={14} />

                                <span>
                                  {formatTime(interviewDate)}
                                </span>

                              </div>

                            </div>

                          ) : (

                            <span className="interview-not-scheduled">
                              Not scheduled
                            </span>

                          )}

                        </td>


                        {/* ROUND */}

                        <td>

                          <span className="interview-round-badge">
                            Round {interview.round}
                          </span>

                        </td>


                        {/* ACTIONS */}

                        <td>

                          <div className="interview-row-actions">

                            <Link
                              to={`/edit-interview/${interview.id}`}
                              className="interview-edit-btn"
                              title="Edit interview schedule"
                            >
                              <Pencil size={14} />

                              <span>Edit Schedule</span>
                            </Link>

                          </div>

                        </td>

                      </tr>
                    )
                  })}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>
    </PageShell>
  )
}

export default InterviewsPage
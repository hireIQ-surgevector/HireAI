import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageShell from './PageShell'
import toast from 'react-hot-toast'

function PostJobPage() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    title: 'Senior Frontend Developer',
    department: 'Engineering',
    location: 'Bangalore, Karnataka',
    description: 'We are looking for a Senior Frontend Developer to lead our UI engineering team...',
    mandatoryInput: '',
    mandatorySkills: ['React', 'TypeScript'],
    requiredInput: '',
    requiredSkills: ['Node.js', 'GraphQL', 'Next.js'],
    minExp: 5,
    minSalary: '',
    maxSalary: '',
    dueDate: '',
    interviewMode: 'Video Interview (IncVid)',
  })

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Standard input handler
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // --- Mandatory Skills Handlers ---
  const addMandatorySkill = () => {
    const trimmed = formData.mandatoryInput.trim().replace(/^,|,$/g, '')
    if (trimmed && !formData.mandatorySkills.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        mandatorySkills: [...prev.mandatorySkills, trimmed],
        mandatoryInput: '',
      }))
    }
  }

  const handleMandatoryKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addMandatorySkill()
    }
  }

  const removeMandatorySkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      mandatorySkills: prev.mandatorySkills.filter((s) => s !== skillToRemove),
    }))
  }

  // --- Required / Secondary Skills Handlers ---
  const addRequiredSkill = () => {
    const trimmed = formData.requiredInput.trim().replace(/^,|,$/g, '')
    if (trimmed && !formData.requiredSkills.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, trimmed],
        requiredInput: '',
      }))
    }
  }

  const handleRequiredKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addRequiredSkill()
    }
  }

  const removeRequiredSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((s) => s !== skillToRemove),
    }))
  }

  // Form submission connected to Flask API
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (
      formData.minSalary &&
      formData.maxSalary &&
      Number(formData.minSalary) > Number(formData.maxSalary)
    ) {
      setErrorMsg('Minimum salary cannot be greater than maximum salary.')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')

      const response = await fetch('http://localhost:5001/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          title: formData.title,
          department: formData.department,
          location: formData.location,
          description: formData.description,
          mandatory_skills: formData.mandatorySkills.join(', '),
          required_skills: formData.requiredSkills.join(', '),
          min_exp: Number(formData.minExp),
          min_salary: formData.minSalary ? Number(formData.minSalary) : null,
          max_salary: formData.maxSalary ? Number(formData.maxSalary) : null,
          due_date: formData.dueDate || null,
          interview_mode: formData.interviewMode,
        }),
      })

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish job')
      }

      toast.success('Job published successfully!')
      navigate('/jobs')
    } catch (err) {
      setErrorMsg(err.message)
      toast.error(err.message || 'Failed to publish job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell title="Post New Job" active="jobs" backTo="/jobs">
      <div className="card large-card">
        {errorMsg && <div className="error-box">{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          {/* Basic Details */}
          <div className="section-header">
            <h3>Basic Job Information</h3>
          </div>

          <div className="field">
            <label htmlFor="title">Job Title</label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="e.g. Senior Frontend Developer"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div className="grid2">
            <div className="field">
              <label htmlFor="department">Department</label>
              <select
                id="department"
                name="department"
                required
                value={formData.department}
                onChange={handleChange}
              >
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                name="location"
                type="text"
                required
                placeholder="e.g. Bangalore, Karnataka / Remote"
                value={formData.location}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="description">Job Description</label>
            <textarea
              id="description"
              name="description"
              rows="4"
              required
              placeholder="Describe roles, responsibilities, and team context..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <hr style={{ border: '0', borderTop: '1px solid var(--border)', margin: '20px 0' }} />

          {/* Skills & Experience */}
          <div className="section-header">
            <h3>Skills & Requirements</h3>
          </div>

          {/* Mandatory Skills */}
          <div className="field">
            <label htmlFor="mandatoryInput">Mandatory Skills</label>
            <div className="flex-row" style={{ gap: '8px' }}>
              <input
                id="mandatoryInput"
                name="mandatoryInput"
                type="text"
                placeholder="Type a mandatory skill and press Enter..."
                value={formData.mandatoryInput}
                onChange={handleChange}
                onKeyDown={handleMandatoryKeyDown}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={addMandatorySkill}
                style={{ flexShrink: 0 }}
              >
                + Add
              </button>
            </div>
          </div>

          {formData.mandatorySkills.length > 0 && (
            <div className="tag-row">
              {formData.mandatorySkills.map((tag) => (
                <span
                  key={tag}
                  className="tag"
                  style={{ cursor: 'pointer' }}
                  onClick={() => removeMandatorySkill(tag)}
                  title="Click to remove tag"
                >
                  {tag} ×
                </span>
              ))}
            </div>
          )}

          {/* Required / Secondary Skills */}
          <div className="field">
            <label htmlFor="requiredInput">Nice-to-Have / Optional Skills</label>
            <div className="flex-row" style={{ gap: '8px' }}>
              <input
                id="requiredInput"
                name="requiredInput"
                type="text"
                placeholder="Type a skill and press Enter..."
                value={formData.requiredInput}
                onChange={handleChange}
                onKeyDown={handleRequiredKeyDown}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={addRequiredSkill}
                style={{ flexShrink: 0 }}
              >
                + Add
              </button>
            </div>
          </div>

          {formData.requiredSkills.length > 0 && (
            <div className="tag-row">
              {formData.requiredSkills.map((tag) => (
                <span
                  key={tag}
                  className="tag"
                  style={{ cursor: 'pointer', background: '#f1f5f9', color: '#475569' }}
                  onClick={() => removeRequiredSkill(tag)}
                  title="Click to remove tag"
                >
                  {tag} ×
                </span>
              ))}
            </div>
          )}

          <div className="grid2">
            <div className="field">
              <label htmlFor="minExp">Min Experience (Years)</label>
              <input
                id="minExp"
                name="minExp"
                type="number"
                min="0"
                required
                value={formData.minExp}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="dueDate">Target Fill Date / Due Date</label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                required
                value={formData.dueDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <hr style={{ border: '0', borderTop: '1px solid var(--border)', margin: '20px 0' }} />

          {/* Compensation */}
          <div className="section-header">
            <h3>Allocated CTC Range</h3>
          </div>

          <div className="grid2">
            <div className="field">
              <label htmlFor="minSalary">Min CTC (LPA)</label>
              <input
                id="minSalary"
                name="minSalary"
                type="number"
                min="0"
                required
                placeholder="e.g. 80000"
                value={formData.minSalary}
                onChange={handleChange}
              />
            </div>
            <div className="field">
              <label htmlFor="maxSalary">Max CTC (LPA)</label>
              <input
                id="maxSalary"
                name="maxSalary"
                type="number"
                min="0"
                required
                placeholder="e.g. 120000"
                value={formData.maxSalary}
                onChange={handleChange}
              />
            </div>
          </div>

          <hr style={{ border: '0', borderTop: '1px solid var(--border)', margin: '20px 0' }} />

          {/* Interview Setup */}
          <div className="section-header">
            <h3>Interview Configuration</h3>
          </div>

          <div className="field">
            <label htmlFor="interviewMode">Interview Mode</label>
            <select
              id="interviewMode"
              name="interviewMode"
              value={formData.interviewMode}
              onChange={handleChange}
            >
              <option value="Video Interview (IncVid)">Video Interview (IncVid)</option>
              <option value="AI Interview (IncBot)">AI Interview (IncBot)</option>
            </select>
          </div>

          <div className="info-box">
            ✨ AI interview questions will be automatically tailored based on the provided Job Description and skills.
          </div>

          {/* Bottom Action Bar */}
          <div className="inline-actions end" style={{ marginTop: '28px' }}>
            <Link to="/jobs" className="btn btn-ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? 'Publishing...' : '🚀 Publish Job'}
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  )
}

export default PostJobPage
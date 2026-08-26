import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus } from "lucide-react"

const PlusIcon = (props) => <Plus {...props} />

function QuickNav({ currentPath }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const items = [
    ['Login', '/login'],
    ['Forgot Password', '/forgot-password'],
    ['Reset Sent', '/reset-sent'],
    ['Sign Up', '/signup'],
    ['Dashboard', '/dashboard'],
    ['Job Openings', '/jobs'],
    ['Candidates', '/candidates'],
    ['Interviews', '/interviews'],
    ['Offer Letters', '/offers'],
  ]
  return (
    <div className="qnav">
      <div className={`qnav-panel ${open ? 'open' : ''}`}>
        {items.map(([label, path]) => (
          <button key={path} type="button" className={`qnav-item ${currentPath === path ? 'cur' : ''}`} onClick={() => { navigate(path); setOpen(false) }}>
            {label}
          </button>
        ))}
      </div>
      <button type="button" className="qnav-btn" onClick={() => setOpen((prev) => !prev)}><PlusIcon size={18} /></button>
    </div>
  )
}

export default QuickNav
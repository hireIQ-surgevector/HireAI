// import PageShell from './PageShell'
// import { Upload } from 'lucide-react'

// const UploadIcon = (props) => <Upload {...props} />

// function UploadResumePage() {
//   return (
//     <PageShell title="AI Resume Screening & ATS" active="candidates" backTo="/candidates">
//       <div className="card large-card">
//         <h3>Upload Resumes</h3>
//         <div className="upload-zone">
//           <UploadIcon size={32} style={{ marginBottom: '8px' }} />
//           <p style={{ fontWeight: 600, color: 'var(--text)' }}>Drag & Drop Resumes Here</p>
//           <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Supports PDF, DOCX, or TXT</span>
//         </div>
//         <button type="button" className="btn btn-primary full-width btn-lg">
//           ✨ Run AI Screening
//         </button>
//       </div>
//     </PageShell>
//   )
// }

// export default UploadResumePage

import { useRef, useState } from 'react'
import PageShell from './PageShell'
import { Upload, FileText, X } from 'lucide-react'

function UploadResumePage() {
  const fileInputRef = useRef(null)
  const [selectedFiles, setSelectedFiles] = useState([])

  // Trigger browser file picker
  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  // Handle selected files
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files])
    }
  }

  // Drag and drop handlers
  const handleDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files])
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  // Remove a selected file
  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <PageShell title="AI Resume Screening & ATS" active="candidates" backTo="/candidates">
      <div className="card large-card">
        <h3>Upload Resumes</h3>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept=".pdf,.docx,.doc,.txt"
          style={{ display: 'none' }}
        />

        {/* Dropzone Container */}
        <div
          className="upload-zone"
          onClick={handleBrowseClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{ cursor: 'pointer' }}
        >
          <Upload size={36} style={{ marginBottom: '10px', color: 'var(--brand)' }} />
          <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
            Drag & Drop Resumes Here
          </p>
          <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '14px' }}>
            Supports PDF, DOCX, or TXT
          </span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); handleBrowseClick(); }}>
            Browse Files
          </button>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div style={{ marginTop: '16px', marginBottom: '16px' }}>
            <label style={{ marginBottom: '8px' }}>
              Selected Files ({selectedFiles.length})
            </label>
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="list-row" style={{ justifyContent: 'space-between' }}>
                <div className="flex-row">
                  <FileText size={18} style={{ color: 'var(--brand)' }} />
                  <div>
                    <div className="list-title">{file.name}</div>
                    <div className="list-sub">{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => removeFile(index)}
                  style={{ padding: '4px', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          className="btn btn-primary full-width btn-lg"
          disabled={selectedFiles.length === 0}
          style={{ opacity: selectedFiles.length === 0 ? 0.6 : 1 }}
        >
          ✨ Run AI Screening {selectedFiles.length > 0 && `(${selectedFiles.length})`}
        </button>
      </div>
    </PageShell>
  )
}

export default UploadResumePage
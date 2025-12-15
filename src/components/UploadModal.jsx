// src/components/UploadModal.jsx
import React from 'react'
import UploadPost from '../pages/UploadPost'
import './UploadModal.css'

export default function UploadModal({ isOpen, onClose, user, functionUrl, onPostCreated }) {
  if (!isOpen) return null

  return (
    <div className="upload-modal-overlay" onClick={onClose}>
      <div className="upload-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="upload-modal-header">
          <h2>Share Your Good Deed</h2>
          <button className="upload-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="upload-modal-body">
          <UploadPost 
            user={user} 
            functionUrl={functionUrl} 
            onPostCreated={() => {
              if (onPostCreated) onPostCreated()
              onClose()
            }} 
          />
        </div>
      </div>
    </div>
  )
}


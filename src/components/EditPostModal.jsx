// src/components/EditPostModal.jsx
import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './EditPostModal.css'

export default function EditPostModal({ isOpen, onClose, post, onPostUpdated }) {
  const [caption, setCaption] = useState(post?.caption || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  async function handleUpdate(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error: updateError } = await supabase
        .from('posts')
        .update({ caption })
        .eq('id', post.id)
      if (updateError) {
        setError(updateError.message)
      } else {
        onPostUpdated?.()
        onClose()
      }
    } catch (err) {
      setError('Failed to update post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="edit-post-modal-overlay" onClick={onClose}>
      <div className="edit-post-modal-content" onClick={e => e.stopPropagation()}>
        <div className="edit-post-modal-header">
          <h3>Edit Post</h3>
          <button className="edit-post-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleUpdate} className="edit-post-form">
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            rows={3}
            className="edit-post-input"
            placeholder="Edit your caption..."
            disabled={loading}
          />
          <div className="edit-post-modal-actions">
            <button type="button" onClick={onClose} className="edit-post-modal-cancel">Cancel</button>
            <button type="submit" className="edit-post-modal-save" disabled={loading || !caption.trim()}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
          {error && <div className="edit-post-modal-error">{error}</div>}
        </form>
      </div>
    </div>
  )
}


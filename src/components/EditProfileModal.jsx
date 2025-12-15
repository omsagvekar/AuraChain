// src/components/EditProfileModal.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import './EditProfileModal.css'

export default function EditProfileModal({ isOpen, onClose, profile, onUpdated }) {
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setDisplayName(profile?.display_name || '')
    setBio(profile?.bio || '')
  }, [profile])

  if (!isOpen) return null

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const updates = {
        display_name: displayName.trim(),
        bio: bio.trim()
      }
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)
      if (updateError) {
        setError(updateError.message)
      } else {
        onUpdated?.()
        onClose()
      }
    } catch (err) {
      setError('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="edit-profile-overlay" onClick={onClose}>
      <div className="edit-profile-modal" onClick={e => e.stopPropagation()}>
        <div className="edit-profile-header">
          <h3>Edit Profile</h3>
          <button className="edit-profile-close" onClick={onClose}>✕</button>
        </div>
        <form className="edit-profile-form" onSubmit={handleSave}>
          <label className="edit-profile-label">
            Display Name
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              maxLength={60}
              required
            />
          </label>
          <label className="edit-profile-label">
            Bio
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={240}
              rows={3}
              placeholder="Tell others about your good deeds..."
            />
          </label>
          {error && <div className="edit-profile-error">{error}</div>}
          <div className="edit-profile-actions">
            <button type="button" className="edit-profile-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="edit-profile-save" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


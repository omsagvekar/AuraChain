// src/pages/UploadPost.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import './UploadPost.css'

export default function UploadPost({ user, functionUrl, onPostCreated }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [authUserId, setAuthUserId] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(r => {
      const uid = r.data?.session?.user?.id ?? null
      setAuthUserId(uid)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUserId(session?.user?.id ?? null)
    })
    return () => listener?.subscription?.unsubscribe?.()
  }, [])

  useEffect(() => {
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }, [file])

  function handleFileChange(e) {
    const chosen = e.target.files?.[0]
    if (!chosen) {
      setFile(null)
      setPreview(null)
      return
    }
    const maxSize = 256 * 1024 // 256 KB
    if (chosen.size > maxSize) {
      setStatus('Please select an image under 256 KB.')
      e.target.value = ''
      setFile(null)
      setPreview(null)
      return
    }
    setStatus('')
    setFile(chosen)
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) return setStatus('Please choose an image first')
    if (!authUserId) return setStatus('Not authenticated yet. Try reloading.')
    if (authUserId !== user.id) {
      return setStatus('Auth mismatch: please login again.')
    }

    setStatus('')
    setLoading(true)

    const path = `${user.id}/${Date.now()}_${file.name}`

    const { data: uploadData, error: uploadErr } = await supabase
      .storage
      .from('post-images')
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (uploadErr) {
      console.error('uploadErr', uploadErr)
      setStatus('Upload failed: ' + uploadErr.message)
      setLoading(false)
      return
    }

    const { data: postData, error: postErr } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        image_path: path,
        caption,
        verdict: 'processing',
        aura_points: 0
      })
      .select()
      .single()

    if (postErr) {
      console.error('postErr', postErr)
      setStatus('Failed to create post: ' + postErr.message)
      setLoading(false)
      return
    }

    // Award +5 aura points for post creation
    const { awardPostCreationPoints } = await import('../lib/auraService')
    await awardPostCreationPoints(postData.id, user.id)

    setStatus('Processing your good deed...')
    
    try {
      if (functionUrl) {
        const resp = await fetch(functionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: postData.id })
        })
        const json = await resp.json()
        console.log('Processing response:', json)
      }
      
      setStatus('success')
      setFile(null)
      setPreview(null)
      setCaption('')
      
      // Reset file input
      const fileInput = document.getElementById('post-image-input')
      if (fileInput) fileInput.value = ''
      
      // Callback to refresh posts
      if (onPostCreated) {
        setTimeout(() => {
          onPostCreated()
          setStatus('')
        }, 1000)
      } else {
        setTimeout(() => setStatus(''), 2000)
      }
    } catch (e) {
      console.error('process call error', e)
      setStatus('Post created! Processing may take a moment.')
      setFile(null)
      setPreview(null)
      setCaption('')
      if (onPostCreated) {
        setTimeout(() => {
          onPostCreated()
          setStatus('')
        }, 1000)
      }
    }
    
    setLoading(false)
  }

  return (
    <div className="upload-post-card card fade-in">
      <div className="upload-header">
        <h3>Share Your Good Deed</h3>
        <p className="upload-subtitle">Upload an image and describe what you did</p>
      </div>

      <form onSubmit={handleUpload} className="upload-form">
        <div className="file-upload-area">
          {preview ? (
            <div className="image-preview">
              <img src={preview} alt="Preview" />
              <button
                type="button"
                className="remove-image"
                onClick={() => {
                  setFile(null)
                  setPreview(null)
                  const fileInput = document.getElementById('post-image-input')
                  if (fileInput) fileInput.value = ''
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <label htmlFor="post-image-input" className="file-upload-label">
              <div className="upload-icon">📸</div>
              <div className="upload-text">
                <span className="upload-text-main">Click to upload image</span>
                <span className="upload-text-sub">or drag and drop (max 256 KB)</span>
              </div>
              <input
                id="post-image-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
                disabled={loading}
              />
            </label>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="post-caption">Caption (optional)</label>
          <textarea
            id="post-caption"
            placeholder="Describe your good deed..."
            value={caption}
            onChange={e => setCaption(e.target.value)}
            rows={3}
            disabled={loading}
          />
        </div>

        <button type="submit" disabled={loading || !file} className="upload-button">
          {loading ? (
            <>
              <span className="button-spinner"></span>
              Uploading...
            </>
          ) : (
            <>
              <span>✨</span>
              Share Good Deed
            </>
          )}
        </button>

        {status && status !== 'success' && (
          <div className={`upload-status ${status.includes('failed') || status.includes('Error') ? 'error' : 'info'}`}>
            {status}
          </div>
        )}

        {status === 'success' && (
          <div className="upload-status success">
            ✓ Post created successfully!
          </div>
        )}
      </form>
    </div>
  )
}

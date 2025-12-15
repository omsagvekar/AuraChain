// src/pages/PostCard.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import './PostCard.css'

export default function PostCard({ post, currentUserId }) {
  const [imageUrl, setImageUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const profile = post.profiles || {}

  useEffect(() => {
    if (post.image_path) {
      loadImage()
    } else {
      setLoading(false)
    }
  }, [post.image_path])

  async function loadImage() {
    try {
      setLoading(true)
      setImageError(false)
      
      // First try to get public URL
      const { data: publicData } = supabase
        .storage
        .from('post-images')
        .getPublicUrl(post.image_path)
      
      if (publicData?.publicUrl) {
        // Test if the public URL is accessible
        const testImg = new Image()
        testImg.onload = () => {
          setImageUrl(publicData.publicUrl)
          setLoading(false)
        }
        testImg.onerror = async () => {
          // If public URL fails, try signed URL
          console.log('Public URL failed, trying signed URL...')
          try {
            const { data: signedData, error: signedError } = await supabase
              .storage
              .from('post-images')
              .createSignedUrl(post.image_path, 3600) // 1 hour expiry
            
            if (!signedError && signedData?.signedUrl) {
              setImageUrl(signedData.signedUrl)
            } else {
              console.error('Signed URL error:', signedError)
              setImageError(true)
            }
          } catch (err) {
            console.error('Error creating signed URL:', err)
            setImageError(true)
          }
          setLoading(false)
        }
        testImg.src = publicData.publicUrl
      } else {
        // Try signed URL if public URL is not available
        const { data: signedData, error: signedError } = await supabase
          .storage
          .from('post-images')
          .createSignedUrl(post.image_path, 3600)
        
        if (!signedError && signedData?.signedUrl) {
          setImageUrl(signedData.signedUrl)
        } else {
          console.error('Error getting image URL:', signedError)
          setImageError(true)
        }
        setLoading(false)
      }
    } catch (error) {
      console.error('Error loading image:', error)
      setImageError(true)
      setLoading(false)
    }
  }

  const displayName = profile?.display_name || 'Anonymous'
  const isOwnPost = post.user_id === currentUserId
  const verdictColor = {
    'approved': 'success',
    'rejected': 'error',
    'processing': 'warning'
  }[post.verdict] || 'warning'

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <article className={`post-card card fade-in ${isOwnPost ? 'own-post' : ''}`}>
      <div className="post-header">
        <div className="post-author">
          <div className="author-avatar">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} />
            ) : (
              <div className="avatar-placeholder">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="author-info">
            <div className="author-name">{displayName}</div>
            <div className="post-date">{formatDate(post.created_at)}</div>
          </div>
        </div>
        {isOwnPost && (
          <span className="own-badge">You</span>
        )}
      </div>

      {imageUrl && (
        <div className="post-image-container">
          {loading ? (
            <div className="image-loading">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <img src={imageUrl} alt={post.caption || 'Good deed'} className="post-image" />
          )}
        </div>
      )}

      {post.caption && (
        <div className="post-caption">
          {post.caption}
        </div>
      )}

      <div className="post-footer">
        <div className="post-verdict">
          <span className={`verdict-badge ${verdictColor}`}>
            {post.verdict === 'processing' && '⏳'}
            {post.verdict === 'approved' && '✓'}
            {post.verdict === 'rejected' && '✗'}
            {post.verdict || 'processing'}
          </span>
        </div>
        <div className="post-aura">
          <span className="aura-icon">✨</span>
          <span className="aura-points">{post.aura_points || 0}</span>
          <span className="aura-label">Aura Points</span>
        </div>
      </div>
    </article>
  )
}


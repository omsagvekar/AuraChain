// src/components/FeedPostCard.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { boostPost, unboostPost, sharePost, getPostEngagement } from '../lib/auraService'
import CommentModal from './CommentModal'
import './FeedPostCard.css'

export default function FeedPostCard({ post, currentUserId, onEngagementChange }) {
  const [imageUrl, setImageUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [engagement, setEngagement] = useState({ boosts: 0, comments: 0, shares: 0, hasBoosted: false })
  const [boosting, setBoosting] = useState(false)
  const [commentModalOpen, setCommentModalOpen] = useState(false)
  const profile = post.profiles || {}

  useEffect(() => {
    if (post.image_path) {
      loadImage()
    } else {
      setLoading(false)
    }
    loadEngagement()
  }, [post.id, currentUserId])

  async function loadImage() {
    try {
      setLoading(true)
      setImageError(false)
      
      const { data: publicData } = supabase
        .storage
        .from('post-images')
        .getPublicUrl(post.image_path)
      
      if (publicData?.publicUrl) {
        const testImg = new Image()
        testImg.onload = () => {
          setImageUrl(publicData.publicUrl)
          setLoading(false)
        }
        testImg.onerror = async () => {
          try {
            const { data: signedData, error: signedError } = await supabase
              .storage
              .from('post-images')
              .createSignedUrl(post.image_path, 3600)
            
            if (!signedError && signedData?.signedUrl) {
              setImageUrl(signedData.signedUrl)
            } else {
              setImageError(true)
            }
          } catch (err) {
            setImageError(true)
          }
          setLoading(false)
        }
        testImg.src = publicData.publicUrl
      } else {
        const { data: signedData, error: signedError } = await supabase
          .storage
          .from('post-images')
          .createSignedUrl(post.image_path, 3600)
        
        if (!signedError && signedData?.signedUrl) {
          setImageUrl(signedData.signedUrl)
        } else {
          setImageError(true)
        }
        setLoading(false)
      }
    } catch (error) {
      setImageError(true)
      setLoading(false)
    }
  }

  async function loadEngagement() {
    if (!post.id) return
    const data = await getPostEngagement(post.id, currentUserId)
    setEngagement(data)
  }

  async function handleBoost() {
    if (boosting || !currentUserId) return
    if (post.user_id === currentUserId) {
      alert('You cannot boost your own post')
      return
    }

    setBoosting(true)
    const result = engagement.hasBoosted
      ? await unboostPost(post.id, currentUserId, post.user_id)
      : await boostPost(post.id, currentUserId, post.user_id)

    setBoosting(false)

    if (result.success) {
      await loadEngagement()
      if (onEngagementChange) {
        onEngagementChange()
      }
    } else {
      // Show user-friendly error message
      const errorMsg = result.error || 'Failed to boost post'
      console.error('Boost error:', errorMsg)
      
      // Check if it's a database setup issue
      if (errorMsg.includes('table not found') || errorMsg.includes('AURA_SYSTEM_SCHEMA')) {
        alert(`Database setup required:\n\n${errorMsg}\n\nPlease create the required tables in Supabase. See AURA_SYSTEM_SCHEMA.md for instructions.`)
      } else {
        alert(errorMsg)
      }
    }
  }

  async function handleShare() {
    if (!currentUserId) return

    // Try native share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this good deed on Aura',
          text: post.caption || 'A good deed shared on Aura',
          url: window.location.href
        })
        // Record share after successful native share
        await sharePost(post.id, currentUserId, post.user_id)
      } catch (err) {
        if (err.name !== 'AbortError') {
          // User cancelled or error - still record share
          await sharePost(post.id, currentUserId, post.user_id)
        }
      }
    } else {
      // Fallback: copy to clipboard and record share
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
        await sharePost(post.id, currentUserId, post.user_id)
      } catch (err) {
        console.error('Failed to copy:', err)
        // Still record share
        await sharePost(post.id, currentUserId, post.user_id)
      }
    }

    await loadEngagement()
    if (onEngagementChange) {
      onEngagementChange()
    }
  }

  function handleComment() {
    setCommentModalOpen(true)
  }

  function handleCommentAdded() {
    loadEngagement()
    if (onEngagementChange) {
      onEngagementChange()
    }
  }

  const displayName = profile?.display_name || 'Anonymous'
  const isOwnPost = post.user_id === currentUserId
  const verdictColor = {
    'approved': 'success',
    'rejected': 'error',
    'processing': 'warning'
  }[post.verdict] || 'warning'

  // Calculate total aura from this post
  const postAura = post.aura_points || 0
  const engagementAura = (engagement.boosts * 2) + (engagement.comments * 3) + (engagement.shares * 4)
  const totalAuraFromPost = postAura + engagementAura

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
    <>
      <article className={`feed-post-card ${isOwnPost ? 'own-post' : ''}`}>
        <div className="feed-post-header">
          <div className="feed-post-author">
            <div className="feed-author-avatar">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} />
              ) : (
                <div className="avatar-placeholder">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="feed-author-info">
              <div className="feed-author-name">{displayName}</div>
              <div className="feed-post-date">{formatDate(post.created_at)}</div>
            </div>
          </div>
          {isOwnPost && (
            <span className="feed-own-badge">You</span>
          )}
        </div>

        {post.image_path && (
          <div className="feed-post-image-container">
            {loading ? (
              <div className="feed-image-loading">
                <div className="loading-spinner"></div>
              </div>
            ) : imageError ? (
              <div className="feed-image-error">
                <div className="error-icon">🖼️</div>
                <p>Image unavailable</p>
              </div>
            ) : imageUrl ? (
              <img 
                src={imageUrl} 
                alt={post.caption || 'Good deed'} 
                className="feed-post-image"
                onError={() => setImageError(true)}
              />
            ) : null}
          </div>
        )}

        {post.caption && (
          <div className="feed-post-caption">
            {post.caption}
          </div>
        )}

        <div className="feed-post-footer">
          <div className="feed-post-status">
            <span className={`feed-verdict-badge ${verdictColor}`}>
              {post.verdict === 'processing' && '⏳'}
              {post.verdict === 'approved' && '✓'}
              {post.verdict === 'rejected' && '✗'}
              {post.verdict || 'processing'}
            </span>
            {totalAuraFromPost > 0 && (
              <span className="feed-aura-points" title={`${postAura} from post + ${engagementAura} from engagement`}>
                <span className="aura-icon">✨</span>
                {totalAuraFromPost} Aura
              </span>
            )}
          </div>

          <div className="feed-post-actions">
            <button 
              className={`feed-action-btn ${engagement.hasBoosted ? 'active' : ''}`}
              onClick={handleBoost}
              disabled={boosting || isOwnPost}
              title={isOwnPost ? "Cannot boost your own post" : engagement.hasBoosted ? "Remove boost" : "Boost this post"}
            >
              <span className="action-icon">{engagement.hasBoosted ? '🚀' : '⚡'}</span>
              <span className="action-label">Boost</span>
              {engagement.boosts > 0 && (
                <span className="action-count">{engagement.boosts}</span>
              )}
            </button>
            <button 
              className="feed-action-btn"
              onClick={handleComment}
              title="View and add comments"
            >
              <span className="action-icon">💬</span>
              <span className="action-label">Comment</span>
              {engagement.comments > 0 && (
                <span className="action-count">{engagement.comments}</span>
              )}
            </button>
            <button 
              className="feed-action-btn"
              onClick={handleShare}
              title="Share this post"
            >
              <span className="action-icon">🔗</span>
              <span className="action-label">Share</span>
              {engagement.shares > 0 && (
                <span className="action-count">{engagement.shares}</span>
              )}
            </button>
          </div>
        </div>
      </article>

      <CommentModal
        isOpen={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        post={post}
        currentUserId={currentUserId}
        onCommentAdded={handleCommentAdded}
      />
    </>
  )
}

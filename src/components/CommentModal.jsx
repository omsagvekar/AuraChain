// src/components/CommentModal.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { addComment } from '../lib/auraService'
import './CommentModal.css'

export default function CommentModal({ isOpen, onClose, post, currentUserId, onCommentAdded }) {
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(true)

  useEffect(() => {
    if (isOpen && post) {
      fetchComments()
    }
  }, [isOpen, post])

  async function fetchComments() {
    if (!post) return
    
    setLoadingComments(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching comments:', error)
      } else if (data) {
        setComments(data)
      }
    } catch (error) {
      console.error('Error in fetchComments:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!comment.trim() || loading) return

    setLoading(true)
    const result = await addComment(post.id, currentUserId, comment, post.user_id)
    setLoading(false)

    if (result.success) {
      setComment('')
      await fetchComments()
      if (onCommentAdded) {
        onCommentAdded()
      }
    } else {
      alert(result.error || 'Failed to add comment')
    }
  }

  if (!isOpen) return null

  return (
    <div className="comment-modal-overlay" onClick={onClose}>
      <div className="comment-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="comment-modal-header">
          <h3>Comments</h3>
          <button className="comment-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="comment-modal-body">
          {loadingComments ? (
            <div className="comment-loading">
              <div className="loading-spinner-small"></div>
              <p>Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="comment-empty">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="comments-list">
              {comments.map(c => (
                <div key={c.id} className="comment-item">
                  <div className="comment-avatar">
                    {c.profiles?.avatar_url ? (
                      <img src={c.profiles.avatar_url} alt={c.profiles.display_name} />
                    ) : (
                      <div className="avatar-placeholder-small">
                        {c.profiles?.display_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div className="comment-content">
                    <div className="comment-author">
                      {c.profiles?.display_name || 'Anonymous'}
                    </div>
                    <div className="comment-text">{c.body || c.content}</div>
                    <div className="comment-date">
                      {new Date(c.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form className="comment-form" onSubmit={handleSubmit}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
            disabled={loading}
            className="comment-input"
          />
          <button type="submit" disabled={loading || !comment.trim()} className="comment-submit">
            {loading ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      </div>
    </div>
  )
}


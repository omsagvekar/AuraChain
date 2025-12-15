// src/components/HomeFeed.jsx
import React from 'react'
import FeedPostCard from './FeedPostCard'
import './HomeFeed.css'

export default function HomeFeed({ posts, currentUserId, loading }) {
  if (loading) {
    return (
      <div className="home-feed">
        <div className="feed-loading">
          <div className="loading-spinner"></div>
          <p>Loading good deeds...</p>
        </div>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="home-feed">
        <div className="feed-empty-state">
          <div className="empty-icon">🌟</div>
          <h3>No posts yet</h3>
          <p>Be the first to share a good deed and spread positivity!</p>
          <p className="empty-subtitle">Your good deeds inspire others to do the same.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="home-feed">
      <div className="feed-header">
        <h2 className="feed-title">Good Deeds Feed</h2>
        <p className="feed-subtitle">Inspiring acts of kindness from our community</p>
      </div>
      
      <div className="feed-posts">
        {posts.map(post => (
          <FeedPostCard 
            key={post.id} 
            post={post} 
            currentUserId={currentUserId}
            onEngagementChange={() => {
              // Optional: Refresh feed when engagement changes
              // This can be passed from parent component if needed
            }}
          />
        ))}
      </div>
    </div>
  )
}


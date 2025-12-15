// src/components/ExplorePage.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import FeedPostCard from './FeedPostCard'
import './ExplorePage.css'

export default function ExplorePage({ currentUserId }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all') // all, verified, high-aura, recent

  useEffect(() => {
    fetchExplorePosts()
  }, [filter])

  async function fetchExplorePosts() {
    setLoading(true)
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles (
            id,
            display_name,
            avatar_url
          )
        `)

      // Apply filters (UI only - actual filtering can be added later)
      if (filter === 'verified') {
        query = query.eq('verdict', 'approved')
      } else if (filter === 'high-aura') {
        query = query.gt('aura_points', 10)
      }
      // 'recent' and 'all' use default ordering

      query = query.order('created_at', { ascending: false }).limit(50)

      const { data, error } = await query

      if (error) {
        console.error('Error fetching explore posts:', error)
        // Fallback to simple fetch
        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
        
        if (postsData) {
          setPosts(postsData)
        }
      } else if (data) {
        setPosts(data)
      }
    } catch (error) {
      console.error('Error in fetchExplorePosts:', error)
    } finally {
      setLoading(false)
    }
  }

  // TODO: Implement search functionality
  function handleSearch(e) {
    e.preventDefault()
    setSearchQuery(e.target.value)
    // Future: Filter posts by search query
    console.log('Search query:', e.target.value)
  }

  // Filter posts by search query (client-side for now)
  const filteredPosts = posts.filter(post => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const caption = (post.caption || '').toLowerCase()
    const displayName = (post.profiles?.display_name || '').toLowerCase()
    return caption.includes(query) || displayName.includes(query)
  })

  return (
    <div className="explore-page">
      <div className="explore-header">
        <h2 className="explore-title">Explore</h2>
        <p className="explore-subtitle">Discover good deeds from the community</p>
      </div>

      <div className="explore-controls">
        <form className="explore-search" onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder="Search by username or caption..."
            value={searchQuery}
            onChange={handleSearch}
            className="search-input"
          />
          <button type="submit" className="search-button">
            🔍
          </button>
        </form>

        <div className="explore-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === 'verified' ? 'active' : ''}`}
            onClick={() => setFilter('verified')}
          >
            ✓ Verified
          </button>
          <button
            className={`filter-btn ${filter === 'high-aura' ? 'active' : ''}`}
            onClick={() => setFilter('high-aura')}
          >
            ✨ High Aura
          </button>
          <button
            className={`filter-btn ${filter === 'recent' ? 'active' : ''}`}
            onClick={() => setFilter('recent')}
          >
            🕐 Recent
          </button>
        </div>
      </div>

      {loading ? (
        <div className="explore-loading">
          <div className="loading-spinner"></div>
          <p>Loading posts...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="explore-empty">
          <div className="empty-icon">🔍</div>
          <h3>No posts found</h3>
          <p>
            {searchQuery 
              ? `No posts match "${searchQuery}"` 
              : 'No posts available yet'}
          </p>
        </div>
      ) : (
        <div className="explore-posts">
          {filteredPosts.map(post => (
            <FeedPostCard 
              key={post.id} 
              post={post} 
              currentUserId={currentUserId} 
            />
          ))}
        </div>
      )}
    </div>
  )
}


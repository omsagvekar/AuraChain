// src/components/ExplorePage.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import './ExplorePage.css'

export default function ExplorePage({ currentUserId, onProfileSelect }) {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all') // all, high-aura, recent

  useEffect(() => {
    fetchProfiles()
  }, [filter])

  async function fetchProfiles() {
    setLoading(true)
    try {
      let query = supabase
        .from('profiles')
        .select('id, display_name, avatar_url, bio, aura_score, created_at')
        .limit(60)

      if (filter === 'high-aura') {
        query = query.order('aura_score', { ascending: false })
      } else if (filter === 'recent') {
        query = query.order('created_at', { ascending: false })
      } else {
        query = query.order('aura_score', { ascending: false })
      }

      const { data, error } = await query
      if (error) {
        console.error('Error fetching profiles:', error)
      } else if (data) {
        setProfiles(data)
      }
    } catch (error) {
      console.error('Error in fetchProfiles:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    setSearchQuery(e.target.value)
  }

  const filteredProfiles = profiles.filter(p => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (p.display_name || '').toLowerCase().includes(q) || (p.bio || '').toLowerCase().includes(q)
  })

  return (
    <div className="explore-page">
      <div className="explore-header">
        <h2 className="explore-title">Explore Profiles</h2>
        <p className="explore-subtitle">Find inspiring people and their aura journeys</p>
      </div>

      <div className="explore-controls">
        <form className="explore-search" onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder="Search by username or bio..."
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
          <p>Loading profiles...</p>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="explore-empty">
          <div className="empty-icon">🔍</div>
          <h3>No profiles found</h3>
          <p>
            {searchQuery 
              ? `No profiles match "${searchQuery}"` 
              : 'No profiles available yet'}
          </p>
        </div>
      ) : (
        <div className="explore-profiles-grid">
          {filteredProfiles.map(profile => (
            <div
              key={profile.id}
              className="profile-card"
              onClick={() => onProfileSelect && onProfileSelect(profile.id)}
            >
              <div className="profile-card-avatar">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.display_name || 'User'} />
                ) : (
                  <div className="avatar-placeholder-small">
                    {(profile.display_name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="profile-card-info">
                <div className="profile-card-name">{profile.display_name || 'User'}</div>
                <div className="profile-card-aura">✨ {profile.aura_score || 0} Aura</div>
                {profile.bio && <p className="profile-card-bio">{profile.bio}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


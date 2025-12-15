// src/components/ContextPanel.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import './ContextPanel.css'

export default function ContextPanel({ currentUserId }) {
  const [topUsers, setTopUsers] = useState([])
  const [recentDeeds, setRecentDeeds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTopUsers()
    fetchRecentDeeds()
  }, [])

  async function fetchTopUsers() {
    try {
      // Fetch top users by aura_score from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, aura_score')
        .gt('aura_score', 0)
        .order('aura_score', { ascending: false })
        .limit(5)

      if (error) {
        console.error('Error fetching top users:', error)
        // Fallback: calculate from posts if aura_score column doesn't exist
        return fetchTopUsersFallback()
      }

      if (data) {
        setTopUsers(data.map(user => ({
          id: user.id,
          display_name: user.display_name || 'Anonymous',
          avatar_url: user.avatar_url || '',
          totalAura: user.aura_score || 0
        })))
      }
    } catch (error) {
      console.error('Error in fetchTopUsers:', error)
      fetchTopUsersFallback()
    }
  }

  async function fetchTopUsersFallback() {
    // Fallback: calculate from posts
    try {
      const { data: posts } = await supabase
        .from('posts')
        .select('user_id, aura_points, profiles!inner(id, display_name, avatar_url)')
        .eq('verdict', 'approved')
        .limit(100)

      if (posts) {
        const userAuraMap = {}
        posts.forEach(post => {
          const userId = post.user_id
          if (!userAuraMap[userId]) {
            userAuraMap[userId] = {
              id: userId,
              display_name: post.profiles?.display_name || 'Anonymous',
              avatar_url: post.profiles?.avatar_url || '',
              totalAura: 0
            }
          }
          userAuraMap[userId].totalAura += post.aura_points || 0
        })

        const sortedUsers = Object.values(userAuraMap)
          .sort((a, b) => b.totalAura - a.totalAura)
          .slice(0, 5)

        setTopUsers(sortedUsers)
      }
    } catch (error) {
      console.error('Error in fetchTopUsersFallback:', error)
    }
  }

  async function fetchRecentDeeds() {
    try {
      const { data } = await supabase
        .from('posts')
        .select(`
          id,
          caption,
          created_at,
          profiles!inner(display_name)
        `)
        .eq('verdict', 'approved')
        .order('created_at', { ascending: false })
        .limit(5)

      if (data) {
        setRecentDeeds(data)
      }
    } catch (error) {
      console.error('Error fetching recent deeds:', error)
    } finally {
      setLoading(false)
    }
  }

  const motivationalMessages = [
    "Every small act of kindness creates ripples of positivity 🌊",
    "Your good deeds inspire others to do the same ✨",
    "Together, we're building a more compassionate world 💙",
    "Kindness is contagious - keep spreading it! 🌟"
  ]

  const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]

  return (
    <aside className="context-panel">
      <div className="context-section">
        <h3 className="context-title">💡 Inspiration</h3>
        <p className="context-message">{randomMessage}</p>
      </div>

      <div className="context-section">
        <h3 className="context-title">⭐ Top Aura Users</h3>
        {loading ? (
          <div className="context-loading">
            <div className="loading-spinner-small"></div>
          </div>
        ) : topUsers.length === 0 ? (
          <p className="context-empty">No users yet</p>
        ) : (
          <div className="top-users-list">
            {topUsers.map((user, index) => (
              <div key={user.id} className="top-user-item">
                <div className="top-user-rank">#{index + 1}</div>
                <div className="top-user-avatar">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.display_name} />
                  ) : (
                    <div className="avatar-placeholder-small">
                      {user.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="top-user-info">
                  <div className="top-user-name">{user.display_name}</div>
                  <div className="top-user-aura">✨ {user.totalAura}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="context-section">
        <h3 className="context-title">🌟 Recent Good Deeds</h3>
        {loading ? (
          <div className="context-loading">
            <div className="loading-spinner-small"></div>
          </div>
        ) : recentDeeds.length === 0 ? (
          <p className="context-empty">No recent deeds</p>
        ) : (
          <div className="recent-deeds-list">
            {recentDeeds.map(deed => (
              <div key={deed.id} className="recent-deed-item">
                <div className="deed-icon">✨</div>
                <div className="deed-content">
                  <div className="deed-author">{deed.profiles?.display_name || 'Anonymous'}</div>
                  <div className="deed-text">
                    {deed.caption ? (
                      deed.caption.length > 50 
                        ? `${deed.caption.substring(0, 50)}...` 
                        : deed.caption
                    ) : (
                      'Shared a good deed'
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}


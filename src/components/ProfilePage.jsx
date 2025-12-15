// src/components/ProfilePage.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import FeedPostCard from './FeedPostCard'
import EditProfileModal from './EditProfileModal'
import './ProfilePage.css'

export default function ProfilePage({ user, currentUserId, profileId = null }) {
  const [profile, setProfile] = useState(null)
  const [userPosts, setUserPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const isOwnProfile = !profileId || profileId === currentUserId
  const targetUserId = profileId || currentUserId

  useEffect(() => {
    fetchProfile(targetUserId)
    fetchUserPosts(targetUserId)
  }, [targetUserId])

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error && data) {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  async function fetchUserPosts(userId) {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user posts:', error)
        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        
        if (postsData) {
          setUserPosts(postsData)
        }
      } else if (data) {
        setUserPosts(data)
      }
    } catch (error) {
      console.error('Error in fetchUserPosts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get aura score from profile, fallback to calculating from posts
  const totalAuraPoints = profile?.aura_score ?? userPosts.reduce((sum, post) => sum + (post.aura_points || 0), 0)
  const displayName = profile?.display_name || (isOwnProfile ? (user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User') : 'User')
  const bio = profile?.bio || ''

  // Calculate aura breakdown (optional - for future display)
  const auraFromPosts = userPosts.filter(p => p.verdict === 'approved').length * 5 // +5 per approved post
  // Note: Boost/comment/share breakdown would require additional queries

  function handleEditProfile() {
    setEditProfileOpen(true)
  }

  async function handleProfileUpdated() {
    await fetchProfile(targetUserId)
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar-large">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={displayName} />
          ) : (
            <div className="avatar-placeholder-large">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="profile-info">
          <div className="profile-name-section">
            <h2 className="profile-name">{displayName}</h2>
            {isOwnProfile && (
              <button 
                className="edit-profile-btn"
                onClick={handleEditProfile}
              >
                Edit Profile
              </button>
            )}
          </div>
          <div className="profile-stats">
            <div className="profile-stat">
              <span className="stat-value">{userPosts.length}</span>
              <span className="stat-label">Good Deeds</span>
            </div>
            <div className="profile-stat">
              <span className="stat-value">✨ {totalAuraPoints}</span>
              <span className="stat-label">Total Aura</span>
            </div>
            {/* TODO: Add aura breakdown section showing:
                - From posts: X points
                - From boosts: X points  
                - From comments: X points
                - From shares: X points
            */}
          </div>
          {bio && (
            <p className="profile-bio">{bio}</p>
          )}
          {!bio && isOwnProfile && (
            <p className="profile-bio-placeholder">
              Add a bio to tell others about yourself
            </p>
          )}
        </div>
      </div>

      <div className="profile-posts-section">
        <h3 className="profile-posts-title">
          {isOwnProfile ? 'Your Good Deeds' : 'Good Deeds'}
        </h3>

        {loading ? (
          <div className="profile-loading">
            <div className="loading-spinner"></div>
            <p>Loading posts...</p>
          </div>
        ) : userPosts.length === 0 ? (
          <div className="profile-empty">
            <div className="empty-icon">🌟</div>
            <h3>No posts yet</h3>
            <p>
              {isOwnProfile 
                ? "Start sharing your good deeds to inspire others!" 
                : "This user hasn't shared any good deeds yet."}
            </p>
          </div>
        ) : (
          <div className="profile-posts-grid">
            {userPosts.map(post => (
              <FeedPostCard 
                key={post.id} 
                post={post} 
                currentUserId={currentUserId} 
                  onProfileClick={() => {}} 
              />
            ))}
          </div>
        )}
      </div>

      {isOwnProfile && (
        <EditProfileModal
          isOpen={editProfileOpen}
          onClose={() => setEditProfileOpen(false)}
          profile={{ ...profile, id: targetUserId }}
          onUpdated={handleProfileUpdated}
        />
      )}
    </div>
  )
}


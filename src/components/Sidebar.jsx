// src/components/Sidebar.jsx
import React from 'react'
import { supabase } from '../lib/supabaseClient'
import './Sidebar.css'

export default function Sidebar({ user, profile, totalAuraPoints, currentView, onViewChange, onUploadClick }) {
  async function handleLogout() {
    await supabase.auth.signOut()
  }

  const displayName = profile?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const auraScore = profile?.aura_score || totalAuraPoints || 0

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo gradient-text">✨ Aura</h1>
        <p className="sidebar-tagline">Share your good deeds</p>
      </div>

      <div className="sidebar-user">
        <div className="sidebar-avatar">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={displayName} />
          ) : (
            <div className="avatar-placeholder">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{displayName}</div>
          <div className="sidebar-aura-score">
            <span className="aura-icon">✨</span>
            <span className="aura-value">{auraScore}</span>
            <span className="aura-label">Aura</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-item ${currentView === 'home' ? 'active' : ''}`}
          onClick={() => onViewChange('home')}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </button>

        <button
          className={`nav-item ${currentView === 'explore' ? 'active' : ''}`}
          onClick={() => onViewChange('explore')}
        >
          <span className="nav-icon">🔍</span>
          <span className="nav-label">Explore</span>
        </button>

        <button
          className={`nav-item ${currentView === 'profile' ? 'active' : ''}`}
          onClick={() => onViewChange('profile')}
        >
          <span className="nav-icon">👤</span>
          <span className="nav-label">Profile</span>
        </button>

        <button
          className="nav-item nav-item-upload"
          onClick={onUploadClick}
        >
          <span className="nav-icon">➕</span>
          <span className="nav-label">Upload Good Deed</span>
        </button>

        <button
          className="nav-item nav-item-logout"
          onClick={handleLogout}
        >
          <span className="nav-icon">🚪</span>
          <span className="nav-label">Logout</span>
        </button>
      </nav>
    </aside>
  )
}


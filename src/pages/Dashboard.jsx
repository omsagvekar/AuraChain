// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Sidebar from '../components/Sidebar'
import HomeFeed from '../components/HomeFeed'
import ExplorePage from '../components/ExplorePage'
import ProfilePage from '../components/ProfilePage'
import ContextPanel from '../components/ContextPanel'
import UploadModal from '../components/UploadModal'
import './Dashboard.css'

export default function Dashboard({ user }) {
  const [posts, setPosts] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState('home')
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const functionUrl = import.meta.env.VITE_PROCESS_IMAGE_URL

  useEffect(() => {
    fetchProfile()
    if (currentView === 'home') {
      fetchPosts()
    }
    
    // Subscribe to realtime updates for posts
    const channel = supabase
      .channel('posts-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'posts' },
        () => {
          if (currentView === 'home') {
            fetchPosts()
          }
          fetchProfile() // Update profile to refresh aura score
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentView])

  async function fetchProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (data) {
      setProfile(data)
    }
  }

  async function fetchPosts() {
    setLoading(true)
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
      .order('created_at', { ascending: false })
      .limit(20)
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching posts with profiles:', error)
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (!postsError && postsData) {
        const userIds = [...new Set(postsData.map(p => p.user_id))]
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds)
        
        const profilesMap = {}
        if (profilesData) {
          profilesData.forEach(p => {
            profilesMap[p.id] = p
          })
        }
        
        const postsWithProfiles = postsData.map(post => ({
          ...post,
          profiles: profilesMap[post.user_id] || null
        }))
        
        setPosts(postsWithProfiles)
      }
    } else if (data) {
      setPosts(data)
    }
    setLoading(false)
  }

  // Get aura score from profile, fallback to calculating from posts
  const totalAuraPoints = profile?.aura_score ?? posts
    .filter(p => p.user_id === user.id)
    .reduce((sum, p) => sum + (p.aura_points || 0), 0)

  function handleViewChange(view) {
    setCurrentView(view)
  }

  function handleUploadClick() {
    setUploadModalOpen(true)
  }

  function handlePostCreated() {
    fetchPosts()
    fetchProfile()
  }

  function renderMainContent() {
    switch (currentView) {
      case 'explore':
        return <ExplorePage currentUserId={user.id} />
      case 'profile':
        return <ProfilePage user={user} currentUserId={user.id} />
      case 'home':
      default:
        return <HomeFeed posts={posts} currentUserId={user.id} loading={loading} />
    }
  }

  return (
    <div className="dashboard-container">
      <Sidebar
        user={user}
        profile={profile}
        totalAuraPoints={totalAuraPoints}
        currentView={currentView}
        onViewChange={handleViewChange}
        onUploadClick={handleUploadClick}
      />

      <main className="dashboard-main">
        <div className="dashboard-content-wrapper">
          <div className="dashboard-main-content">
            {renderMainContent()}
          </div>

          <ContextPanel currentUserId={user.id} />
        </div>
      </main>

      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        user={user}
        functionUrl={functionUrl}
        onPostCreated={handlePostCreated}
      />
    </div>
  )
}

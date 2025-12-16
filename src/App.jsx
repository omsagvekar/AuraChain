// src/App.jsx
import React, { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import SignUp from './pages/SignUp.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx' // optional, create minimal if missing

export default function App() {
  const [user, setUser] = useState(null)
  const [isSignUp, setIsSignUp] = useState(true)

  useEffect(() => {
    // get session on load
    supabase.auth.getSession().then(r => {
      if (r.data?.session) {
        setUser(r.data.session.user)
        ensureProfile(r.data.session.user)
      }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) ensureProfile(u)
    })
    return () => listener?.subscription?.unsubscribe?.()
  }, [])

  async function ensureProfile(user) {
    if (!user) return
    // create profile if missing (server enforces id=auth.uid())
    const { data } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle()
    if (!data) {
      await supabase.from('profiles').insert({
        id: user.id,
        display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'New User',
        avatar_url: '',
        bio: ''
      })
    }
  }

  if (!user) {
    return (
      <div className="auth-center-outer">
        <div className="auth-center-inner">
          <div className="auth-hero">
            <h1 className="gradient-text">Welcome to Aura</h1>
            <p className="auth-hero-subtitle">
              Share your good deeds, earn aura, and inspire others every day.
            </p>
          </div>
          <div className="auth-forms">
            {isSignUp ? <SignUp /> : <Login />}
            <div className="auth-toggle">
              {isSignUp ? (
                <p>Already have an account? <button onClick={() => setIsSignUp(false)}>Log in</button></p>
              ) : (
                <p>Don't have an account? <button onClick={() => setIsSignUp(true)}>Sign up</button></p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <Dashboard user={user} />
}

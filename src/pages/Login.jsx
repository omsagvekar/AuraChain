// src/pages/Login.jsx
import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './Auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    setLoading(false)
    
    if (error) {
      setMsg('Error: ' + error.message)
      return
    }
    setMsg('Logged in successfully!')
  }

  return (
    <div className="auth-card fade-in">
      <div className="auth-header">
        <h2 className="gradient-text">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to continue your journey</p>
      </div>
      
      <form onSubmit={handleLogin} className="auth-form">
        <div className="form-group">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <button type="submit" disabled={loading} className="auth-button">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        
        {msg && (
          <div className={`auth-message ${msg.includes('Error') ? 'error' : 'success'}`}>
            {msg}
          </div>
        )}
      </form>
    </div>
  )
}

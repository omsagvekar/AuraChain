// src/pages/SignUp.jsx
import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './Auth.css'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignUp(e) {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
        }
      }
    })
    
    setLoading(false)
    
    if (error) {
      setMsg('Error: ' + error.message)
      return
    }
    setMsg('Sign up successful! Check your email to verify your account.')
    // Clear form
    setName('')
    setEmail('')
    setPassword('')
  }

  return (
    <div className="auth-card fade-in">
      <div className="auth-header">
        <h2 className="gradient-text">Join Aura</h2>
        <p className="auth-subtitle">Start sharing your good deeds</p>
      </div>
      
      <form onSubmit={handleSignUp} className="auth-form">
        <div className="form-group">
          <label htmlFor="signup-name">Full Name</label>
          <input
            id="signup-name"
            type="text"
            required
            placeholder="John Doe"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
            minLength={6}
          />
        </div>
        
        <button type="submit" disabled={loading} className="auth-button">
          {loading ? 'Creating account...' : 'Sign Up'}
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

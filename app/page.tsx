'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
      return
    }

    // Vérifier le rôle dans user_profiles
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role === 'admin') {
      window.location.href = '/dashboard'
    } else {
      window.location.href = '/client'
    }

    setLoading(false)
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0d1520',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: '#1a2540',
        border: '1px solid rgba(200,241,53,0.2)',
        borderRadius: '16px',
        padding: '48px',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#c8f135', fontSize: '24px', margin: '0 0 8px' }}>
          NeuroAccess
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: '0 0 32px' }}>
          Plateforme de rapports
        </p>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{
            width: '100%', padding: '12px', borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: '#fff', fontSize: '14px', marginBottom: '12px',
            boxSizing: 'border-box'
          }}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{
            width: '100%', padding: '12px', borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: '#fff', fontSize: '14px', marginBottom: '24px',
            boxSizing: 'border-box'
          }}
        />
        {error && <p style={{ color: '#ff6b6b', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '12px', borderRadius: '8px',
            background: '#c8f135', color: '#0d1520',
            fontSize: '14px', fontWeight: '700',
            border: 'none', cursor: 'pointer',
            opacity: loading ? 0.7 : 1
          }}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </div>
    </main>
  )
}

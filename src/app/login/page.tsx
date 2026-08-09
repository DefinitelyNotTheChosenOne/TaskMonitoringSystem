'use client'

import { useState } from 'react'
import { login } from './actions'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
    }
    
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      backgroundColor: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Premium background glow */}
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
        opacity: 0.1,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      
      <div className="neu-card page-animate-enter" style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '480px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        padding: '48px 40px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--bg)', 
            boxShadow: 'var(--shadow-extrude)', 
            border: '2px solid var(--accent)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 24px',
            color: 'var(--accent)',
            fontWeight: 'bold',
            fontSize: '32px'
          }}>
            ITM
          </div>
          <h2 style={{ marginBottom: '12px', fontSize: '28px', fontWeight: 700 }}>Integtrust Task Monitoring</h2>
          <p className="text-secondary" style={{ marginBottom: '8px', fontSize: '15px' }}>
            Enter your credentials to access your dashboard.
          </p>
        </div>

        <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '13px', border: '1px solid #ef4444' }}>
              {error}
            </div>
          )}

          <div className="flex-column" style={{ gap: '8px' }}>
            <label htmlFor="email" style={{ fontSize: '13px', fontWeight: 600 }}>Email Address</label>
            <input 
              id="email"
              name="email" 
              type="email" 
              required 
              className="neu-input" 
              placeholder="you@company.com"
            />
          </div>

          <div className="flex-column" style={{ gap: '8px' }}>
            <label htmlFor="password" style={{ fontSize: '13px', fontWeight: 600 }}>Password</label>
            <input 
              id="password"
              name="password" 
              type="password" 
              required 
              className="neu-input" 
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            className="neu-button" 
            style={{ marginTop: '8px', padding: '12px', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <p className="text-secondary" style={{ fontSize: '13px' }}>
            Need an account? Contact your company administrator.
          </p>
        </div>
      </div>
    </div>
  )
}

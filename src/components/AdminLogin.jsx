import { useState } from 'react'
import { signInWithGoogle, signInWithFacebook } from '../lib/auth'

const s = {
  wrap: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#0A0A0F',
  },
  box: {
    background: '#111118', border: '1px solid #1E1E2E', borderRadius: 24,
    padding: '48px 40px', width: 400, maxWidth: '90vw', textAlign: 'center',
  },
  logo: { fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 8 },
  accent: { color: '#FF4D00' },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 40 },
  divider: {
    display: 'flex', alignItems: 'center', gap: 12,
    margin: '24px 0', color: '#333', fontSize: 12,
  },
  divLine: { flex: 1, height: 1, background: '#1E1E2E' },
  oauthBtn: (bg, border) => ({
    width: '100%', padding: '13px', borderRadius: 12, border: `1px solid ${border}`,
    background: bg, color: '#F0EDE8', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 10, marginBottom: 10, fontFamily: 'inherit',
    transition: 'opacity 0.15s',
  }),
  error: {
    background: 'rgba(255,77,0,0.1)', border: '1px solid rgba(255,77,0,0.3)',
    borderRadius: 10, padding: '10px 14px', fontSize: 13,
    color: '#FF4D00', marginTop: 16,
  },
  denied: {
    background: 'rgba(255,77,0,0.08)', border: '1px solid rgba(255,77,0,0.2)',
    borderRadius: 12, padding: '16px', marginTop: 16, fontSize: 13, color: '#888',
  },
}

export default function AdminLogin({ deniedUser, onSignOut }) {
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState('')

  async function handleGoogle() {
    setLoading('google'); setError('')
    try { await signInWithGoogle() } catch { setError('Přihlášení selhalo. Zkus to znovu.') }
    setLoading(null)
  }

  async function handleFacebook() {
    setLoading('facebook'); setError('')
    try { await signInWithFacebook() } catch { setError('Přihlášení selhalo. Zkus to znovu.') }
    setLoading(null)
  }

  return (
    <div style={s.wrap}>
      <div style={s.box}>
        <div style={s.logo}>FIT<span style={s.accent}>BOOK</span></div>
        <div style={s.subtitle}>Přihlaste se pro přístup do trenér panelu</div>

        {/* Přihlášen, ale není admin */}
        {deniedUser ? (
          <div style={s.denied}>
            <div style={{ marginBottom: 8 }}>
              ⛔ Účet <strong style={{ color: '#F0EDE8' }}>{deniedUser.email}</strong> nemá přístup do admin panelu.
            </div>
            <button
              onClick={onSignOut}
              style={{ ...s.oauthBtn('#1A1A28', '#2E2E3E'), marginBottom: 0, width: 'auto', padding: '8px 20px' }}
            >
              Odhlásit se
            </button>
          </div>
        ) : (
          <>
            <button
              style={s.oauthBtn('#1A1A28', '#2E2E3E')}
              onClick={handleGoogle}
              disabled={!!loading}
            >
              <GoogleIcon />
              {loading === 'google' ? 'Přihlašování...' : 'Přihlásit se přes Google'}
            </button>

            <button
              style={s.oauthBtn('#1A1A28', '#2E2E3E')}
              onClick={handleFacebook}
              disabled={!!loading}
            >
              <FacebookIcon />
              {loading === 'facebook' ? 'Přihlašování...' : 'Přihlásit se přes Facebook'}
            </button>

            {error && <div style={s.error}>⚠️ {error}</div>}
          </>
        )}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.86L38.37 6C34.18 2.29 29.34 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.28 5.66C11.6 12.62 17.32 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

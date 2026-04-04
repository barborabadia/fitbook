import { useState } from 'react'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD

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
  subtitle: { fontSize: 14, color: '#555', marginBottom: 32 },
  input: {
    width: '100%', background: '#0A0A0F', border: '1px solid #1E1E2E', borderRadius: 10,
    padding: '12px 16px', color: '#F0EDE8', fontSize: 14, fontFamily: 'inherit',
    outline: 'none', marginBottom: 10, boxSizing: 'border-box', textAlign: 'left',
  },
  btn: {
    width: '100%', padding: '13px', borderRadius: 12, border: 'none',
    background: '#FF4D00', color: '#fff', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  error: {
    background: 'rgba(255,77,0,0.1)', border: '1px solid rgba(255,77,0,0.3)',
    borderRadius: 10, padding: '10px 14px', fontSize: 13,
    color: '#FF4D00', marginTop: 12,
  },
}

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('fitbook_admin', '1')
      onLogin()
    } else {
      setError('Špatné heslo. Zkus to znovu.')
    }
  }

  return (
    <div style={s.wrap}>
      <div style={s.box}>
        <div style={s.logo}>FIT<span style={s.accent}>BOOK</span></div>
        <div style={s.subtitle}>Zadejte heslo pro přístup do trenér panelu</div>
        <input
          style={s.input}
          type="password"
          placeholder="Heslo"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        <button style={s.btn} onClick={handleLogin}>Přihlásit se</button>
        {error && <div style={s.error}>⚠️ {error}</div>}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD
const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

const s = {
  wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0F' },
  box: { background: '#111118', border: '1px solid #1E1E2E', borderRadius: 24, padding: '48px 40px', width: 400, maxWidth: '90vw', textAlign: 'center' },
  logo: { fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 8 },
  accent: { color: '#FF4D00' },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 32 },
  input: { width: '100%', background: '#0A0A0F', border: '1px solid #1E1E2E', borderRadius: 10, padding: '12px 16px', color: '#F0EDE8', fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 10, boxSizing: 'border-box' },
  btn: (disabled) => ({ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: disabled ? '#1A1A28' : '#FF4D00', color: disabled ? '#444' : '#fff', fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }),
  error: { background: 'rgba(255,77,0,0.1)', border: '1px solid rgba(255,77,0,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#FF4D00', marginTop: 12 },
  warning: { background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#FFB800', marginTop: 12 },
  lockout: { background: 'rgba(255,77,0,0.08)', border: '1px solid rgba(255,77,0,0.2)', borderRadius: 12, padding: '20px', fontSize: 14 },
}

function getLockoutData() {
  try {
    const data = localStorage.getItem('fitbook_lockout')
    return data ? JSON.parse(data) : { attempts: 0, lockedUntil: null }
  } catch { return { attempts: 0, lockedUntil: null } }
}

function saveLockoutData(data) {
  localStorage.setItem('fitbook_lockout', JSON.stringify(data))
}

function formatTimeLeft(lockedUntil) {
  const diff = Math.ceil((new Date(lockedUntil) - new Date()) / 1000 / 60)
  return diff <= 1 ? 'méně než minutu' : `${diff} minut`
}

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [lockout, setLockout] = useState(getLockoutData())
  const [timeLeft, setTimeLeft] = useState('')

  const isLocked = lockout.lockedUntil && new Date(lockout.lockedUntil) > new Date()

  useEffect(() => {
    if (!isLocked) return
    const interval = setInterval(() => {
      const data = getLockoutData()
      const stillLocked = data.lockedUntil && new Date(data.lockedUntil) > new Date()
      if (!stillLocked) {
        saveLockoutData({ attempts: 0, lockedUntil: null })
        setLockout({ attempts: 0, lockedUntil: null })
        clearInterval(interval)
      } else {
        setTimeLeft(formatTimeLeft(data.lockedUntil))
        setLockout(data)
      }
    }, 10000)
    setTimeLeft(formatTimeLeft(lockout.lockedUntil))
    return () => clearInterval(interval)
  }, [isLocked])

  function handleLogin() {
    if (isLocked) return

    if (password === ADMIN_PASSWORD) {
      saveLockoutData({ attempts: 0, lockedUntil: null })
      sessionStorage.setItem('fitbook_admin', '1')
      onLogin()
    } else {
      const newAttempts = lockout.attempts + 1
      if (newAttempts >= MAX_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString()
        const newData = { attempts: newAttempts, lockedUntil }
        saveLockoutData(newData)
        setLockout(newData)
        setTimeLeft(formatTimeLeft(lockedUntil))
        setError('')
      } else {
        const newData = { attempts: newAttempts, lockedUntil: null }
        saveLockoutData(newData)
        setLockout(newData)
        const remaining = MAX_ATTEMPTS - newAttempts
        setError(`Špatné heslo. Zbývá ${remaining} ${remaining === 1 ? 'pokus' : remaining < 5 ? 'pokusy' : 'pokusů'}.`)
      }
      setPassword('')
    }
  }

  return (
    <div style={s.wrap}>
      <div style={s.box}>
        <div style={s.logo}>Cvičení<span style={s.accent}> pro ženy</span></div>
        <div style={s.subtitle}>Přihlášení do trenér panelu</div>

        {isLocked ? (
          <div style={s.lockout}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
            <div style={{ fontWeight: 700, color: '#FF4D00', marginBottom: 8 }}>Přístup zablokován</div>
            <div style={{ color: '#666', fontSize: 13, lineHeight: 1.6 }}>
              Po {MAX_ATTEMPTS} neúspěšných pokusech byl přístup dočasně zablokován.<br />
              Zkus to znovu za <strong style={{ color: '#F0EDE8' }}>{timeLeft}</strong>.
            </div>
          </div>
        ) : (
          <>
            <input
              style={s.input}
              type="password"
              placeholder="Heslo"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoFocus
            />
            <button style={s.btn(false)} onClick={handleLogin}>
              Přihlásit se
            </button>
            {error && <div style={s.error}>⚠️ {error}</div>}
            {!error && lockout.attempts > 0 && (
              <div style={s.warning}>
                ⚠️ {lockout.attempts} neúspěšný {lockout.attempts === 1 ? 'pokus' : 'pokusů'} o přihlášení
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

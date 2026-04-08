import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const s = {
  bar: {
    background: '#FFFFFF', border: '1px solid #EBCFD8', borderRadius: 14,
    padding: '14px 20px', marginBottom: 20,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    flexWrap: 'wrap', boxShadow: '0 2px 12px rgba(200,81,107,0.06)',
  },
  left: { fontSize: 13, color: '#9B7E8A' },
  leftBold: { color: '#2C1A22', fontWeight: 600 },
  btnRow: { display: 'flex', gap: 8, flexShrink: 0 },
  btn: (bg, border) => ({
    padding: '7px 14px', borderRadius: 8, border: `1px solid ${border}`,
    background: bg, color: '#2C1A22', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
    fontFamily: 'inherit', whiteSpace: 'nowrap',
  }),
  avatar: { width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' },
  avatarPlaceholder: (hue) => ({
    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
    background: `hsl(${hue}, 60%, 88%)`, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, color: `hsl(${hue}, 50%, 40%)`,
  }),
}

function getHue(str = '') {
  let h = 0
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 360
  return h
}

export default function ClientAuthBar({ onUserChange }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      onUserChange?.(user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      onUserChange?.(u)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href }
    })
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
    onUserChange?.(null)
  }

  if (loading) return null

  if (user) {
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Uživatel'
    const avatar = user.user_metadata?.avatar_url
    const hue = getHue(user.email)
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

    return (
      <div style={s.bar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {avatar
            ? <img src={avatar} alt="" style={s.avatar} />
            : <div style={s.avatarPlaceholder(hue)}>{initials}</div>
          }
          <div style={s.left}>
            Přihlášena jako <span style={s.leftBold}>{name}</span>
            <div style={{ fontSize: 11, color: '#C4ABB4', marginTop: 1 }}>Formulář je předvyplněn</div>
          </div>
        </div>
        <button style={s.btn('#F5E8EC', '#EBCFD8')} onClick={handleSignOut}>
          Odhlásit
        </button>
      </div>
    )
  }

  return (
    <div style={s.bar}>
      <div style={s.left}>
        Přihlaste se pro rychlejší rezervaci – formulář se předvyplní automaticky.
      </div>
      <div style={s.btnRow}>
        <button style={s.btn('#F5E8EC', '#EBCFD8')} onClick={handleGoogle}>
          <GoogleIcon /> Google
        </button>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.86L38.37 6C34.18 2.29 29.34 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.28 5.66C11.6 12.62 17.32 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

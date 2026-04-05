import { useState } from 'react'
import Schedule from './components/Schedule'
import Clients from './components/Clients'
import ClientBooking from './components/ClientBooking'
import AdminLogin from './components/AdminLogin'

const isClientView = window.location.pathname === '/book'

const s = {
  root: { fontFamily: "'DM Sans', sans-serif", background: '#0A0A0F', minHeight: '100vh', color: '#F0EDE8' },
  sidebar: { width: 220, background: '#111118', borderRight: '1px solid #1E1E2E', display: 'flex', flexDirection: 'column', padding: '32px 0', position: 'fixed', top: 0, left: 0, height: '100vh' },
  logo: { padding: '0 28px 28px', borderBottom: '1px solid #1E1E2E' },
  logoText: { fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' },
  logoAccent: { color: '#FF4D00' },
  nav: { padding: '20px 12px', flex: 1 },
  navItem: (active) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: active ? 600 : 400, color: active ? '#FF4D00' : '#666', background: active ? 'rgba(255,77,0,0.08)' : 'transparent', border: active ? '1px solid rgba(255,77,0,0.15)' : '1px solid transparent', marginBottom: 4 }),
  linkBox: { margin: '0 12px 12px', background: '#0A0A0F', border: '1px solid #1E1E2E', borderRadius: 12, padding: '12px 14px' },
  main: { marginLeft: 220, padding: '40px 48px', minHeight: '100vh' },
}

export default function App() {
  const [view, setView] = useState('schedule')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(sessionStorage.getItem('fitbook_admin') === '1')

  if (isClientView) return <div style={s.root}><ClientBooking /></div>

  if (!isLoggedIn) return <div style={s.root}><AdminLogin onLogin={() => setIsLoggedIn(true)} /></div>

  const bookingUrl = `${window.location.origin}/book`

  return (
    <div style={s.root}>
      <div style={s.sidebar}>
        <div style={s.logo}>
          <div style={s.logoText}>Cvičení<span style={s.logoAccent}> pro ženy</span></div>
          <div style={{ fontSize: 11, color: '#333', marginTop: 2 }}>trenér panel</div>
        </div>
        <nav style={s.nav}>
          {[{ id: 'schedule', label: 'Rozvrh', icon: '📅' }, { id: 'clients', label: 'Klienti', icon: '👥' }].map(item => (
            <div key={item.id} style={s.navItem(view === item.id)} onClick={() => setView(item.id)}>
              <span>{item.icon}</span><span>{item.label}</span>
            </div>
          ))}
        </nav>
        <div style={s.linkBox}>
          <div style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Link pro klienty</div>
          <div style={{ fontSize: 11, color: '#FF4D00', wordBreak: 'break-all', fontWeight: 600 }}>{bookingUrl}</div>
          <button onClick={() => navigator.clipboard.writeText(bookingUrl)} style={{ marginTop: 8, width: '100%', padding: '6px', borderRadius: 6, border: 'none', background: 'rgba(255,77,0,0.15)', color: '#FF4D00', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}>📋 Kopírovat</button>
        </div>
        <div style={{ margin: '0 12px 20px' }}>
          <button onClick={() => { sessionStorage.removeItem('fitbook_admin'); setIsLoggedIn(false) }} style={{ width: '100%', padding: '8px', borderRadius: 8, border: 'none', background: '#1A1A28', color: '#555', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>Odhlásit se</button>
        </div>
      </div>
      <div style={s.main}>
        {view === 'schedule' && <Schedule onSelectSlot={setSelectedSlot} />}
        {view === 'clients' && <Clients />}
      </div>
    </div>
  )
}

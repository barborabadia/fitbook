import { useState } from 'react'
import Schedule from './components/Schedule'
import Clients from './components/Clients'
import ClientBooking from './components/ClientBooking'
import AdminLogin from './components/AdminLogin'
import SlotDetailModal from './components/SlotDetailModal'
import Statistics from './components/Statistics'

const isClientView = window.location.pathname === '/book'

const s = {
  root: { fontFamily: "'DM Sans', sans-serif", background: '#FBF6F8', minHeight: '100vh', color: '#2C1A22' },
  sidebar: { width: 224, background: '#FFFFFF', borderRight: '1px solid #EBCFD8', display: 'flex', flexDirection: 'column', padding: '32px 0', position: 'fixed', top: 0, left: 0, height: '100vh', boxShadow: '2px 0 20px rgba(200,81,107,0.06)' },
  logo: { padding: '0 28px 28px', borderBottom: '1px solid #F0D9DF' },
  logoText: { fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px', fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.2 },
  logoAccent: { color: '#C8516B' },
  logoSub: { fontSize: 11, color: '#C4ABB4', marginTop: 2 },
  nav: { padding: '20px 12px', flex: 1 },
  navItem: (active) => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
    borderRadius: 10, cursor: 'pointer', fontSize: 14,
    fontWeight: active ? 600 : 400,
    color: active ? '#C8516B' : '#9B7E8A',
    background: active ? 'rgba(200,81,107,0.08)' : 'transparent',
    border: active ? '1px solid rgba(200,81,107,0.18)' : '1px solid transparent',
    marginBottom: 4, transition: 'all 0.15s ease',
  }),
  linkBox: { margin: '0 12px 12px', background: '#FFF5F7', border: '1px solid #EBCFD8', borderRadius: 12, padding: '12px 14px' },
  main: { marginLeft: 224, padding: '40px 48px', minHeight: '100vh' },
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
          <div style={s.logoText}>Cvičení<span style={s.logoAccent}> pro ženy</span> 🌸</div>
          <div style={s.logoSub}>trenér panel</div>
        </div>
        <nav style={s.nav}>
          {[
            { id: 'schedule', label: 'Rozvrh', icon: '📅' },
            { id: 'clients', label: 'Klienti', icon: '👥' },
            { id: 'stats', label: 'Statistiky', icon: '📊' },
          ].map(item => (
            <div key={item.id} style={s.navItem(view === item.id)} onClick={() => setView(item.id)}>
              <span>{item.icon}</span><span>{item.label}</span>
            </div>
          ))}
        </nav>
        <div style={s.linkBox}>
          <div style={{ fontSize: 10, color: '#C4ABB4', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Link pro klienty</div>
          <div style={{ fontSize: 11, color: '#C8516B', wordBreak: 'break-all', fontWeight: 600, marginBottom: 8 }}>{bookingUrl}</div>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(bookingUrl)}&bgcolor=FFF5F7&color=C8516B&margin=8`}
            alt="QR kód"
            style={{ width: '100%', borderRadius: 8, display: 'block', marginBottom: 8 }}
          />
          <button onClick={() => navigator.clipboard.writeText(bookingUrl)} style={{ width: '100%', padding: '6px', borderRadius: 6, border: 'none', background: 'rgba(200,81,107,0.1)', color: '#C8516B', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}>📋 Kopírovat odkaz</button>
        </div>
        <div style={{ margin: '0 12px 20px' }}>
          <button onClick={() => { sessionStorage.removeItem('fitbook_admin'); setIsLoggedIn(false) }} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #EBCFD8', background: 'transparent', color: '#BFA0AD', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>Odhlásit se</button>
        </div>
      </div>
      <div style={s.main}>
        {view === 'schedule' && <Schedule onSelectSlot={setSelectedSlot} />}
        {view === 'clients' && <Clients />}
        {view === 'stats' && <Statistics />}
      </div>
      {selectedSlot && <SlotDetailModal slot={selectedSlot} onClose={() => setSelectedSlot(null)} />}
    </div>
  )
}

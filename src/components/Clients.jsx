import { useState, useEffect } from 'react'
import ClientDetailModal from './ClientDetailModal'
import { supabase } from '../lib/supabase'

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  title: { fontSize: 32, fontWeight: 700, letterSpacing: '-1px', color: '#2C1A22', fontFamily: "'Cormorant Garamond', serif" },
  subtitle: { fontSize: 14, color: '#9B7E8A', marginTop: 4 },
  searchInput: { background: '#FFFFFF', border: '1px solid #EBCFD8', borderRadius: 10, padding: '10px 16px', color: '#2C1A22', fontSize: 14, width: 240, fontFamily: 'inherit', outline: 'none' },
  table: { background: '#FFFFFF', border: '1px solid #EBCFD8', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 20px rgba(200,81,107,0.06)' },
  tHead: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', padding: '14px 24px', fontSize: 11, fontWeight: 700, color: '#BFA0AD', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #F0D9DF', background: '#FFF5F7' },
  tRow: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', padding: '14px 24px', borderBottom: '1px solid #FAF0F3', alignItems: 'center', fontSize: 14 },
  avatar: (hue) => ({ width: 32, height: 32, borderRadius: '50%', background: `hsl(${hue}, 60%, 88%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: `hsl(${hue}, 50%, 40%)`, flexShrink: 0 }),
  badge: (type) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: type === 'new' ? 'rgba(91,158,152,0.1)' : 'rgba(212,148,90,0.1)', color: type === 'new' ? '#5B9E98' : '#D4945A', border: `1px solid ${type === 'new' ? 'rgba(91,158,152,0.2)' : 'rgba(212,148,90,0.2)'}` }),
  empty: { padding: '48px 24px', textAlign: 'center', color: '#BFA0AD', fontSize: 14 },
}

function getHue(str = '') {
  let h = 0
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 360
  return h
}

export default function Clients() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const isMobile = window.innerWidth < 768

  useEffect(() => { loadClients() }, [])

  async function loadClients() {
    setLoading(true)
    const { data } = await supabase.from('bookings').select('client_name, client_email, client_phone, booking_type, price, status, created_at, slot_id, training_slots(name, slot_date, start_time)').eq('status', 'confirmed').order('created_at', { ascending: false })

    if (data) {
      const map = {}
      data.forEach(b => {
        const key = b.client_email
        if (!map[key]) map[key] = { name: b.client_name, email: b.client_email, phone: b.client_phone, sessions: 0, totalSpent: 0, lastSlot: null, lastDate: null }
        map[key].sessions++
        map[key].totalSpent += b.price || 0
        if (!map[key].lastDate || b.created_at > map[key].lastDate) {
          map[key].lastDate = b.created_at
          map[key].lastSlot = b.training_slots
        }
      })
      setClients(Object.values(map))
    }
    setLoading(false)
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={s.title}>Klienti</div>
        <div style={s.subtitle}>Celkem {clients.length} klientů</div>
        <input style={{ ...s.searchInput, width: '100%', marginTop: 12, boxSizing: 'border-box' }} placeholder="🔍 Hledat..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading && <div style={s.empty}>Načítám...</div>}
      {!loading && filtered.length === 0 && <div style={s.empty}>{search ? 'Žádný klient nenalezen.' : 'Zatím žádné rezervace.'}</div>}

      {isMobile ? (
        <div>
          {filtered.map(c => {
            const hue = getHue(c.email)
            const initials = c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            const isNew = c.sessions <= 2
            return (
              <div key={c.email} style={{ background: '#fff', border: '1px solid #EBCFD8', borderRadius: 14, padding: '14px 16px', marginBottom: 10, cursor: 'pointer', boxShadow: '0 2px 8px rgba(200,81,107,0.05)' }} onClick={() => setSelectedClient(c)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={s.avatar(hue)}>{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#2C1A22', fontSize: 15 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: '#9B7E8A', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</div>
                  </div>
                  <span style={s.badge(isNew ? 'new' : 'active')}>{isNew ? 'Nová' : 'Aktivní'}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, background: '#FBF6F8', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#BFA0AD', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Tréninků</div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#2C1A22', marginTop: 2 }}>{c.sessions}</div>
                  </div>
                  <div style={{ flex: 1, background: '#FBF6F8', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#BFA0AD', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Utraceno</div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#D4945A', marginTop: 2 }}>{c.totalSpent > 0 ? `${c.totalSpent} Kč` : '–'}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={s.table}>
          <div style={s.tHead}>
            <span>Jméno</span><span>E-mail</span><span>Tréninků</span><span>Utraceno</span><span>Status</span>
          </div>
          {filtered.map((c, i) => {
            const hue = getHue(c.email)
            const initials = c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            const isNew = c.sessions <= 2
            return (
              <div key={c.email} style={{ ...s.tRow, background: i % 2 === 0 ? 'transparent' : 'rgba(200,81,107,0.015)', cursor: 'pointer' }} onClick={() => setSelectedClient(c)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={s.avatar(hue)}>{initials}</div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#2C1A22' }}>{c.name}</div>
                    {c.phone && <div style={{ fontSize: 11, color: '#9B7E8A' }}>{c.phone}</div>}
                  </div>
                </div>
                <span style={{ color: '#9B7E8A', fontSize: 13 }}>{c.email}</span>
                <span style={{ fontWeight: 700, color: '#2C1A22' }}>{c.sessions}</span>
                <span style={{ fontWeight: 600, color: '#D4945A' }}>{c.totalSpent > 0 ? `${c.totalSpent} Kč` : '–'}</span>
                <span style={s.badge(isNew ? 'new' : 'active')}>{isNew ? 'Nová' : 'Aktivní'}</span>
              </div>
            )
          })}
        </div>
      )}
      {selectedClient && <ClientDetailModal client={selectedClient} onClose={() => setSelectedClient(null)} />}
    </div>
  )
}

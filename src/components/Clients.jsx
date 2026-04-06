import { useState, useEffect } from 'react'
import ClientDetailModal from './ClientDetailModal'
import { supabase } from '../lib/supabase'

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  title: { fontSize: 32, fontWeight: 800, letterSpacing: '-1px' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  searchInput: { background: '#111118', border: '1px solid #1E1E2E', borderRadius: 10, padding: '10px 16px', color: '#F0EDE8', fontSize: 14, width: 240, fontFamily: 'inherit', outline: 'none' },
  table: { background: '#111118', border: '1px solid #1E1E2E', borderRadius: 16, overflow: 'hidden' },
  tHead: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', padding: '14px 24px', fontSize: 11, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #1E1E2E' },
  tRow: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', padding: '14px 24px', borderBottom: '1px solid #0F0F1A', alignItems: 'center', fontSize: 14 },
  avatar: (hue) => ({ width: 32, height: 32, borderRadius: '50%', background: `hsl(${hue}, 50%, 20%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: `hsl(${hue}, 70%, 65%)`, flexShrink: 0 }),
  badge: (type) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: type === 'new' ? 'rgba(0,194,168,0.1)' : 'rgba(255,184,0,0.1)', color: type === 'new' ? '#00C2A8' : '#FFB800', border: `1px solid ${type === 'new' ? 'rgba(0,194,168,0.2)' : 'rgba(255,184,0,0.2)'}` }),
  empty: { padding: '48px 24px', textAlign: 'center', color: '#444', fontSize: 14 },
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

  useEffect(() => { loadClients() }, [])

  async function loadClients() {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select('client_name, client_email, client_phone, booking_type, price, status, created_at, slot_id, training_slots(name, slot_date, start_time)')
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })

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

  function formatDate(dateStr) {
    if (!dateStr) return '–'
    return new Date(dateStr).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })
  }

  return (
    <div>
      <div style={s.header}>
        <div>
          <div style={s.title}>Klienti</div>
          <div style={s.subtitle}>Celkem {clients.length} klientů</div>
        </div>
        <input style={s.searchInput} placeholder="🔍 Hledat..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={s.table}>
        <div style={s.tHead}>
          <span>Jméno</span><span>E-mail</span><span>Tréninků</span><span>Utraceno</span><span>Status</span>
        </div>
        {loading && <div style={s.empty}>Načítám...</div>}
        {!loading && filtered.length === 0 && <div style={s.empty}>{search ? 'Žádný klient nenalezen.' : 'Zatím žádné rezervace.'}</div>}
        {filtered.map((c, i) => {
          const hue = getHue(c.email)
          const initials = c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
          const isNew = c.sessions <= 2
          return (
            <div key={c.email} style={{ ...s.tRow, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', cursor: 'pointer' }} onClick={() => setSelectedClient(c)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={s.avatar(hue)}>{initials}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  {c.phone && <div style={{ fontSize: 11, color: '#555' }}>{c.phone}</div>}
                </div>
              </div>
              <span style={{ color: '#666', fontSize: 13 }}>{c.email}</span>
              <span style={{ fontWeight: 700 }}>{c.sessions}</span>
              <span style={{ fontWeight: 600, color: '#FFB800' }}>{c.totalSpent > 0 ? `${c.totalSpent} Kč` : '–'}</span>
              <span style={s.badge(isNew ? 'new' : 'active')}>{isNew ? 'Nový' : 'Aktivní'}</span>
            </div>
          )
        })}
      </div>
      {selectedClient && <ClientDetailModal client={selectedClient} onClose={() => setSelectedClient(null)} />}
    </div>
  )
}

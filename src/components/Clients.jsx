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

const modalStyle = { position: 'fixed', inset: 0, background: 'rgba(44,26,34,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }
const inputStyle = { width: '100%', background: '#FBF6F8', border: '1px solid #EBCFD8', borderRadius: 10, padding: '10px 14px', color: '#2C1A22', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }
const labelStyle = { fontSize: 11, fontWeight: 600, color: '#9B7E8A', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6, marginTop: 12 }

export default function Clients() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '' })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')
  const isMobile = window.innerWidth < 768

  useEffect(() => { loadClients() }, [])

  async function loadClients() {
    setLoading(true)
    const [{ data }, { data: mc }] = await Promise.all([
      supabase.from('bookings').select('client_name, client_email, client_phone, booking_type, price, status, created_at, slot_id, training_slots(name, slot_date, start_time)').eq('status', 'confirmed').order('created_at', { ascending: false }),
      supabase.from('manual_clients').select('*').order('name'),
    ])

    const map = {}
    data?.forEach(b => {
      const key = b.client_email
      if (!map[key]) map[key] = { name: b.client_name, email: b.client_email, phone: b.client_phone, sessions: 0, totalSpent: 0, lastSlot: null, lastDate: null }
      map[key].sessions++
      map[key].totalSpent += b.price || 0
      if (!map[key].lastDate || b.created_at > map[key].lastDate) {
        map[key].lastDate = b.created_at
        map[key].lastSlot = b.training_slots
      }
    })
    mc?.forEach(c => {
      if (!map[c.email]) map[c.email] = { name: c.name, email: c.email, phone: c.phone, sessions: 0, totalSpent: 0, lastSlot: null, lastDate: null, isManual: true }
    })
    setClients(Object.values(map))
    setLoading(false)
  }

  async function addClient() {
    if (!newClient.name.trim() || !newClient.email.trim()) return
    setAddLoading(true); setAddError('')
    const { error } = await supabase.from('manual_clients').insert({
      name: newClient.name.trim(),
      email: newClient.email.trim().toLowerCase(),
      phone: newClient.phone.trim() || null,
    })
    if (error) { setAddError('Chyba – email možná již existuje.'); setAddLoading(false); return }
    setShowAddModal(false)
    setNewClient({ name: '', email: '', phone: '' })
    setAddLoading(false)
    loadClients()
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={s.title}>Klienti</div>
            <div style={s.subtitle}>Celkem {clients.length} klientů</div>
          </div>
          <button onClick={() => { setShowAddModal(true); setAddError('') }} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#C8516B', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>+ Přidat klienta</button>
        </div>
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

      {showAddModal && (
        <div style={modalStyle} onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', maxWidth: 400, width: '100%', boxShadow: '0 8px 32px rgba(200,81,107,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#2C1A22' }}>Přidat klienta</div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9B7E8A' }}>×</button>
            </div>
            <label style={labelStyle}>Jméno a příjmení *</label>
            <input style={inputStyle} placeholder="Jana Nováková" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} />
            <label style={labelStyle}>E-mail *</label>
            <input style={inputStyle} type="email" placeholder="jana@email.cz" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} />
            <label style={labelStyle}>Telefon (volitelné)</label>
            <input style={inputStyle} placeholder="+420 777 888 999" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} />
            {addError && <div style={{ fontSize: 13, color: '#C8516B', fontWeight: 600, marginBottom: 8 }}>⚠️ {addError}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid #EBCFD8', background: '#fff', color: '#9B7E8A', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Zrušit</button>
              <button onClick={addClient} disabled={!newClient.name || !newClient.email || addLoading} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: '#C8516B', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: (!newClient.name || !newClient.email || addLoading) ? 0.5 : 1 }}>
                {addLoading ? 'Ukládám...' : 'Přidat klienta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

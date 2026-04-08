import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DAYS_FULL = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle']

function getDayName(dateStr) {
  const day = new Date(dateStr).getDay()
  return DAYS_FULL[day === 0 ? 6 : day - 1]
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getHue(str = '') {
  let h = 0
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 360
  return h
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(44,26,34,0.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  box: { background: '#FFFFFF', border: '1px solid #EBCFD8', borderRadius: 20, padding: 36, width: 520, maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(200,81,107,0.15)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  closeBtn: { background: 'none', border: 'none', color: '#BFA0AD', cursor: 'pointer', fontSize: 20, flexShrink: 0 },
  avatar: (hue) => ({ width: 52, height: 52, borderRadius: '50%', background: `hsl(${hue}, 60%, 88%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: `hsl(${hue}, 50%, 40%)`, flexShrink: 0 }),
  name: { fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: '#2C1A22' },
  meta: { fontSize: 13, color: '#9B7E8A', marginTop: 4 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, margin: '20px 0' },
  stat: { background: '#FBF6F8', border: '1px solid #EBCFD8', borderRadius: 10, padding: '12px 14px', textAlign: 'center' },
  statLabel: { fontSize: 10, color: '#BFA0AD', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 },
  statVal: { fontSize: 22, fontWeight: 800 },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: '#BFA0AD', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 },
  typeRow: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 },
  typeCard: (color) => ({ background: `${color}08`, border: `1px solid ${color}25`, borderRadius: 12, padding: '14px 16px' }),
  typeLabel: { fontSize: 13, fontWeight: 700, color: '#2C1A22' },
  typeCount: { fontSize: 24, fontWeight: 800, marginTop: 4 },
  bookingCard: (cancelled) => ({ background: cancelled ? 'transparent' : '#FBF6F8', border: `1px solid ${cancelled ? '#F0D9DF' : '#EBCFD8'}`, borderRadius: 10, padding: '12px 16px', marginBottom: 8, opacity: cancelled ? 0.5 : 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }),
  bookingName: { fontSize: 14, fontWeight: 600, color: '#2C1A22' },
  bookingMeta: { fontSize: 12, color: '#9B7E8A', marginTop: 2 },
  badge: (type) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: type === 'cancelled' ? 'rgba(200,81,107,0.1)' : 'rgba(91,158,152,0.1)', color: type === 'cancelled' ? '#C8516B' : '#5B9E98', border: `1px solid ${type === 'cancelled' ? 'rgba(200,81,107,0.2)' : 'rgba(91,158,152,0.2)'}` }),
  empty: { textAlign: 'center', color: '#BFA0AD', padding: '24px 0', fontSize: 14 },
}

export default function ClientDetailModal({ client, onClose }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => { loadBookings(); loadNotes() }, [client.email])

  async function loadNotes() {
    const { data } = await supabase.from('client_notes').select('*').eq('client_email', client.email).order('created_at', { ascending: false })
    if (data) setNotes(data)
  }

  async function addNote() {
    if (!newNote.trim()) return
    setSavingNote(true)
    await supabase.from('client_notes').insert({ client_email: client.email, note: newNote.trim() })
    setNewNote('')
    await loadNotes()
    setSavingNote(false)
  }

  async function deleteNote(id) {
    await supabase.from('client_notes').delete().eq('id', id)
    loadNotes()
  }

  async function loadBookings() {
    setLoading(true)
    const { data } = await supabase.from('bookings').select('*, training_slots(name, slot_date, start_time, duration_minutes, color)').eq('client_email', client.email).order('created_at', { ascending: false })
    if (data) setBookings(data)
    setLoading(false)
  }

  const confirmed = bookings.filter(b => b.status === 'confirmed')
  const cancelled = bookings.filter(b => b.status === 'cancelled')
  const totalSpent = confirmed.reduce((a, b) => a + (b.price || 0), 0)

  const byType = {}
  confirmed.forEach(b => {
    const name = b.training_slots?.name || 'Neznámý'
    byType[name] = (byType[name] || 0) + 1
  })

  const hue = getHue(client.email)
  const initials = client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const typeColors = {
    'Osobní trénink': '#C8516B',
    'XXL cvičení': '#D4945A',
    'Funkční trénink': '#9B72CF',
  }

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.box}>
        <div style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={s.avatar(hue)}>{initials}</div>
            <div>
              <div style={s.name}>{client.name}</div>
              <div style={s.meta}>📧 {client.email}</div>
              {client.phone && <div style={s.meta}>📱 {client.phone}</div>}
            </div>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={s.statsRow}>
          {[
            { label: 'Celkem tréninků', value: confirmed.length, color: '#2C1A22' },
            { label: 'Zrušeno', value: cancelled.length, color: cancelled.length > 0 ? '#C8516B' : '#2C1A22' },
            { label: 'Utraceno', value: totalSpent > 0 ? `${totalSpent} Kč` : '–', color: '#D4945A' },
            { label: 'Status', value: confirmed.length <= 2 ? 'Nová' : 'Aktivní', color: confirmed.length <= 2 ? '#5B9E98' : '#D4945A' },
          ].map((s2, i) => (
            <div key={i} style={s.stat}>
              <div style={s.statLabel}>{s2.label}</div>
              <div style={{ ...s.statVal, color: s2.color, fontSize: totalSpent > 999 ? 16 : 22 }}>{s2.value}</div>
            </div>
          ))}
        </div>

        {Object.keys(byType).length > 0 && (
          <>
            <div style={s.sectionLabel}>Tréninky podle typu</div>
            <div style={s.typeRow}>
              {Object.entries(byType).map(([name, count]) => (
                <div key={name} style={s.typeCard(typeColors[name] || '#9B7E8A')}>
                  <div style={s.typeLabel}>{name}</div>
                  <div style={{ ...s.typeCount, color: typeColors[name] || '#9B7E8A' }}>{count}×</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ ...s.sectionLabel, marginBottom: 10 }}>Poznámky</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            style={{ flex: 1, background: '#FBF6F8', border: '1px solid #EBCFD8', borderRadius: 10, padding: '10px 14px', color: '#2C1A22', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
            placeholder="Přidat poznámku..."
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addNote()}
          />
          <button onClick={addNote} disabled={!newNote.trim() || savingNote} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#C8516B', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !newNote.trim() ? 0.5 : 1 }}>
            {savingNote ? '...' : '+ Přidat'}
          </button>
        </div>
        {notes.map(n => (
          <div key={n.id} style={{ background: '#FBF6F8', border: '1px solid #EBCFD8', borderRadius: 10, padding: '10px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <div>
              <div style={{ fontSize: 13, color: '#2C1A22', lineHeight: 1.5 }}>{n.note}</div>
              <div style={{ fontSize: 11, color: '#BFA0AD', marginTop: 4 }}>{new Date(n.created_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
            <button onClick={() => deleteNote(n.id)} style={{ background: 'none', border: 'none', color: '#C4ABB4', cursor: 'pointer', fontSize: 16, lineHeight: 1, flexShrink: 0 }}>✕</button>
          </div>
        ))}
        {notes.length === 0 && <div style={{ ...s.empty, padding: '12px 0' }}>Žádné poznámky</div>}

        <div style={{ ...s.sectionLabel, marginTop: 20 }}>Historie rezervací</div>

        {loading && <div style={s.empty}>Načítám...</div>}
        {!loading && bookings.length === 0 && <div style={s.empty}>Žádné rezervace.</div>}

        {bookings.map(b => {
          const slot = b.training_slots
          if (!slot) return null
          const isCancelled = b.status === 'cancelled'
          const dayName = getDayName(slot.slot_date)
          return (
            <div key={b.id} style={s.bookingCard(isCancelled)}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={s.bookingName}>{slot.name}</span>
                  {b.booking_type === 'duo' && <span style={{ fontSize: 10, color: '#9B72CF', fontWeight: 700 }}>DUO</span>}
                  <span style={s.badge(isCancelled ? 'cancelled' : 'confirmed')}>
                    {isCancelled ? 'Zrušeno' : 'Absolvováno'}
                  </span>
                </div>
                <div style={s.bookingMeta}>{dayName}, {formatDate(slot.slot_date)} • {slot.start_time}</div>
              </div>
              {b.price > 0 && !isCancelled && (
                <div style={{ fontSize: 13, color: '#C8516B', fontWeight: 700, flexShrink: 0 }}>{b.price} Kč</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

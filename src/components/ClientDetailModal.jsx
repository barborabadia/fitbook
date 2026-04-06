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
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  box: { background: '#111118', border: '1px solid #1E1E2E', borderRadius: 20, padding: 36, width: 520, maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  closeBtn: { background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 20, flexShrink: 0 },
  avatar: (hue) => ({ width: 52, height: 52, borderRadius: '50%', background: `hsl(${hue}, 50%, 20%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: `hsl(${hue}, 70%, 65%)`, flexShrink: 0 }),
  name: { fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' },
  meta: { fontSize: 13, color: '#555', marginTop: 4 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, margin: '20px 0' },
  stat: { background: '#0A0A0F', border: '1px solid #1E1E2E', borderRadius: 10, padding: '12px 14px', textAlign: 'center' },
  statLabel: { fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 },
  statVal: { fontSize: 22, fontWeight: 800 },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 },
  typeRow: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 },
  typeCard: (color) => ({ background: `${color}10`, border: `1px solid ${color}30`, borderRadius: 12, padding: '14px 16px' }),
  typeLabel: { fontSize: 13, fontWeight: 700 },
  typeCount: { fontSize: 24, fontWeight: 800, marginTop: 4 },
  bookingCard: (cancelled) => ({ background: cancelled ? 'transparent' : '#0A0A0F', border: `1px solid ${cancelled ? '#1A1A28' : '#1E1E2E'}`, borderRadius: 10, padding: '12px 16px', marginBottom: 8, opacity: cancelled ? 0.5 : 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }),
  bookingName: { fontSize: 14, fontWeight: 600 },
  bookingMeta: { fontSize: 12, color: '#555', marginTop: 2 },
  badge: (type) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: type === 'cancelled' ? 'rgba(255,77,0,0.1)' : 'rgba(0,194,168,0.1)', color: type === 'cancelled' ? '#FF4D00' : '#00C2A8', border: `1px solid ${type === 'cancelled' ? 'rgba(255,77,0,0.2)' : 'rgba(0,194,168,0.2)'}` }),
  empty: { textAlign: 'center', color: '#444', padding: '24px 0', fontSize: 14 },
}

export default function ClientDetailModal({ client, onClose }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadBookings() }, [client.email])

  async function loadBookings() {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select('*, training_slots(name, slot_date, start_time, duration_minutes, color)')
      .eq('client_email', client.email)
      .order('created_at', { ascending: false })
    if (data) setBookings(data)
    setLoading(false)
  }

  const confirmed = bookings.filter(b => b.status === 'confirmed')
  const cancelled = bookings.filter(b => b.status === 'cancelled')
  const totalSpent = confirmed.reduce((a, b) => a + (b.price || 0), 0)

  // Statistiky podle typu tréninku
  const byType = {}
  confirmed.forEach(b => {
    const name = b.training_slots?.name || 'Neznámý'
    byType[name] = (byType[name] || 0) + 1
  })

  const hue = getHue(client.email)
  const initials = client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const typeColors = {
    'Osobní trénink': '#FF4D00',
    'XXL cvičení': '#FFB800',
    'Funkční trénink': '#7C3AED',
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
            { label: 'Celkem tréninků', value: confirmed.length, color: '#F0EDE8' },
            { label: 'Zrušeno', value: cancelled.length, color: cancelled.length > 0 ? '#FF4D00' : '#F0EDE8' },
            { label: 'Utraceno', value: totalSpent > 0 ? `${totalSpent} Kč` : '–', color: '#FFB800' },
            { label: 'Status', value: confirmed.length <= 2 ? 'Nový' : 'Aktivní', color: confirmed.length <= 2 ? '#00C2A8' : '#FFB800' },
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
                <div key={name} style={s.typeCard(typeColors[name] || '#666')}>
                  <div style={s.typeLabel}>{name}</div>
                  <div style={{ ...s.typeCount, color: typeColors[name] || '#666' }}>{count}×</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={s.sectionLabel}>Historie rezervací</div>

        {loading && <div style={s.empty}>Načítám...</div>}
        {!loading && bookings.length === 0 && <div style={s.empty}>Žádné rezervace.</div>}

        {bookings.map(b => {
          const slot = b.training_slots
          if (!slot) return null
          const cancelled = b.status === 'cancelled'
          const dayName = getDayName(slot.slot_date)
          return (
            <div key={b.id} style={s.bookingCard(cancelled)}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={s.bookingName}>{slot.name}</span>
                  {b.booking_type === 'duo' && <span style={{ fontSize: 10, color: '#A78BFA', fontWeight: 700 }}>DUO</span>}
                  <span style={s.badge(cancelled ? 'cancelled' : 'confirmed')}>
                    {cancelled ? 'Zrušeno' : 'Absolvováno'}
                  </span>
                </div>
                <div style={s.bookingMeta}>{dayName}, {formatDate(slot.slot_date)} • {slot.start_time}</div>
              </div>
              {b.price > 0 && !cancelled && (
                <div style={{ fontSize: 13, color: '#FF4D00', fontWeight: 700, flexShrink: 0 }}>{b.price} Kč</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

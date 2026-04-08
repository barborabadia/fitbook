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
  box: { background: '#FFFFFF', border: '1px solid #EBCFD8', borderRadius: 20, padding: 36, width: 480, maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(200,81,107,0.15)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  tag: (color) => ({ fontSize: 11, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }),
  title: { fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: '#2C1A22' },
  closeBtn: { background: 'none', border: 'none', color: '#BFA0AD', cursor: 'pointer', fontSize: 20, flexShrink: 0 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 },
  stat: { background: '#FBF6F8', border: '1px solid #EBCFD8', borderRadius: 10, padding: '10px 14px' },
  statLabel: { fontSize: 10, color: '#BFA0AD', textTransform: 'uppercase', letterSpacing: '0.8px' },
  statVal: { fontSize: 18, fontWeight: 800, marginTop: 4, color: '#2C1A22' },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: '#BFA0AD', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 },
  clientCard: (paid) => ({ background: paid ? 'rgba(39,174,96,0.08)' : '#FBF6F8', border: `1px solid ${paid ? 'rgba(39,174,96,0.35)' : '#EBCFD8'}`, borderRadius: 12, padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s' }),
  avatar: (hue) => ({ width: 36, height: 36, borderRadius: '50%', background: `hsl(${hue}, 60%, 88%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: `hsl(${hue}, 50%, 40%)`, flexShrink: 0 }),
  clientName: { fontWeight: 600, fontSize: 14, color: '#2C1A22' },
  clientMeta: { fontSize: 12, color: '#9B7E8A', marginTop: 2 },
  badge: (type) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: type === 'duo' ? 'rgba(155,114,207,0.12)' : 'rgba(91,158,152,0.1)', color: type === 'duo' ? '#9B72CF' : '#5B9E98', border: `1px solid ${type === 'duo' ? 'rgba(155,114,207,0.25)' : 'rgba(91,158,152,0.2)'}`, marginLeft: 6 }),
  empty: { textAlign: 'center', color: '#BFA0AD', padding: '24px 0', fontSize: 14 },
  cancelledBadge: { display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(200,81,107,0.1)', color: '#C8516B', border: '1px solid rgba(200,81,107,0.2)', marginLeft: 6 },
  bar: { height: 6, background: '#F0D9DF', borderRadius: 4, marginBottom: 24, overflow: 'hidden' },
  barFill: (color, ratio) => ({ height: '100%', width: `${Math.min(ratio, 1) * 100}%`, background: ratio >= 1 ? '#C8516B' : color, borderRadius: 4, transition: 'width 0.3s' }),
  paidBtn: (paid) => ({ background: paid ? '#27AE60' : '#fff', border: `1px solid ${paid ? '#27AE60' : '#EBCFD8'}`, borderRadius: 8, padding: '5px 10px', color: paid ? '#fff' : '#9B7E8A', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', whiteSpace: 'nowrap', fontWeight: paid ? 700 : 400, transition: 'all 0.15s' }),
  cancelBtn: { background: 'none', border: '1px solid #EBCFD8', borderRadius: 8, padding: '5px 10px', color: '#9B7E8A', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', whiteSpace: 'nowrap' },
  textarea: { width: '100%', background: '#FBF6F8', border: '1px solid #EBCFD8', borderRadius: 10, padding: '10px 14px', color: '#2C1A22', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: 80 },
  saveBtn: { marginTop: 8, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#C8516B', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
}

export default function SlotDetailModal({ slot, onClose }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState(slot.notes || '')
  const [notesSaved, setNotesSaved] = useState(false)

  useEffect(() => { loadBookings() }, [slot.id])

  async function loadBookings() {
    setLoading(true)
    const { data } = await supabase.from('bookings').select('*').eq('slot_id', slot.id).order('created_at')
    if (data) setBookings(data)
    setLoading(false)
  }

  async function cancelBooking(bookingId) {
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
    loadBookings()
  }

  async function togglePaid(bookingId, currentPaid) {
    await supabase.from('bookings').update({ paid: !currentPaid }).eq('id', bookingId)
    loadBookings()
  }

  async function saveNotes() {
    await supabase.from('training_slots').update({ notes }).eq('id', slot.id)
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }

  const confirmed = bookings.filter(b => b.status === 'confirmed')
  const cancelled = bookings.filter(b => b.status === 'cancelled')
  const ratio = confirmed.length / slot.capacity
  const dayName = getDayName(slot.slot_date)

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.box}>
        <div style={s.header}>
          <div>
            <div style={s.tag(slot.color)}>{dayName}, {formatDate(slot.slot_date)} • {slot.start_time}</div>
            <div style={s.title}>{slot.name}</div>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={s.statsRow}>
          <div style={s.stat}>
            <div style={s.statLabel}>Kapacita</div>
            <div style={s.statVal}>{slot.capacity}</div>
          </div>
          <div style={s.stat}>
            <div style={s.statLabel}>Rezervováno</div>
            <div style={{ ...s.statVal, color: ratio >= 1 ? '#C8516B' : '#2C1A22' }}>{confirmed.length}</div>
          </div>
          <div style={s.stat}>
            <div style={s.statLabel}>Volná místa</div>
            <div style={{ ...s.statVal, color: '#5B9E98' }}>{Math.max(0, slot.capacity - confirmed.length)}</div>
          </div>
        </div>

        <div style={s.bar}>
          <div style={s.barFill(slot.color, ratio)} />
        </div>

        <div style={s.sectionLabel}>Rezervace ({confirmed.length})</div>

        {loading && <div style={s.empty}>Načítám...</div>}

        {!loading && confirmed.length === 0 && (
          <div style={s.empty}>Žádné rezervace na tomto termínu.</div>
        )}

        {confirmed.map(b => {
          const hue = getHue(b.client_email)
          const initials = b.client_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
          const isPersonal = slot.name === 'Osobní trénink'
          return (
            <div key={b.id} style={s.clientCard(b.paid)}>
              <div style={s.avatar(hue)}>{initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                  <span style={s.clientName}>{b.client_name}</span>
                  {isPersonal && <span style={s.badge(b.booking_type)}>{b.booking_type === 'duo' ? 'Duo' : 'Sólo'}</span>}
                  {b.price > 0 && <span style={{ fontSize: 11, color: '#C8516B', fontWeight: 600, marginLeft: 4 }}>{b.price} Kč</span>}
                </div>
                <div style={s.clientMeta}>
                  📧 {b.client_email}
                  {b.client_phone && <span> · 📱 {b.client_phone}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={s.paidBtn(b.paid)} onClick={() => togglePaid(b.id, b.paid)}>
                  {b.paid ? '✓ Zaplaceno' : 'Zaplaceno?'}
                </button>
                <button style={s.cancelBtn} onClick={() => cancelBooking(b.id)}>Zrušit</button>
              </div>
            </div>
          )
        })}

        {cancelled.length > 0 && (
          <>
            <div style={{ ...s.sectionLabel, marginTop: 20 }}>Zrušené rezervace ({cancelled.length})</div>
            {cancelled.map(b => {
              const hue = getHue(b.client_email)
              const initials = b.client_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              return (
                <div key={b.id} style={{ ...s.clientCard(false), opacity: 0.4 }}>
                  <div style={s.avatar(hue)}>{initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={s.clientName}>{b.client_name}</span>
                      <span style={s.cancelledBadge}>Zrušeno</span>
                    </div>
                    <div style={s.clientMeta}>📧 {b.client_email}</div>
                  </div>
                </div>
              )
            })}
          </>
        )}

        <div style={{ marginTop: 24, borderTop: '1px solid #F0D9DF', paddingTop: 20 }}>
          <div style={s.sectionLabel}>Poznámka k tréninku</div>
          <textarea
            style={s.textarea}
            placeholder="Co se cvičilo, poznámky k hodině..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <button style={s.saveBtn} onClick={saveNotes}>
            {notesSaved ? '✓ Uloženo' : 'Uložit poznámku'}
          </button>
        </div>
      </div>
    </div>
  )
}

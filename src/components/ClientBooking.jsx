import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import BookingModal from './BookingModal'
import ClientAuthBar from './ClientAuthBar'
import MyBookings from './MyBookings'

function getMonday(d = new Date()) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function hoursUntilSlot(slotDate, startTime) {
  const slotDateTime = new Date(`${slotDate}T${startTime}:00`)
  return (slotDateTime - new Date()) / (1000 * 60 * 60)
}

const DAYS_FULL = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle']
const ICONS = { 'XXL': '🏆', 'Funkční': '⚡', 'Osobní': '💪', default: '💪' }

function getIcon(name) {
  for (const [key, icon] of Object.entries(ICONS)) { if (name.includes(key)) return icon }
  return ICONS.default
}

function getDayName(dateStr) {
  const day = new Date(dateStr).getDay()
  return DAYS_FULL[day === 0 ? 6 : day - 1]
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' })
}

const s = {
  wrap: { maxWidth: 640, margin: '0 auto', padding: '40px 24px' },
  hero: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: '#2C1A22', fontFamily: "'Cormorant Garamond', serif" },
  sub: { fontSize: 14, color: '#9B7E8A', marginTop: 4 },
  tabRow: { display: 'flex', gap: 8, marginBottom: 24 },
  tab: (active) => ({ padding: '8px 18px', borderRadius: 10, border: `1px solid ${active ? 'rgba(200,81,107,0.3)' : '#EBCFD8'}`, background: active ? 'rgba(200,81,107,0.08)' : '#FFFFFF', color: active ? '#C8516B' : '#9B7E8A', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }),
  weekNav: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#9B7E8A' },
  navBtn: { background: '#FFFFFF', border: '1px solid #EBCFD8', borderRadius: 8, padding: '6px 12px', color: '#9B7E8A', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' },
  dateGroup: { marginBottom: 24 },
  dateHeader: { fontSize: 12, fontWeight: 700, color: '#BFA0AD', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 },
  card: (color, disabled) => ({
    display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderRadius: 12,
    border: `1px solid ${disabled ? '#EBCFD8' : color}`,
    background: disabled ? '#FAFAFA' : color,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1, marginBottom: 8,
    boxShadow: disabled ? 'none' : '0 2px 8px rgba(200,81,107,0.06)',
    transition: 'all 0.15s',
  }),
  icon: (color, disabled) => ({ width: 40, height: 40, borderRadius: 10, background: disabled ? `${color}18` : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }),
  cardName: { fontWeight: 700, fontSize: 14 },
  cardMeta: { fontSize: 12, marginTop: 2 },
  chip: (color) => ({ padding: '3px 12px', background: color, borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#fff' }),
  disabledChip: { padding: '3px 12px', background: '#F5E8EC', borderRadius: 20, fontSize: 11, fontWeight: 600, color: '#BFA0AD', border: '1px solid #EBCFD8' },
  empty: { textAlign: 'center', color: '#BFA0AD', padding: '40px 0', fontSize: 14 },
}

export default function ClientBooking() {
  const [tab, setTab] = useState('book')
  const [monday, setMonday] = useState(getMonday())
  const [slots, setSlots] = useState([])
  const [bookingCounts, setBookingCounts] = useState({})
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loggedInUser, setLoggedInUser] = useState(null)

  const weekDates = Array.from({ length: 7 }, (_, i) => toDateStr(addDays(monday, i)))

  useEffect(() => { loadData() }, [monday])

  async function loadData() {
    setLoading(true)
    const { data: sl } = await supabase.from('training_slots').select('*').gte('slot_date', weekDates[0]).lte('slot_date', weekDates[6]).eq('is_cancelled', false).order('slot_date').order('start_time')
    if (sl) setSlots(sl)
    if (sl && sl.length > 0) {
      const { data: bk } = await supabase.from('bookings').select('slot_id').in('slot_id', sl.map(s => s.id)).eq('status', 'confirmed')
      if (bk) {
        const counts = {}
        bk.forEach(b => { counts[b.slot_id] = (counts[b.slot_id] || 0) + 1 })
        setBookingCounts(counts)
      }
    }
    setLoading(false)
  }

  const prefill = loggedInUser ? { name: loggedInUser.user_metadata?.full_name || '', email: loggedInUser.email || '', phone: '' } : null

  const slotsByDate = {}
  slots.forEach(sl => {
    if (!slotsByDate[sl.slot_date]) slotsByDate[sl.slot_date] = []
    slotsByDate[sl.slot_date].push(sl)
  })

  return (
    <div style={s.wrap}>
      <div style={s.hero}>
        <div style={s.title}>Barbora Knížková 🌸</div>
        <div style={{ fontSize: 13, color: '#C8516B', marginTop: 2, fontWeight: 600 }}>Cvičení pro ženy</div>
        <div style={s.sub}>Rezervace fitness tréninků</div>
      </div>

      <div style={s.tabRow}>
        <button style={s.tab(tab === 'book')} onClick={() => setTab('book')}>📅 Rezervovat trénink</button>
        <button style={s.tab(tab === 'my')} onClick={() => setTab('my')}>📋 Moje rezervace</button>
      </div>

      {tab === 'my' && <MyBookings prefillEmail={loggedInUser?.email || null} />}

      {tab === 'book' && (
        <>
          <ClientAuthBar onUserChange={setLoggedInUser} />

          <div style={s.weekNav}>
            <button style={s.navBtn} onClick={() => setMonday(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })}>←</button>
            <div style={s.weekLabel}>{weekDates[0]} – {weekDates[6]}</div>
            <button style={s.navBtn} onClick={() => setMonday(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })}>→</button>
          </div>

          {loading && <div style={s.empty}>Načítám tréninky...</div>}
          {!loading && slots.length === 0 && <div style={s.empty}>Tento týden nejsou žádné termíny.<br />Zkus jiný týden.</div>}

          {Object.entries(slotsByDate).map(([date, daySlots]) => (
            <div key={date} style={s.dateGroup}>
              <div style={s.dateHeader}>{getDayName(date)} – {formatDate(date)}</div>
              {daySlots.map(sl => {
                const booked = bookingCounts[sl.id] || 0
                const free = sl.capacity - booked
                const full = free <= 0
                const isPersonal = sl.name === 'Osobní trénink'
                const hours = hoursUntilSlot(sl.slot_date, sl.start_time)
                const tooLate = isPersonal ? hours < 24 : hours < 0
                const disabled = full || tooLate

                return (
                  <div key={sl.id} style={s.card(sl.color, disabled)} onClick={() => !disabled && setSelected({ ...sl, booked })}>
                    <div style={s.icon(sl.color, disabled)}>{getIcon(sl.name)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ ...s.cardName, color: disabled ? '#2C1A22' : '#fff' }}>{sl.name}</div>
                      <div style={{ ...s.cardMeta, color: disabled ? '#9B7E8A' : 'rgba(255,255,255,0.8)' }}>
                        {sl.start_time} • {sl.duration_minutes} min
                        {!isPersonal && free > 0 && !full && <span style={{ marginLeft: 8, color: disabled ? '#BFA0AD' : 'rgba(255,255,255,0.6)' }}>{free} volných míst</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {full && <span style={{ fontSize: 12, color: '#C8516B', fontWeight: 600 }}>Plno</span>}
                      {!full && tooLate && <span style={s.disabledChip}>Uzavřeno</span>}
                      {!full && !tooLate && <div style={{ ...s.chip(sl.color), background: '#fff', color: sl.color }}>Rezervovat</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </>
      )}

      {selected && <BookingModal slot={selected} prefill={prefill} onClose={async () => { setSelected(null); await loadData() }} />}
    </div>
  )
}

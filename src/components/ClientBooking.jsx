import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import BookingModal from './BookingModal'
import ClientAuthBar from './ClientAuthBar'

const DAYS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']
const ICONS = {
  'HIIT': '⚡', 'Silový': '🏋️', 'Kruhový': '🔄', 'Protah': '🧘', 'Víkend': '🏆', default: '💪'
}

function getMonday(d = new Date()) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function getIcon(name) {
  for (const [key, icon] of Object.entries(ICONS)) {
    if (name.includes(key)) return icon
  }
  return ICONS.default
}

const s = {
  wrap: { maxWidth: 640, margin: '0 auto', padding: '40px 24px' },
  hero: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' },
  sub: { fontSize: 14, color: '#555', marginTop: 4 },
  card: (color, full) => ({
    display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 14,
    border: `1px solid ${full ? '#1E1E2E' : color + '44'}`,
    background: full ? 'transparent' : `${color}08`,
    cursor: full ? 'not-allowed' : 'pointer', opacity: full ? 0.45 : 1, marginBottom: 10,
    transition: 'all 0.15s',
  }),
  icon: (color) => ({
    width: 48, height: 48, borderRadius: 12, background: `${color}20`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
  }),
  cardName: { fontWeight: 700, fontSize: 15 },
  cardMeta: { fontSize: 12, color: '#555', marginTop: 2 },
  chip: (color) => ({
    padding: '4px 14px', background: color, borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#fff',
  }),
  freeCount: (full) => ({ fontSize: 12, color: full ? '#FF4D00' : '#555', marginBottom: 4, textAlign: 'right' }),
  empty: { textAlign: 'center', color: '#444', padding: '40px 0', fontSize: 14 },
}

export default function ClientBooking() {
  const [trainings, setTrainings] = useState([])
  const [bookingCounts, setBookingCounts] = useState({})
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loggedInUser, setLoggedInUser] = useState(null)

  const monday = getMonday()
  const weekStart = monday.toISOString().split('T')[0]

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: tr } = await supabase.from('trainings').select('*').order('day_of_week').order('start_time')
    if (tr) setTrainings(tr)

    const { data: bk } = await supabase
      .from('bookings').select('training_id')
      .eq('week_start', weekStart).eq('status', 'confirmed')

    if (bk) {
      const counts = {}
      bk.forEach(b => { counts[b.training_id] = (counts[b.training_id] || 0) + 1 })
      setBookingCounts(counts)
    }
    setLoading(false)
  }

  async function handleClose() {
    setSelected(null)
    await loadData()
  }

  // Předvyplněné údaje z přihlášeného účtu
  const prefill = loggedInUser ? {
    name: loggedInUser.user_metadata?.full_name || '',
    email: loggedInUser.email || '',
    phone: loggedInUser.user_metadata?.phone || '',
  } : null

  return (
    <div style={s.wrap}>
      <div style={s.hero}>
        <div style={s.title}>Vyber si trénink 💪</div>
        <div style={s.sub}>Klikni na volný termín a rezervuj si místo</div>
      </div>

      <ClientAuthBar onUserChange={setLoggedInUser} />

      {loading && <div style={s.empty}>Načítám tréninky...</div>}
      {!loading && trainings.length === 0 && (
        <div style={s.empty}>Momentálně nejsou vypsány žádné tréninky.</div>
      )}

      {trainings.map(t => {
        const booked = bookingCounts[t.id] || 0
        const free = t.capacity - booked
        const full = free <= 0
        return (
          <div key={t.id} style={s.card(t.color, full)}
            onClick={() => !full && setSelected({ ...t, booked, weekStart })}>
            <div style={s.icon(t.color)}>{getIcon(t.name)}</div>
            <div style={{ flex: 1 }}>
              <div style={s.cardName}>{t.name}</div>
              <div style={s.cardMeta}>{DAYS[t.day_of_week]} • {t.start_time} • {t.duration_minutes} min</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={s.freeCount(full)}>{full ? 'Plno' : `${free} volných míst`}</div>
              {!full && <div style={s.chip(t.color)}>Rezervovat</div>}
            </div>
          </div>
        )
      })}

      {selected && (
        <BookingModal
          training={selected}
          prefill={prefill}
          onClose={handleClose}
        />
      )}
    </div>
  )
}

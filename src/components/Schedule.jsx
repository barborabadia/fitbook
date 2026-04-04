import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DAYS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

function getMonday(d = new Date()) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatDate(monday, dayOffset) {
  const d = new Date(monday)
  d.setDate(d.getDate() + dayOffset)
  return d.toISOString().split('T')[0]
}

function formatWeekLabel(monday) {
  const end = new Date(monday)
  end.setDate(end.getDate() + 6)
  const opts = { day: 'numeric', month: 'long' }
  return `${monday.toLocaleDateString('cs-CZ', opts)} – ${end.toLocaleDateString('cs-CZ', { ...opts, year: 'numeric' })}`
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  title: { fontSize: 32, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.1 },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  btnRow: { display: 'flex', gap: 10 },
  btn: (v = 'secondary') => ({
    padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 600,
    background: v === 'primary' ? '#FF4D00' : '#1A1A28',
    color: v === 'primary' ? '#fff' : '#888',
  }),
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 },
  stat: { background: '#111118', border: '1px solid #1E1E2E', borderRadius: 16, padding: '20px 24px' },
  statLabel: { fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: 800, letterSpacing: '-1px' },
  statSub: { fontSize: 12, color: '#444', marginTop: 4 },
  weekGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 },
  dayCol: (has) => ({
    background: has ? '#111118' : 'transparent',
    border: has ? '1px solid #1E1E2E' : '1px solid transparent',
    borderRadius: 14, padding: '12px 8px', minHeight: 240,
  }),
  dayLabel: (active) => ({
    fontSize: 11, fontWeight: 700,
    color: active ? '#FF4D00' : '#333',
    textTransform: 'uppercase', letterSpacing: '0.8px',
    textAlign: 'center', marginBottom: 10,
  }),
  card: (color, full) => ({
    background: full ? 'rgba(255,77,0,0.05)' : `${color}15`,
    border: `1px solid ${full ? 'rgba(255,77,0,0.2)' : color + '44'}`,
    borderRadius: 10, padding: '8px 10px', marginBottom: 8, cursor: 'pointer',
  }),
  cardTime: { fontSize: 10, color: '#666', fontWeight: 600 },
  cardName: { fontSize: 12, fontWeight: 700, marginTop: 2 },
  bar: { height: 3, background: '#1E1E2E', borderRadius: 2, marginTop: 6 },
  fill: (color, ratio) => ({
    height: '100%', width: `${Math.min(ratio, 1) * 100}%`,
    background: ratio >= 1 ? '#FF4D00' : color, borderRadius: 2,
  }),
  cardSub: { fontSize: 10, color: '#555', marginTop: 4 },
}

export default function Schedule({ onSelectTraining }) {
  const [monday, setMonday] = useState(getMonday())
  const [trainings, setTrainings] = useState([])
  const [bookingCounts, setBookingCounts] = useState({})
  const [loading, setLoading] = useState(true)

  const weekStart = monday.toISOString().split('T')[0]

  useEffect(() => {
    loadData()
  }, [weekStart])

  async function loadData() {
    setLoading(true)
    // Načti tréninky
    const { data: tr } = await supabase.from('trainings').select('*').order('day_of_week').order('start_time')
    if (tr) setTrainings(tr)

    // Načti počty rezervací pro tento týden
    const { data: bk } = await supabase
      .from('bookings')
      .select('training_id, id')
      .eq('week_start', weekStart)
      .eq('status', 'confirmed')

    if (bk) {
      const counts = {}
      bk.forEach(b => { counts[b.training_id] = (counts[b.training_id] || 0) + 1 })
      setBookingCounts(counts)
    }
    setLoading(false)
  }

  const totalBookings = Object.values(bookingCounts).reduce((a, b) => a + b, 0)
  const totalCapacity = trainings.reduce((a, t) => a + t.capacity, 0)

  return (
    <div>
      <div style={s.header}>
        <div>
          <div style={s.title}>Týdenní rozvrh</div>
          <div style={s.subtitle}>{formatWeekLabel(monday)}</div>
        </div>
        <div style={s.btnRow}>
          <button style={s.btn()} onClick={() => setMonday(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })}>← Předchozí</button>
          <button style={s.btn()} onClick={() => setMonday(getMonday())}>Tento týden</button>
          <button style={s.btn()} onClick={() => setMonday(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })}>Následující →</button>
        </div>
      </div>

      <div style={s.statsRow}>
        {[
          { label: 'Tréninků tento týden', value: trainings.length, sub: 'různých lekcí' },
          { label: 'Celkem rezervací', value: totalBookings, sub: `z ${totalCapacity} míst` },
          { label: 'Obsazenost', value: totalCapacity ? `${Math.round(totalBookings / totalCapacity * 100)}%` : '0%', sub: 'průměrné využití' },
          { label: 'Volná místa', value: totalCapacity - totalBookings, sub: 'zbývá tento týden' },
        ].map((s2, i) => (
          <div key={i} style={s.stat}>
            <div style={s.statLabel}>{s2.label}</div>
            <div style={s.statValue}>{loading ? '…' : s2.value}</div>
            <div style={s.statSub}>{s2.sub}</div>
          </div>
        ))}
      </div>

      <div style={s.weekGrid}>
        {DAYS.map((day, i) => {
          const dayTrainings = trainings.filter(t => t.day_of_week === i)
          return (
            <div key={i} style={s.dayCol(dayTrainings.length > 0)}>
              <div style={s.dayLabel(dayTrainings.length > 0)}>{day}</div>
              {dayTrainings.map(t => {
                const booked = bookingCounts[t.id] || 0
                const ratio = booked / t.capacity
                const full = ratio >= 1
                return (
                  <div key={t.id} style={s.card(t.color, full)}
                    onClick={() => onSelectTraining({ ...t, booked, weekStart })}>
                    <div style={s.cardTime}>{t.start_time}</div>
                    <div style={{ ...s.cardName, color: t.color }}>{t.name}</div>
                    <div style={s.bar}><div style={s.fill(t.color, ratio)} /></div>
                    <div style={s.cardSub}>{full ? '🔴 plno' : `${booked}/${t.capacity} míst`}</div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

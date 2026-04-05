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

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function toDateStr(date) {
  return date.toISOString().split('T')[0]
}

function formatWeekLabel(monday) {
  const end = addDays(monday, 6)
  const opts = { day: 'numeric', month: 'long' }
  return `${monday.toLocaleDateString('cs-CZ', opts)} – ${end.toLocaleDateString('cs-CZ', { ...opts, year: 'numeric' })}`
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 },
  title: { fontSize: 32, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.1 },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  btnRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  btn: (v = 'secondary') => ({
    padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
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
    borderRadius: 14, padding: '12px 8px', minHeight: 200,
  }),
  dayLabel: (active) => ({
    fontSize: 11, fontWeight: 700, color: active ? '#FF4D00' : '#333',
    textTransform: 'uppercase', letterSpacing: '0.8px', textAlign: 'center', marginBottom: 10,
  }),
  card: (color, full, cancelled) => ({
    background: cancelled ? 'transparent' : full ? 'rgba(255,77,0,0.05)' : `${color}15`,
    border: `1px solid ${cancelled ? '#1E1E2E' : full ? 'rgba(255,77,0,0.2)' : color + '44'}`,
    borderRadius: 10, padding: '8px 10px', marginBottom: 6,
    cursor: cancelled ? 'default' : 'pointer', opacity: cancelled ? 0.4 : 1,
  }),
  cardTime: { fontSize: 10, color: '#666', fontWeight: 600 },
  cardName: { fontSize: 12, fontWeight: 700, marginTop: 2 },
  bar: { height: 3, background: '#1E1E2E', borderRadius: 2, marginTop: 6 },
  fill: (color, ratio) => ({ height: '100%', width: `${Math.min(ratio, 1) * 100}%`, background: ratio >= 1 ? '#FF4D00' : color, borderRadius: 2 }),
  cardSub: { fontSize: 10, color: '#555', marginTop: 4 },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalBox: { background: '#111118', border: '1px solid #1E1E2E', borderRadius: 20, padding: 32, width: 420, maxWidth: '90vw' },
  input: { width: '100%', background: '#0A0A0F', border: '1px solid #1E1E2E', borderRadius: 10, padding: '10px 14px', color: '#F0EDE8', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 10 },
  label: { fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6, marginTop: 12 },
  select: { width: '100%', background: '#0A0A0F', border: '1px solid #1E1E2E', borderRadius: 10, padding: '10px 14px', color: '#F0EDE8', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 10 },
}

export default function Schedule({ onSelectSlot }) {
  const [monday, setMonday] = useState(getMonday())
  const [slots, setSlots] = useState([])
  const [bookingCounts, setBookingCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [templates, setTemplates] = useState([])
  const [newSlot, setNewSlot] = useState({ date: '', time: '', name: 'Osobní trénink', duration: 60, capacity: 1, color: '#FF4D00' })

  const weekDates = Array.from({ length: 7 }, (_, i) => toDateStr(addDays(monday, i)))

  useEffect(() => { loadData() }, [monday])

  async function loadData() {
    setLoading(true)
    const { data: sl } = await supabase.from('training_slots').select('*').gte('slot_date', weekDates[0]).lte('slot_date', weekDates[6]).order('slot_date').order('start_time')
    if (sl) setSlots(sl)

    if (sl && sl.length > 0) {
      const { data: bk } = await supabase.from('bookings').select('slot_id').in('slot_id', sl.map(s => s.id)).eq('status', 'confirmed')
      if (bk) {
        const counts = {}
        bk.forEach(b => { counts[b.slot_id] = (counts[b.slot_id] || 0) + 1 })
        setBookingCounts(counts)
      }
    }

    const { data: tmpl } = await supabase.from('training_templates').select('*').eq('is_active', true)
    if (tmpl) setTemplates(tmpl)
    setLoading(false)
  }

  async function generateWeek() {
    setGenerating(true)
    const inserts = []
    for (let i = 0; i < 7; i++) {
      const date = addDays(monday, i)
      const dayTemplates = templates.filter(t => t.day_of_week === i)
      for (const t of dayTemplates) {
        const exists = slots.find(s => s.slot_date === toDateStr(date) && s.start_time === t.start_time && s.template_id === t.id)
        if (!exists) {
          inserts.push({ template_id: t.id, name: t.name, slot_date: toDateStr(date), start_time: t.start_time, duration_minutes: t.duration_minutes, capacity: t.capacity, color: t.color, description: t.description, price: t.price })
        }
      }
    }
    if (inserts.length > 0) await supabase.from('training_slots').insert(inserts)
    setShowGenerateModal(false)
    setGenerating(false)
    loadData()
  }

  async function addSlot() {
    if (!newSlot.date || !newSlot.time) return
    await supabase.from('training_slots').insert({ name: newSlot.name, slot_date: newSlot.date, start_time: newSlot.time, duration_minutes: parseInt(newSlot.duration), capacity: parseInt(newSlot.capacity), color: newSlot.color, price: newSlot.name === 'Osobní trénink' ? 200 : 0 })
    setShowAddModal(false)
    setNewSlot({ date: '', time: '', name: 'Osobní trénink', duration: 60, capacity: 1, color: '#FF4D00' })
    loadData()
  }

  async function removeSlot(sl) {
    const booked = bookingCounts[sl.id] || 0
    if (booked > 0) await supabase.from('training_slots').update({ is_cancelled: true }).eq('id', sl.id)
    else await supabase.from('training_slots').delete().eq('id', sl.id)
    loadData()
  }

  const activeSlots = slots.filter(s => !s.is_cancelled)
  const totalBookings = Object.values(bookingCounts).reduce((a, b) => a + b, 0)
  const totalCapacity = activeSlots.reduce((a, s) => a + s.capacity, 0)

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
          <button style={s.btn('primary')} onClick={() => setShowGenerateModal(true)}>⚡ Generovat týden</button>
          <button style={s.btn('primary')} onClick={() => setShowAddModal(true)}>+ Přidat termín</button>
        </div>
      </div>

      <div style={s.statsRow}>
        {[
          { label: 'Termínů tento týden', value: activeSlots.length, sub: 'aktivních' },
          { label: 'Celkem rezervací', value: totalBookings, sub: `z ${totalCapacity} míst` },
          { label: 'Obsazenost', value: totalCapacity ? `${Math.round(totalBookings / totalCapacity * 100)}%` : '0%', sub: 'průměrné využití' },
          { label: 'Volná místa', value: totalCapacity - totalBookings, sub: 'zbývá' },
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
          const daySlots = slots.filter(sl => sl.slot_date === weekDates[i])
          return (
            <div key={i} style={s.dayCol(daySlots.length > 0)}>
              <div style={s.dayLabel(daySlots.length > 0)}>{day}</div>
              {daySlots.map(sl => {
                const booked = bookingCounts[sl.id] || 0
                const ratio = booked / sl.capacity
                const full = ratio >= 1
                return (
                  <div key={sl.id} style={s.card(sl.color, full, sl.is_cancelled)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }} onClick={() => !sl.is_cancelled && onSelectSlot({ ...sl, booked })}>
                        <div style={s.cardTime}>{sl.start_time}</div>
                        <div style={{ ...s.cardName, color: sl.is_cancelled ? '#444' : sl.color }}>{sl.name}</div>
                        {!sl.is_cancelled && <><div style={s.bar}><div style={s.fill(sl.color, ratio)} /></div><div style={s.cardSub}>{full ? '🔴 plno' : `${booked}/${sl.capacity}`}</div></>}
                        {sl.is_cancelled && <div style={s.cardSub}>zrušeno</div>}
                      </div>
                      {!sl.is_cancelled && (
                        <button onClick={() => removeSlot(sl)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 14, padding: '0 0 0 6px', lineHeight: 1 }} title="Odebrat termín">✕</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {showGenerateModal && (
        <div style={s.modal} onClick={e => e.target === e.currentTarget && setShowGenerateModal(false)}>
          <div style={s.modalBox}>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>⚡ Generovat týden</div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
              Vygeneruje všechny termíny pro <strong style={{ color: '#F0EDE8' }}>{formatWeekLabel(monday)}</strong> ze šablon. Termíny které už existují se nepřidají znovu.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ ...s.btn(), flex: 1 }} onClick={() => setShowGenerateModal(false)}>Zrušit</button>
              <button style={{ ...s.btn('primary'), flex: 2 }} onClick={generateWeek} disabled={generating}>{generating ? 'Generuji...' : '⚡ Generovat'}</button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div style={s.modal} onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
          <div style={s.modalBox}>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>+ Přidat termín</div>
            <label style={s.label}>Typ tréninku</label>
            <select style={s.select} value={newSlot.name} onChange={e => {
              const name = e.target.value
              setNewSlot({ ...newSlot, name, color: name === 'XXL cvičení' ? '#FFB800' : name === 'Funkční trénink' ? '#7C3AED' : '#FF4D00', capacity: name === 'XXL cvičení' ? 12 : name === 'Funkční trénink' ? 8 : 1 })
            }}>
              <option>Osobní trénink</option>
              <option>XXL cvičení</option>
              <option>Funkční trénink</option>
            </select>
            <label style={s.label}>Datum</label>
            <input style={s.input} type="date" value={newSlot.date} onChange={e => setNewSlot({ ...newSlot, date: e.target.value })} />
            <label style={s.label}>Čas začátku</label>
            <input style={s.input} type="time" value={newSlot.time} onChange={e => setNewSlot({ ...newSlot, time: e.target.value })} />
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button style={{ ...s.btn(), flex: 1 }} onClick={() => setShowAddModal(false)}>Zrušit</button>
              <button style={{ ...s.btn('primary'), flex: 2 }} onClick={addSlot} disabled={!newSlot.date || !newSlot.time}>Přidat termín</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

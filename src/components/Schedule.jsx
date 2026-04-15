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
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatWeekLabel(monday) {
  const end = addDays(monday, 6)
  const opts = { day: 'numeric', month: 'long' }
  return `${monday.toLocaleDateString('cs-CZ', opts)} – ${end.toLocaleDateString('cs-CZ', { ...opts, year: 'numeric' })}`
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 },
  title: { fontSize: 32, fontWeight: 700, letterSpacing: '-1px', lineHeight: 1.1, color: '#2C1A22', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  subtitle: { fontSize: 14, color: '#9B7E8A', marginTop: 4 },
  btnRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  btn: (v = 'secondary') => ({
    padding: '10px 16px', borderRadius: 10, border: v === 'secondary' ? '1px solid #EBCFD8' : 'none',
    cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
    background: v === 'primary' ? '#C8516B' : '#FFFFFF',
    color: v === 'primary' ? '#fff' : '#9B7E8A',
  }),
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 },
  stat: { background: '#FFFFFF', border: '1px solid #EBCFD8', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(200,81,107,0.05)' },
  statLabel: { fontSize: 11, color: '#9B7E8A', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: '#2C1A22' },
  statSub: { fontSize: 12, color: '#BFA0AD', marginTop: 4 },
  weekGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 },
  dayCol: (has) => ({
    background: has ? '#FFFFFF' : 'transparent',
    border: has ? '1px solid #EBCFD8' : '1px solid transparent',
    borderRadius: 14, padding: '12px 8px', minHeight: 200,
    boxShadow: has ? '0 2px 12px rgba(200,81,107,0.04)' : 'none',
  }),
  dayLabel: (active) => ({
    fontSize: 11, fontWeight: 700, color: active ? '#C8516B' : '#C4ABB4',
    textTransform: 'uppercase', letterSpacing: '0.8px', textAlign: 'center', marginBottom: 10,
  }),
  card: (color, full, cancelled) => ({
    background: cancelled ? 'transparent' : '#C8516B',
    border: `1px solid ${cancelled ? '#EBCFD8' : '#C8516B'}`,
    borderRadius: 10, padding: '8px 10px', marginBottom: 6,
    cursor: cancelled ? 'default' : 'pointer', opacity: cancelled ? 0.4 : 1,
  }),
  cardTime: { fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: 600 },
  cardName: { fontSize: 12, fontWeight: 700, marginTop: 2, color: '#fff' },
  bar: { height: 3, background: 'rgba(255,255,255,0.3)', borderRadius: 2, marginTop: 6 },
  fill: (color, ratio) => ({ height: '100%', width: `${Math.min(ratio, 1) * 100}%`, background: 'rgba(255,255,255,0.85)', borderRadius: 2 }),
  cardSub: { fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  modal: { position: 'fixed', inset: 0, background: 'rgba(44,26,34,0.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalBox: { background: '#FFFFFF', border: '1px solid #EBCFD8', borderRadius: 20, padding: 32, width: 420, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(200,81,107,0.15)' },
  input: { width: '100%', background: '#FBF6F8', border: '1px solid #EBCFD8', borderRadius: 10, padding: '10px 14px', color: '#2C1A22', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 10 },
  label: { fontSize: 11, fontWeight: 600, color: '#9B7E8A', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6, marginTop: 12 },
  select: { width: '100%', background: '#FBF6F8', border: '1px solid #EBCFD8', borderRadius: 10, padding: '10px 14px', color: '#2C1A22', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 10 },
}

const DAYS_FULL = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle']

export default function Schedule({ onSelectSlot, refreshKey, isMobile }) {
  const [monday, setMonday] = useState(getMonday())
  const [slots, setSlots] = useState([])
  const [bookingCounts, setBookingCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [templates, setTemplates] = useState([])
  const [bookingTypes, setBookingTypes] = useState({})
  const [paidCounts, setPaidCounts] = useState({})
  const [newSlot, setNewSlot] = useState({ date: '', time: '', name: 'Osobní trénink', duration: 60, capacity: 1, color: '#C8516B', price: 200 })

  const weekDates = Array.from({ length: 7 }, (_, i) => toDateStr(addDays(monday, i)))

  useEffect(() => { loadData() }, [monday, refreshKey])

  async function loadData() {
    setLoading(true)
    const { data: sl } = await supabase.from('training_slots').select('*').gte('slot_date', weekDates[0]).lte('slot_date', weekDates[6]).order('slot_date').order('start_time')
    if (sl) setSlots(sl)

    if (sl && sl.length > 0) {
      const { data: bk } = await supabase.from('bookings').select('slot_id, booking_type, paid').in('slot_id', sl.map(s => s.id)).eq('status', 'confirmed')
      if (bk) {
        const counts = {}
        const types = {}
        const paid = {}
        bk.forEach(b => {
          counts[b.slot_id] = (counts[b.slot_id] || 0) + 1
          types[b.slot_id] = b.booking_type
          if (b.paid) paid[b.slot_id] = (paid[b.slot_id] || 0) + 1
        })
        setBookingCounts(counts)
        setBookingTypes(types)
        setPaidCounts(paid)
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
    await supabase.from('training_slots').insert({ name: newSlot.name, slot_date: newSlot.date, start_time: newSlot.time, duration_minutes: parseInt(newSlot.duration), capacity: parseInt(newSlot.capacity), color: newSlot.color, price: newSlot.price })
    setShowAddModal(false)
    setNewSlot({ date: '', time: '', name: 'Osobní trénink', duration: 60, capacity: 1, color: '#C8516B', price: 200 })
    loadData()
  }

  function getSlotDefaults(name) {
    if (name === 'Osobní trénink') return { color: '#C8516B', capacity: 1, price: 200 }
    if (name.includes('Zbůch')) return { color: name.includes('XXL') ? '#D4945A' : name.includes('Posilování') ? '#5B9E98' : '#9B72CF', capacity: 10, price: 130 }
    if (name.includes('Stod')) return { color: name.includes('XXL') ? '#D4945A' : '#9B72CF', capacity: 10, price: 120 }
    return { color: '#C8516B', capacity: 1, price: 0 }
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

  const slotsByDate = {}
  slots.forEach(sl => {
    if (!slotsByDate[sl.slot_date]) slotsByDate[sl.slot_date] = []
    slotsByDate[sl.slot_date].push(sl)
  })

  if (isMobile) {
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', color: '#2C1A22', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Týdenní rozvrh</div>
          <div style={{ fontSize: 13, color: '#9B7E8A', marginTop: 2 }}>{formatWeekLabel(monday)}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Termínů', value: activeSlots.length },
            { label: 'Rezervací', value: totalBookings },
            { label: 'Obsazenost', value: totalCapacity ? `${Math.round(totalBookings / totalCapacity * 100)}%` : '0%' },
            { label: 'Volná místa', value: totalCapacity - totalBookings },
          ].map((st, i) => (
            <div key={i} style={s.stat}>
              <div style={s.statLabel}>{st.label}</div>
              <div style={{ ...s.statValue, fontSize: 22 }}>{loading ? '…' : st.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button style={s.btn()} onClick={() => setMonday(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })}>←</button>
          <button style={{ ...s.btn(), flex: 1 }} onClick={() => setMonday(getMonday())}>Tento týden</button>
          <button style={s.btn()} onClick={() => setMonday(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })}>→</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button style={{ ...s.btn('primary'), flex: 1 }} onClick={() => setShowGenerateModal(true)}>⚡ Generovat</button>
          <button style={{ ...s.btn('primary'), flex: 1 }} onClick={() => setShowAddModal(true)}>+ Přidat termín</button>
        </div>

        {loading && <div style={{ textAlign: 'center', color: '#BFA0AD', padding: '24px 0' }}>Načítám...</div>}
        {!loading && Object.keys(slotsByDate).length === 0 && <div style={{ textAlign: 'center', color: '#BFA0AD', padding: '24px 0', fontSize: 14 }}>Tento týden nejsou žádné termíny.</div>}

        {weekDates.map((date, i) => {
          const daySlots = slotsByDate[date]
          if (!daySlots?.length) return null
          return (
            <div key={date} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#BFA0AD', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
                {DAYS_FULL[i]} — {new Date(date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' })}
              </div>
              {daySlots.map(sl => {
                const booked = bookingCounts[sl.id] || 0
                const ratio = booked / sl.capacity
                const full = ratio >= 1
                const allPaid = booked > 0 && (paidCounts[sl.id] || 0) >= booked
                const cardBg = sl.is_cancelled ? '#f5f5f5' : allPaid ? '#27AE60' : '#C8516B'
                const cardBorder = sl.is_cancelled ? '#EBCFD8' : allPaid ? '#27AE60' : '#C8516B'
                return (
                  <div key={sl.id} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: sl.is_cancelled ? 0.4 : 1 }}>
                    <div style={{ flex: 1 }} onClick={() => !sl.is_cancelled && onSelectSlot({ ...sl, booked })}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: sl.is_cancelled ? '#9B7E8A' : '#fff' }}>{sl.name}</div>
                      <div style={{ fontSize: 12, color: sl.is_cancelled ? '#BFA0AD' : 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                        {sl.start_time} • {sl.duration_minutes} min
                        {!sl.is_cancelled && ` • ${full ? '🔴 plno' : `${booked}/${sl.capacity}`}`}
                        {sl.is_cancelled && ' • zrušeno'}
                      </div>
                      {!sl.is_cancelled && sl.name === 'Osobní trénink' && booked > 0 && (
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
                          {bookingTypes[sl.id] === 'duo' ? '👯 Duo' : '🧘 Sólo'}
                        </div>
                      )}
                      {!sl.is_cancelled && sl.notes && (
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 5, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          📝 {sl.notes}
                        </div>
                      )}
                    </div>
                    {!sl.is_cancelled && (
                      <button onClick={() => removeSlot(sl)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 13, padding: '6px 10px', marginLeft: 8 }}>✕</button>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}

        {showGenerateModal && (
          <div style={s.modal} onClick={e => e.target === e.currentTarget && setShowGenerateModal(false)}>
            <div style={s.modalBox}>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: '#2C1A22' }}>⚡ Generovat týden</div>
              <div style={{ fontSize: 14, color: '#9B7E8A', marginBottom: 24, lineHeight: 1.6 }}>
                Vygeneruje termíny pro <strong style={{ color: '#2C1A22' }}>{formatWeekLabel(monday)}</strong> ze šablon.
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
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, color: '#2C1A22' }}>+ Přidat termín</div>
              <label style={s.label}>Typ tréninku</label>
              <select style={s.select} value={newSlot.name} onChange={e => {
                const name = e.target.value
                setNewSlot({ ...newSlot, name, ...getSlotDefaults(name) })
              }}>
                <optgroup label="Stod">
                  <option>Osobní trénink</option>
                  <option>XXL cvičení - Stod</option>
                  <option>Funkční trénink - Stod</option>
                </optgroup>
                <optgroup label="Zbůch">
                  <option>XXL cvičení - Zbůch</option>
                  <option>Posilování na hudbu - Zbůch</option>
                  <option>FIT Orient - Zbůch</option>
                </optgroup>
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
                const allPaid = booked > 0 && (paidCounts[sl.id] || 0) >= booked
                const cardBg = sl.is_cancelled ? 'transparent' : allPaid ? '#27AE60' : '#C8516B'
                const cardBorder = sl.is_cancelled ? '#EBCFD8' : allPaid ? '#27AE60' : '#C8516B'
                return (
                  <div key={sl.id} style={{ ...s.card(sl.color, full, sl.is_cancelled), background: cardBg, border: `1px solid ${cardBorder}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }} onClick={() => !sl.is_cancelled && onSelectSlot({ ...sl, booked })}>
                        <div style={s.cardTime}>{sl.start_time}</div>
                        <div style={{ ...s.cardName, color: sl.is_cancelled ? '#BFA0AD' : '#fff' }}>{sl.name}</div>
                        {!sl.is_cancelled && <>
                          <div style={s.bar}><div style={s.fill(sl.color, ratio)} /></div>
                          <div style={s.cardSub}>{full ? '🔴 plno' : `${booked}/${sl.capacity}`}</div>
                          {sl.name === 'Osobní trénink' && booked > 0 && (
                            <div style={{ marginTop: 4, display: 'inline-block', fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.25)', color: '#fff', borderRadius: 6, padding: '2px 6px' }}>
                              {bookingTypes[sl.id] === 'duo' ? '👯 Duo' : '🧘 Sólo'}
                            </div>
                          )}
                        </>}
                        {sl.is_cancelled && <div style={s.cardSub}>zrušeno</div>}
                        {!sl.is_cancelled && sl.notes && (
                          <div style={{ marginTop: 5, fontSize: 10, color: 'rgba(255,255,255,0.8)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            📝 {sl.notes}
                          </div>
                        )}
                      </div>
                      {!sl.is_cancelled && (
                        <button onClick={() => removeSlot(sl)} style={{ background: 'none', border: 'none', color: '#C4ABB4', cursor: 'pointer', fontSize: 14, padding: '0 0 0 6px', lineHeight: 1 }} title="Odebrat termín">✕</button>
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
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: '#2C1A22' }}>⚡ Generovat týden</div>
            <div style={{ fontSize: 14, color: '#9B7E8A', marginBottom: 24, lineHeight: 1.6 }}>
              Vygeneruje všechny termíny pro <strong style={{ color: '#2C1A22' }}>{formatWeekLabel(monday)}</strong> ze šablon.
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
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, color: '#2C1A22' }}>+ Přidat termín</div>
            <label style={s.label}>Typ tréninku</label>
            <select style={s.select} value={newSlot.name} onChange={e => {
              const name = e.target.value
              setNewSlot({ ...newSlot, name, color: name === 'XXL cvičení' ? '#D4945A' : name === 'Funkční trénink' ? '#9B72CF' : '#C8516B', capacity: name === 'XXL cvičení' ? 10 : name === 'Funkční trénink' ? 10 : 1})
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

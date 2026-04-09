import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}
function getMonday(d = new Date()) {
  const date = new Date(d); const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff); date.setHours(0,0,0,0); return date
}
function addDays(date, days) {
  const d = new Date(date); d.setDate(d.getDate() + days); return d
}

const MONTHS = ['Led','Úno','Bře','Dub','Kvě','Čer','Čvc','Srp','Zář','Říj','Lis','Pro']
const DAYS_SHORT = ['Po','Út','St','Čt','Pá','So','Ne']
const TYPE_COLORS = {
  'Osobní trénink': '#C8516B',
  'XXL cvičení': '#D4945A',
  'Funkční trénink': '#9B72CF',
}

const s = {
  title: { fontSize: 32, fontWeight: 700, letterSpacing: '-1px', color: '#2C1A22', fontFamily: "'Cormorant Garamond', serif" },
  subtitle: { fontSize: 14, color: '#9B7E8A', marginTop: 4 },
  stat: { background: '#FFFFFF', border: '1px solid #EBCFD8', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(200,81,107,0.05)' },
  statLabel: { fontSize: 11, color: '#9B7E8A', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 },
  statValue: { fontSize: 26, fontWeight: 800, letterSpacing: '-1px', color: '#2C1A22' },
  statSub: { fontSize: 12, color: '#BFA0AD', marginTop: 4 },
  card: { background: '#FFFFFF', border: '1px solid #EBCFD8', borderRadius: 16, padding: '24px', boxShadow: '0 2px 12px rgba(200,81,107,0.05)' },
  cardTitle: { fontSize: 13, fontWeight: 700, color: '#9B7E8A', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 20 },
  barWrap: { marginBottom: 12 },
  barLabel: { display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 },
  barTrack: { height: 8, background: '#F0D9DF', borderRadius: 4, overflow: 'hidden' },
  barFill: (color, pct) => ({ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s ease' }),
  monthBar: (height, color) => ({ width: '100%', background: color, borderRadius: '4px 4px 0 0', height: `${height}px`, transition: 'height 0.4s ease', minHeight: 2 }),
  monthLabel: { fontSize: 10, color: '#BFA0AD', textAlign: 'center', marginTop: 6 },
  monthVal: { fontSize: 10, color: '#9B7E8A', textAlign: 'center', marginBottom: 4 },
  clientRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #FAF0F3' },
  avatar: (hue) => ({ width: 32, height: 32, borderRadius: '50%', background: `hsl(${hue}, 60%, 88%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: `hsl(${hue}, 50%, 40%)`, flexShrink: 0 }),
  empty: { color: '#BFA0AD', fontSize: 13, padding: '20px 0', textAlign: 'center' },
  periodBtn: (active) => ({ padding: '6px 14px', borderRadius: 8, border: `1px solid ${active ? '#C8516B' : '#EBCFD8'}`, background: active ? 'rgba(200,81,107,0.08)' : '#fff', color: active ? '#C8516B' : '#9B7E8A', cursor: 'pointer', fontSize: 12, fontWeight: active ? 700 : 400, fontFamily: 'inherit', transition: 'all 0.15s' }),
}

function getHue(str = '') {
  let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 360; return h
}

function Trend({ current, previous }) {
  if (!previous || previous === 0) return null
  const diff = Math.round((current - previous) / previous * 100)
  if (diff === 0) return null
  const up = diff > 0
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: up ? '#27AE60' : '#C8516B', marginLeft: 6 }}>
      {up ? '↑' : '↓'} {Math.abs(diff)} %
    </span>
  )
}

const PERIODS = [
  { id: 'month', label: 'Tento měsíc' },
  { id: '3months', label: '3 měsíce' },
  { id: 'year', label: 'Tento rok' },
  { id: 'all', label: 'Vše' },
]

function getPeriodRange(period) {
  const now = new Date()
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    return { start: toDateStr(start), prevStart: toDateStr(prevStart), prevEnd: toDateStr(prevEnd) }
  }
  if (period === '3months') {
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const prevEnd = new Date(now.getFullYear(), now.getMonth() - 2, 0)
    return { start: toDateStr(start), prevStart: toDateStr(prevStart), prevEnd: toDateStr(prevEnd) }
  }
  if (period === 'year') {
    const start = new Date(now.getFullYear(), 0, 1)
    const prevStart = new Date(now.getFullYear() - 1, 0, 1)
    const prevEnd = new Date(now.getFullYear(), 0, 0)
    return { start: toDateStr(start), prevStart: toDateStr(prevStart), prevEnd: toDateStr(prevEnd) }
  }
  return { start: null, prevStart: null, prevEnd: null }
}

export default function Statistics() {
  const [bookings, setBookings] = useState([])
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const isMobile = window.innerWidth < 768

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: bk } = await supabase.from('bookings').select('*, training_slots(name, slot_date, start_time)').order('created_at', { ascending: false })
    const { data: sl } = await supabase.from('training_slots').select('*').order('slot_date')
    if (bk) setBookings(bk)
    if (sl) setSlots(sl)
    setLoading(false)
  }

  const { start, prevStart, prevEnd } = getPeriodRange(period)

  function inPeriod(b, from, to) {
    const date = b.training_slots?.slot_date
    if (!date) return false
    if (from && date < from) return false
    if (to && date > to) return false
    return true
  }

  const confirmed = bookings.filter(b => b.status === 'confirmed')
  const cancelled = bookings.filter(b => b.status === 'cancelled')

  const periodConfirmed = confirmed.filter(b => !start || inPeriod(b, start, null))
  const prevConfirmed = confirmed.filter(b => prevStart && inPeriod(b, prevStart, prevEnd))

  const totalRevenue = periodConfirmed.reduce((a, b) => a + (b.price || 0), 0)
  const prevRevenue = prevConfirmed.reduce((a, b) => a + (b.price || 0), 0)

  const paidRevenue = periodConfirmed.filter(b => b.paid).reduce((a, b) => a + (b.price || 0), 0)
  const unpaidRevenue = totalRevenue - paidRevenue

  const groupSlotIds = new Set(periodConfirmed.filter(b => b.training_slots?.name === 'XXL cvičení' || b.training_slots?.name === 'Funkční trénink').map(b => b.slot_id))
  const salonCosts = groupSlotIds.size * 200
  const netRevenue = totalRevenue - salonCosts
  const prevGroupSlotIds = new Set(prevConfirmed.filter(b => b.training_slots?.name === 'XXL cvičení' || b.training_slots?.name === 'Funkční trénink').map(b => b.slot_id))
  const prevNetRevenue = prevRevenue - prevGroupSlotIds.size * 200

  const uniqueClients = new Set(periodConfirmed.map(b => b.client_email)).size
  const prevUniqueClients = new Set(prevConfirmed.map(b => b.client_email)).size

  // Retence klientů
  const allClientMap = {}
  confirmed.forEach(b => {
    if (!allClientMap[b.client_email]) allClientMap[b.client_email] = 0
    allClientMap[b.client_email]++
  })
  const returningClients = Object.values(allClientMap).filter(c => c > 1).length
  const totalClients = Object.keys(allClientMap).length
  const retentionRate = totalClients > 0 ? Math.round(returningClients / totalClients * 100) : 0

  // Oblíbenost tréninků
  const byType = {}
  periodConfirmed.forEach(b => { const name = b.training_slots?.name || 'Neznámý'; byType[name] = (byType[name] || 0) + 1 })
  const maxByType = Math.max(...Object.values(byType), 1)

  // Nejoblíbenější den v týdnu
  const byDayOfWeek = [0, 0, 0, 0, 0, 0, 0]
  periodConfirmed.forEach(b => {
    const date = b.training_slots?.slot_date
    if (!date) return
    const day = new Date(date).getDay()
    const idx = day === 0 ? 6 : day - 1
    byDayOfWeek[idx]++
  })
  const maxDay = Math.max(...byDayOfWeek, 1)

  // Měsíční data (posledních 6 nebo 12 měsíců)
  const monthCount = period === 'year' ? 12 : period === 'all' ? 12 : 6
  const monthlyData = {}
  const now = new Date()
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    monthlyData[key] = { count: 0, revenue: 0, label: MONTHS[d.getMonth()] }
  }
  const groupSlotsByMonth = {}
  confirmed.filter(b => b.training_slots?.name === 'XXL cvičení' || b.training_slots?.name === 'Funkční trénink').forEach(b => {
    const date = b.training_slots?.slot_date; if (!date) return
    const key = date.slice(0, 7)
    if (!groupSlotsByMonth[key]) groupSlotsByMonth[key] = new Set()
    groupSlotsByMonth[key].add(b.slot_id)
  })
  confirmed.forEach(b => {
    const date = b.training_slots?.slot_date; if (!date) return
    const key = date.slice(0, 7)
    if (monthlyData[key]) { monthlyData[key].count++; monthlyData[key].revenue += b.price || 0 }
  })
  Object.entries(groupSlotsByMonth).forEach(([key, slotSet]) => { if (monthlyData[key]) monthlyData[key].revenue -= slotSet.size * 200 })
  const months = Object.values(monthlyData)
  const maxCount = Math.max(...months.map(m => m.count), 1)

  // Top klienti
  const clientMap = {}
  periodConfirmed.forEach(b => {
    const key = b.client_email
    if (!clientMap[key]) clientMap[key] = { name: b.client_name, email: b.client_email, count: 0, spent: 0 }
    clientMap[key].count++; clientMap[key].spent += b.price || 0
  })
  const topClients = Object.values(clientMap).sort((a, b) => b.count - a.count).slice(0, 5)

  // Obsazenost tohoto týdne
  const monday = getMonday()
  const weekDates = Array.from({ length: 7 }, (_, i) => toDateStr(addDays(monday, i)))
  const thisWeekSlots = slots.filter(s => weekDates.includes(s.slot_date) && !s.is_cancelled)
  const thisWeekBookings = confirmed.filter(b => thisWeekSlots.some(s => s.id === b.slot_id))
  const weekCapacity = thisWeekSlots.reduce((a, s) => a + s.capacity, 0)
  const weekOccupancy = weekCapacity > 0 ? Math.round(thisWeekBookings.length / weekCapacity * 100) : 0

  const cancellationRate = bookings.length > 0 ? Math.round(cancelled.length / bookings.length * 100) : 0

  if (loading) return <div style={{ color: '#BFA0AD', padding: '40px 0' }}>Načítám statistiky...</div>

  const statsGrid = isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)'
  const cardsGrid = isMobile ? '1fr' : '1fr 1fr'

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={s.title}>Statistiky</div>
        <div style={s.subtitle}>Přehled výkonu a aktivit</div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {PERIODS.map(p => (
          <button key={p.id} style={s.periodBtn(period === p.id)} onClick={() => setPeriod(p.id)}>{p.label}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: statsGrid, gap: 12, marginBottom: 20 }}>
        <div style={s.stat}>
          <div style={s.statLabel}>Rezervací</div>
          <div style={s.statValue}>
            {periodConfirmed.length}
            <Trend current={periodConfirmed.length} previous={prevConfirmed.length} />
          </div>
          <div style={s.statSub}>{cancelled.length} zrušeno celkem</div>
        </div>
        <div style={s.stat}>
          <div style={s.statLabel}>Klienti</div>
          <div style={s.statValue}>
            {uniqueClients}
            <Trend current={uniqueClients} previous={prevUniqueClients} />
          </div>
          <div style={s.statSub}>retence {retentionRate} %</div>
        </div>
        <div style={s.stat}>
          <div style={s.statLabel}>Čistý příjem</div>
          <div style={{ ...s.statValue, fontSize: netRevenue.toString().length > 6 ? 18 : 26 }}>
            {netRevenue.toLocaleString('cs-CZ')} Kč
            <Trend current={netRevenue} previous={prevNetRevenue} />
          </div>
          <div style={s.statSub}>náklady sál: {salonCosts} Kč</div>
        </div>
        <div style={s.stat}>
          <div style={s.statLabel}>Obsazenost týden</div>
          <div style={s.statValue}>{weekOccupancy} %</div>
          <div style={s.statSub}>{thisWeekBookings.length} z {weekCapacity} míst</div>
        </div>
      </div>

      {totalRevenue > 0 && (
        <div style={{ ...s.card, marginBottom: 16 }}>
          <div style={s.cardTitle}>Zaplaceno vs nezaplaceno</div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: '#27AE60', fontWeight: 600 }}>✓ Zaplaceno</span>
                <span style={{ fontWeight: 700 }}>{paidRevenue.toLocaleString('cs-CZ')} Kč</span>
              </div>
              <div style={{ height: 10, background: '#F0D9DF', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${totalRevenue > 0 ? Math.round(paidRevenue / totalRevenue * 100) : 0}%`, background: '#27AE60', borderRadius: 5, transition: 'width 0.5s' }} />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: '#C8516B', fontWeight: 600 }}>⏳ Čeká na platbu</span>
                <span style={{ fontWeight: 700 }}>{unpaidRevenue.toLocaleString('cs-CZ')} Kč</span>
              </div>
              <div style={{ height: 10, background: '#F0D9DF', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${totalRevenue > 0 ? Math.round(unpaidRevenue / totalRevenue * 100) : 0}%`, background: '#C8516B', borderRadius: 5, transition: 'width 0.5s' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: cardsGrid, gap: 16, marginBottom: 16 }}>
        <div style={s.card}>
          <div style={s.cardTitle}>Rezervace po měsících</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
            {months.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                <div style={s.monthVal}>{m.count > 0 ? m.count : ''}</div>
                <div style={s.monthBar(Math.max(m.count / maxCount * 90, m.count > 0 ? 4 : 2), m.count > 0 ? '#C8516B' : '#F0D9DF')} />
                <div style={s.monthLabel}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={s.card}>
          <div style={s.cardTitle}>Příjmy po měsících (Kč)</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
            {months.map((m, i) => {
              const maxRev = Math.max(...months.map(x => x.revenue), 1)
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <div style={s.monthVal}>{m.revenue > 0 ? m.revenue : ''}</div>
                  <div style={s.monthBar(Math.max(m.revenue / maxRev * 90, m.revenue > 0 ? 4 : 2), m.revenue > 0 ? '#5B9E98' : '#F0D9DF')} />
                  <div style={s.monthLabel}>{m.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: cardsGrid, gap: 16, marginBottom: 16 }}>
        <div style={s.card}>
          <div style={s.cardTitle}>Oblíbenost tréninků</div>
          {Object.keys(byType).length === 0 && <div style={s.empty}>Žádná data</div>}
          {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
            <div key={name} style={s.barWrap}>
              <div style={s.barLabel}>
                <span style={{ color: '#2C1A22' }}>{name}</span>
                <span style={{ color: TYPE_COLORS[name] || '#9B7E8A', fontWeight: 700 }}>{count}×</span>
              </div>
              <div style={s.barTrack}>
                <div style={s.barFill(TYPE_COLORS[name] || '#9B7E8A', Math.round(count / maxByType * 100))} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #F0D9DF' }}>
            <div style={{ ...s.cardTitle, marginBottom: 10 }}>Míra zrušení</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: cancellationRate > 20 ? '#C8516B' : '#5B9E98' }}>{cancellationRate} %</div>
              <div style={{ fontSize: 13, color: '#9B7E8A', lineHeight: 1.5 }}>{cancelled.length} zrušení<br />z {bookings.length} celkem</div>
            </div>
          </div>
        </div>

        <div style={s.card}>
          <div style={s.cardTitle}>Nejoblíbenější den v týdnu</div>
          {byDayOfWeek.every(v => v === 0) && <div style={s.empty}>Žádná data</div>}
          {!byDayOfWeek.every(v => v === 0) && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100, marginBottom: 16 }}>
              {byDayOfWeek.map((count, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: 10, color: '#9B7E8A', marginBottom: 4 }}>{count > 0 ? count : ''}</div>
                  <div style={{ width: '100%', background: count === maxDay ? '#C8516B' : count > 0 ? 'rgba(200,81,107,0.3)' : '#F0D9DF', borderRadius: '4px 4px 0 0', height: `${Math.max(count / maxDay * 80, count > 0 ? 4 : 2)}px`, transition: 'height 0.4s' }} />
                  <div style={{ fontSize: 10, color: count === maxDay ? '#C8516B' : '#BFA0AD', fontWeight: count === maxDay ? 700 : 400, marginTop: 6 }}>{DAYS_SHORT[i]}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ paddingTop: 16, borderTop: '1px solid #F0D9DF' }}>
            <div style={{ ...s.cardTitle, marginBottom: 12 }}>Nejaktivnější klienti</div>
            {topClients.length === 0 && <div style={s.empty}>Žádná data</div>}
            {topClients.map((c, i) => {
              const hue = getHue(c.email)
              const initials = c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              return (
                <div key={c.email} style={s.clientRow}>
                  <div style={{ fontSize: 12, color: '#D4B8C2', fontWeight: 700, width: 16 }}>{i + 1}</div>
                  <div style={s.avatar(hue)}>{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#2C1A22', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: '#9B7E8A' }}>{c.count} tréninků{c.spent > 0 ? ` · ${c.spent} Kč` : ''}</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#C8516B' }}>{c.count}×</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

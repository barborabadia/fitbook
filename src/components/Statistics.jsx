import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

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

function getMonday(d = new Date()) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

const MONTHS = ['Led','Úno','Bře','Dub','Kvě','Čer','Čvc','Srp','Zář','Říj','Lis','Pro']
const TYPE_COLORS = {
  'Osobní trénink': '#FF4D00',
  'XXL cvičení': '#FFB800',
  'Funkční trénink': '#7C3AED',
}

const s = {
  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: 800, letterSpacing: '-1px' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 },
  stat: { background: '#111118', border: '1px solid #1E1E2E', borderRadius: 16, padding: '20px 24px' },
  statLabel: { fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: 800, letterSpacing: '-1px' },
  statSub: { fontSize: 12, color: '#444', marginTop: 4 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  card: { background: '#111118', border: '1px solid #1E1E2E', borderRadius: 16, padding: '24px' },
  cardTitle: { fontSize: 13, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 20 },
  barWrap: { marginBottom: 12 },
  barLabel: { display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 },
  barTrack: { height: 8, background: '#1E1E2E', borderRadius: 4, overflow: 'hidden' },
  barFill: (color, pct) => ({ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s ease' }),
  monthBar: (height, color) => ({ width: '100%', background: color, borderRadius: '4px 4px 0 0', height: `${height}px`, transition: 'height 0.4s ease', minHeight: 2 }),
  monthLabel: { fontSize: 10, color: '#444', textAlign: 'center', marginTop: 6 },
  monthVal: { fontSize: 10, color: '#666', textAlign: 'center', marginBottom: 4 },
  clientRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #0F0F1A' },
  avatar: (hue) => ({ width: 32, height: 32, borderRadius: '50%', background: `hsl(${hue}, 50%, 20%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: `hsl(${hue}, 70%, 65%)`, flexShrink: 0 }),
  empty: { color: '#444', fontSize: 13, padding: '20px 0', textAlign: 'center' },
}

function getHue(str = '') {
  let h = 0
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 360
  return h
}

export default function Statistics() {
  const [bookings, setBookings] = useState([])
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: bk } = await supabase
      .from('bookings')
      .select('*, training_slots(name, slot_date, start_time)')
      .order('created_at', { ascending: false })

    const { data: sl } = await supabase
      .from('training_slots')
      .select('*')
      .order('slot_date')

    if (bk) setBookings(bk)
    if (sl) setSlots(sl)
    setLoading(false)
  }

  const confirmed = bookings.filter(b => b.status === 'confirmed')
  const cancelled = bookings.filter(b => b.status === 'cancelled')
  const totalRevenue = confirmed.reduce((a, b) => a + (b.price || 0), 0)

  // Náklady na sál – 200 Kč za každou lekci XXL/Funkční kde byla alespoň 1 rezervace
  const groupSlotIds = new Set(
    confirmed
      .filter(b => b.training_slots?.name === 'XXL cvičení' || b.training_slots?.name === 'Funkční trénink')
      .map(b => b.slot_id)
  )
  const salonCosts = groupSlotIds.size * 200
  const netRevenue = totalRevenue - salonCosts
  const uniqueClients = new Set(confirmed.map(b => b.client_email)).size

  // Rezervace podle typu tréninku
  const byType = {}
  confirmed.forEach(b => {
    const name = b.training_slots?.name || 'Neznámý'
    byType[name] = (byType[name] || 0) + 1
  })
  const maxByType = Math.max(...Object.values(byType), 1)

  // Rezervace po měsících (posledních 6 měsíců)
  const monthlyData = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyData[key] = { count: 0, revenue: 0, label: MONTHS[d.getMonth()] }
  }
  // Spočítej náklady na sál po měsících
  const groupSlotsByMonth = {}
  confirmed
    .filter(b => b.training_slots?.name === 'XXL cvičení' || b.training_slots?.name === 'Funkční trénink')
    .forEach(b => {
      const date = b.training_slots?.slot_date
      if (!date) return
      const key = date.slice(0, 7)
      if (!groupSlotsByMonth[key]) groupSlotsByMonth[key] = new Set()
      groupSlotsByMonth[key].add(b.slot_id)
    })

  confirmed.forEach(b => {
    const date = b.training_slots?.slot_date
    if (!date) return
    const key = date.slice(0, 7)
    if (monthlyData[key]) {
      monthlyData[key].count++
      monthlyData[key].revenue += b.price || 0
    }
  })

  // Odečti náklady na sál od měsíčních příjmů
  Object.entries(groupSlotsByMonth).forEach(([key, slotSet]) => {
    if (monthlyData[key]) monthlyData[key].revenue -= slotSet.size * 200
  })
  const months = Object.values(monthlyData)
  const maxCount = Math.max(...months.map(m => m.count), 1)

  // Nejaktivnější klienti
  const clientMap = {}
  confirmed.forEach(b => {
    const key = b.client_email
    if (!clientMap[key]) clientMap[key] = { name: b.client_name, email: b.client_email, count: 0, spent: 0 }
    clientMap[key].count++
    clientMap[key].spent += b.price || 0
  })
  const topClients = Object.values(clientMap).sort((a, b) => b.count - a.count).slice(0, 5)

  // Obsazenost tento týden
  const monday = getMonday()
  const weekDates = Array.from({ length: 7 }, (_, i) => toDateStr(addDays(monday, i)))
  const thisWeekSlots = slots.filter(s => weekDates.includes(s.slot_date) && !s.is_cancelled)
  const thisWeekBookings = confirmed.filter(b => thisWeekSlots.some(s => s.id === b.slot_id))
  const weekCapacity = thisWeekSlots.reduce((a, s) => a + s.capacity, 0)
  const weekOccupancy = weekCapacity > 0 ? Math.round(thisWeekBookings.length / weekCapacity * 100) : 0

  // Míra zrušení
  const cancellationRate = bookings.length > 0 ? Math.round(cancelled.length / bookings.length * 100) : 0

  if (loading) return <div style={{ color: '#444', padding: '40px 0' }}>Načítám statistiky...</div>

  return (
    <div>
      <div style={s.header}>
        <div style={s.title}>Statistiky</div>
        <div style={s.subtitle}>Přehled výkonu a aktivit</div>
      </div>

      {/* Klíčové metriky */}
      <div style={s.statsRow}>
        {[
          { label: 'Celkem rezervací', value: confirmed.length, sub: `${cancelled.length} zrušeno` },
          { label: 'Aktivní klienti', value: uniqueClients, sub: 'unikátních emailů' },
          { label: 'Čistý příjem', value: `${netRevenue.toLocaleString('cs-CZ')} Kč`, sub: `náklady na sál: ${salonCosts} Kč` },
          { label: 'Obsazenost tento týden', value: `${weekOccupancy}%`, sub: `${thisWeekBookings.length} z ${weekCapacity} míst` },
        ].map((s2, i) => (
          <div key={i} style={s.stat}>
            <div style={s.statLabel}>{s2.label}</div>
            <div style={{ ...s.statValue, fontSize: s2.value.toString().length > 8 ? 20 : 28 }}>{s2.value}</div>
            <div style={s.statSub}>{s2.sub}</div>
          </div>
        ))}
      </div>

      <div style={s.row}>
        {/* Graf po měsících */}
        <div style={s.card}>
          <div style={s.cardTitle}>Rezervace po měsících</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
            {months.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                <div style={s.monthVal}>{m.count > 0 ? m.count : ''}</div>
                <div style={s.monthBar(Math.max(m.count / maxCount * 90, m.count > 0 ? 4 : 2), m.count > 0 ? '#FF4D00' : '#1E1E2E')} />
                <div style={s.monthLabel}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Příjmy po měsících */}
        <div style={s.card}>
          <div style={s.cardTitle}>Příjmy po měsících (Kč)</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
            {months.map((m, i) => {
              const maxRev = Math.max(...months.map(x => x.revenue), 1)
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <div style={s.monthVal}>{m.revenue > 0 ? m.revenue : ''}</div>
                  <div style={s.monthBar(Math.max(m.revenue / maxRev * 90, m.revenue > 0 ? 4 : 2), m.revenue > 0 ? '#00C2A8' : '#1E1E2E')} />
                  <div style={s.monthLabel}>{m.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={s.row}>
        {/* Oblíbenost tréninků */}
        <div style={s.card}>
          <div style={s.cardTitle}>Oblíbenost tréninků</div>
          {Object.keys(byType).length === 0 && <div style={s.empty}>Žádná data</div>}
          {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
            <div key={name} style={s.barWrap}>
              <div style={s.barLabel}>
                <span style={{ color: '#F0EDE8' }}>{name}</span>
                <span style={{ color: TYPE_COLORS[name] || '#666', fontWeight: 700 }}>{count}×</span>
              </div>
              <div style={s.barTrack}>
                <div style={s.barFill(TYPE_COLORS[name] || '#666', Math.round(count / maxByType * 100))} />
              </div>
            </div>
          ))}

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #1E1E2E' }}>
            <div style={{ ...s.cardTitle, marginBottom: 12 }}>Míra zrušení</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: cancellationRate > 20 ? '#FF4D00' : '#00C2A8' }}>{cancellationRate}%</div>
              <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>
                {cancelled.length} zrušení<br />z {bookings.length} celkem
              </div>
            </div>
          </div>
        </div>

        {/* Nejaktivnější klienti */}
        <div style={s.card}>
          <div style={s.cardTitle}>Nejaktivnější klienti</div>
          {topClients.length === 0 && <div style={s.empty}>Žádná data</div>}
          {topClients.map((c, i) => {
            const hue = getHue(c.email)
            const initials = c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            return (
              <div key={c.email} style={s.clientRow}>
                <div style={{ fontSize: 12, color: '#333', fontWeight: 700, width: 16 }}>{i + 1}</div>
                <div style={s.avatar(hue)}>{initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#555' }}>{c.count} tréninků{c.spent > 0 ? ` · ${c.spent} Kč` : ''}</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FF4D00' }}>{c.count}×</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

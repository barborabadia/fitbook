import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function hoursUntilSlot(slotDate, startTime) {
  return (new Date(`${slotDate}T${startTime}:00`) - new Date()) / (1000 * 60 * 60)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })
}

const s = {
  wrap: { maxWidth: 640, margin: '0 auto' },
  title: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4, color: '#2C1A22', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  sub: { fontSize: 14, color: '#9B7E8A', marginBottom: 20 },
  inputRow: { display: 'flex', gap: 10, marginBottom: 20 },
  input: { flex: 1, background: '#FFFFFF', border: '1px solid #EBCFD8', borderRadius: 10, padding: '12px 16px', color: '#2C1A22', fontSize: 14, fontFamily: 'inherit', outline: 'none' },
  btn: (v = 'primary') => ({ padding: '12px 20px', borderRadius: 10, border: v === 'secondary' ? '1px solid #EBCFD8' : 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', background: v === 'primary' ? '#C8516B' : '#F5E8EC', color: v === 'primary' ? '#fff' : '#9B7E8A', whiteSpace: 'nowrap' }),
  card: (cancelled) => ({ background: cancelled ? 'transparent' : '#FFFFFF', border: `1px solid ${cancelled ? '#F0D9DF' : '#EBCFD8'}`, borderRadius: 14, padding: '18px 20px', marginBottom: 10, opacity: cancelled ? 0.5 : 1, boxShadow: cancelled ? 'none' : '0 2px 12px rgba(200,81,107,0.06)' }),
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  cardName: { fontSize: 16, fontWeight: 700, color: '#2C1A22' },
  cardMeta: { fontSize: 13, color: '#9B7E8A', marginTop: 4 },
  cardPrice: { fontSize: 13, color: '#C8516B', fontWeight: 600, marginTop: 4 },
  cancelBtn: { padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(200,81,107,0.3)', background: 'rgba(200,81,107,0.06)', color: '#C8516B', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 },
  disabledBtn: { padding: '7px 14px', borderRadius: 8, border: '1px solid #EBCFD8', background: 'transparent', color: '#C4ABB4', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 },
  badge: (type) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: type === 'cancelled' ? 'rgba(200,81,107,0.1)' : 'rgba(91,158,152,0.1)', color: type === 'cancelled' ? '#C8516B' : '#5B9E98', border: `1px solid ${type === 'cancelled' ? 'rgba(200,81,107,0.2)' : 'rgba(91,158,152,0.2)'}` }),
  empty: { textAlign: 'center', color: '#BFA0AD', padding: '40px 0', fontSize: 14 },
  error: { background: 'rgba(200,81,107,0.08)', border: '1px solid rgba(200,81,107,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C8516B', marginBottom: 16 },
  success: { background: 'rgba(91,158,152,0.08)', border: '1px solid rgba(91,158,152,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#5B9E98', marginBottom: 16 },
  confirmBox: { background: '#FBF6F8', border: '1px solid rgba(200,81,107,0.2)', borderRadius: 12, padding: '16px', marginTop: 12 },
  sectionLabel: { fontSize: 12, fontWeight: 700, color: '#BFA0AD', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 },
}

export default function MyBookings({ prefillEmail }) {
  const [email, setEmail] = useState(prefillEmail || '')
  const [bookings, setBookings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(null)

  useEffect(() => {
    if (prefillEmail) { setEmail(prefillEmail); fetchBookings(prefillEmail) }
  }, [prefillEmail])

  async function fetchBookings(emailVal) {
    if (!emailVal?.trim()) return
    setLoading(true); setError(''); setSuccess('')
    const { data, error: err } = await supabase.from('bookings').select('*, training_slots(name, slot_date, start_time, duration_minutes, color, price)').eq('client_email', emailVal.trim().toLowerCase()).order('created_at', { ascending: false })
    if (err) { setError('Chyba při načítání.'); setLoading(false); return }
    setBookings(data || [])
    setLoading(false)
  }

  async function cancelBooking(booking) {
    const slot = booking.training_slots
    if (hoursUntilSlot(slot.slot_date, slot.start_time) < 24) {
      setError('Rezervaci nelze zrušit méně než 24 hodin před tréninkem.')
      setConfirmCancel(null)
      return
    }
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
    setSuccess('Rezervace byla úspěšně zrušena.')
    setConfirmCancel(null)
    fetchBookings(email)
  }

  const upcoming = bookings?.filter(b => b.training_slots && new Date(`${b.training_slots.slot_date}T${b.training_slots.start_time}:00`) > new Date()) || []
  const past = bookings?.filter(b => b.training_slots && new Date(`${b.training_slots.slot_date}T${b.training_slots.start_time}:00`) <= new Date()) || []

  const TYPE_COLORS = { 'Osobní trénink': '#C8516B', 'XXL cvičení': '#D4945A', 'Funkční trénink': '#9B72CF' }
  const pastConfirmed = past.filter(b => b.status === 'confirmed')
  const byType = {}
  pastConfirmed.forEach(b => {
    const name = b.training_slots?.name || 'Jiný'
    byType[name] = (byType[name] || 0) + 1
  })

  return (
    <div style={s.wrap}>
      {!prefillEmail && (
        <>
          <div style={s.title}>Moje rezervace</div>
          <div style={s.sub}>Zadej svůj e-mail a zobrazíme ti tvé rezervace</div>
          <div style={s.inputRow}>
            <input style={s.input} type="email" placeholder="tvuj@email.cz" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchBookings(email)} />
            <button style={s.btn()} onClick={() => fetchBookings(email)} disabled={loading}>{loading ? 'Načítám...' : 'Zobrazit'}</button>
          </div>
        </>
      )}

      {prefillEmail && (
        <div style={{ marginBottom: 20 }}>
          <div style={s.title}>Moje rezervace</div>
          <div style={s.sub}>{prefillEmail}</div>
        </div>
      )}

      {error && <div style={s.error}>⚠️ {error}</div>}
      {success && <div style={s.success}>✓ {success}</div>}
      {loading && <div style={s.empty}>Načítám...</div>}

      {!loading && bookings !== null && (
        <>
          {bookings.length === 0 && <div style={s.empty}>Žádné rezervace nenalezeny.</div>}

          {(pastConfirmed.length > 0 || upcoming.filter(b => b.status === 'confirmed').length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>

              <div style={{ background: '#FFFFFF', border: '1px solid #EBCFD8', borderRadius: 16, padding: '20px', boxShadow: '0 2px 12px rgba(200,81,107,0.05)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2C1A22', marginBottom: 4 }}>Absolvované tréninky</div>
                <div style={{ fontSize: 12, color: '#BFA0AD', marginBottom: 16 }}>celkem {pastConfirmed.length} {pastConfirmed.length === 1 ? 'trénink' : pastConfirmed.length < 5 ? 'tréninky' : 'tréninků'}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([name, count]) => {
                    const color = TYPE_COLORS[name] || '#9B7E8A'
                    const pct = Math.round(count / pastConfirmed.length * 100)
                    return (
                      <div key={name} style={{ background: `${color}08`, border: `1px solid ${color}28`, borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ fontSize: 11, color: '#9B7E8A', marginBottom: 4 }}>{name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{count}×</div>
                          <div style={{ fontSize: 10, color: '#BFA0AD' }}>{pct} %</div>
                        </div>
                        <div style={{ marginTop: 8, height: 3, background: `${color}20`, borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {(() => {
                const upcomingConfirmed = upcoming.filter(b => b.status === 'confirmed')
                const nextSlot = upcomingConfirmed[0]?.training_slots
                return (
                  <div style={{ background: '#FFFFFF', border: '1px solid #EBCFD8', borderRadius: 16, padding: '20px', boxShadow: '0 2px 12px rgba(200,81,107,0.05)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#2C1A22', marginBottom: 4 }}>Nadcházející tréninky</div>
                    <div style={{ fontSize: 12, color: '#BFA0AD', marginBottom: 16 }}>rezervované termíny</div>
                    {upcomingConfirmed.length === 0 ? (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#BFA0AD', fontSize: 13, textAlign: 'center', gap: 8 }}>
                        <div style={{ fontSize: 28 }}>🗓️</div>
                        <div>Žádné nadcházející<br />rezervace</div>
                      </div>
                    ) : (
                      <>
                        <div style={{ background: 'rgba(200,81,107,0.06)', border: '1px solid rgba(200,81,107,0.15)', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
                          <div style={{ fontSize: 11, color: '#BFA0AD', marginBottom: 2 }}>Příští trénink</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#2C1A22' }}>{nextSlot?.name}</div>
                          <div style={{ fontSize: 12, color: '#9B7E8A', marginTop: 4 }}>
                            {nextSlot ? new Date(nextSlot.slot_date).toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'long' }) : ''} • {nextSlot?.start_time}
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 36, fontWeight: 800, color: '#C8516B', lineHeight: 1 }}>{upcomingConfirmed.length}</div>
                          <div style={{ fontSize: 12, color: '#BFA0AD', marginTop: 4 }}>{upcomingConfirmed.length === 1 ? 'rezervace' : upcomingConfirmed.length < 5 ? 'rezervace' : 'rezervací'}</div>
                        </div>
                      </>
                    )}
                  </div>
                )
              })()}

            </div>
          )}

          {upcoming.length > 0 && (
            <>
              <div style={s.sectionLabel}>Nadcházející tréninky</div>
              {upcoming.map(b => {
                const slot = b.training_slots
                const canCancel = hoursUntilSlot(slot.slot_date, slot.start_time) >= 24 && b.status === 'confirmed'
                const cancelled = b.status === 'cancelled'
                return (
                  <div key={b.id} style={s.card(cancelled)}>
                    <div style={s.cardTop}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <div style={s.cardName}>{slot.name}</div>
                          <span style={s.badge(cancelled ? 'cancelled' : 'confirmed')}>{cancelled ? 'Zrušeno' : 'Potvrzeno'}</span>
                        </div>
                        <div style={s.cardMeta}>{formatDate(slot.slot_date)} • {slot.start_time} • {slot.duration_minutes} min</div>
                        {b.booking_type === 'duo' && <div style={s.cardMeta}>Duo trénink</div>}
                        {b.price > 0 && <div style={s.cardPrice}>{b.price} Kč</div>}
                      </div>
                      {!cancelled && (canCancel
                        ? <button style={s.cancelBtn} onClick={() => setConfirmCancel(b)}>Zrušit</button>
                        : <div style={s.disabledBtn}>Nelze zrušit</div>
                      )}
                    </div>
                    {confirmCancel?.id === b.id && (
                      <div style={s.confirmBox}>
                        <div style={{ fontSize: 13, color: '#9B7E8A', marginBottom: 12 }}>Opravdu chceš zrušit tuto rezervaci?</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button style={{ ...s.btn('secondary'), padding: '8px 16px' }} onClick={() => setConfirmCancel(null)}>Ne, zpět</button>
                          <button style={{ ...s.btn('primary'), padding: '8px 16px' }} onClick={() => cancelBooking(b)}>Ano, zrušit</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}

          {past.length > 0 && (
            <>
              <div style={{ ...s.sectionLabel, marginTop: 24 }}>Historie</div>
              {past.slice(0, 5).map(b => {
                const slot = b.training_slots
                return (
                  <div key={b.id} style={s.card(b.status === 'cancelled')}>
                    <div style={s.cardTop}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <div style={{ ...s.cardName, fontSize: 14 }}>{slot.name}</div>
                          <span style={s.badge(b.status === 'cancelled' ? 'cancelled' : 'confirmed')}>{b.status === 'cancelled' ? 'Zrušeno' : 'Absolvováno'}</span>
                        </div>
                        <div style={s.cardMeta}>{formatDate(slot.slot_date)} • {slot.start_time}</div>
                      </div>
                      {b.price > 0 && <div style={{ fontSize: 13, color: '#9B7E8A', fontWeight: 600 }}>{b.price} Kč</div>}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </>
      )}
    </div>
  )
}

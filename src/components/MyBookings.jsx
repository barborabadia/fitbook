import { useState } from 'react'
import { supabase } from '../lib/supabase'

function hoursUntilSlot(slotDate, startTime) {
  const slotDateTime = new Date(`${slotDate}T${startTime}:00`)
  const now = new Date()
  return (slotDateTime - now) / (1000 * 60 * 60)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })
}

const s = {
  wrap: { maxWidth: 640, margin: '0 auto', padding: '40px 24px' },
  title: { fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 },
  sub: { fontSize: 14, color: '#555', marginBottom: 28 },
  inputRow: { display: 'flex', gap: 10, marginBottom: 24 },
  input: { flex: 1, background: '#111118', border: '1px solid #1E1E2E', borderRadius: 10, padding: '12px 16px', color: '#F0EDE8', fontSize: 14, fontFamily: 'inherit', outline: 'none' },
  btn: (v = 'primary') => ({ padding: '12px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', background: v === 'primary' ? '#FF4D00' : '#1A1A28', color: v === 'primary' ? '#fff' : '#888', whiteSpace: 'nowrap' }),
  card: (cancelled) => ({ background: cancelled ? 'transparent' : '#111118', border: `1px solid ${cancelled ? '#1A1A28' : '#1E1E2E'}`, borderRadius: 14, padding: '18px 20px', marginBottom: 10, opacity: cancelled ? 0.5 : 1 }),
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  cardName: { fontSize: 16, fontWeight: 700 },
  cardMeta: { fontSize: 13, color: '#555', marginTop: 4 },
  cardPrice: { fontSize: 13, color: '#FF4D00', fontWeight: 600, marginTop: 4 },
  cancelBtn: { padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(255,77,0,0.3)', background: 'rgba(255,77,0,0.08)', color: '#FF4D00', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 },
  disabledBtn: { padding: '7px 14px', borderRadius: 8, border: '1px solid #1E1E2E', background: 'transparent', color: '#333', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 },
  badge: (type) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: type === 'cancelled' ? 'rgba(255,77,0,0.1)' : 'rgba(0,194,168,0.1)', color: type === 'cancelled' ? '#FF4D00' : '#00C2A8', border: `1px solid ${type === 'cancelled' ? 'rgba(255,77,0,0.2)' : 'rgba(0,194,168,0.2)'}` }),
  empty: { textAlign: 'center', color: '#444', padding: '40px 0', fontSize: 14 },
  error: { background: 'rgba(255,77,0,0.1)', border: '1px solid rgba(255,77,0,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#FF4D00', marginBottom: 16 },
  success: { background: 'rgba(0,194,168,0.08)', border: '1px solid rgba(0,194,168,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#00C2A8', marginBottom: 16 },
  confirmBox: { background: '#0A0A0F', border: '1px solid rgba(255,77,0,0.3)', borderRadius: 12, padding: '16px', marginTop: 12 },
}

export default function MyBookings() {
  const [email, setEmail] = useState('')
  const [bookings, setBookings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(null)

  async function loadBookings() {
    if (!email.trim()) return
    setLoading(true); setError(''); setSuccess('')
    const { data, error: err } = await supabase
      .from('bookings')
      .select('*, training_slots(name, slot_date, start_time, duration_minutes, color, price)')
      .eq('client_email', email.trim().toLowerCase())
      .order('created_at', { ascending: false })

    if (err) { setError('Chyba při načítání. Zkus to znovu.'); setLoading(false); return }
    setBookings(data || [])
    setLoading(false)
  }

  async function cancelBooking(booking) {
    const slot = booking.training_slots
    const hours = hoursUntilSlot(slot.slot_date, slot.start_time)
    if (hours < 24) {
      setError('Rezervaci nelze zrušit méně než 24 hodin před tréninkem.')
      setConfirmCancel(null)
      return
    }

    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
    setSuccess('Rezervace byla úspěšně zrušena.')
    setConfirmCancel(null)
    loadBookings()
  }

  const upcoming = bookings?.filter(b => {
    if (!b.training_slots) return false
    const slot = b.training_slots
    return new Date(`${slot.slot_date}T${slot.start_time}:00`) > new Date()
  }) || []

  const past = bookings?.filter(b => {
    if (!b.training_slots) return false
    const slot = b.training_slots
    return new Date(`${slot.slot_date}T${slot.start_time}:00`) <= new Date()
  }) || []

  return (
    <div style={s.wrap}>
      <div style={s.title}>Moje rezervace</div>
      <div style={s.sub}>Zadej svůj e-mail a zobrazíme ti tvé rezervace</div>

      <div style={s.inputRow}>
        <input
          style={s.input}
          type="email"
          placeholder="tvuj@email.cz"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && loadBookings()}
        />
        <button style={s.btn()} onClick={loadBookings} disabled={loading}>
          {loading ? 'Načítám...' : 'Zobrazit'}
        </button>
      </div>

      {error && <div style={s.error}>⚠️ {error}</div>}
      {success && <div style={s.success}>✓ {success}</div>}

      {bookings !== null && (
        <>
          {bookings.length === 0 && <div style={s.empty}>Na tomto e-mailu nejsou žádné rezervace.</div>}

          {upcoming.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>Nadcházející tréninky</div>
              {upcoming.map(b => {
                const slot = b.training_slots
                const hours = hoursUntilSlot(slot.slot_date, slot.start_time)
                const canCancel = hours >= 24 && b.status === 'confirmed'
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
                      {!cancelled && (
                        canCancel
                          ? <button style={s.cancelBtn} onClick={() => setConfirmCancel(b)}>Zrušit</button>
                          : <div style={s.disabledBtn} title="Nelze zrušit méně než 24h předem">Nelze zrušit</div>
                      )}
                    </div>

                    {confirmCancel?.id === b.id && (
                      <div style={s.confirmBox}>
                        <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>Opravdu chceš zrušit tuto rezervaci?</div>
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
              <div style={{ fontSize: 12, fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '24px 0 12px' }}>Historie</div>
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
                      {b.price > 0 && <div style={{ fontSize: 13, color: '#555', fontWeight: 600 }}>{b.price} Kč</div>}
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

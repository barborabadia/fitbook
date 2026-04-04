import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DAYS = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle']

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(8px)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  box: {
    background: '#111118', border: '1px solid #1E1E2E', borderRadius: 20,
    padding: 40, width: 440, maxWidth: '90vw',
  },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  closeBtn: { background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 20 },
  tag: (color) => ({ fontSize: 11, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }),
  name: { fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 },
  statBox: { background: '#0A0A0F', borderRadius: 10, padding: '10px 14px', border: '1px solid #1E1E2E' },
  statLabel: { fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.8px' },
  statVal: { fontSize: 15, fontWeight: 700, marginTop: 4 },
  label: { fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6, marginTop: 14 },
  input: (prefilled) => ({
    width: '100%', background: prefilled ? 'rgba(0,194,168,0.05)' : '#0A0A0F',
    border: `1px solid ${prefilled ? 'rgba(0,194,168,0.3)' : '#1E1E2E'}`, borderRadius: 10,
    padding: '12px 16px', color: '#F0EDE8', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  }),
  prefillBadge: {
    display: 'inline-block', padding: '3px 8px', borderRadius: 6,
    background: 'rgba(0,194,168,0.1)', border: '1px solid rgba(0,194,168,0.2)',
    color: '#00C2A8', fontSize: 10, fontWeight: 700, marginLeft: 8, verticalAlign: 'middle',
  },
  btnRow: { display: 'flex', gap: 10, marginTop: 20 },
  btn: (v) => ({
    flex: v === 'primary' ? 2 : 1, padding: '12px', borderRadius: 10, border: 'none',
    cursor: 'pointer', fontSize: 14, fontWeight: 600,
    background: v === 'primary' ? '#FF4D00' : '#1A1A28',
    color: v === 'primary' ? '#fff' : '#888',
  }),
  successWrap: { textAlign: 'center', padding: '20px 0' },
  successBox: (color) => ({
    background: `${color}12`, border: `1px solid ${color}33`,
    borderRadius: 12, padding: '12px 16px', margin: '20px 0',
  }),
  error: {
    background: 'rgba(255,77,0,0.1)', border: '1px solid rgba(255,77,0,0.3)',
    borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#FF4D00', marginTop: 12,
  },
}

export default function BookingModal({ training, prefill, onClose }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Předvyplnit z přihlášeného účtu
  useEffect(() => {
    if (prefill) {
      setForm({
        name: prefill.name || '',
        email: prefill.email || '',
        phone: prefill.phone || '',
      })
    }
  }, [prefill])

  const free = training.capacity - training.booked
  const full = free <= 0

  async function handleConfirm() {
    if (!form.name.trim() || !form.email.trim()) return
    setLoading(true)
    setError('')

    const { data: existing } = await supabase
      .from('bookings').select('id')
      .eq('training_id', training.id)
      .eq('week_start', training.weekStart)
      .eq('client_email', form.email.trim().toLowerCase())
      .eq('status', 'confirmed')

    if (existing?.length > 0) {
      setError('Na tento trénink již máš rezervaci.')
      setLoading(false)
      return
    }

    const { count } = await supabase
      .from('bookings').select('*', { count: 'exact', head: true })
      .eq('training_id', training.id)
      .eq('week_start', training.weekStart)
      .eq('status', 'confirmed')

    if (count >= training.capacity) {
      setError('Trénink je bohužel plný. Zkus jiný termín.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('bookings').insert({
      training_id: training.id,
      week_start: training.weekStart,
      client_name: form.name.trim(),
      client_email: form.email.trim().toLowerCase(),
      client_phone: form.phone.trim() || null,
      status: 'confirmed',
    })

    if (insertError) setError('Chyba při ukládání. Zkus to znovu.')
    else setStep(3)
    setLoading(false)
  }

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.box}>
        {step === 3 ? (
          <div style={s.successWrap}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Rezervace potvrzena!</div>
            <div style={{ fontSize: 14, color: '#555' }}>
              Těšíme se na tebe, <strong style={{ color: '#F0EDE8' }}>{form.name}</strong>!
            </div>
            <div style={s.successBox(training.color)}>
              <div style={{ fontWeight: 700 }}>{training.name}</div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                {DAYS[training.day_of_week]} • {training.start_time} • {training.duration_minutes} min
              </div>
            </div>
            <button style={{ ...s.btn('primary'), flex: 'unset', width: '100%' }} onClick={onClose}>
              Zavřít
            </button>
          </div>
        ) : (
          <>
            <div style={s.topRow}>
              <div>
                <div style={s.tag(training.color)}>{DAYS[training.day_of_week]} • {training.start_time}</div>
                <div style={s.name}>{training.name}</div>
              </div>
              <button style={s.closeBtn} onClick={onClose}>✕</button>
            </div>

            {step === 1 && (
              <>
                <div style={s.statsGrid}>
                  {[
                    { label: 'Délka', value: `${training.duration_minutes} min` },
                    { label: 'Kapacita', value: `${training.capacity} míst` },
                    { label: 'Zbývá', value: full ? '🔴 Plno' : `${free} míst` },
                  ].map((item, i) => (
                    <div key={i} style={s.statBox}>
                      <div style={s.statLabel}>{item.label}</div>
                      <div style={s.statVal}>{item.value}</div>
                    </div>
                  ))}
                </div>
                {training.description && (
                  <div style={{ color: '#666', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
                    {training.description}
                  </div>
                )}
                <button
                  style={{ ...s.btn('primary'), flex: 'unset', width: '100%', opacity: full ? 0.4 : 1 }}
                  disabled={full}
                  onClick={() => setStep(2)}
                >
                  {full ? 'Trénink je plný' : 'Rezervovat místo →'}
                </button>
              </>
            )}

            {step === 2 && (
              <>
                {prefill && (
                  <div style={{
                    background: 'rgba(0,194,168,0.06)', border: '1px solid rgba(0,194,168,0.15)',
                    borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#00C2A8', marginBottom: 4,
                  }}>
                    ✓ Formulář byl předvyplněn z tvého účtu. Údaje můžeš upravit.
                  </div>
                )}

                <label style={s.label}>
                  Jméno a příjmení *
                  {prefill?.name && <span style={s.prefillBadge}>předvyplněno</span>}
                </label>
                <input
                  style={s.input(!!prefill?.name)}
                  placeholder="Jan Novák"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />

                <label style={s.label}>
                  E-mail *
                  {prefill?.email && <span style={s.prefillBadge}>předvyplněno</span>}
                </label>
                <input
                  style={s.input(!!prefill?.email)}
                  placeholder="jan@email.cz"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />

                <label style={s.label}>Telefon (volitelné)</label>
                <input
                  style={s.input(false)}
                  placeholder="+420 777 888 999"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />

                {error && <div style={s.error}>⚠️ {error}</div>}

                <div style={s.btnRow}>
                  <button style={s.btn('secondary')} onClick={() => { setStep(1); setError('') }}>← Zpět</button>
                  <button
                    style={{ ...s.btn('primary'), opacity: (!form.name || !form.email || loading) ? 0.5 : 1 }}
                    onClick={handleConfirm}
                    disabled={!form.name || !form.email || loading}
                  >
                    {loading ? 'Ukládám...' : 'Potvrdit rezervaci ✓'}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

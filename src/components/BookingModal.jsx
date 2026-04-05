import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const IBAN = 'CZ2403000000000260597819' // bez mezer pro QR

function getPrice(slot, bookingType) {
  if (slot.name === 'Osobní trénink') return bookingType === 'duo' ? 300 : 200
  if (slot.name === 'XXL cvičení' || slot.name === 'Funkční trénink') return 120
  return 0
}

function buildQrString(price, message) {
  // Český platební QR - formát SPD
  const iban = IBAN
  const amount = price.toFixed(2)
  const msg = encodeURIComponent(message).replace(/%20/g, '+')
  return `SPD*1.0*ACC:${iban}*AM:${amount}*CC:CZK*MSG:${message}`
}

function QRCode({ value, size = 180 }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=111118&color=F0EDE8&margin=10`
  return <img src={url} alt="Platební QR kód" style={{ width: size, height: size, borderRadius: 12 }} />
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  box: { background: '#111118', border: '1px solid #1E1E2E', borderRadius: 20, padding: 36, width: 460, maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' },
  closeBtn: { background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 20 },
  tag: (color) => ({ fontSize: 11, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }),
  name: { fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' },
  typeRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '20px 0' },
  typeCard: (selected, color) => ({ padding: '14px', borderRadius: 12, border: `1px solid ${selected ? color : '#1E1E2E'}`, background: selected ? `${color}15` : '#0A0A0F', cursor: 'pointer', textAlign: 'center' }),
  typeLabel: { fontSize: 14, fontWeight: 700 },
  typePrice: { fontSize: 12, color: '#666', marginTop: 4 },
  label: { fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6, marginTop: 14 },
  input: (prefilled) => ({ width: '100%', background: prefilled ? 'rgba(0,194,168,0.05)' : '#0A0A0F', border: `1px solid ${prefilled ? 'rgba(0,194,168,0.3)' : '#1E1E2E'}`, borderRadius: 10, padding: '11px 14px', color: '#F0EDE8', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }),
  btnRow: { display: 'flex', gap: 10, marginTop: 20 },
  btn: (v) => ({ flex: v === 'primary' ? 2 : 1, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', background: v === 'primary' ? '#FF4D00' : '#1A1A28', color: v === 'primary' ? '#fff' : '#888' }),
  error: { background: 'rgba(255,77,0,0.1)', border: '1px solid rgba(255,77,0,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#FF4D00', marginTop: 12 },
  successWrap: { textAlign: 'center' },
  successBox: (color) => ({ background: `${color}12`, border: `1px solid ${color}33`, borderRadius: 12, padding: '14px 16px', margin: '16px 0', textAlign: 'left' }),
  qrBox: { background: '#0A0A0F', border: '1px solid #1E1E2E', borderRadius: 16, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, margin: '16px 0' },
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function BookingModal({ slot, prefill, onClose }) {
  const [step, setStep] = useState(1)
  const [bookingType, setBookingType] = useState('solo')
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isPersonal = slot.name === 'Osobní trénink'
  const price = getPrice(slot, bookingType)

  useEffect(() => {
    if (prefill) setForm({ name: prefill.name || '', email: prefill.email || '', phone: prefill.phone || '' })
  }, [prefill])

  async function handleConfirm() {
    if (!form.name.trim() || !form.email.trim()) return
    setLoading(true); setError('')

    const { data: existing } = await supabase.from('bookings').select('id').eq('slot_id', slot.id).eq('client_email', form.email.trim().toLowerCase()).eq('status', 'confirmed')
    if (existing?.length > 0) { setError('Na tento termín již máš rezervaci.'); setLoading(false); return }

    const { count } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('slot_id', slot.id).eq('status', 'confirmed')
    if (count >= slot.capacity) { setError('Termín je bohužel plný.'); setLoading(false); return }

    const { error: err } = await supabase.from('bookings').insert({
      slot_id: slot.id,
      client_name: form.name.trim(),
      client_email: form.email.trim().toLowerCase(),
      client_phone: form.phone.trim() || null,
      booking_type: isPersonal ? bookingType : 'solo',
      price,
      status: 'confirmed',
    })

    if (err) setError('Chyba při ukládání. Zkus to znovu.')
    else setStep(3)
    setLoading(false)
  }

  const qrMessage = `Rezervace ${slot.name} ${slot.slot_date}`
  const qrString = buildQrString(price, qrMessage)

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.box}>
        {step === 3 ? (
          <div style={s.successWrap}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Rezervace potvrzena!</div>
            <div style={{ fontSize: 14, color: '#555', marginBottom: 4 }}>Těšíme se na tebe, <strong style={{ color: '#F0EDE8' }}>{form.name}</strong>!</div>

            <div style={s.successBox(slot.color)}>
              <div style={{ fontWeight: 700 }}>{slot.name}{isPersonal && ` – ${bookingType === 'duo' ? 'Duo' : 'Sólo'}`}</div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{formatDate(slot.slot_date)} • {slot.start_time} • {slot.duration_minutes} min</div>
              <div style={{ fontSize: 14, color: '#FF4D00', marginTop: 6, fontWeight: 700 }}>Cena: {price} Kč</div>
            </div>

            {/* QR kód pro platbu */}
            <div style={s.qrBox}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#F0EDE8' }}>Zaplať přes QR kód</div>
              <QRCode value={qrString} size={180} />
              <div style={{ fontSize: 12, color: '#555', textAlign: 'center', lineHeight: 1.5 }}>
                Naskenuj QR kód v mobilním bankovnictví.<br />
                Částka <strong style={{ color: '#FF4D00' }}>{price} Kč</strong> bude předvyplněna.
              </div>
            </div>

            <button style={{ ...s.btn('primary'), flex: 'unset', width: '100%' }} onClick={onClose}>Zavřít</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={s.tag(slot.color)}>{formatDate(slot.slot_date)} • {slot.start_time}</div>
                <div style={s.name}>{slot.name}</div>
              </div>
              <button style={s.closeBtn} onClick={onClose}>✕</button>
            </div>

            {step === 1 && (
              <>
                {isPersonal && (
                  <>
                    <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Vyber typ tréninku:</div>
                    <div style={s.typeRow}>
                      <div style={s.typeCard(bookingType === 'solo', slot.color)} onClick={() => setBookingType('solo')}>
                        <div style={{ fontSize: 24 }}>🧘</div>
                        <div style={s.typeLabel}>Sólo</div>
                        <div style={s.typePrice}>200 Kč / 60 min</div>
                      </div>
                      <div style={s.typeCard(bookingType === 'duo', slot.color)} onClick={() => setBookingType('duo')}>
                        <div style={{ fontSize: 24 }}>👯</div>
                        <div style={s.typeLabel}>Duo</div>
                        <div style={s.typePrice}>300 Kč / 60 min</div>
                      </div>
                    </div>
                  </>
                )}
                {!isPersonal && (
                  <div style={{ background: `${slot.color}12`, border: `1px solid ${slot.color}33`, borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
                    <div style={{ fontSize: 13, color: '#888' }}>Délka: {slot.duration_minutes} min • Volná místa: {slot.capacity - slot.booked}</div>
                    <div style={{ fontSize: 14, color: '#FF4D00', fontWeight: 700, marginTop: 4 }}>Cena: 120 Kč</div>
                  </div>
                )}
                <button style={{ ...s.btn('primary'), flex: 'unset', width: '100%' }} onClick={() => setStep(2)}>
                  Rezervovat →
                </button>
              </>
            )}

            {step === 2 && (
              <>
                {prefill && <div style={{ background: 'rgba(0,194,168,0.06)', border: '1px solid rgba(0,194,168,0.15)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#00C2A8', marginBottom: 8 }}>✓ Formulář předvyplněn z tvého účtu</div>}
                <label style={s.label}>Jméno a příjmení *</label>
                <input style={s.input(!!prefill?.name)} placeholder="Jana Nováková" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <label style={s.label}>E-mail *</label>
                <input style={s.input(!!prefill?.email)} placeholder="jana@email.cz" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                <label style={s.label}>Telefon (volitelné)</label>
                <input style={s.input(false)} placeholder="+420 777 888 999" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                <div style={{ fontSize: 13, color: '#FF4D00', fontWeight: 600, marginTop: 10 }}>
                  Cena: {price} Kč{isPersonal && ` – ${bookingType === 'duo' ? 'Duo' : 'Sólo'}`}
                </div>
                {error && <div style={s.error}>⚠️ {error}</div>}
                <div style={s.btnRow}>
                  <button style={s.btn('secondary')} onClick={() => { setStep(1); setError('') }}>← Zpět</button>
                  <button style={{ ...s.btn('primary'), opacity: (!form.name || !form.email || loading) ? 0.5 : 1 }} onClick={handleConfirm} disabled={!form.name || !form.email || loading}>
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

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const IBAN = 'CZ2403000000000260597819'

function getPrice(slot, bookingType) {
  if (slot.name === 'Osobní trénink') return bookingType === 'duo' ? 300 : 200
  if (slot.name.includes('Zbůch')) return 130
  if (slot.name.includes('Březín')) return 130
  if (slot.name.includes('Holýšov')) return 150
  if (slot.name.includes('Stod')) return 120
  return slot.price || 0
}

function buildQrString(price, message) {
  return `SPD*1.0*ACC:${IBAN}*AM:${price.toFixed(2)}*CC:CZK*MSG:${message}`
}

function QRCode({ value, size = 180 }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=FFF5F7&color=C8516B&margin=10`
  return <img src={url} alt="Platební QR kód" style={{ width: size, height: size, borderRadius: 12 }} />
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(44,26,34,0.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  box: { background: '#FFFFFF', border: '1px solid #EBCFD8', borderRadius: 20, padding: 36, width: 460, maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(200,81,107,0.15)' },
  closeBtn: { background: 'none', border: 'none', color: '#BFA0AD', cursor: 'pointer', fontSize: 20 },
  tag: (color) => ({ fontSize: 11, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }),
  name: { fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: '#2C1A22' },
  typeRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '20px 0' },
  typeCard: (selected, color) => ({ padding: '14px', borderRadius: 12, border: `2px solid ${selected ? color : '#EBCFD8'}`, background: selected ? `${color}20` : '#FBF6F8', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s', boxShadow: selected ? `0 2px 12px ${color}30` : 'none' }),
  typeLabel: (selected, color) => ({ fontSize: 14, fontWeight: 700, color: selected ? color : '#2C1A22' }),
  typePrice: { fontSize: 12, color: '#9B7E8A', marginTop: 4 },
  label: { fontSize: 11, fontWeight: 600, color: '#9B7E8A', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6, marginTop: 14 },
  input: (prefilled) => ({ width: '100%', background: prefilled ? 'rgba(91,158,152,0.05)' : '#FBF6F8', border: `1px solid ${prefilled ? 'rgba(91,158,152,0.4)' : '#EBCFD8'}`, borderRadius: 10, padding: '11px 14px', color: '#2C1A22', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }),
  btnRow: { display: 'flex', gap: 10, marginTop: 20 },
  btn: (v) => ({ flex: v === 'primary' ? 2 : 1, padding: '12px', borderRadius: 10, border: v === 'secondary' ? '1px solid #EBCFD8' : 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', background: v === 'primary' ? '#C8516B' : '#F5E8EC', color: v === 'primary' ? '#fff' : '#9B7E8A' }),
  error: { background: 'rgba(200,81,107,0.08)', border: '1px solid rgba(200,81,107,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C8516B', marginTop: 12 },
  successWrap: { textAlign: 'center' },
  successBox: (color) => ({ background: `${color}10`, border: `1px solid ${color}30`, borderRadius: 12, padding: '14px 16px', margin: '16px 0', textAlign: 'left' }),
  qrBox: { background: '#FBF6F8', border: '1px solid #EBCFD8', borderRadius: 16, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, margin: '16px 0' },
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
  const isZbuch = slot.name.includes('Zbůch') || slot.name.includes('Březín') || slot.name.includes('Holýšov')
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

  const qrString = buildQrString(price, `Rezervace ${slot.name} ${slot.slot_date}`)

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.box}>
        {step === 3 ? (
          <div style={s.successWrap}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌸</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, color: '#2C1A22' }}>Rezervace potvrzena!</div>
            <div style={{ fontSize: 14, color: '#9B7E8A', marginBottom: 4 }}>Těšíme se na tebe, <strong style={{ color: '#2C1A22' }}>{form.name}</strong>!</div>

            <div style={s.successBox(slot.color)}>
              <div style={{ fontWeight: 700, color: '#2C1A22' }}>{slot.name}{isPersonal && ` – ${bookingType === 'duo' ? 'Duo' : 'Sólo'}`}</div>
              <div style={{ fontSize: 13, color: '#9B7E8A', marginTop: 2 }}>{formatDate(slot.slot_date)} • {slot.start_time} • {slot.duration_minutes} min</div>
              <div style={{ fontSize: 14, color: '#C8516B', marginTop: 6, fontWeight: 700 }}>Cena: {price} Kč</div>
            </div>

            {isZbuch ? (
              <div style={{ background: 'rgba(91,158,152,0.07)', border: '1px solid rgba(91,158,152,0.35)', borderRadius: 12, padding: '20px 16px', margin: '16px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>💵</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#2C1A22' }}>Platbu provedete v hotovosti</div>
                <div style={{ fontSize: 13, color: '#9B7E8A', marginTop: 6 }}>před zahájením lekce</div>
                <div style={{ fontSize: 14, color: '#C8516B', fontWeight: 700, marginTop: 8 }}>{price} Kč</div>
              </div>
            ) : (
              <div style={s.qrBox}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2C1A22' }}>Zaplať přes QR kód</div>
                <QRCode value={qrString} size={180} />
                <div style={{ fontSize: 12, color: '#9B7E8A', textAlign: 'center', lineHeight: 1.5 }}>
                  Naskenuj QR kód v mobilním bankovnictví.<br />
                  Částka <strong style={{ color: '#C8516B' }}>{price} Kč</strong> bude předvyplněna.
                </div>
              </div>
            )}

            <button style={{ ...s.btn('primary'), flex: 'unset', width: '100%' }} onClick={onClose}>Zavřít</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={s.tag('#C8516B')}>{formatDate(slot.slot_date)} • {slot.start_time}</div>
                <div style={s.name}>{slot.name}</div>
              </div>
              <button style={s.closeBtn} onClick={onClose}>✕</button>
            </div>

            {step === 1 && (
              <>
                {isPersonal && (
                  <>
                    <div style={{ fontSize: 13, color: '#9B7E8A', marginBottom: 4 }}>Vyber typ tréninku:</div>
                    <div style={s.typeRow}>
                      <div style={s.typeCard(bookingType === 'solo', '#C8516B')} onClick={() => setBookingType('solo')}>
                        <div style={{ fontSize: 24 }}>🧘</div>
                        <div style={s.typeLabel(bookingType === 'solo', '#C8516B')}>Sólo</div>
                        <div style={s.typePrice}>200 Kč / 60 min</div>
                      </div>
                      <div style={s.typeCard(bookingType === 'duo', '#C8516B')} onClick={() => setBookingType('duo')}>
                        <div style={{ fontSize: 24 }}>👯</div>
                        <div style={s.typeLabel(bookingType === 'duo', '#C8516B')}>Duo</div>
                        <div style={s.typePrice}>300 Kč / 60 min</div>
                      </div>
                    </div>
                  </>
                )}
                {!isPersonal && (
                  <div style={{ background: `${slot.color}10`, border: `1px solid ${slot.color}30`, borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
                    <div style={{ fontSize: 13, color: '#9B7E8A' }}>Délka: {slot.duration_minutes} min • Volná místa: {slot.capacity - slot.booked}</div>
                    <div style={{ fontSize: 14, color: '#C8516B', fontWeight: 700, marginTop: 4 }}>Cena: {price} Kč{isZbuch ? ' – platba v hotovosti' : ''}</div>
                  </div>
                )}
                <button style={{ ...s.btn('primary'), flex: 'unset', width: '100%' }} onClick={() => setStep(2)}>
                  Rezervovat →
                </button>
              </>
            )}

            {step === 2 && (
              <>
                {prefill && <div style={{ background: 'rgba(91,158,152,0.06)', border: '1px solid rgba(91,158,152,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#5B9E98', marginBottom: 8 }}>✓ Formulář předvyplněn z tvého účtu</div>}
                <label style={s.label}>Jméno a příjmení *</label>
                <input style={s.input(!!prefill?.name)} placeholder="Jana Nováková" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <label style={s.label}>E-mail *</label>
                <input style={s.input(!!prefill?.email)} placeholder="jana@email.cz" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                <label style={s.label}>Telefon (volitelné)</label>
                <input style={s.input(false)} placeholder="+420 777 888 999" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                <div style={{ fontSize: 13, color: '#C8516B', fontWeight: 600, marginTop: 10 }}>
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

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DAYS_FULL = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle']

function getDayName(dateStr) {
  const day = new Date(dateStr).getDay()
  return DAYS_FULL[day === 0 ? 6 : day - 1]
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getHue(str = '') {
  let h = 0
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 360
  return h
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(44,26,34,0.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  box: { background: '#FFFFFF', border: '1px solid #EBCFD8', borderRadius: 20, padding: 'clamp(16px, 4vw, 36px)', width: 480, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(200,81,107,0.15)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  tag: (color) => ({ fontSize: 11, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }),
  title: { fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: '#2C1A22' },
  closeBtn: { background: 'none', border: 'none', color: '#BFA0AD', cursor: 'pointer', fontSize: 20, flexShrink: 0 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 },
  stat: { background: '#FBF6F8', border: '1px solid #EBCFD8', borderRadius: 10, padding: '10px 14px' },
  statLabel: { fontSize: 10, color: '#BFA0AD', textTransform: 'uppercase', letterSpacing: '0.8px' },
  statVal: { fontSize: 18, fontWeight: 800, marginTop: 4, color: '#2C1A22' },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: '#BFA0AD', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 },
  clientCard: (paid) => ({ background: paid ? 'rgba(39,174,96,0.08)' : '#FBF6F8', border: `1px solid ${paid ? 'rgba(39,174,96,0.35)' : '#EBCFD8'}`, borderRadius: 12, padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s' }),
  avatar: (hue) => ({ width: 36, height: 36, borderRadius: '50%', background: `hsl(${hue}, 60%, 88%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: `hsl(${hue}, 50%, 40%)`, flexShrink: 0 }),
  clientName: { fontWeight: 600, fontSize: 14, color: '#2C1A22' },
  clientMeta: { fontSize: 12, color: '#9B7E8A', marginTop: 2 },
  badge: (type) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: type === 'duo' ? 'rgba(155,114,207,0.12)' : 'rgba(91,158,152,0.1)', color: type === 'duo' ? '#9B72CF' : '#5B9E98', border: `1px solid ${type === 'duo' ? 'rgba(155,114,207,0.25)' : 'rgba(91,158,152,0.2)'}`, marginLeft: 6 }),
  empty: { textAlign: 'center', color: '#BFA0AD', padding: '24px 0', fontSize: 14 },
  cancelledBadge: { display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(200,81,107,0.1)', color: '#C8516B', border: '1px solid rgba(200,81,107,0.2)', marginLeft: 6 },
  bar: { height: 6, background: '#F0D9DF', borderRadius: 4, marginBottom: 24, overflow: 'hidden' },
  barFill: (color, ratio) => ({ height: '100%', width: `${Math.min(ratio, 1) * 100}%`, background: ratio >= 1 ? '#C8516B' : color, borderRadius: 4, transition: 'width 0.3s' }),
  paidBtn: (paid) => ({ background: paid ? '#27AE60' : '#fff', border: `1px solid ${paid ? '#27AE60' : '#EBCFD8'}`, borderRadius: 8, padding: '5px 10px', color: paid ? '#fff' : '#9B7E8A', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', whiteSpace: 'nowrap', fontWeight: paid ? 700 : 400, transition: 'all 0.15s' }),
  cancelBtn: { background: 'none', border: '1px solid #EBCFD8', borderRadius: 8, padding: '5px 10px', color: '#9B7E8A', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', whiteSpace: 'nowrap' },
  textarea: { width: '100%', background: '#FBF6F8', border: '1px solid #EBCFD8', borderRadius: 10, padding: '10px 14px', color: '#2C1A22', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: 80 },
  saveBtn: { marginTop: 8, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#C8516B', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
}

function CopyLinkBtn({ slotId, slotName, slotDate }) {
  const [copied, setCopied] = useState(false)
  const handleShare = () => {
    const url = `${window.location.origin}/book?slot=${slotId}`
    if (navigator.share) {
      navigator.share({ title: slotName, text: `Rezervuj si místo: ${slotName} (${slotDate})`, url })
    } else {
      navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
    }
  }
  return (
    <button onClick={handleShare} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #EBCFD8', background: copied ? 'rgba(91,158,152,0.1)' : '#FBF6F8', color: copied ? '#5B9E98' : '#9B7E8A', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
      {copied ? '✓ Zkopírováno' : '🔗 Sdílet'}
    </button>
  )
}

export default function SlotDetailModal({ slot, onClose }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState(slot.notes || '')
  const [notesSaved, setNotesSaved] = useState(false)
  const [showAddBooking, setShowAddBooking] = useState(false)
  const [allClients, setAllClients] = useState([])
  const [clientSearch, setClientSearch] = useState('')
  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [bookingType, setBookingType] = useState('solo')
  const [editingPriceId, setEditingPriceId] = useState(null)
  const [editingPriceValue, setEditingPriceValue] = useState('')
  const [paymentPickerId, setPaymentPickerId] = useState(null)
  const [movingBookingId, setMovingBookingId] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const isMobile = window.innerWidth < 768

  useEffect(() => { loadBookings() }, [slot.id])

  async function loadBookings() {
    setLoading(true)
    const { data } = await supabase.from('bookings').select('*').eq('slot_id', slot.id).order('created_at')
    if (data) setBookings(data)
    setLoading(false)
  }

  async function cancelBooking(bookingId) {
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
  }

  async function deleteBooking(bookingId, clientName) {
    if (!window.confirm(`Opravdu smazat rezervaci klienta "${clientName}"? Tato akce je nevratná.`)) return
    const { error } = await supabase.from('bookings').delete().eq('id', bookingId)
    if (error) { alert('Chyba při mazání: ' + error.message); return }
    setBookings(prev => prev.filter(b => b.id !== bookingId))
  }

  async function setPaid(bookingId, method) {
    await supabase.from('bookings').update({ paid: true, payment_method: method }).eq('id', bookingId)
    setPaymentPickerId(null)
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, paid: true, payment_method: method } : b))
  }

  async function unsetPaid(bookingId) {
    await supabase.from('bookings').update({ paid: false, payment_method: null }).eq('id', bookingId)
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, paid: false, payment_method: null } : b))
  }

  async function openMoveBooking(bookingId) {
    if (movingBookingId === bookingId) { setMovingBookingId(null); return }
    // Načti všechny budoucí termíny stejného typu kromě aktuálního
    const today = new Date().toISOString().slice(0, 10)
    const { data: slots } = await supabase
      .from('training_slots')
      .select('*, bookings(id, status)')
      .eq('name', slot.name)
      .neq('id', slot.id)
      .gte('slot_date', today)
      .order('slot_date')
      .order('start_time')
    // Filtruj termíny s volnou kapacitou
    const withCapacity = (slots || []).filter(s => {
      const confirmed = (s.bookings || []).filter(b => b.status === 'confirmed').length
      return confirmed < s.capacity
    })
    setAvailableSlots(withCapacity)
    setMovingBookingId(bookingId)
  }

  async function moveBooking(bookingId, targetSlotId) {
    await supabase.from('bookings').update({ slot_id: targetSlotId }).eq('id', bookingId)
    setMovingBookingId(null)
    loadBookings()
  }

  async function toggleBookingType(bookingId, currentType) {
    const newType = currentType === 'duo' ? 'solo' : 'duo'
    const newPrice = newType === 'duo' ? 300 : (slot.price || 0)
    await supabase.from('bookings').update({ booking_type: newType, price: newPrice }).eq('id', bookingId)
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, booking_type: newType, price: newPrice } : b))
  }

  async function savePrice(bookingId) {
    const val = parseInt(editingPriceValue, 10)
    if (!isNaN(val) && val >= 0) {
      await supabase.from('bookings').update({ price: val }).eq('id', bookingId)
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, price: val } : b))
    }
    setEditingPriceId(null)
  }

  async function saveNotes() {
    await supabase.from('training_slots').update({ notes }).eq('id', slot.id)
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }

  async function openAddBooking() {
    setShowAddBooking(true)
    setClientSearch('')
    setAddError('')
    setBookingType('solo')
    const { data: bk } = await supabase.from('bookings').select('client_name, client_email, client_phone').eq('status', 'confirmed')
    const { data: mc } = await supabase.from('manual_clients').select('*').order('name')
    const map = {}
    bk?.forEach(b => { const key = b.client_email || `__name__${b.client_name}`; if (!map[key]) map[key] = { name: b.client_name, email: b.client_email, phone: b.client_phone } })
    mc?.forEach(c => { const key = c.email || `__name__${c.name}`; if (!map[key]) map[key] = { name: c.name, email: c.email, phone: c.phone } })
    setAllClients(Object.values(map).sort((a, b) => a.name.localeCompare(b.name, 'cs')))
  }

  async function addManualBooking(client) {
    setAddLoading(true); setAddError('')
    // Kontrola duplicity na tento termín (skupinové tréninky povolují více míst)
    const isGroup = n => !n?.includes('Osobní trénink')
    if (!isGroup(slot.name)) {
      if (client.email) {
        const { data: existing } = await supabase.from('bookings').select('id').eq('slot_id', slot.id).eq('client_email', client.email).eq('status', 'confirmed')
        if (existing?.length > 0) { setAddError(`${client.name} má na tento termín již rezervaci.`); setAddLoading(false); return }
      } else {
        const { data: existing } = await supabase.from('bookings').select('id').eq('slot_id', slot.id).eq('client_name', client.name).eq('status', 'confirmed')
        if (existing?.length > 0) { setAddError(`${client.name} má na tento termín již rezervaci.`); setAddLoading(false); return }
      }
    }
    const confirmed = bookings.filter(b => b.status === 'confirmed')
    if (confirmed.length >= slot.capacity) { setAddError('Termín je plný.'); setAddLoading(false); return }
    const { error } = await supabase.from('bookings').insert({
      slot_id: slot.id,
      client_name: client.name,
      client_email: client.email || null,
      client_phone: client.phone || null,
      booking_type: bookingType,
      price: bookingType === 'duo' ? 300 : resolveSlotPrice(),
      status: 'confirmed',
    })
    if (error) { setAddError('Chyba při ukládání: ' + error.message); setAddLoading(false); return }
    setShowAddBooking(false)
    loadBookings()
    setAddLoading(false)
  }

  function resolveSlotPrice() {
    if (slot.price) return slot.price
    if (slot.name === 'Osobní trénink') return 200
    if (slot.name?.includes('Holýšov')) return 150
    if (slot.name === 'Tabata - Březín') return 150
    if (slot.name?.includes('Zbůch') || slot.name?.includes('Březín')) return 130
    if (slot.name?.includes('Stod')) return 120
    return 0
  }

  const confirmed = bookings.filter(b => b.status === 'confirmed')
  const cancelled = bookings.filter(b => b.status === 'cancelled')
  const ratio = confirmed.length / slot.capacity
  const dayName = getDayName(slot.slot_date || '')
  const isZbuch = slot.name?.includes('Zbůch')
  function zbuchProfit(count) {
    if (count >= 9) return 300
    if (count >= 5) return 250
    return 200
  }

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.box}>
        <div style={s.header}>
          <div>
            <div style={s.tag(slot.color)}>{dayName}, {formatDate(slot.slot_date)} • {slot.start_time}</div>
            <div style={s.title}>{slot.name}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CopyLinkBtn slotId={slot.id} slotName={slot.name} slotDate={formatDate(slot.slot_date)} />
            <button style={s.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        <div style={s.statsRow}>
          <div style={s.stat}>
            <div style={s.statLabel}>Kapacita</div>
            <div style={s.statVal}>{slot.capacity}</div>
          </div>
          <div style={s.stat}>
            <div style={s.statLabel}>Rezervováno</div>
            <div style={{ ...s.statVal, color: ratio >= 1 ? '#C8516B' : '#2C1A22' }}>{confirmed.length}</div>
          </div>
          {isZbuch ? (
            <div style={s.stat}>
              <div style={s.statLabel}>Odměna za lekci</div>
              <div style={{ ...s.statVal, color: '#5B9E98' }}>{confirmed.length > 0 ? `${zbuchProfit(confirmed.length)} Kč` : '–'}</div>
            </div>
          ) : (
            <div style={s.stat}>
              <div style={s.statLabel}>Volná místa</div>
              <div style={{ ...s.statVal, color: '#5B9E98' }}>{Math.max(0, slot.capacity - confirmed.length)}</div>
            </div>
          )}
        </div>

        <div style={s.bar}>
          <div style={s.barFill(slot.color, ratio)} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={s.sectionLabel}>Poznámka k tréninku</div>
          <textarea
            style={s.textarea}
            placeholder="Co se cvičilo, poznámky k hodině..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <button style={s.saveBtn} onClick={saveNotes}>
            {notesSaved ? '✓ Uloženo' : 'Uložit poznámku'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={s.sectionLabel}>Rezervace ({confirmed.length})</div>
          <button onClick={openAddBooking} style={{ background: '#C8516B', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Přidat ručně</button>
        </div>

        {showAddBooking && (
          <div style={{ background: '#FBF6F8', border: '1px solid #EBCFD8', borderRadius: 12, padding: '16px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#2C1A22', marginBottom: 10 }}>Vybrat klienta</div>
            {slot.name === 'Osobní trénink' && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {['solo', 'duo'].map(type => (
                  <button
                    key={type}
                    onClick={() => setBookingType(type)}
                    style={{ flex: 1, padding: '7px', borderRadius: 8, border: `1px solid ${bookingType === type ? (type === 'duo' ? '#9B72CF' : '#5B9E98') : '#EBCFD8'}`, background: bookingType === type ? (type === 'duo' ? 'rgba(155,114,207,0.1)' : 'rgba(91,158,152,0.1)') : '#fff', color: bookingType === type ? (type === 'duo' ? '#9B72CF' : '#5B9E98') : '#9B7E8A', fontWeight: bookingType === type ? 700 : 400, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {type === 'duo' ? '👯 Duo' : '🧘 Sólo'}
                  </button>
                ))}
              </div>
            )}
            <input
              style={{ width: '100%', background: '#fff', border: '1px solid #EBCFD8', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
              placeholder="🔍 Hledat klienta..."
              value={clientSearch}
              onChange={e => setClientSearch(e.target.value)}
            />
            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #EBCFD8', borderRadius: 8, background: '#fff' }}>
              {(() => {
                const q = clientSearch.toLowerCase()
                const filtered = allClients.filter(c =>
                  (c.name || '').toLowerCase().includes(q) ||
                  (c.email || '').toLowerCase().includes(q)
                )
                return filtered.length === 0
                  ? <div style={{ padding: '16px', textAlign: 'center', color: '#BFA0AD', fontSize: 13 }}>Žádný klient nenalezen</div>
                  : filtered.slice(0, 20).map(c => (
                    <div
                      key={c.email || c.name}
                      onClick={() => addManualBooking(c)}
                      style={{ padding: '10px 12px', borderBottom: '1px solid #FAF0F3', cursor: 'pointer', fontSize: 13 }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,81,107,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontWeight: 600, color: '#2C1A22' }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: '#9B7E8A' }}>{c.email}{c.phone ? ` · ${c.phone}` : ''}</div>
                    </div>
                  ))
              })()}
            </div>
            {addError && <div style={{ fontSize: 12, color: '#C8516B', marginTop: 8, fontWeight: 600 }}>⚠️ {addError}</div>}
            {addLoading && <div style={{ fontSize: 12, color: '#9B7E8A', marginTop: 8 }}>Ukládám...</div>}
            <button onClick={() => setShowAddBooking(false)} style={{ marginTop: 10, background: 'none', border: '1px solid #EBCFD8', borderRadius: 8, padding: '6px 12px', color: '#9B7E8A', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Zrušit</button>
          </div>
        )}

        {loading && <div style={s.empty}>Načítám...</div>}

        {!loading && confirmed.length === 0 && (
          <div style={s.empty}>Žádné rezervace na tomto termínu.</div>
        )}

        {confirmed.map(b => {
          const hue = getHue(b.client_email || b.client_name)
          const initials = (b.client_name || '?').split(' ').filter(n => n.length > 0).map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
          const isPersonal = slot.name === 'Osobní trénink'
          const paymentLabel = b.payment_method === 'cash' ? '💵 Hotově' : b.payment_method === 'transfer' ? '🏦 Na účet' : ''
          return (
            <div key={b.id} style={{ ...s.clientCard(b.paid), flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
              {/* Řádek 1: avatar + jméno + zaplaceno */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={s.avatar(hue)}>{initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={s.clientName}>{b.client_name}</span>
                    {isPersonal && <span title="Klikni pro změnu" style={{ ...s.badge(b.booking_type), cursor: 'pointer' }} onClick={() => toggleBookingType(b.id, b.booking_type)}>{b.booking_type === 'duo' ? 'Duo' : 'Sólo'}</span>}
                    {!isZbuch && (editingPriceId === b.id ? (
                      <input autoFocus type="number" value={editingPriceValue}
                        onChange={e => setEditingPriceValue(e.target.value)}
                        onBlur={() => savePrice(b.id)}
                        onKeyDown={e => { if (e.key === 'Enter') savePrice(b.id); if (e.key === 'Escape') setEditingPriceId(null) }}
                        style={{ width: 64, fontSize: 11, padding: '2px 6px', borderRadius: 6, border: '1px solid #C8516B', fontFamily: 'inherit', outline: 'none' }}
                      />
                    ) : (
                      <span title="Klikni pro úpravu ceny" onClick={() => { setEditingPriceId(b.id); setEditingPriceValue(String(b.price ?? 0)) }}
                        style={{ fontSize: 11, color: '#C8516B', fontWeight: 600, cursor: 'pointer', borderBottom: '1px dashed #C8516B' }}>
                        {b.price ?? 0} Kč
                      </span>
                    ))}
                  </div>
                  <div style={{ ...s.clientMeta, marginTop: 2 }}>
                    📧 {b.client_email}{b.client_phone && <span> · 📱 {b.client_phone}</span>}
                  </div>
                </div>
                {!isZbuch && (b.paid ? (
                  <button style={s.paidBtn(true)} onClick={() => unsetPaid(b.id)}>✓ {paymentLabel || 'Zaplaceno'}</button>
                ) : (
                  <button style={s.paidBtn(false)} onClick={() => setPaymentPickerId(paymentPickerId === b.id ? null : b.id)}>Zaplaceno?</button>
                ))}
              </div>
              {/* Řádek 2: akční tlačítka + dropdowny */}
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', position: 'relative' }}>
                <button style={s.cancelBtn} onClick={() => openMoveBooking(b.id)}>Přesunout</button>
                <button style={s.cancelBtn} onClick={() => cancelBooking(b.id)}>Zrušit</button>
                <button style={{ ...s.cancelBtn, color: '#C8516B', borderColor: 'rgba(200,81,107,0.3)' }} onClick={() => deleteBooking(b.id, b.client_name)}>Smazat</button>
                {movingBookingId === b.id && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 10, background: '#fff', border: '1px solid #EBCFD8', borderRadius: 10, padding: 8, boxShadow: '0 4px 16px rgba(200,81,107,0.12)', minWidth: 220, maxHeight: 240, overflowY: 'auto' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#BFA0AD', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6, padding: '0 4px' }}>Přesunout na termín</div>
                    {availableSlots.length === 0 && <div style={{ fontSize: 12, color: '#9B7E8A', padding: '4px 4px 8px' }}>Žádný volný termín</div>}
                    {availableSlots.map(ts => (
                      <div
                        key={ts.id}
                        onClick={() => moveBooking(b.id, ts.id)}
                        style={{ padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,81,107,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontWeight: 600, color: '#2C1A22' }}>{ts.start_time?.slice(0, 5) || '–'}</span>
                        <span style={{ color: '#9B7E8A', fontSize: 12 }}> · {formatDate(ts.slot_date)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {paymentPickerId === b.id && (
                  <div style={{ display: 'flex', gap: 6, position: 'absolute', top: '100%', right: 0, zIndex: 10, background: '#fff', border: '1px solid #EBCFD8', borderRadius: 10, padding: 8, boxShadow: '0 4px 16px rgba(200,81,107,0.12)', whiteSpace: 'nowrap' }}>
                    <button onClick={() => setPaid(b.id, 'cash')} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #EBCFD8', background: '#FBF6F8', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>💵 Hotově</button>
                    <button onClick={() => setPaid(b.id, 'transfer')} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #EBCFD8', background: '#FBF6F8', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>🏦 Na účet</button>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {cancelled.length > 0 && (
          <>
            <div style={{ ...s.sectionLabel, marginTop: 20 }}>Zrušené rezervace ({cancelled.length})</div>
            {cancelled.map(b => {
              const hue = getHue(b.client_email || b.client_name)
              const initials = (b.client_name || '?').split(' ').filter(n => n.length > 0).map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
              return (
                <div key={b.id} style={{ ...s.clientCard(false), opacity: 0.4 }}>
                  <div style={s.avatar(hue)}>{initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={s.clientName}>{b.client_name}</span>
                      <span style={s.cancelledBadge}>Zrušeno</span>
                    </div>
                    <div style={s.clientMeta}>📧 {b.client_email}</div>
                  </div>
                  <button style={{ ...s.cancelBtn, color: '#C8516B', borderColor: 'rgba(200,81,107,0.3)', opacity: 1 }} onClick={() => deleteBooking(b.id, b.client_name)}>Smazat</button>
                </div>
              )
            })}
          </>
        )}

      </div>
    </div>
  )
}

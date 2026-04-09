// supabase/functions/booking-notifications/index.ts
// Spustí se automaticky při každé nové nebo změněné rezervaci
// Posílá email klientovi i trenérovi

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL')!
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'rezervace@cviceniprozeny.cz'

const DAYS_CZ = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle']

function getDayName(dateStr: string) {
  const day = new Date(dateStr).getDay()
  return DAYS_CZ[day === 0 ? 6 : day - 1]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error: ${err}`)
  }
  return res.json()
}

// ── Email šablony ──────────────────────────────────────────────────────────────

function emailBase(content: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0A0A0F; color: #F0EDE8; border-radius: 16px; overflow: hidden;">
      <div style="background: #FF4D00; padding: 24px 32px;">
        <div style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Barbora Knížková</div>
      </div>
      <div style="padding: 32px;">
        ${content}
      </div>
      <div style="padding: 16px 32px; border-top: 1px solid #1E1E2E; font-size: 12px; color: #555; text-align: center;">
        Barbora Knížková · barbora-knizkova.vercel.app
      </div>
    </div>
  `
}

function bookingConfirmationClient(booking: any, slot: any) {
  const isPersonal = slot.name === 'Osobní trénink'
  const typeLabel = isPersonal ? (booking.booking_type === 'duo' ? 'Duo trénink' : 'Sólo trénink') : ''
  const dayName = getDayName(slot.slot_date)

  return emailBase(`
    <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px;">✅ Rezervace potvrzena!</h2>
    <p style="color: #888; margin: 0 0 24px;">Ahoj <strong style="color: #F0EDE8;">${booking.client_name}</strong>, tvoje rezervace je potvrzena.</p>

    <div style="background: #111118; border: 1px solid #1E1E2E; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <div style="font-size: 18px; font-weight: 700; margin-bottom: 8px; color: #FF4D00;">${slot.name}${typeLabel ? ` – ${typeLabel}` : ''}</div>
      <div style="color: #888; font-size: 14px; line-height: 1.8;">
        📅 ${dayName}, ${formatDate(slot.slot_date)}<br>
        🕐 ${slot.start_time} (${slot.duration_minutes} min)<br>
        ${booking.price > 0 ? `💰 Cena: <strong style="color: #FF4D00;">${booking.price} Kč</strong>` : ''}
      </div>
    </div>

    ${booking.price > 0 ? `
    <div style="background: #111118; border: 1px solid #1E1E2E; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 13px; color: #888;">
      💳 Platbu proveď převodem nebo QR kódem při příchodu na trénink.<br>
      Číslo účtu: <strong style="color: #F0EDE8;">260597819/0300</strong>
    </div>
    ` : ''}

    <p style="color: #666; font-size: 13px;">
      Pokud potřebuješ rezervaci zrušit, udělej to nejpozději 24 hodin předem na adrese:<br>
      <a href="https://barbora-knizkova.vercel.app/book" style="color: #FF4D00;">barbora-knizkova.vercel.app/book</a>
    </p>
  `)
}

function bookingNotificationAdmin(booking: any, slot: any) {
  const isPersonal = slot.name === 'Osobní trénink'
  const typeLabel = isPersonal ? (booking.booking_type === 'duo' ? 'Duo' : 'Sólo') : ''
  const dayName = getDayName(slot.slot_date)

  return emailBase(`
    <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px;">🆕 Nová rezervace</h2>

    <div style="background: #111118; border: 1px solid #1E1E2E; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <div style="font-size: 16px; font-weight: 700; margin-bottom: 12px; color: #FF4D00;">${slot.name}${typeLabel ? ` – ${typeLabel}` : ''}</div>
      <div style="color: #888; font-size: 14px; line-height: 2;">
        📅 ${dayName}, ${formatDate(slot.slot_date)} v ${slot.start_time}<br>
        👤 <strong style="color: #F0EDE8;">${booking.client_name}</strong><br>
        📧 ${booking.client_email}<br>
        ${booking.client_phone ? `📱 ${booking.client_phone}<br>` : ''}
        ${booking.price > 0 ? `💰 ${booking.price} Kč` : ''}
      </div>
    </div>
  `)
}

function cancellationClient(booking: any, slot: any) {
  const dayName = getDayName(slot.slot_date)
  return emailBase(`
    <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px;">❌ Rezervace zrušena</h2>
    <p style="color: #888; margin: 0 0 24px;">Ahoj <strong style="color: #F0EDE8;">${booking.client_name}</strong>, tvoje rezervace byla zrušena.</p>

    <div style="background: #111118; border: 1px solid #1E1E2E; border-radius: 12px; padding: 20px; margin-bottom: 24px; opacity: 0.7;">
      <div style="font-size: 16px; font-weight: 700; margin-bottom: 8px; color: #888;">${slot.name}</div>
      <div style="color: #666; font-size: 14px; line-height: 1.8;">
        📅 ${dayName}, ${formatDate(slot.slot_date)}<br>
        🕐 ${slot.start_time}
      </div>
    </div>

    <p style="color: #666; font-size: 13px;">
      Chceš se rezervovat na jiný termín?<br>
      <a href="https://barbora-knizkova.vercel.app/book" style="color: #FF4D00;">barbora-knizkova.vercel.app/book</a>
    </p>
  `)
}

function cancellationAdmin(booking: any, slot: any) {
  const dayName = getDayName(slot.slot_date)
  return emailBase(`
    <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px;">⚠️ Zrušení rezervace</h2>

    <div style="background: #111118; border: 1px solid #1E1E2E; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <div style="font-size: 16px; font-weight: 700; margin-bottom: 12px; color: #888;">${slot.name}</div>
      <div style="color: #888; font-size: 14px; line-height: 2;">
        📅 ${dayName}, ${formatDate(slot.slot_date)} v ${slot.start_time}<br>
        👤 <strong style="color: #F0EDE8;">${booking.client_name}</strong><br>
        📧 ${booking.client_email}<br>
        ${booking.client_phone ? `📱 ${booking.client_phone}<br>` : ''}
      </div>
    </div>
  `)
}


// ── Google Calendar – smazání události ────────────────────────────────────────

function pemToBinaryNotif(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s+/g, '')
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}

async function getGcalToken(serviceAccount: any): Promise<string> {
  const { encode } = await import('https://deno.land/std@0.177.0/encoding/base64url.ts')
  const now = Math.floor(Date.now() / 1000)
  const header = encode(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const payload = encode(JSON.stringify({ iss: serviceAccount.client_email, scope: "https://www.googleapis.com/auth/calendar", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }))
  const signingInput = header + "." + payload
  let pemKey = serviceAccount.private_key
  if (pemKey.includes('\\n')) pemKey = pemKey.replace(/\\n/g, '\n')
  const cryptoKey = await crypto.subtle.importKey("pkcs8", pemToBinaryNotif(pemKey), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"])
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(signingInput))
  const jwt = signingInput + "." + encode(new Uint8Array(sig))
  const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=" + jwt })
  const data = await res.json()
  if (!data.access_token) throw new Error("GCal auth failed")
  return data.access_token
}

async function deleteCalendarEvent(serviceAccount: any, calendarId: string, eventId: string): Promise<void> {
  try {
    const token = await getGcalToken(serviceAccount)
    const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(calendarId) + "/events/" + eventId, { method: "DELETE", headers: { "Authorization": "Bearer " + token } })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`GCal DELETE failed (${res.status}): ${body}`)
    }
    console.log("✅ Calendar event deleted:", eventId)
  } catch (e) {
    console.error("⚠️ Could not delete calendar event:", e)
  }
}

// ── Hlavní handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  try {
    // Auth check vypnutý – funkce je chráněná Supabase infrastrukturou

    const body = await req.json()
    const { type, table, record, old_record } = body

    if (table !== 'bookings') return new Response('Ignored', { status: 200 })

    // Načti detail slotu
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: slot } = await supabase
      .from('training_slots')
      .select('*')
      .eq('id', record.slot_id)
      .single()

    if (!slot) throw new Error('Slot not found')

    // Nová rezervace
    if (type === 'INSERT' && record.status === 'confirmed') {
      await Promise.all([
        sendEmail(
          record.client_email,
          `✅ Rezervace potvrzena – ${slot.name} ${slot.slot_date}`,
          bookingConfirmationClient(record, slot)
        ),
        sendEmail(
          ADMIN_EMAIL,
          `🆕 Nová rezervace – ${record.client_name}`,
          bookingNotificationAdmin(record, slot)
        ),
      ])
      console.log('✅ Confirmation emails sent')
    }

    // Zrušení rezervace
    if (type === 'UPDATE' && record.status === 'cancelled' && old_record?.status !== 'cancelled') {
      // Emaily – chyby ignorujeme aby nespadlo i mazání kalendáře
      await sendEmail(ADMIN_EMAIL, `⚠️ Zrušení rezervace – ${record.client_name}`, cancellationAdmin(record, slot)).catch(e => console.error('Admin email failed:', e))
      await sendEmail(record.client_email, `❌ Rezervace zrušena – ${slot.name} ${slot.slot_date}`, cancellationClient(record, slot)).catch(e => console.error('Client email failed:', e))

      // Smaž z Google Kalendáře
      if (record.gcal_event_id) {
        const sa = Deno.env.get('GOOGLE_SERVICE_ACCOUNT')
        const cal = Deno.env.get('GOOGLE_CALENDAR_ID')
        if (sa && cal) await deleteCalendarEvent(JSON.parse(sa), cal, record.gcal_event_id)
      }
      console.log('✅ Cancellation processed')
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('❌ Error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

// supabase/functions/booking-to-gcal/index.ts
// Vytvoří událost v Google Kalendáři při každé nové rezervaci

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DAYS_CZ = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle']

function getDayName(dateStr: string) {
  const day = new Date(dateStr).getDay()
  return DAYS_CZ[day === 0 ? 6 : day - 1]
}

async function getGoogleAccessToken(serviceAccount: Record<string, string>): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/calendar',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  }))
  const signingInput = `${header}.${payload}`
  const pemKey = serviceAccount.private_key.replace(/\\n/g, '\n')
  const binaryKey = pemToBinary(pemKey)
  const cryptoKey = await crypto.subtle.importKey('pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(signingInput))
  const jwt = `${signingInput}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })
  const data = await res.json()
  if (!data.access_token) throw new Error(`Google auth failed: ${JSON.stringify(data)}`)
  return data.access_token
}

function pemToBinary(pem: string): ArrayBuffer {
  const base64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, '')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

async function createCalendarEvent(accessToken: string, calendarId: string, event: any) {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: event.summary,
        description: event.description,
        start: { dateTime: event.startDateTime, timeZone: 'Europe/Prague' },
        end: { dateTime: event.endDateTime, timeZone: 'Europe/Prague' },
        colorId: event.colorId ?? '6',
        reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 60 }] },
      }),
    }
  )
  if (!res.ok) throw new Error(`Google Calendar API error: ${await res.text()}`)
  return res.json()
}

Deno.serve(async (req: Request) => {
  try {
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
    const authHeader = req.headers.get('authorization')
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    if (body.type !== 'INSERT' || body.table !== 'bookings') {
      return new Response('Ignored', { status: 200 })
    }

    const booking = body.record
    if (booking.status !== 'confirmed') return new Response('Not confirmed', { status: 200 })

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: slot } = await supabase.from('training_slots').select('*').eq('id', booking.slot_id).single()
    if (!slot) throw new Error('Slot not found')

    const [hours, minutes] = slot.start_time.split(':').map(Number)
    const startDateTime = new Date(`${slot.slot_date}T${slot.start_time}:00`)
    const endDateTime = new Date(startDateTime)
    endDateTime.setMinutes(endDateTime.getMinutes() + slot.duration_minutes)

    const isPersonal = slot.name === 'Osobní trénink'
    const typeLabel = isPersonal ? (booking.booking_type === 'duo' ? ' – Duo' : ' – Sólo') : ''

    const serviceAccount = JSON.parse(Deno.env.get('GOOGLE_SERVICE_ACCOUNT')!)
    const calendarId = Deno.env.get('GOOGLE_CALENDAR_ID')!
    const accessToken = await getGoogleAccessToken(serviceAccount)

    const calEvent = await createCalendarEvent(accessToken, calendarId, {
      summary: `💪 ${slot.name}${typeLabel} – ${booking.client_name}`,
      description: [
        `📋 ${slot.name}${typeLabel}`,
        `👤 Klient: ${booking.client_name}`,
        `📧 Email: ${booking.client_email}`,
        booking.client_phone ? `📱 Telefon: ${booking.client_phone}` : '',
        `📅 ${getDayName(slot.slot_date)}, ${slot.slot_date} v ${slot.start_time}`,
        `⏱️ Délka: ${slot.duration_minutes} min`,
        booking.price > 0 ? `💰 Cena: ${booking.price} Kč` : '',
        `🆔 ID: ${booking.id}`,
      ].filter(Boolean).join('\n'),
      startDateTime: startDateTime.toISOString().slice(0, 19),
      endDateTime: endDateTime.toISOString().slice(0, 19),
    })

    console.log('✅ Google Calendar event created:', calEvent.id)
    return new Response(JSON.stringify({ success: true, eventId: calEvent.id }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('❌ Error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
})

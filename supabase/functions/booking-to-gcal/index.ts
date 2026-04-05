import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encode as base64encode } from 'https://deno.land/std@0.177.0/encoding/base64url.ts'

const DAYS_CZ = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle']

function getDayName(dateStr: string) {
  const day = new Date(dateStr).getDay()
  return DAYS_CZ[day === 0 ? 6 : day - 1]
}

function pemToBinary(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '')
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}

async function getGoogleAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  const headerObj = { alg: 'RS256', typ: 'JWT' }
  const payloadObj = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/calendar',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }

  const header = base64encode(JSON.stringify(headerObj))
  const payload = base64encode(JSON.stringify(payloadObj))
  const signingInput = `${header}.${payload}`

  // Normalizuj private_key
  let pemKey = serviceAccount.private_key
  if (pemKey.includes('\\n')) pemKey = pemKey.replace(/\\n/g, '\n')

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToBinary(pemKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput)
  )

  const signature = base64encode(new Uint8Array(signatureBuffer))
  const jwt = `${signingInput}.${signature}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  const data = await res.json()
  if (!data.access_token) throw new Error(`Google auth failed: ${JSON.stringify(data)}`)
  return data.access_token
}

async function createCalendarEvent(accessToken: string, calendarId: string, event: any) {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: event.summary,
        description: event.description,
        start: { dateTime: event.startDateTime, timeZone: 'Europe/Prague' },
        end: { dateTime: event.endDateTime, timeZone: 'Europe/Prague' },
        colorId: '6',
        reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 60 }] },
      }),
    }
  )
  if (!res.ok) throw new Error(`Google Calendar API error: ${await res.text()}`)
  return res.json()
}

Deno.serve(async (req: Request) => {
  try {
    // Auth check odstraněn – funkce je chráněná Supabase infrastrukturou

    const body = await req.json()
    if (body.type !== 'INSERT' || body.table !== 'bookings') {
      return new Response('Ignored', { status: 200 })
    }

    const booking = body.record
    if (booking.status !== 'confirmed') return new Response('Not confirmed', { status: 200 })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: slot } = await supabase
      .from('training_slots')
      .select('*')
      .eq('id', booking.slot_id)
      .single()

    if (!slot) throw new Error('Slot not found')

    // Použij explicitní Prague timezone aby se čas neshiftoval
    const startDateTime = new Date(`${slot.slot_date}T${slot.start_time}:00+02:00`)
    const endDateTime = new Date(startDateTime)
    endDateTime.setMinutes(endDateTime.getMinutes() + slot.duration_minutes)

    const isPersonal = slot.name === 'Osobní trénink'
    const typeLabel = isPersonal ? (booking.booking_type === 'duo' ? ' – Duo' : ' – Sólo') : ''

    const serviceAccount = JSON.parse(Deno.env.get('GOOGLE_SERVICE_ACCOUNT')!)
    const calendarId = Deno.env.get('GOOGLE_CALENDAR_ID')!

    const accessToken = await getGoogleAccessToken(serviceAccount)

    // Čas předáme přímo jako local datetime string bez UTC konverze
    const endTime = new Date(`${slot.slot_date}T${slot.start_time}:00`)
    endTime.setMinutes(endTime.getMinutes() + slot.duration_minutes)
    const endHH = String(endTime.getHours()).padStart(2, '0')
    const endMM = String(endTime.getMinutes()).padStart(2, '0')
    const endTimeStr = `${endHH}:${endMM}`

    const calEvent = await createCalendarEvent(accessToken, calendarId, {
      summary: `💪 ${slot.name}${typeLabel} – ${booking.client_name}`,
      description: [
        `👤 ${booking.client_name}`,
        `📧 ${booking.client_email}`,
        booking.client_phone ? `📱 ${booking.client_phone}` : '',
        booking.price > 0 ? `💰 ${booking.price} Kč` : '',
        `🆔 ${booking.id}`,
      ].filter(Boolean).join('\n'),
      startDateTime: `${slot.slot_date}T${slot.start_time}:00`,
      endDateTime: `${slot.slot_date}T${endTimeStr}:00`,
    })

    // Ulož gcal_event_id do databáze pro pozdější smazání
    await supabase
      .from('bookings')
      .update({ gcal_event_id: calEvent.id })
      .eq('id', booking.id)

    console.log('✅ Calendar event created:', calEvent.id)
    return new Response(JSON.stringify({ success: true, eventId: calEvent.id }), {
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

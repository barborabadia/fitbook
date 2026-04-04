// supabase/functions/booking-to-gcal/index.ts
// Tato funkce se spustí automaticky při každé nové rezervaci
// a vytvoří událost v Google Kalendáři trenéra.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DAYS_CZ = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle']

// ─── Google Auth pomocí Service Account ────────────────────────────────────────

async function getGoogleAccessToken(serviceAccount: Record<string, string>): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/calendar',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))

  const signingInput = `${header}.${payload}`

  // Importuj privátní klíč
  const pemKey = serviceAccount.private_key.replace(/\\n/g, '\n')
  const binaryKey = pemToBinary(pemKey)
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput)
  )

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

// ─── Vytvoření události v Google Kalendáři ─────────────────────────────────────

async function createCalendarEvent(accessToken: string, calendarId: string, event: {
  summary: string
  description: string
  startDateTime: string
  endDateTime: string
  colorId?: string
}) {
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
        colorId: event.colorId ?? '6', // 6 = tangerine/oranžová
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 60 },
          ],
        },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google Calendar API error: ${err}`)
  }

  return res.json()
}

// ─── Hlavní handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  try {
    // Webhook secret – ochrana před neoprávněnými voláními
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
    const authHeader = req.headers.get('authorization')
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body = await req.json()

    // Supabase webhook posílá { type, table, record, old_record }
    if (body.type !== 'INSERT' || body.table !== 'bookings') {
      return new Response('Ignored', { status: 200 })
    }

    const booking = body.record
    if (booking.status !== 'confirmed') {
      return new Response('Not confirmed, skipped', { status: 200 })
    }

    // Načti detaily tréninku
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: training, error } = await supabase
      .from('trainings')
      .select('*')
      .eq('id', booking.training_id)
      .single()

    if (error || !training) throw new Error('Training not found')

    // Sestav datum a čas tréninku
    // week_start je pondělí daného týdne, day_of_week je 0=Po, 6=Ne
    const weekStart = new Date(booking.week_start)
    weekStart.setDate(weekStart.getDate() + training.day_of_week)

    const [hours, minutes] = training.start_time.split(':').map(Number)
    const startDateTime = new Date(weekStart)
    startDateTime.setHours(hours, minutes, 0, 0)

    const endDateTime = new Date(startDateTime)
    endDateTime.setMinutes(endDateTime.getMinutes() + training.duration_minutes)

    const startISO = startDateTime.toISOString().slice(0, 19)
    const endISO = endDateTime.toISOString().slice(0, 19)

    // Google Service Account z env proměnné
    const serviceAccount = JSON.parse(Deno.env.get('GOOGLE_SERVICE_ACCOUNT')!)
    const calendarId = Deno.env.get('GOOGLE_CALENDAR_ID')!

    const accessToken = await getGoogleAccessToken(serviceAccount)

    const calEvent = await createCalendarEvent(accessToken, calendarId, {
      summary: `🏋️ ${training.name} – ${booking.client_name}`,
      description: [
        `📋 Rezervace: ${training.name}`,
        `👤 Klient: ${booking.client_name}`,
        `📧 Email: ${booking.client_email}`,
        booking.client_phone ? `📱 Telefon: ${booking.client_phone}` : '',
        `📅 Den: ${DAYS_CZ[training.day_of_week]}, ${training.start_time}`,
        `⏱️ Délka: ${training.duration_minutes} min`,
        `🆔 Rezervace ID: ${booking.id}`,
      ].filter(Boolean).join('\n'),
      startDateTime: startISO,
      endDateTime: endISO,
    })

    console.log('✅ Google Calendar event created:', calEvent.id)
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

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
        <div style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Cvičení pro ženy</div>
      </div>
      <div style="padding: 32px;">
        ${content}
      </div>
      <div style="padding: 16px 32px; border-top: 1px solid #1E1E2E; font-size: 12px; color: #555; text-align: center;">
        Cvičení pro ženy · cviceni-pro-zeny.vercel.app
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
      <a href="https://cviceni-pro-zeny.vercel.app/book" style="color: #FF4D00;">cviceni-pro-zeny.vercel.app/book</a>
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
      <a href="https://cviceni-pro-zeny.vercel.app/book" style="color: #FF4D00;">cviceni-pro-zeny.vercel.app/book</a>
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

// ── Hlavní handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  try {
    // Supabase webhooks posílají service_role token automaticky - přijmeme ho
    // Volitelně lze nastavit WEBHOOK_SECRET pro extra ochranu
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
    const authHeader = req.headers.get('authorization')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}` && authHeader !== `Bearer ${serviceRoleKey}`) {
      return new Response('Unauthorized', { status: 401 })
    }

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
    if (type === 'UPDATE' && record.status === 'cancelled' && old_record?.status === 'confirmed') {
      await Promise.all([
        sendEmail(
          record.client_email,
          `❌ Rezervace zrušena – ${slot.name} ${slot.slot_date}`,
          cancellationClient(record, slot)
        ),
        sendEmail(
          ADMIN_EMAIL,
          `⚠️ Zrušení rezervace – ${record.client_name}`,
          cancellationAdmin(record, slot)
        ),
      ])
      console.log('✅ Cancellation emails sent')
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

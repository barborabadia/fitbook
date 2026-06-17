// supabase/functions/send-inquiry/index.ts
// Odešle email trenérce při poptávce online spolupráce a uloží záznam do DB

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL')!
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'rezervace@cviceniprozeny.cz'

const SERVICE_NAMES: Record<string, string> = {
  vyziva: 'Výživové poradenství',
  trenink: 'Tréninkový plán',
}

const SERVICE_PRICES: Record<string, number> = {
  vyziva: 1500,
  trenink: 1000,
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

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const { service, clientName, clientEmail } = await req.json()
    const serviceName = SERVICE_NAMES[service] || service
    const price = SERVICE_PRICES[service] || 0

    // Ulož poptávku do databáze
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    await supabase.from('inquiries').insert({
      client_name: clientName,
      client_email: clientEmail || null,
      service,
      price,
    })

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0A0A0F; color: #F0EDE8; border-radius: 16px; overflow: hidden;">
        <div style="background: #FF4D00; padding: 24px 32px;">
          <div style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Barbora Knížková</div>
        </div>
        <div style="padding: 32px;">
          <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 20px;">🆕 Nová poptávka – ${serviceName}</h2>
          <div style="background: #111118; border: 1px solid #1E1E2E; border-radius: 12px; padding: 20px;">
            <div style="color: #888; font-size: 14px; line-height: 2;">
              👤 <strong style="color: #F0EDE8;">${clientName}</strong><br>
              📧 ${clientEmail}<br>
              🎯 <strong style="color: #FF4D00;">${serviceName}</strong><br>
              💰 ${price} Kč
            </div>
          </div>
        </div>
        <div style="padding: 16px 32px; border-top: 1px solid #1E1E2E; font-size: 12px; color: #555; text-align: center;">
          Barbora Knížková · barbora-knizkova.vercel.app
        </div>
      </div>
    `

    await sendEmail(ADMIN_EMAIL, `🆕 Poptávka: ${serviceName} – ${clientName}`, html)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  } catch (err) {
    console.error('❌ Error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }
})

import sharp from 'sharp'
import { mkdirSync } from 'fs'

mkdirSync('public', { recursive: true })

function makeSvg(size) {
  const r = Math.round(size * 0.18)
  const s = size

  // Činka – dvě závaží + tyč, vše bílé na sakurovém pozadí
  const plateW  = s * 0.19
  const plateH  = s * 0.39
  const plateRx = s * 0.03
  const barH    = s * 0.115
  const barRx   = s * 0.022

  // Pozice (symetricky)
  const totalW  = plateW * 2 + s * 0.36
  const startX  = (s - totalW) / 2
  const plateY  = (s - plateH) / 2
  const barY    = (s - barH) / 2
  const barX    = startX + plateW
  const barW    = s - 2 * startX - 2 * plateW

  // Vnitřní detail závaží (jemný stín)
  const inPad   = s * 0.035
  const inRx    = s * 0.02

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#F08DAE"/>
      <stop offset="100%" stop-color="#C03468"/>
    </linearGradient>
  </defs>

  <!-- Pozadí -->
  <rect width="${s}" height="${s}" fill="url(#bg)" rx="${r}"/>

  <!-- Levé závaží -->
  <rect x="${startX}" y="${plateY}" width="${plateW}" height="${plateH}" rx="${plateRx}" fill="white"/>
  <rect x="${startX + inPad}" y="${plateY + inPad}" width="${plateW - inPad*2}" height="${plateH - inPad*2}" rx="${inRx}" fill="rgba(180,50,100,0.12)"/>

  <!-- Tyč -->
  <rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="${barRx}" fill="white"/>

  <!-- Pravé závaží -->
  <rect x="${startX + plateW + barW}" y="${plateY}" width="${plateW}" height="${plateH}" rx="${plateRx}" fill="white"/>
  <rect x="${startX + plateW + barW + inPad}" y="${plateY + inPad}" width="${plateW - inPad*2}" height="${plateH - inPad*2}" rx="${inRx}" fill="rgba(180,50,100,0.12)"/>
</svg>`
}

for (const size of [192, 512]) {
  await sharp(Buffer.from(makeSvg(size)))
    .png()
    .toFile(`public/icon-${size}.png`)
  console.log(`Generated public/icon-${size}.png`)
}

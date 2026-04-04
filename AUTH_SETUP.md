# 🔐 Nastavení přihlašování – Google & Facebook

---

## Jak přihlašování funguje

- **Trenér** (`/`) – musí se přihlásit, přístup má pouze účet jehož e-mail je v `VITE_ADMIN_EMAIL`
- **Klienti** (`/book`) – přihlášení je **volitelné**, slouží jen k předvyplnění formuláře

---

## Krok 1 – Google přihlašování (5 minut)

1. Jdi na [console.cloud.google.com](https://console.cloud.google.com)
2. Vyber projekt (nebo vytvoř nový)
3. **APIs & Services > OAuth consent screen**
   - User Type: **External** → Create
   - App name: `FitBook`, přidej svůj e-mail → Save
4. **APIs & Services > Credentials > Create Credentials > OAuth client ID**
   - Application type: **Web application**
   - Authorized redirect URIs – přidej:
     ```
     https://tvuj-projekt.supabase.co/auth/v1/callback
     ```
     (URL najdeš v Supabase > Settings > API > Project URL)
   - Klikni **Create** a zkopíruj **Client ID** a **Client Secret**

5. Jdi do **Supabase > Authentication > Providers > Google**
   - Zapni Google provider
   - Vlož Client ID a Client Secret
   - Ulož

---

## Krok 2 – Facebook přihlašování (10 minut)

1. Jdi na [developers.facebook.com](https://developers.facebook.com)
2. **My Apps > Create App**
   - Typ: **Consumer** → Next
   - App name: `FitBook` → Create App
3. Na dashboardu klikni **Set up** u produktu **Facebook Login**
   - Vyber **Web**, zadej URL své appky (např. `https://fitbook.vercel.app`)
4. Jdi na **Settings > Basic** a zkopíruj **App ID** a **App Secret**
5. Jdi na **Facebook Login > Settings**
   - Valid OAuth Redirect URIs – přidej:
     ```
     https://tvuj-projekt.supabase.co/auth/v1/callback
     ```
6. Jdi do **Supabase > Authentication > Providers > Facebook**
   - Zapni Facebook provider
   - Vlož App ID a App Secret
   - Ulož

---

## Krok 3 – Nastavení env proměnných

### Lokálně (soubor `.env`):
```
VITE_SUPABASE_URL=https://tvuj-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=tvuj-anon-key
VITE_ADMIN_EMAIL=tvuj@gmail.com
```

### Na Vercelu:
1. Jdi na vercel.com → tvůj projekt → **Settings > Environment Variables**
2. Přidej `VITE_ADMIN_EMAIL` = tvůj e-mail (stejný jako použiješ při přihlášení přes Google/Facebook)

---

## Krok 4 – Redirect URL pro Vercel

V Supabase jdi na **Authentication > URL Configuration** a přidej:
```
https://tvuj-projekt.vercel.app
https://tvuj-projekt.vercel.app/book
```

---

## ✅ Hotovo!

- Otevři `/` → zobrazí se přihlašovací obrazovka
- Přihlas se svým Google nebo Facebook účtem
- Pokud e-mail odpovídá `VITE_ADMIN_EMAIL`, dostaneš se do admin panelu

Klienti na `/book` uvidí možnost přihlásit se pro rychlejší rezervaci – nebo mohou rezervovat bez přihlášení.

---

## ❗ Časté problémy

**"Access denied" i po přihlášení:**
Zkontroluj, že `VITE_ADMIN_EMAIL` v Supabase/Vercel je přesně stejný e-mail, který používáš v Google/Facebook účtu.

**Redirect loop nebo chyba po přihlášení:**
Zkontroluj, že máš správně nastavené Redirect URIs v Google Console / Facebook i v Supabase URL Configuration.

**Facebook vyžaduje review:**
Pro testování stačí přidat svůj e-mail jako Test User v Facebook app → Roles → Test Users.

# 📅 Napojení na Google Kalendář – návod

Při každé nové rezervaci se automaticky vytvoří událost v tvém Google Kalendáři.

---

## Jak to funguje

```
Klient vyplní formulář
        ↓
Supabase uloží rezervaci
        ↓
Supabase Webhook spustí Edge Function
        ↓
Edge Function zavolá Google Calendar API
        ↓
V tvém kalendáři se objeví událost 🎉
```

---

## Krok 1 – Google Service Account (10 minut)

Service Account je "robot účet", který může zapisovat do tvého kalendáře bez toho, aby ses musel přihlašovat.

1. Jdi na [console.cloud.google.com](https://console.cloud.google.com)
2. Vytvoř nový projekt (nebo použij existující) – klikni nahoře na název projektu → **New Project**
3. V levém menu jdi na **APIs & Services > Library**
4. Vyhledej **Google Calendar API** a klikni **Enable**
5. Jdi na **APIs & Services > Credentials**
6. Klikni **Create Credentials > Service Account**
   - Jméno: `fitbook-calendar`
   - Klikni **Create and Continue** → přeskoč roles → **Done**
7. Klikni na nově vytvořený Service Account
8. Jdi na záložku **Keys > Add Key > Create new key > JSON**
9. Stáhne se soubor `.json` – **ULOŽ HO, budeš ho potřebovat**

---

## Krok 2 – Sdílení kalendáře se Service Accountem

1. Otevři [calendar.google.com](https://calendar.google.com)
2. V levém panelu najdi svůj kalendář, klikni na tři tečky → **Settings and sharing**
3. Přejdi dolů na **Share with specific people or groups**
4. Klikni **Add people** a zadej email Service Accountu
   - Najdeš ho v JSON souboru jako `"client_email": "fitbook-calendar@...iam.gserviceaccount.com"`
5. Nastav oprávnění: **Make changes to events**
6. Klikni **Send**
7. Zkopíruj si **Calendar ID** – najdeš ho níže na stránce v sekci **Integrate calendar**
   - Vypadá jako: `tvuj-email@gmail.com` nebo dlouhý řetězec `abc123@group.calendar.google.com`

---

## Krok 3 – Nasazení Edge Function

V terminálu ve složce projektu:

```bash
# Přihlas se do Supabase CLI (pokud ho nemáš: npm install -g supabase)
npx supabase login

# Propoj s tvým projektem (Project ID najdeš v Supabase > Settings > General)
npx supabase link --project-ref TVOJE_PROJECT_ID

# Nasaď funkci
npx supabase functions deploy booking-to-gcal
```

---

## Krok 4 – Nastavení env proměnných v Supabase

Jdi na [supabase.com](https://supabase.com) → tvůj projekt → **Settings > Edge Functions > Add new secret**

Přidej tyto 3 proměnné:

| Název | Hodnota |
|-------|---------|
| `GOOGLE_SERVICE_ACCOUNT` | Celý obsah JSON souboru ze Kroku 1 (jako jeden řádek) |
| `GOOGLE_CALENDAR_ID` | Calendar ID z Kroku 2 |
| `WEBHOOK_SECRET` | Libovolný tajný řetězec, např. `moje-tajne-heslo-123` |

**Jak zkopírovat JSON jako jeden řádek** (v terminálu):
```bash
cat cesta/k/service-account.json | tr -d '\n'
```

---

## Krok 5 – Nastavení Webhook v Supabase

1. Jdi do Supabase → **Database > Webhooks**
2. Klikni **Create a new hook**
3. Vyplň:
   - **Name**: `booking-created`
   - **Table**: `bookings`
   - **Events**: ✅ Insert
   - **Type**: Supabase Edge Function
   - **Edge Function**: `booking-to-gcal`
   - **HTTP Headers**: přidej `authorization: Bearer moje-tajne-heslo-123` (stejné jako WEBHOOK_SECRET)
4. Klikni **Create webhook**

---

## ✅ Hotovo!

Udělej testovací rezervaci přes `/book` – do 5 sekund by se měla objevit událost v Google Kalendáři.

Každá událost bude obsahovat:
- 🏋️ Název tréninku + jméno klienta
- 📧 Email a telefon klienta
- ⏱️ Přesný čas a délku
- 🔔 Připomínku 60 minut předem

---

## ❗ Řešení problémů

**Událost se nevytvoří:**
1. Zkontroluj Supabase → **Edge Functions > Logs** – tam uvidíš chybové hlášky
2. Ověř, že Service Account má přístup ke kalendáři (Krok 2)
3. Zkontroluj, že `GOOGLE_CALENDAR_ID` je správně

**Chyba "Permission denied":**
- Service Account nemá přístup ke kalendáři → opakuj Krok 2

**Chyba "Invalid JWT":**
- JSON soubor v `GOOGLE_SERVICE_ACCOUNT` není správně naformátovaný → zkus znovu zkopírovat jako jeden řádek

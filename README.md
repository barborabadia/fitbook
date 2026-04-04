# FitBook – Rezervační systém pro fitness tréninky

Jednoduchá webová aplikace pro správu rezervací fitness tréninků.
- **Trenér** vidí týdenní rozvrh a seznam klientů
- **Klienti** si rezervují místo na adrese `/book`

## 🛠️ Technologie

- **Frontend**: React + Vite
- **Databáze**: Supabase (zdarma)
- **Hosting**: Vercel (zdarma)

---

## 🚀 Jak to rozjet – krok za krokem

### 1. Supabase (databáze) – 5 minut

1. Jdi na [supabase.com](https://supabase.com) a vytvoř účet (zdarma)
2. Klikni **New project** – zvol název a heslo, vyber region `West EU (Ireland)`
3. Počkej ~2 minuty na inicializaci projektu
4. Jdi do **SQL Editor** (vlevo v menu)
5. Zkopíruj celý obsah souboru `supabase/schema.sql` a spusť ho (tlačítko Run)
6. Jdi do **Settings > API** a zkopíruj:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

### 2. GitHub – nahrání kódu – 3 minuty

1. Jdi na [github.com](https://github.com) a vytvoř nový repository (např. `fitbook`)
2. V terminálu ve složce tohoto projektu spusť:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/TVOJE_JMENO/fitbook.git
   git push -u origin main
   ```

### 3. Vercel (hosting) – 3 minuty

1. Jdi na [vercel.com](https://vercel.com) a přihlas se přes GitHub
2. Klikni **Add New > Project**
3. Vyber svůj `fitbook` repository a klikni **Import**
4. V sekci **Environment Variables** přidej:
   - `VITE_SUPABASE_URL` = tvoje URL z Supabase
   - `VITE_SUPABASE_ANON_KEY` = tvůj anon key ze Supabase
5. Klikni **Deploy**

✅ Po ~1 minutě máš appku live na adrese jako `fitbook.vercel.app`

---

## 📱 Jak to používat

| URL | Kdo | Co vidí |
|-----|-----|---------|
| `fitbook.vercel.app` | Trenér | Rozvrh, klienti |
| `fitbook.vercel.app/book` | Klienti | Rezervační formulář |

**Odkaz pro klienty** najdeš v levém panelu aplikace – tlačítko Kopírovat.

---

## 📁 Struktura projektu

```
fitbook/
├── src/
│   ├── App.jsx                # Hlavní aplikace, routing
│   ├── main.jsx               # Entry point
│   ├── lib/
│   │   └── supabase.js        # Supabase klient
│   └── components/
│       ├── Schedule.jsx       # Týdenní rozvrh (admin)
│       ├── Clients.jsx        # Seznam klientů (admin)
│       ├── ClientBooking.jsx  # Rezervační stránka (klienti)
│       └── BookingModal.jsx   # Rezervační formulář (modal)
├── supabase/
│   └── schema.sql             # SQL schéma – spusť v Supabase
├── .env.example               # Vzor pro .env soubor
├── vercel.json                # Konfigurace Vercelu
└── package.json
```

---

## 💡 Možná rozšíření

- **E-mail potvrzení** – přidat Resend.com (zdarma do 3000 emailů/měsíc)
- **Admin přihlášení** – přidat Supabase Auth pro ochranu trenér panelu
- **Přidávání tréninků** – formulář pro vytváření nových tréninků přímo v appce
- **SMS notifikace** – přidat BSMS.cz nebo Twilio
- **Vlastní doména** – koupit .cz doménu a napojit na Vercel (~200 Kč/rok)

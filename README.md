# Puzzle Training — Connections

Primul joc din aplicația de puzzle training: un joc tip "Connections"
(grupare de 16 iteme în 4 categorii ascunse). Next.js (App Router, static
export) + TypeScript + Tailwind + Supabase.

**Stack de hosting: GitHub + GitHub Pages + Supabase — fără Vercel.**
Build-ul rulează automat, în cloud, prin GitHub Actions, de fiecare dată
când urci cod. Nu ai nevoie de nimic instalat local.

---

## De la zero — pornire curată

Fiindcă vrei un proiect curat: dacă ai deja un repo GitHub și un proiect
Vercel de la încercarea anterioară:
- **Vercel**: intră în proiectul vechi → Settings → scroll jos → Delete
  Project. (Opțional, doar curățenie — nu costă nimic să-l lași, dar nu
  mai are treabă cu noul flux.)
- **GitHub**: cel mai curat e să ștergi repo-ul vechi (Settings → scroll
  jos → Delete this repository) și creezi unul nou, gol. Așa nu rămân
  fișiere vechi (ex. vechiul `next.config.mjs` fără `output: export`)
  amestecate cu cele noi.
- **Supabase**: **nu-l atinge**. Baza de date, categoriile și funcțiile
  RPC sunt deja corect configurate — schimbăm doar unde "trăiește"
  frontend-ul, nu backend-ul.

---

## PAS 1 — GitHub (repo nou)

1. Creează un repo nou pe GitHub (fără README, fără .gitignore generat de
   GitHub — le avem deja în arhivă).
2. **Add file → Upload files** → tragi tot conținutul arhivei (păstrând
   structura de foldere) → commit pe branch-ul **main**.
   - Atenție la foldere/fișiere ascunse: `.github/`, `.gitignore`,
     `.env.local.example` — activează "show hidden files" în file
     manager înainte să tragi fișierele, ca să nu le sari.

---

## PAS 2 — GitHub Pages (activare, o singură dată)

1. În repo → **Settings → Pages**.
2. La **Source**, alege **GitHub Actions** (nu "Deploy from a branch").
3. Atât — nu mai e nimic de configurat aici. Workflow-ul din
   `.github/workflows/deploy.yml` se ocupă de restul.

---

## PAS 3 — Secrets (cheile Supabase)

Fiindcă nu mai avem Vercel, cheile merg în GitHub:

1. Repo → **Settings → Secrets and variables → Actions**.
2. **New repository secret** → adaugă pe rând:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL din Supabase (Project
     Settings → API)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key din Supabase

---

## PAS 4 — Primul deploy

1. Repo → tab **Actions** → ar trebui să vezi deja un workflow rulând
   (declanșat automat de push-ul din Pasul 1) sau apasă **Run workflow**
   manual dacă nu a pornit.
2. Așteaptă ~1-2 minute până devine verde (✓).
3. Link-ul live apare în **Settings → Pages** (sus, "Your site is live
   at…") — de forma `https://username.github.io/nume-repo/`.
4. Deschide linkul + `jocuri/connections/` la final, testează jocul.

De fiecare dată când urci o schimbare pe `main`, Actions redeployează
automat — identic ca experiență cu Vercel, doar hostat de GitHub.

---

## Supabase — neschimbat

Dacă acesta e chiar primul setup (nu ai rulat nimic încă în Supabase),
rulează în ordine, în **SQL Editor**, cele 3 fișiere din `supabase/`:
1. `1_schema.sql`
2. `2_seed_categories.sql`
3. `3_fix_grants.sql`

și activează **Anonymous Sign-Ins** în Authentication → Providers.

Dacă ai rulat deja astea data trecută — nu mai face nimic aici, treci
direct la Pas 1-4 de mai sus.

---

## Structura proiectului

```
.github/workflows/deploy.yml — build + deploy automat pe GitHub Pages
supabase/
  1_schema.sql                — tabele, RLS, funcțiile RPC
  2_seed_categories.sql       — pool-ul de 36 de categorii
  3_fix_grants.sql            — GRANT-uri explicite de siguranță
app/
  layout.tsx                  — fonturi, stiluri globale
  page.tsx                    — landing / hub de jocuri
  jocuri/connections/page.tsx — pagina jocului
components/connections/
  Board.tsx                   — orchestrează grid + banner-e + controale
  Tile.tsx                    — un item din grid
  SolvedBanner.tsx             — banner full-width pentru categorie rezolvată
  MistakeDots.tsx              — indicator 4 puncte pentru greșeli
  Controls.tsx                 — Amestecă / Deselectează / Trimite
  GameOverPanel.tsx            — ecran final (win/loss + reveal)
hooks/
  useConnectionsGame.ts        — toată logica de joc + apelurile RPC
lib/supabase/client.ts         — client Supabase pentru browser
types/connections.ts           — tipuri TypeScript
```

## Cum funcționează validarea

Toată logica de validare rulează **exclusiv pe server**, prin funcțiile
RPC din Supabase (`SECURITY DEFINER`). Clientul primește doar
`shuffled_items` (fără maparea către categorii) și trimite selecțiile la
`submit_guess`, care răspunde cu `correct` / `one_away` / `wrong` — fără
să dezvăluie niciodată categoria corectă înainte de vreme.

## Ce se pierde față de Vercel

- Fără preview automat per branch/PR din cutie (configurabil separat,
  dar nu e inclus aici).
- Deploy puțin mai lent (GitHub Actions vs. Vercel), nesemnificativ
  pentru un proiect mic.
- Static export nu suportă API routes / server actions Next.js — dacă
  un joc viitor are nevoie de logică server-side reală, acea logică
  trebuie să stea în Supabase (Edge Functions / RPC), nu în Next.js.

## Dacă rulezi local (opțional, cu PowerShell)

```powershell
npm install
copy .env.local.example .env.local
notepad .env.local   # completează cheile reale
npm run dev
```

## Debugging: dacă apeși Trimite și nu se întâmplă nimic

Orice eroare la `submit_guess` apare vizibil, într-un banner mov sub
titlu, cu mesajul exact al erorii. Trimite textul exact dacă apare.

---

## Interfața de admin

Accesibilă la `/admin/` (dashboard cu lista jocurilor) și
`/admin/connections/` (import + gestionare categorii pentru Connections).

### Setup (o singură dată)

1. Rulează `supabase/5_admin_setup.sql` în Supabase SQL Editor — creează
   tabelul `admins`, funcția `is_admin()` și drepturile de scriere pe
   `categories`/`games`.
2. Verifică în **Authentication → Providers** că **Email** e activat
   (pe lângă Anonymous, care rămâne pentru jucători).
3. Intră pe `/admin/` → "Nu ai cont? Creează unul" → completează
   email + parolă.
4. În Supabase → **Authentication → Users**, găsește contul tău nou și
   copiază **UID**.
5. Rulează în SQL Editor (înlocuiește cu UID-ul tău):
   ```sql
   insert into admins (user_id) values ('UUID-UL-TAU-AICI');
   ```
6. Reintră pe `/admin/` cu emailul și parola — ar trebui să vezi
   dashboard-ul.

### Import de categorii (Excel)

Pe pagina `/admin/connections/`:
1. Apasă **"Descarcă șablonul"** — un `.xlsx` cu antet corect, un rând de
   exemplu (evidențiat galben — șterge-l) și o filă de instrucțiuni.
2. Completează câte un rând per categorie: `tier` (yellow/green/blue/
   purple), `title`, `item1`-`item4`, `explanation` (opțional).
3. Încarcă fișierul — vezi un preview cu rândurile valide/invalide
   înainte de import (nimic nu se salvează până apeși "Importă").
4. Rândurile cu erori sunt ignorate automat, cu motivul afișat.

### Gestionare categorii existente

Tabel cu toate categoriile jocului, cu comutator activ/inactiv (o
categorie inactivă nu mai apare în puzzle-urile generate) și ștergere.

## Next steps sugerate

- Adaugă autentificare reală (email/OAuth) peste sesiunea anonimă, ca
  progresul să persiste cross-device.
- Extinde `user_game_stats` cu streak-uri afișate în UI.
- Adaugă un al doilea joc în `games` registry și un hub `/jocuri`.

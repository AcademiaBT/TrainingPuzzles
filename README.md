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
  1_schema.sql                — tabele, RLS, funcțiile RPC (Connections)
  2_seed_categories.sql       — pool-ul de 36 de categorii
  3_fix_grants.sql            — GRANT-uri explicite de siguranță
  4_fix_submit_guess.sql      — fix pentru submit_guess (bug alias SQL)
  5_admin_setup.sql           — tabel admins, is_admin(), drepturi scriere
  6_decision_lab_schema.sql   — tabele, RLS, funcțiile RPC (Decision Lab)
  7_decision_lab_seed.sql     — cele 5 scenarii MVP
app/
  layout.tsx                  — fonturi, stiluri globale
  page.tsx                    — landing / hub de jocuri
  jocuri/connections/page.tsx — pagina jocului Connections
  jocuri/decision-lab/page.tsx — pagina jocului Decision Lab
  admin/page.tsx              — dashboard admin (login + listă jocuri)
  admin/connections/page.tsx  — admin Connections (import + gestionare)
  admin/decision-lab/page.tsx — admin Decision Lab (import + gestionare)
components/connections/
  Board.tsx                   — orchestrează grid + banner-e + controale
  Tile.tsx                    — un item din grid
  SolvedBanner.tsx             — banner full-width pentru categorie rezolvată
  MistakeDots.tsx              — indicator 4 puncte pentru greșeli
  Controls.tsx                 — Amestecă / Deselectează / Trimite
  GameOverPanel.tsx            — ecran final (win/loss + reveal)
components/decision-lab/
  Board.tsx                   — orchestrează selecția + jocul + rezultatul
  ScenarioList.tsx             — ecranul de alegere a scenariului
  DecisionCard.tsx              — situația curentă + opțiunile
  FeedbackPanel.tsx             — consecința + scorul, după fiecare alegere
  ResultPanel.tsx                — scorul final
components/admin/
  LoginForm.tsx                — login admin (fără auto-înregistrare)
  ImportPanel.tsx               — import Excel pentru Connections
  CategoryTable.tsx             — gestionare categorii Connections
  DecisionImportPanel.tsx       — import Excel pentru Decision Lab
  DecisionScenarioTable.tsx     — gestionare scenarii Decision Lab
hooks/
  useConnectionsGame.ts        — logica de joc Connections + apelurile RPC
  useDecisionLabGame.ts         — logica de joc Decision Lab + apelurile RPC
  useAdminSession.ts            — login/logout + verificare is_admin
lib/
  supabase/client.ts           — client Supabase pentru browser
  importParser.ts               — parser/validator import Excel Connections
  decisionImportParser.ts       — parser/validator import Excel Decision Lab
types/
  connections.ts                — tipuri TypeScript Connections + admin
  decisionLab.ts                 — tipuri TypeScript Decision Lab
public/templates/
  connections-import-template.xlsx
  decision-lab-import-template.xlsx
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
3. Creează-ți contul de admin direct din Supabase (nu din app — formularul
   de login nu are opțiune de "creează cont", intenționat): **Authentication
   → Users → Add user**, completează email + parolă, bifează "Auto Confirm
   User".
4. Copiază **UID**-ul contului nou creat.
5. Rulează în SQL Editor (înlocuiește cu UID-ul tău):
   ```sql
   insert into admins (user_id) values ('UUID-UL-TAU-AICI');
   ```
6. Intră pe `/admin/` cu emailul și parola de la pasul 3.

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

---

## Al doilea joc: Decision Lab

Simulare decizională: jucătorul primește o situație și alege dintre mai
multe opțiuni; fiecare alegere are o consecință (feedback) și un scor.
Structura e un arbore de decizie (nod → opțiuni → nod următor), nu o
grupare ca la Connections.

### Setup (o singură dată)

1. Rulează, în ordine, în Supabase SQL Editor:
   - `supabase/6_decision_lab_schema.sql` — tabele, RLS, funcțiile RPC
     (`start_decision_session`, `get_current_node`, `choose_decision`) și
     înregistrarea jocului în `games`.
   - `supabase/7_decision_lab_seed.sql` — cele 5 scenarii MVP din discuția
     inițială (Clientul important, E-mailul alarmant, Incidentul
     misterios, Clientul nemulțumit, Date contradictorii).
2. Jocul e disponibil imediat la `/jocuri/decision-lab/`, iar
   administrarea la `/admin/decision-lab/`.

### Structura scenariilor deja încărcate

Fiecare din cele 5 scenarii are **5 decizii succesive** (nu doar una):
situația evoluează după fiecare alegere — apare o complicație nouă, o
informație suplimentară, o presiune de timp — indiferent de ce ai ales
la pasul anterior. Doar scorul și feedback-ul diferă în funcție de
alegere. La finalul celor 5 decizii, primești rezultatul și scorul total.

5 scenarii × 5 noduri × 4 opțiuni = 100 de opțiuni în total — exact
volumul estimat pentru Sprint 1 în discuția inițială. Poți adânci
oricând un scenariu suplimentar (mai multe ramuri, nu doar o progresie
liniară) prin import Excel — formatul suportă asta nativ.

### Import de scenarii (Excel)

Pe pagina `/admin/decision-lab/`, formatul de import diferă de
Connections, fiindcă modelează un arbore, nu o grupare simplă:

| Coloană | Ce reprezintă |
|---|---|
| `scenario` | Titlul scenariului — se repetă pe toate rândurile lui |
| `scenario_description` | Descriere scurtă (opțional, o dată e suficient) |
| `node_code` | Cod unic al nodului **în cadrul scenariului** (ex: `start`, `final`) |
| `node_text` | Textul situației afișat jucătorului |
| `is_root` | `TRUE` doar pe nodul de start — exact unul per scenariu |
| `is_final` | `TRUE` dacă nodul e un final (fără opțiuni) |
| `choice_text` | Textul opțiunii (gol dacă `is_final`) |
| `next_node_code` | Către ce `node_code` duce opțiunea (gol dacă `is_final`) |
| `score` | Punctaj adăugat la alegerea opțiunii |
| `feedback` | Consecința afișată imediat după alegere |

Un nod cu mai multe opțiuni = mai multe rânduri cu **același**
`node_code` (textul nodului se repetă identic pe fiecare). Descarcă
șablonul din pagina de admin — conține un scenariu complet, funcțional,
ca exemplu.

### Securitate

Ca și la Connections: nodurile și opțiunile **nu** sunt expuse public
prin Data API — jucătorul le vede progresiv, exclusiv prin RPC-urile
`get_current_node`/`choose_decision`, care nu dezvăluie niciodată scorul
sau destinația unei opțiuni înainte ca jucătorul să o aleagă. Doar
titlul și descrierea scenariilor sunt publice (necesare pentru ecranul
de selecție).

## Next steps sugerate

- Adaugă autentificare reală (email/OAuth) peste sesiunea anonimă, ca
  progresul să persiste cross-device.
- Extinde `user_game_stats` cu streak-uri afișate în UI.
- Adaugă un al doilea joc în `games` registry și un hub `/jocuri`.

# Receipt Insights - Product Requirements Document

## 1. Executive Summary

Receipt Insights är en svensk matbutiksutgiftshanterare som använder AI för att automatiskt tolka kvittofoton och PDF:er. Applikationen ger användare insikter om sina matutgifter genom visualiseringar, prisjämförelser mellan butiker och intelligent kategorisering av produkter.

Kärnvärdet är **automatisering**: istället för att manuellt registrera varje inköp scannar användaren sitt kvitto, och AI extraherar all data automatiskt. Användare kan fokusera på att förstå sina utgifter utan manuellt arbete.

**Production Status:** Applikationen är i produktion med aktiva användare. Alla kärnfunktioner fungerar och är deployade på Vercel/Supabase.

---

## 2. Mission

**Mission Statement:** Ge svenska hushåll kontroll över sina matutgifter genom automatisk kvittotolkning och intelligent prisanalys.

### Core Principles

1. **Automatisering Först** — AI tolkar kvitton automatiskt; manuellt arbete ska vara undantag.
2. **Datadriven Insikt** — Visa mönster och trender som användaren inte ser själv.
3. **Prisjämförelse** — Hjälp användare hitta var produkter är billigast.
4. **Kontinuerlig Inlärning** — Systemet lär sig av korrigeringar och blir bättre över tid.
5. **Svensk Kontext** — Optimerad för svenska butiker (ICA, Coop, Willys, Hemköp).

---

## 3. Target Users

### Primary Persona: Prismedveten Konsument

- **Vem:** Privatpersoner i Sverige som handlar mat i vardagen
- **Teknisk Nivå:** Bekväm med webappar, smartphone-användare
- **Mål:**
  - Förstå var pengarna går varje månad
  - Hitta vilken butik som har bäst priser för deras vanliga produkter
  - Spåra utgifter per kategori över tid (Frukt, Mejeri, Kött, etc.)
- **Smärtpunkter:**
  - Manuell utgiftshantering är för tidskrävande
  - Svårt att jämföra priser mellan butiker
  - Ingen överblick av matvanor och utgiftsmönster

---

## 4. Current Scope (Production)

### In Production ✅

**Core Functionality**
- ✅ Ladda upp kvittofoton och PDF:er
- ✅ AI-powered kvittotolkning (Gemini 2.5 Flash)
- ✅ Automatisk produktkategorisering (14 svenska kategorier)
- ✅ Dashboard med månadsöversikt och statistik
- ✅ Prisjämförelse med kr/kg, kr/L, kr/st
- ✅ Butiksrekommendationer (var produkter är billigast)
- ✅ Produkthantering med AI-assisterad gruppering
- ✅ Träningsgränssnitt för att korrigera AI-tolkningar
- ✅ Dupblettdetektering vid uppladdning (Datum-medveten)
- ✅ Flersidiga PDF:er (automatiskt kombinerade)
- ✅ Parser Anomaly Detection System (automatisk feldetektering)
- ✅ Automated Regression Testing (Golden Set)

**Technical**
- ✅ React + TypeScript + Vite frontend
- ✅ Supabase backend (Database, Auth, Storage, Edge Functions)
- ✅ PostgreSQL database med 10 tabeller och 8 aggregeringsvyer
- ✅ Google Gemini API för AI (gemini-2.5-flash)
- ✅ Vercel hosting med automatisk deploy
- ✅ RLS (Row Level Security) för dataisolering

### Known Limitations

- ⚠️ Äldre kvittobilder pekar till gammalt storage (Lovable)
- ⚠️ Database views flaggade som Security Definer
- ⚠️ Structured parser ej promotad till production
- ⚠️ Relaxerad TypeScript-konfiguration

### Out of Scope / Future

- ❌ Budgetfunktionalitet
- ❌ Inköpslistor
- ❌ Prisnotifieringar
- ❌ Mobil PWA
- ❌ Fler butiksformat (Lidl, City Gross)
- ❌ Export till andra budgetappar

---

## 5. User Stories

### Primary User Stories

1. **Som användare vill jag ladda upp ett kvittofoto, så att jag slipper registrera mina inköp manuellt.**
   - Exempel: Fota kvittot med mobilen, ladda upp, se alla produkter med kategorier automatiskt

2. **Som användare vill jag se min månadsöversikt, så att jag förstår var mina pengar går.**
   - Exempel: Dashboard visar 4 500 kr spenderat, fördelat på 45% Mejeri, 30% Frukt & Grönt, etc.

3. **Som användare vill jag jämföra priser mellan butiker, så att jag kan handla smartare.**
   - Exempel: Söka på "Mjölk" och se att ICA har 14.90 kr/L vs Willys 12.90 kr/L

4. **Som användare vill jag korrigera AI:s tolkningar, så att systemet lär sig mina produkter.**
   - Exempel: Ändra "ICA MJÖLK 3%" till "Mjölk" och se det rätt nästa gång

5. **Som användare vill jag gruppera liknande produkter, så att prisjämförelser blir rättvisa.**
   - Exempel: "Coca-Cola 1.5L", "COCA-COLA 150CL" → grupperas till "Coca-cola"

6. **Som användare vill jag se vilken butik som är billigast för min varukorg.**
   - Exempel: "Du kan spara 247 kr/månad genom att köpa dessa produkter på Willys istället"

7. **Som användare vill jag se prishistorik för en produkt, så att jag vet om priset är högt eller lågt.**
   - Exempel: Klicka på "Äpple Royal Gala" och se graf över 6 månaders prisutvekling

---

## 6. Core Architecture & Patterns

### High-Level Architecture

```
┌─────────────────────┐      HTTPS/JSON       ┌─────────────────────┐
│                     │ ◄────────────────────►│                     │
│   React + Vite      │                       │   Supabase          │
│   (Frontend)        │                       │   (Backend)         │
│   Vercel Hosting    │                       │   - PostgreSQL      │
│                     │                       │   - Auth            │
└─────────────────────┘                       │   - Storage         │
                                              │   - Edge Functions  │
                                              └──────────┬──────────┘
                                                         │
                                                         ▼
                                              ┌─────────────────────┐
                                              │   Google Gemini     │
                                              │   (AI Parsing)      │
                                              └─────────────────────┘
```

### Directory Structure

```
grocer-gist-2.0/
├── src/
│   ├── components/         # 75+ React-komponenter (UI, forms, dialogs)
│   │   ├── ui/             # shadcn/ui bas-komponenter
│   │   └── ...             # Feature-specifika komponenter
│   ├── pages/              # 11 route-komponenter
│   │   ├── Dashboard.tsx   # Månadsöversikt
│   │   ├── Upload.tsx      # Kvittouppladdning
│   │   ├── Training.tsx    # AI-korrigering
│   │   ├── PriceComparison.tsx
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions, constants
│   ├── integrations/       # Supabase client & types
│   └── types/              # TypeScript type definitions
│
├── supabase/
│   ├── functions/          # 7 Edge Functions (Deno runtime)
│   │   ├── parse-receipt/  # AI kvittotolkning
│   │   ├── suggest-categories/
│   │   ├── suggest-product-groups/
│   │   ├── suggest-group-merges/
│   │   ├── auto-map-products/
│   │   ├── export-data/
│   │   └── admin-delete-all/
│   └── migrations/         # 45+ database migrations
│
├── docs/                   # Feature dokumentation
├── CLAUDE.md               # Utvecklingsguide
├── TODO.md                 # Roadmap och uppgiftslista
└── PRD.md                  # Detta dokument
```

### Key Design Patterns

- **Code Splitting** — React.lazy() för route-baserad lazy loading
- **Server-side Aggregation** — PostgreSQL views för dashboard-data (ej client-side beräkning)
- **Virtualization** — react-window för listor >1000 element
- **API Query Layer** — TanStack Query för caching och server state
- **Category Correction Priority** — User mappings > Global mappings > AI category > 'other'
- **Debouncing** — use-debounce för sökfält

---

## 7. Features

### 7.1 Receipt Upload & Parsing

**Purpose:** Automatiskt extrahera data från kvittofoton och PDF:er

**Operations:**
- Upload kvittobild (JPG, PNG)
- Upload PDF (konverteras client-side till bilder)
- Flersidiga kvitton kombineras automatiskt
- Dupblettdetektering (datum + summa + butiksnamn)

**AI Processing (parse-receipt Edge Function):**
1. Hybrid approach: strukturerad parser för kända format + AI fallback
2. Extraherar: butiksnamn, datum, totalsumma, produktlista
3. Kategoriserar varje produkt automatiskt
4. Hanterar rabatter, pant, multiline-produktnamn
5. Lär sig från `store_patterns` för bättre accuracy

### 7.2 Dashboard Analytics

**Purpose:** Visualisera utgifter och trender

**Features:**
- Månadsöversikt: total summa, antal kvitton, snitt per kvitto
- Kategorifördelning (cirkeldiagram)
- Butiksfördelning (stapeldiagram)
- Månadsnavigering framåt/bakåt
- Server-side aggregering via PostgreSQL views

### 7.3 Price Comparison

**Purpose:** Jämföra priser per enhet mellan butiker

**Features:**
- Produktsökning med realtidsfiltrering
- Enhetsbaserad jämförelse (kr/kg, kr/L, kr/st)
- Kategori-aware: Drycker→kr/L, Frukt→kr/kg, Mejeri→kr/st
- Best-store identifiering per produkt
- Prishistorik per produkt (klickbar)
- Visual indicators: ⚖️ kg, 💧 L, 📦 st, ⚠️ saknar data

### 7.4 Product Management

**Purpose:** Gruppera och kategorisera produkter

**Features:**
- Lista omappade produkter med antal förekomster
- AI-assisterad gruppering (suggest-product-groups)
- Manuell merge av produktvarianter
- Kategoritilldelning
- Globala mappings (115+ fördefinierade svenska produkter)
- User-specific mappings (per användare)

### 7.5 Training / Correction

**Purpose:** Korrigera AI och förbättra framtida tolkningar

**Features:**
- Granska kvitton sida-vid-sida med originalbilden
- Korrigera produktnamn, kategorier, priser
- Korrigeringar sparas i `receipt_corrections`
- Uppdateringar i `store_patterns` för framtida parsing
- AI-mapp flera produkter samtidigt

### 7.6 Store Recommendations

**Purpose:** Visa var användaren kan spara pengar

**Features:**
- Besparingspotential baserad på användarens varukorg
- Butiksranking per produkt
- Total möjlig besparing per månad

### 7.7 Diagnostics & Quality Monitoring

**Purpose:** Övervaka parserns hälsa och möjliggöra snabba korrigeringar

**Features:**
- **Parser Health Dashboard:** Visualiserar hälsa (%), snitt-tid och vanliga feltyper
- **Anomaly List:** Detaljerad lista på misstänkta fel (absurd_unit_price, high_quantity)
- **Drill-down:** Klicka på ett fel för att öppna kvittot direkt i träningsläget
- **System Diagnostics:** Verktyg för att rensa korrupta kategorier och tomma mappings
- **Regression Testing UI:** Instruktioner och status för Golden Set-tester

---

## 8. Technology Stack

### Frontend

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React | 18.3.1 |
| Language | TypeScript | 5.9.3 |
| Build Tool | Vite | 5.4.19 |
| Routing | React Router | 6.30.1 |
| Server State | TanStack Query | 5.90.12 |
| UI Components | shadcn/ui (Radix) | — |
| Styling | Tailwind CSS | 3.4.17 |
| Charts | Recharts | 2.15.4 |
| Forms | React Hook Form | 7.68.0 |
| Dates | date-fns | 3.6.0 |
| PDF Parsing | pdfjs-dist | 5.4.449 |
| Virtualization | react-window | 2.2.3 |
| Icons | lucide-react | 0.555.0 |

### Backend

| Component | Technology |
|-----------|------------|
| BaaS Platform | Supabase |
| Database | PostgreSQL |
| Auth | Supabase Auth (email/password) |
| Storage | Supabase Storage |
| Edge Functions | Deno runtime |
| AI | Google Gemini API (gemini-2.5-flash) |

### Hosting & Infrastructure

| Component | Service |
|-----------|---------|
| Frontend | Vercel (`grocer-gist-2-0.vercel.app`) |
| Backend | Supabase (self-hosted projekt) |
| Edge Functions | Supabase Edge Functions |
| AI | Google Gemini API |

### Development Tools

| Tool | Purpose |
|------|---------|
| npm | Package management |
| ESLint | Linting |
| Vite | Dev server & bundling |
| Supabase CLI | Migrations & function deployment |
| GitHub CLI | PR workflow |

---

## 9. Security & Configuration

### Security Scope

**In Production:**
- ✅ Authentication via Supabase Auth (email/password)
- ✅ Row Level Security (RLS) på alla tabeller
- ✅ JWT-verifiering i Edge Functions
- ✅ Input validation (Pydantic-liknande via Zod)
- ✅ SQL injection prevention (Supabase client)
- ✅ CORS konfigurerat

**Known Issues:**
- ⚠️ 8 views flaggade som "Security Definer" i Supabase Security Advisor
- ⚠️ Relaxerad TypeScript-konfiguration (`noImplicitAny: false`)

### Environment Variables

**Frontend (.env):**
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbG...
```

**Edge Functions (Supabase secrets):**
```
GEMINI_API_KEY=xxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
ADMIN_EMAIL=admin@example.com
```

### Deployment

- **Frontend:** Auto-deploy via Vercel on push to `main`
- **Edge Functions:** `supabase functions deploy`
- **Database Migrations:** `supabase db push`

---

## 10. API Specification

### Supabase Tables

| Table | Purpose |
|-------|---------|
| `receipts` | Kvittodata med items som JSONB |
| `product_mappings` | User-specific produktgrupperingar |
| `global_product_mappings` | Delade grupperingar (115+ produkter) |
| `receipt_corrections` | Träningsdata för AI |
| `store_patterns` | Inlärda mönster per butik |
| `receipt_image_hashes` | Dupblettdetektering |
| `category_suggestion_feedback` | AI-feedback för förbättring |
| `user_global_overrides` | User-overrides av globala mappings |
| `ignored_merge_suggestions` | Dismissed merge suggestions |
| `global_mapping_changes` | Audit log |

### Database Views

| View | Purpose |
|------|---------|
| `view_monthly_stats` | Aggregerad månadsstatistik |
| `view_category_breakdown` | Utgifter per kategori/månad |
| `view_store_comparison` | Utgifter per butik/månad |
| `view_price_comparison` | Enhetsprisjämförelse |
| `view_store_recommendations` | Sparförslag per produkt |
| `view_store_savings_summary` | Summerad sparininfo per butik |
| `view_user_basket` | Användarens vanliga produkter |
| `view_product_store_prices` | Produktpriser per butik |

### Edge Functions

| Function | Purpose |
|----------|---------|
| `parse-receipt` | Tolka kvittofoton/PDF med Gemini AI |
| `suggest-categories` | AI-kategoriseringsförslag |
| `suggest-product-groups` | AI-grupperingsförslag |
| `suggest-group-merges` | Föreslå sammanslagningar |
| `auto-map-products` | Automatisk produktmappning |
| `export-data` | Exportera användardata |
| `admin-delete-all` | Adminverktyg (skyddad) |

---

## 11. Success Criteria

### Production Success Definition

Applikationen är framgångsrik när användaren kan:
1. Ladda upp ett kvittofoto och se produkter automatiskt extraherade
2. Se sin månadsöversikt direkt utan manuell inmatning
3. Jämföra priser mellan butiker och hitta billigaste alternativet
4. Korrigera AI-tolkningar för bättre framtida accuracy
5. Se vilken butik som passar bäst för deras specifika varukorg

### Functional Requirements (Production)

- ✅ Upload och tolkning av kvittofoton/PDF
- ✅ AI-kategorisering av produkter
- ✅ Dashboard med kategori- och butiksfördelning
- ✅ Prisjämförelse med enhetshantering
- ✅ Produktgruppering (manuell + AI-assisterad)
- ✅ Träningsgränssnitt för korrigeringar
- ✅ Autentisering och dataisolering (RLS)
- ✅ Persistering av all data

### Quality Indicators

- Page load under 2 sekunder
- AI-parsing under 10 sekunder per kvitto
- Dashboard aggregering via server-side views
- Virtualisering för listor >1000 element
- Fungerar i Chrome, Firefox, Safari
- Responsiv layout (desktop focusing)

---

## 12. Implementation Status

### Completed Phases ✅

**Phase 1: Backend Foundation**
- ✅ Supabase-projekt med PostgreSQL
- ✅ 45+ database migrations
- ✅ RLS policies på alla tabeller
- ✅ Edge Functions deployade

**Phase 2: Frontend Foundation**
- ✅ Vite + React + TypeScript
- ✅ shadcn/ui + Tailwind CSS
- ✅ TanStack Query för server state
- ✅ React Router för routing

**Phase 3: Core Features**
- ✅ Kvittouppladdning med AI-parsing
- ✅ Dashboard med statistik
- ✅ Prisjämförelse
- ✅ Produkthantering
- ✅ Träningsgränssnitt

**Phase 4: Polish & Quality**
- ✅ Loading och error states
- ✅ Code splitting (React.lazy)
- ✅ Server-side aggregering
- ✅ Vercel + Supabase deployment
- ✅ Parser Anomaly Detection & Diagnostics
- ✅ Automated Regression Testing

### Current Sprint Focus

- [ ] Promota structured parser till production
- [ ] Fix Security Definer Views
- [ ] Migrera gamla kvittobilder till nytt storage

---

## 13. Future Considerations

### Post-MVP Enhancements

- **Budgetfunktionalitet** — Sätt månatliga budgetar per kategori
- **Inköpslistor** — Baserade på vanliga produkter
- **Prisnotifieringar** — När produkter går ner i pris
- **Mobil PWA** — Installable web app
- **Fler butiksformat** — Lidl, City Gross, Hemköp
- **Dataexport** — CSV/JSON export

### Technical Improvements

- **Structured parser promotion** — 100% accuracy för ICA-format
- **Security Invoker views** — Åtgärda Supabase-varningar
- **Strict TypeScript** — Aktivera `noImplicitAny: true`
- **Database type generation** — Striktare types för views
- **Bundle optimization** — Manuella chunks för stora dependencies

---

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **AI-parsing felaktigheter** | Fel data i statistik | Träningsgränssnitt för korrigeringar; store_patterns lärande |
| **Gemini API rate limits** | Uppladdning misslyckas | Error handling; retry logic; visa tydliga felmeddelanden |
| **Dupbletter i database views** | React reconciliation-fel | Unique keys med index (PR #27) |
| **Storage migration** | Gamla bilder försvinner | Migrera innan Lovable bucket tas bort |
| **Security Definer views** | Potentiell dataläcka | Granska och konvertera till Security Invoker |

---

## 15. Appendix

### Database Schema (Core Tables)

```sql
-- Huvudtabell för kvitton
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    store_name TEXT,
    total_amount NUMERIC,
    receipt_date DATE,
    items JSONB,  -- [{name, price, quantity, category, discount?}]
    image_url TEXT,
    image_urls JSONB,  -- För flersidiga kvitton
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Användarens produktmappings
CREATE TABLE product_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    original_name TEXT NOT NULL,
    mapped_name TEXT NOT NULL,
    category TEXT,
    quantity_amount NUMERIC,
    quantity_unit TEXT,
    auto_mapped BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Globala mappings (delade mellan användare)
CREATE TABLE global_product_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_name TEXT NOT NULL,
    mapped_name TEXT NOT NULL,
    category TEXT,
    quantity_amount NUMERIC,
    quantity_unit TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Product Categories (14)

| Key | Swedish Name |
|-----|--------------|
| `frukt_och_gront` | Frukt och grönt |
| `mejeri` | Mejeri |
| `kott_fagel_chark` | Kött, fågel, chark |
| `fisk_skaldjur` | Fisk och skaldjur |
| `brod_bageri` | Bröd och bageri |
| `skafferi` | Skafferi |
| `frysvaror` | Frysvaror |
| `drycker` | Drycker |
| `sotsaker_snacks` | Sötsaker och snacks |
| `fardigmat` | Färdigmat |
| `hushall_hygien` | Hushåll och hygien |
| `delikatess` | Delikatess |
| `pant` | Pant |
| `other` | Övrigt |

### Key Documentation

- [CLAUDE.md](./CLAUDE.md) — Utvecklingsguide och teknisk referens
- [TODO.md](./TODO.md) — Roadmap och uppgiftslista
- [docs/PRICE_COMPARISON.md](./docs/PRICE_COMPARISON.md) — Price Comparison feature
- [docs/PRICE_COMPARISON_ENHANCEMENT.md](./docs/PRICE_COMPARISON_ENHANCEMENT.md) — Unit normalization
- [docs/AAA_PARSING_TRAINING.md](./docs/AAA_PARSING_TRAINING.md) — Parser training guide

---

## Document History

| Datum | Ändring |
|-------|---------|
| 2026-01-17 | Initial PRD skapad baserat på befintlig kodbas |
| 2026-01-17 | Uppdaterad struktur enligt Habit Tracker-template |

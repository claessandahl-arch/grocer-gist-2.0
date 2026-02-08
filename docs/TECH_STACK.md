# Tech Stack Documentation

## 🛠️ Libraries & Tools

### **Core Framework**

| Library | Version | What | Why |
|---------|---------|------|-----|
| **React** | 18.3.1 | UI framework | Builds interactive user interfaces with components. When data changes, only the affected parts update—no full page refresh needed. |
| **React DOM** | 18.3.1 | React's bridge to the browser | Renders React components into actual HTML on the page. |
| **TypeScript** | 5.9.3 | JavaScript with types | Catches bugs before runtime (e.g., "you passed a string but expected a number"). Makes refactoring safer. |

---

### **Build & Development**

| Library | Version | What | Why |
|---------|---------|------|-----|
| **Vite** | 5.4.19 | Build tool & dev server | Extremely fast hot-reload during development. Bundles your code efficiently for production. |
| **ESLint** | 9.32.0 | Code linter | Catches code quality issues and enforces consistent style. |

---

### **Routing**

| Library | Version | What | Why |
|---------|---------|------|-----|
| **React Router** | 6.30.1 | Client-side routing | Navigate between pages (Dashboard → Upload → Training) without reloading the browser. URLs like `/dashboard` work as expected. |

---

### **Styling**

| Library | Version | What | Why |
|---------|---------|------|-----|
| **Tailwind CSS** | 3.4.17 | Utility-first CSS framework | Style components with classes like `bg-teal-500 p-4 rounded-lg`. No separate CSS files needed—fast to build UIs. |
| **clsx** | 2.1.1 | Class name utility | Merge conditional classes smartly: `clsx('btn', isActive && 'btn-active')`. |
| **tailwind-merge** | 2.6.0 | Tailwind class merger | Avoids duplicate/conflicting Tailwind classes when merging. |
| **class-variance-authority** | 0.7.1 | Component variants | Define button variants (`primary`, `outline`, `ghost`) in a type-safe way. |
| **tailwindcss-animate** | 1.0.7 | Animation utilities | Pre-built animation classes for Tailwind. |

---

### **UI Components**

| Library | Version | What | Why |
|---------|---------|------|-----|
| **Radix UI** | Various | Accessible primitives | Pre-built, accessible components (modals, dropdowns, tabs) that you style yourself. Handles keyboard navigation, focus trapping, ARIA attributes. |
| **Lucide React** | 0.555.0 | Icon library | Clean, consistent SVG icons (`<Plus />`, `<Trash />`, etc.). |
| **cmdk** | 1.1.1 | Command palette | Searchable command menu component. |
| **sonner** | 1.7.4 | Toast notifications | Beautiful, customizable toast notifications. |
| **vaul** | 0.9.9 | Drawer component | Mobile-friendly bottom drawer/sheet component. |
| **embla-carousel-react** | 8.6.0 | Carousel/slider | Lightweight, performant carousel component. |

**Radix UI packages used (20+):**
- `@radix-ui/react-dialog` - Modal dialogs
- `@radix-ui/react-select` - Dropdown selects
- `@radix-ui/react-tabs` - Tab navigation
- `@radix-ui/react-label` - Form labels
- `@radix-ui/react-separator` - Visual separators
- `@radix-ui/react-slot` - Component composition
- `@radix-ui/react-checkbox` - Checkboxes
- `@radix-ui/react-accordion` - Expandable sections
- `@radix-ui/react-alert-dialog` - Alert dialogs
- `@radix-ui/react-dropdown-menu` - Dropdown menus
- `@radix-ui/react-popover` - Popovers
- `@radix-ui/react-progress` - Progress bars
- `@radix-ui/react-scroll-area` - Custom scroll containers
- `@radix-ui/react-switch` - Toggle switches
- `@radix-ui/react-tooltip` - Tooltips
- `@radix-ui/react-toast` - Toast notifications
- And more...

---

### **Backend & Data**

| Library | Version | What | Why |
|---------|---------|------|-----|
| **Supabase** | 2.81.1 | Backend-as-a-Service | Your database, authentication, and API in one. Stores receipts, products, mappings, etc. in PostgreSQL. Handles login/signup. |
| **TanStack Query** | 5.90.12 | Server state management | Caches API data, auto-refetches when stale, handles loading/error states. No manual `useEffect` + `useState` for API calls. |

---

### **Forms & Validation**

| Library | Version | What | Why |
|---------|---------|------|-----|
| **React Hook Form** | 7.68.0 | Form handling | Performant forms with minimal re-renders. Built-in validation and error handling. |
| **@hookform/resolvers** | 3.10.0 | Schema integration | Connects React Hook Form to validation libraries like Zod. |
| **Zod** | 3.25.76 | Schema validation | Type-safe schema validation. Runtime validation that generates TypeScript types. |

---

### **Data Visualization & Processing**

| Library | Version | What | Why |
|---------|---------|------|-----|
| **Recharts** | 2.15.4 | Charting library | Builds pie charts, bar charts, and line graphs for the Dashboard analytics. |
| **pdfjs-dist** | 5.4.449 | PDF processing | Client-side PDF to image conversion for receipt uploads. Extracts text for structured parsing. |
| **date-fns** | 3.6.0 | Date utilities | Modern, lightweight date manipulation. Supports Swedish locale. |

---

### **Performance & UX**

| Library | Version | What | Why |
|---------|---------|------|-----|
| **react-window** | 2.2.3 | Virtualization | Renders only visible items in long lists. Handles 1000+ products smoothly. |
| **use-debounce** | 10.0.6 | Debouncing | Limits how often a function runs. Reduces API calls during typing. |
| **react-resizable-panels** | 2.1.9 | Resizable layouts | Split pane components with draggable dividers. |
| **react-day-picker** | 8.10.1 | Date picker | Accessible date selection component. |

---

### **Theming**

| Library | Version | What | Why |
|---------|---------|------|-----|
| **next-themes** | 0.3.0 | Theme management | Dark/light mode switching with system preference detection. |

---

## � Development Setup

### Prerequisites

- **Node.js 18+** (install via [nvm](https://github.com/nvm-sh/nvm))
- **npm** (comes with Node.js)
- **Supabase CLI** (for Edge Function deployment)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/claessandahl-arch/grocer-gist-2.0.git
cd grocer-gist-2.0

# Install dependencies
npm install

# Start development server
npm run dev
```

**Dev Server Configuration:**
- Port: **8080** (not the default 5173)
- Access at: http://localhost:8080

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

**Edge Function Secrets** (set in Supabase Dashboard):
- `GEMINI_API_KEY` - For AI parsing
- `SUPABASE_URL` - Auto-injected
- `SUPABASE_SERVICE_ROLE_KEY` - For admin operations

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 8080) |
| `npm run build` | Production build |
| `npm run build:dev` | Development build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

---

## �📁 Folder Structure

```
src/
├── main.tsx              → Entry point: mounts React app
├── App.tsx               → Routing setup: defines all pages/routes
├── index.css             → Global styles (Tailwind base + custom variables)
│
├── pages/                → Full-page views
│   ├── Index.tsx             → Public landing page
│   ├── Auth.tsx              → Login/signup page
│   ├── Dashboard.tsx         → Analytics with monthly navigation
│   ├── Upload.tsx            → Receipt upload (images/PDFs)
│   ├── Training.tsx          → Manual correction interface
│   ├── DataManagement.tsx    → Bulk category editing
│   ├── ProductManagement.tsx → Product grouping/merging
│   ├── PriceComparison.tsx   → Unit price analysis
│   ├── StoreRecommendations.tsx → Store comparison insights
│   ├── Diagnostics.tsx       → System diagnostics & admin
│   └── NotFound.tsx          → 404 page
│
├── components/           → Reusable building blocks
│   └── ui/               → shadcn-style primitives (50+ components)
│
├── hooks/                → Custom React hooks
│
├── integrations/         → External service integrations
│   └── supabase/         → Supabase client & types
│
├── lib/                  → Utilities & helpers
│   ├── categoryConstants.ts  → Category definitions (14 Swedish categories)
│   ├── categoryUtils.ts      → Category resolution (priority system)
│   ├── imageHash.ts          → Image fingerprinting for duplicates
│   ├── logger.ts             → Logging utilities
│   └── utils.ts              → General helpers (cn for class merging)
│
├── types/                → TypeScript type definitions
│
└── workers/              → Web workers (background processing)
```

**Supabase Structure:**
```
supabase/
├── config.toml           → Supabase project configuration
├── functions/            → Edge Functions (Deno runtime)
│   ├── parse-receipt/        → AI receipt parsing (Gemini + structured parser)
│   ├── suggest-categories/   → AI category suggestions
│   ├── suggest-product-groups/ → AI product grouping
│   ├── suggest-group-merges/   → AI group merge suggestions
│   ├── auto-map-products/    → Batch auto-mapping
│   ├── export-data/          → Data export functionality
│   └── admin-delete-all/     → Admin cleanup function
│
└── migrations/           → 40+ SQL migration files
    └── *.sql
```

---

## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  main.tsx → App.tsx (React Router)                              │
│  Routes: /auth, /dashboard, /upload, /training, etc.            │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
     ┌──────────┐      ┌──────────┐      ┌──────────┐
     │  Pages   │      │Components│      │ Contexts │
     │(Dashboard│      │(UI, Forms│      │ (Auth)   │
     │ Upload)  │      │ Charts)  │      │          │
     └──────────┘      └──────────┘      └──────────┘
            │                                  │
            └──────────────┬───────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  TanStack Query (useQuery, useMutation)                         │
│  - Caches data, handles loading/error states                    │
│  - Query keys for cache invalidation                            │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  integrations/supabase/client.ts → Supabase Client              │
│  - Database queries (receipts, mappings, patterns)              │
│  - Edge Function calls (parse-receipt, suggest-categories)      │
│  - File storage (receipt images)                                │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE (Self-hosted)                       │
│  - PostgreSQL database (receipts, products, mappings)           │
│  - Authentication (email/password login)                        │
│  - Storage (receipt images)                                     │
│  - Edge Functions (AI parsing via Gemini API)                   │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE GEMINI API                            │
│  - Model: gemini-2.5-flash                                      │
│  - Receipt OCR and item extraction                              │
│  - Category suggestions                                         │
│  - Product grouping suggestions                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Architecture

### **Receipt-Centric Model**

All data flows from uploaded receipts:

```
┌─────────────────────────────────────────────────────────────────┐
│ receipts table (Core data - all parsed receipts)                │
├─────────────────────────────────────────────────────────────────┤
│ → Store name, date, total amount                                │
│ → Items array (JSONB): name, price, quantity, category          │
│ → Image URLs (single or multi-page)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Product Mapping System (Normalizes product names)               │
├─────────────────────────────────────────────────────────────────┤
│ product_mappings     → User-specific mappings                   │
│ global_product_mappings → Shared mappings (115+ products)       │
│ user_global_overrides → User customization of global mappings   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Analytics Views (Pre-calculated for performance)                │
├─────────────────────────────────────────────────────────────────┤
│ view_monthly_stats     → Monthly aggregated spending            │
│ view_category_breakdown → Spending by category with corrections │
│ view_store_comparison  → Spending by store                      │
│ view_price_comparison  → Unit price analysis                    │
└─────────────────────────────────────────────────────────────────┘
```

### **Category Correction Priority System**

The application uses a sophisticated priority system to ensure accurate analytics:

1. **User mappings** (`product_mappings.category`) - User's explicit categorization
2. **Global mappings** (`global_product_mappings.category`) - Shared product database
3. **Receipt category** - AI-parsed from receipt
4. **Fallback** - 'other' category

---

## 📝 Example Flow: User Uploads a Receipt

1. User selects receipt image/PDF on `/upload`
2. Client-side:
   - PDF converted to images using `pdfjs-dist` (scale: 2.0, quality: 0.9)
   - Files sanitized (Swedish chars: å→a, ä→a, ö→o)
   - Duplicate detection (date + amount + store name)
3. Images uploaded to Supabase Storage
4. `parse-receipt` Edge Function called with image URLs
5. Edge Function processing:
   - **PDF text extraction** (if PDF URL provided) → Attempts structured parsing
   - **Structured parser** (for ICA receipts) → 100% accuracy if successful
   - **AI fallback** (Gemini 2.5 Flash) → Handles any receipt format
6. Parsed data returned: store, date, total, items with categories
7. Receipt saved to database
8. TanStack Query caches result → Dashboard updates
9. User sees receipt on Dashboard with category breakdown! 🎯

---

## 🤖 AI Receipt Parsing System

### **Overview**

| Component | Technology | Notes |
|-----------|------------|-------|
| **Model** | `gemini-2.5-flash` | Best balance of speed and accuracy |
| **Technique** | Hybrid: Structured Parsing + AI Vision | Structured parser for known formats, AI fallback for others |
| **Backend** | Supabase Edge Function | `supabase/functions/parse-receipt/index.ts` |
| **PDF Processing** | `pdfjs-dist` (client) + `pdf-parse` (server) | Client-side preview, server-side text extraction |

### **Processing Strategy (Priority Order)**

1. **PDF Text Extraction** (if PDF URL provided):
   - Uses `npm:pdf-parse@1.1.1` in Deno runtime
   - Extracts perfect text from PDF layer
   - Passes to structured parser

2. **Structured Parser** (for known formats):
   - Code-based parsing for 100% accuracy
   - Supports ICA detailed format and ICA kvitto format
   - Supports Willys self-scanning receipts
   - Handles multi-line product names, discounts, Swedish abbreviations

3. **AI Vision Fallback** (always available):
   - Receives PDF text in prompt for improved accuracy
   - Applies learned patterns from `store_patterns` table
   - Handles any receipt format

### **AI-Assisted Features**

| Edge Function | Purpose |
|---------------|---------|
| `parse-receipt` | Extract items, prices, categories from receipt images |
| `suggest-categories` | AI category suggestions for uncategorized products |
| `suggest-product-groups` | AI grouping of similar products (spelling variants, brands) |
| `suggest-group-merges` | AI suggestions for merging product groups |
| `auto-map-products` | Batch auto-mapping of products to existing groups |
| `export-data` | Data export functionality |

### **Supported Store Formats**

The structured parser supports these Swedish grocery stores (100% accuracy when text extraction succeeds):

| Store Type | Detection | Notes |
|------------|-----------|-------|
| **ICA Kvantum** | "Kvantum" + "Beskrivning" | 14-16 digit barcodes, table-based format |
| **ICA Nära** | "Nära" + "Beskrivning" | Same parser as Kvantum |
| **Maxi ICA** | "Maxi" + "Beskrivning" | Same parser as Kvantum |
| **ICA Supermarket** | Store name + "Beskrivning" | Same parser as Kvantum |
| **Willys** | "Willys" in text | Self-scanning receipt format |

Other stores (Coop, Hemköp, etc.) use the AI parser as fallback.

### **Parser Versioning (Training Mode)**

The `parse-receipt` Edge Function supports a `parserVersion` parameter for A/B testing:

| Version | Description |
|---------|-------------|
| `current` | Production parser (default) |
| `experimental` | With latest fixes for testing |
| `ai_only` | Skip structured parsing, use only Gemini |
| `comparison` | Run both structured + AI, return diff |

**Comparison mode** runs both parsers and returns detailed diff metrics:
- Match rate (% of items matched)
- Price accuracy (% of prices within 0.10 kr)
- Timing comparison (structured: ~2ms vs AI: ~10-27s)

Access via Training page → "Träning på inläsning" tab.

### **Known Parser Limitations**

These are **documented limitations** that affect item-level accuracy but maintain correct totals:

| Limitation | Description | Impact |
|------------|-------------|--------|
| **Bundle discounts** | Multi-buy discounts (e.g., "4 chips for 89kr") applied to last item only | Individual item may show negative price, **total is correct** |
| **Bundle offer names** | Lines like "Wienerbröd 4F25" may append to previous product name | Affects item name display only |
| **Pantretur math** | Some Pantretur totals don't match unit × qty on receipt | Parser uses actual receipt value, logs warning |

---

## 🏗️ Hosting & Infrastructure

| Service | Usage |
|---------|-------|
| **Vercel** | Frontend hosting (auto-deploy from `main` branch) |
| **Supabase** | Self-hosted backend (PostgreSQL, Auth, Storage, Edge Functions) |
| **Google Gemini API** | Direct API access for AI features |

### **Deployment**

```bash
# Frontend: Auto-deployed via Vercel on push to main

# Edge Functions: Manual deployment
supabase functions deploy <function-name>
supabase functions deploy  # Deploy all

# Database migrations
supabase db push
```

---

## ⚡ Performance Optimizations

1. **Code Splitting**: All routes lazy loaded using `React.lazy()`
   - Reduces initial bundle size
   - Faster initial page load

2. **Virtualization**: Uses `react-window` for long product lists
   - Only renders visible items
   - Handles 1000+ products smoothly

3. **Server-side Aggregation**: Dashboard uses database views
   - Pre-calculated monthly stats
   - Pre-applied category corrections
   - Significantly faster rendering

4. **Query Caching**: TanStack Query with smart cache policies
   - Critical data: `staleTime: 0`, `refetchOnMount: true`
   - Less critical: `staleTime: 5 * 60 * 1000` (5 minutes)

5. **Debouncing**: Search inputs use `use-debounce`
   - Reduces unnecessary re-renders
   - Prevents excessive API calls

---

## 📋 Category System

14 Swedish grocery categories defined in `src/lib/categoryConstants.ts`:

| Key | Swedish Name |
|-----|--------------|
| `frukt_och_gront` | Frukt & Grönt |
| `kott` | Kött |
| `fisk` | Fisk |
| `mejeri` | Mejeri |
| `brod_och_bakverk` | Bröd & Bakverk |
| `fryst` | Fryst |
| `torrvaror` | Torrvaror |
| `drycker` | Drycker |
| `snacks_och_godis` | Snacks & Godis |
| `hygien` | Hygien |
| `hushall` | Hushåll |
| `barnprodukter` | Barnprodukter |
| `husdjur` | Husdjur |
| `other` | Övrigt |

**Usage:**
```typescript
import { CATEGORY_KEYS, categoryNames, categoryOptions } from '@/lib/categoryConstants';

// Get key
const key = CATEGORY_KEYS.FRUKT_OCH_GRONT; // 'frukt_och_gront'

// Get display name
const name = categoryNames['frukt_och_gront']; // 'Frukt & Grönt'

// Get options for select
const options = categoryOptions; // [{ value, label }, ...]
```

---

## 📜 Migration History

> **Migration completed December 2024** — Fully independent from Lovable Cloud.

### Migration Phases

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Own Supabase instance | ✅ Complete |
| Phase 2 | Replace AI Gateway → Direct Gemini API | ✅ Complete |
| Phase 3 | Remove `lovable-tagger` dependency | ✅ Complete |
| Phase 4 | New GitHub repo + Vercel hosting | ✅ Complete |

### Data Migrated

| Data Type | Count |
|-----------|-------|
| Receipts | 117 |
| Product mappings | 1,057 |
| Global mappings | 221 |
| Store patterns | 5 |
| User overrides | 3 |

### Current Infrastructure

| Component | Service |
|-----------|---------|
| **Frontend** | Vercel (`grocer-gist-2-0.vercel.app`) |
| **Database** | Supabase (`issddemuomsuqkkrzqzn`) |
| **Edge Functions** | Supabase (7 deployed) |
| **AI** | Google Gemini API (`gemini-2.5-flash`) |

> **Note**: Some receipt images may still point to old Lovable storage URLs until migrated.


## Hosting & Infrastructure

- **Frontend Hosting**: Vercel (`grocer-gist-2-0.vercel.app`)
  - Auto-deploy: Enabled from `main`
  - Build Command: `npm run build`
  - Output Directory: `dist`
- **Database**: Self-hosted Supabase
- **Edge Functions**: Supabase Edge Functions (Deno runtime)
  - Deployment: `supabase functions deploy [function-name]`
- **AI**: Google Gemini API (`gemini-2.5-flash`)

## Context7 Integration (AI Tools)
This project uses **Context7** MCP server to fetch up-to-date documentation.
**Key library IDs verified:**
- Supabase: `/supabase/supabase-js`
- TanStack Query: `/websites/tanstack_query`
- React Router: `/remix-run/react-router`
- React Hook Form: `/react-hook-form/react-hook-form`
- Zod: `/colinhacks/zod`

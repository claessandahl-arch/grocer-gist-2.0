# Tech Stack Documentation

## 🛠️ Libraries & Tools

### **Core Framework**

| Library | Version | What | Why |
|---------|---------|------|-----|
| **React** | 19.2.0 | UI framework | Builds interactive user interfaces with components. When data changes, only the affected parts update—no full page refresh needed. |
| **React DOM** | 19.2.0 | React's bridge to the browser | Renders React components into actual HTML on the page. |
| **TypeScript** | 5.9.3 | JavaScript with types | Catches bugs before runtime (e.g., "you passed a string but expected a number"). Makes refactoring safer. |

---

### **Build & Development**

| Library | Version | What | Why |
|---------|---------|------|-----|
| **Vite** | 7.2.4 | Build tool & dev server | Extremely fast hot-reload during development. Bundles your code efficiently for production. |
| **ESLint** | 9.39.1 | Code linter | Catches code quality issues and enforces consistent style. |

---

### **Routing**

| Library | Version | What | Why |
|---------|---------|------|-----|
| **React Router** | 7.9.6 | Client-side routing | Navigate between pages (Overview → Reports → Import) without reloading the browser. URLs like `/app/reports` work as expected. |

---

### **Styling**

| Library | Version | What | Why |
|---------|---------|------|-----|
| **Tailwind CSS** | 4.1.17 | Utility-first CSS framework | Style components with classes like `bg-teal-500 p-4 rounded-lg`. No separate CSS files needed—fast to build UIs. |
| **clsx** | 2.1.1 | Class name utility | Merge conditional classes smartly: `clsx('btn', isActive && 'btn-active')`. |
| **tailwind-merge** | 3.4.0 | Tailwind class merger | Avoids duplicate/conflicting Tailwind classes when merging. |
| **class-variance-authority** | 0.7.1 | Component variants | Define button variants (`primary`, `outline`, `ghost`) in a type-safe way. |

---

### **UI Components**

| Library | Version | What | Why |
|---------|---------|------|-----|
| **Radix UI** | Various | Accessible primitives | Pre-built, accessible components (modals, dropdowns, tabs) that you style yourself. Handles keyboard navigation, focus trapping, ARIA attributes. |
| **Lucide React** | 0.555.0 | Icon library | Clean, consistent SVG icons (`<Plus />`, `<Trash />`, etc.). |

**Radix UI packages used:**
- `@radix-ui/react-dialog` - Modal dialogs
- `@radix-ui/react-select` - Dropdown selects
- `@radix-ui/react-tabs` - Tab navigation
- `@radix-ui/react-label` - Form labels
- `@radix-ui/react-separator` - Visual separators
- `@radix-ui/react-slot` - Component composition

---

### **Backend & Data**

| Library | Version | What | Why |
|---------|---------|------|-----|
| **Supabase** | 2.86.0 | Backend-as-a-Service | Your database, authentication, and API in one. Stores users, transactions, categories, etc. in PostgreSQL. Handles login/signup. |
| **TanStack Query** | 5.90.11 | Server state management | Caches API data, auto-refetches when stale, handles loading/error states. No manual `useEffect` + `useState` for API calls. |

---

### **Data Visualization & Import**

| Library | Version | What | Why |
|---------|---------|------|-----|
| **Recharts** | 3.5.1 | Charting library | Builds the donut charts, pie charts, line graphs, and bar charts in the Reports page. |
| **xlsx** | 0.18.5 | Excel file parser | Reads `.xlsx` bank exports so users can import transactions. |

---

## 📁 Folder Structure

```
src/
├── main.tsx          → Entry point: mounts React app
├── App.tsx           → Routing setup: defines all pages/routes
├── index.css         → Global styles (Tailwind base)
│
├── pages/            → Full-page views
│   ├── Landing.tsx       → Public homepage
│   ├── Login.tsx         → Auth: login form
│   ├── Register.tsx      → Auth: signup form
│   ├── Overview.tsx      → Dashboard with monthly summary
│   ├── Incomes.tsx       → Manage income sources
│   ├── FixedExpenses.tsx → Manage fixed monthly expenses
│   ├── VariableExpenses.tsx → Transaction list (rörliga utgifter)
│   ├── Savings.tsx       → Manage savings goals
│   ├── Categories.tsx    → Manage expense/income categories
│   ├── Reports.tsx       → Charts & trend analysis
│   ├── Import.tsx        → Import bank/Excel files
│   └── Admin.tsx         → Bulk operations, stats
│
├── components/       → Reusable building blocks
│   ├── AppLayout.tsx     → Navigation bar + page wrapper
│   ├── ProtectedRoute.tsx→ Redirects to login if not authenticated
│   ├── QueryProvider.tsx → Sets up TanStack Query
│   ├── ErrorBoundary.tsx → Catches errors, shows friendly message
│   ├── AddTransactionDialog.tsx → Modal for adding transactions
│   ├── TransactionList.tsx → Table of transactions
│   └── ui/               → Shadcn-style primitives (button, card, dialog...)
│
├── contexts/         → React Context providers
│   └── AuthContext.tsx   → Manages login state globally
│
├── lib/              → Utilities & API layer
│   ├── supabase.ts       → Supabase client initialization
│   ├── api.ts            → All database operations (CRUD + reports)
│   ├── queryKeys.ts      → Centralized TanStack Query keys
│   └── utils.ts          → Helper functions (cn for class merging)
│
└── types/            → TypeScript type definitions
    └── database.ts       → Types for Category, Transaction, Income, etc.
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
│  Routes: /login, /app, /app/reports, etc.                       │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
     ┌──────────┐      ┌──────────┐      ┌──────────┐
     │  Pages   │      │Components│      │ Context  │
     │(Overview,│      │(AppLayout│      │(AuthCtx) │
     │ Reports) │      │ Dialog)  │      │          │
     └──────────┘      └──────────┘      └──────────┘
            │                                  │
            └──────────────┬───────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  TanStack Query (useQuery, useMutation)                         │
│  - Caches data, handles loading/error states                    │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  lib/api.ts → Supabase Client                                   │
│  - getCategories(), createTransaction(), getDashboardSummary()  │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE (Cloud)                             │
│  - PostgreSQL database (transactions, categories, users)        │
│  - Authentication (login, signup, sessions)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Architecture

### **Transaction-Centric Model**

All dated financial data flows through the `transactions` table with the `type` field distinguishing between:

```
┌─────────────────────────────────────────────────────────────────┐
│ transactions table (ALL actual dated financial data)            │
├─────────────────────────────────────────────────────────────────┤
│ type: 'income'        → Imported salaries, bonuses, etc.        │
│ type: 'expense'       → Variable expenses (groceries, dining)   │
│ type: 'fixed_expense' → Imported rent, insurance, subscriptions │
│ type: 'savings'       → Imported savings transfers              │
└─────────────────────────────────────────────────────────────────┘
```

### **Budget Templates (for future "Budget vs Actual")**

```
┌─────────────────────────────────────────────────────────────────┐
│ incomes / fixed_expenses / savings tables (BUDGET TEMPLATES)    │
├─────────────────────────────────────────────────────────────────┤
│ → "Expected monthly income: 50,000 kr"                          │
│ → "Rent budget: 15,000 kr"                                      │
│ → "Savings goal: 10,000 kr/month"                               │
│ → These are used for pattern matching during import             │
│ → Future: Compare "Budget vs Actual" per month                  │
└─────────────────────────────────────────────────────────────────┘
```

### **Why This Architecture?**

1. **Per-month accuracy**: Each import creates dated transactions, so reports show actual values per month
2. **Trend analysis**: Can track how fixed expenses or savings vary over time
3. **Clean separation**: Budget goals (templates) vs. Actual spending (transactions)
4. **Duplicate detection**: All imports check against transactions table by date + amount + description

---

## 📝 Example Flow: User Views Reports Page

1. User clicks "Rapporter" → React Router renders `Reports.tsx`
2. `Reports.tsx` calls `useQuery({ queryFn: getMonthlyBudgetHistory })`
3. TanStack Query checks cache—if stale, calls `api.ts`
4. `api.ts` queries Supabase: `supabase.from('transactions').select(...)`
5. Data returns → TanStack Query caches it → Recharts renders the charts
6. User sees beautiful donut chart with their sparkvot! 🎯

---

## 🏗️ Build Configuration

The project uses Vite with manual chunk splitting for optimal bundle sizes:

```typescript
// vite.config.ts
manualChunks: {
  vendor: ['react', 'react-dom', 'react-router'],
  supabase: ['@supabase/supabase-js'],
  query: ['@tanstack/react-query'],
  xlsx: ['xlsx'],
  charts: ['recharts'],
  ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', ...]
}
```

This ensures large libraries are loaded separately and can be cached by the browser.

---

## 🤖 AI Chatbot (Spargransen)

### **Overview**

| Component | Technology | Notes |
|-----------|------------|-------|
| **Model** | `gemini-2.5-flash` | Best balance of intelligence and function calling |
| **Technique** | Function Calling + Multi-Call Loop | AI can call up to 15 functions per question |
| **Backend** | Supabase Edge Function | `supabase/functions/chat/index.ts` |
| **Frontend** | React Component | `src/components/ChatBot.tsx` |

### **Multi-Function-Call Architecture** ⭐

The chatbot uses a **loop-based approach** allowing the AI to make multiple sequential function calls:

```typescript
// Simplified loop structure
const MAX_FUNCTION_CALLS = 15
let currentContents = [...chatHistory, userMessage]

for (let i = 0; i < MAX_FUNCTION_CALLS; i++) {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: currentContents,
        config: { tools: [{ functionDeclarations }] }
    })
    
    if (response.functionCalls?.length > 0) {
        // Execute function, add result to context
        const result = await executeFunction(...)
        currentContents.push({ role: 'model', parts: [{ functionCall }] })
        currentContents.push({ role: 'function', parts: [{ functionResponse }] })
        continue  // Let AI decide if it needs more data
    }
    
    // No more function calls - return final text
    return response.text
}
```

**Why this approach?**
- AI decides how many calls it needs
- No specialized functions needed (e.g., "getYearlyExpensesByCategory")
- Works for any question complexity
- Self-limiting with max iterations

### **Available Functions (12)**

| Function | Description |
|----------|-------------|
| `getTransactionSummary` | Summary for month/year |
| `getExpensesByCategory` | Expenses by category |
| `getTopExpenses` | Largest transactions |
| `calculateRequiredIncome` | Income for target savings % |
| `analyzeOptimizationOpportunities` | Which expenses to reduce |
| `searchTransactions` | Search by description |
| `compareMonths` | Compare two months |
| `getCategories` | List all categories |
| `getBudgetTemplates` | Incomes/fixed_expenses/savings |
| `getTransactionsByType` | Filter by type + description |
| `getIncomeBreakdown` | Group income by source |
| `getYearlyExpensesByCategory` | All months for a year |

### **Model Selection Learnings** ⚠️

| Model | Verdict | Issues |
|-------|---------|--------|
| `gemini-3-flash-preview` | ❌ Complex | Requires thought signatures for multi-turn |
| `gemini-2.5-flash` | ✅ **Best** | Works well, good intelligence |
| `gemini-2.0-flash` | ❌ Hallucinations | Claims to "work in background" |
| `gemini-1.5-flash` | ❌ Not available | SDK v1beta doesn't support |

**Key insight:** Gemini 3's thought signatures are complex for function calling loops. Gemini 2.5 Flash provides the best balance.

### **Deployment**

```bash
# Deploy Edge Function
supabase functions deploy chat

# Set API key (one time)
supabase secrets set GEMINI_API_KEY=your_key
```

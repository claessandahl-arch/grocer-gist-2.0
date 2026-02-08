# Tech Stack Documentation - Receipt Insights

## 🛠️ Core Technologies

### **Frontend Framework**

| Technology | Version | Description | Why |
| :--- | :--- | :--- | :--- |
| **React** | 18.3.1 | UI library | Fast, component-based UI development. |
| **TypeScript** | 5.9.3 | Programming language | Type safety to catch errors during development. |
| **Vite** | 5.4.19 | Build tool | Extremely fast development server and optimized production builds. |
| **React Router** | 6.30.1 | Routing | Client-side navigation for a Single Page Application (SPA) experience. |

---

### **State Management & Data Fetching**

| Library | Version | Description | Why |
| :--- | :--- | :--- | :--- |
| **TanStack Query** | 5.90.12 | Server state management | Handles caching, synchronization, and refetching of Supabase data. |
| **Supabase JS** | 2.81.1 | Backend client | Direct interaction with PostgreSQL, Auth, and Storage. |

---

### **Styling & UI Components**

| Library | Version | Description | Why |
| :--- | :--- | :--- | :--- |
| **Tailwind CSS** | 3.4.17 | Utility-first CSS | Rapid styling using utility classes. Transitioning to v4. |
| **shadcn/ui** | - | UI components | Accessible, customizable components built on Radix UI. |
| **Lucide React** | 0.555.0 | Icon library | Consistent and lightweight SVG icons. |
| **Recharts** | 2.15.4 | Visualization | Interactive charts for the spending dashboard. |

---

### **Specialized Libraries**

| Library | Version | Description | Why |
| :--- | :--- | :--- | :--- |
| **pdfjs-dist** | 5.4.449 | PDF processing | Client-side conversion of PDF receipts to images for preview. |
| **date-fns** | 3.6.0 | Date utilities | Swedish locale-aware date formatting and manipulation. |
| **react-window** | 2.2.3 | Virtualization | Efficient rendering of large product lists (>1000 items). |
| **zod** | 3.25.76 | Validation | Schema validation for API responses and forms. |

---

## ☁️ Infrastructure & Backend

### **Supabase Platform**
- **Database**: PostgreSQL with Row Level Security (RLS) for multi-tenant data isolation.
- **Authentication**: Email/password based auth.
- **Storage**: Buckets for receipt images and PDF documents.
- **Edge Functions**: Deno runtime for AI processing and admin tasks.

### **AI Engine**
- **Model**: Google Gemini 2.5 Flash (`gemini-2.5-flash`).
- **Capabilities**: Image-to-text (OCR), structured data extraction, smart categorization.
- **Learning**: Corrections stored in `store_patterns` to improve future parsing.

---

## 🧪 Testing & Quality Control

### **Regression Testing**
- **Runner**: `tsx` (Node.js TypeScript executor).
- **Automation**: GitHub Actions (`parser-regression-test.yml`).
- **Data**: "Golden Set" of known-good receipts in `test-receipts/golden-set/`.

### **Monitoring**
- **Anomaly Detection**: Automated detection of absurd prices or quantities during parsing.
- **Diagnostics UI**: `/diagnostics` page for real-time parser health monitoring.

---

## 📁 Key File Structure

```
src/
├── components/       # UI building blocks (admin, training, dashboard)
├── integrations/     # Supabase client and auto-generated types
├── lib/              # Utils, constants (categories, units, hashing)
├── pages/            # Main routes (Dashboard, Upload, Training, etc.)
└── types/            # Shared TypeScript interfaces
supabase/
├── functions/        # Edge functions (Deno/TypeScript)
└── migrations/       # SQL schema changes
scripts/              # CLI tools for testing and maintenance
```

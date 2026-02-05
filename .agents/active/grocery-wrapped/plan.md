# Feature: Grocery Wrapped 🎉

## Description

**Spotify Wrapped-style "Year in Review"** for grocery shopping data, presenting entertaining and insightful statistics in a swipeable, story-like format.

**Psychology leveraged:** Personalization, nostalgia, self-discovery, gamification with archetypes, and shareable content.

## User Story

```
As a Grocer Gist user
I want to see a fun summary of my grocery shopping year
So that I can reflect on my habits and share memorable insights
```

## Complexity Assessment

| Aspect | Rating |
|--------|--------|
| **Overall** | Medium-High |
| **UI/UX** | High (story-like animations, responsive design) |
| **Data Layer** | Medium (aggregations from existing receipt data) |
| **Backend** | Low-Medium (RPC functions with SQL aggregations) |

---

## Proposed Changes

### Database Layer (Supabase)

#### [NEW] `supabase/migrations/YYYYMMDD_grocery_wrapped_functions.sql`

Create 3 RPC functions for wrapped statistics:

1. **`get_wrapped_overview(year_param)`** - Total spending, receipt count, unique products, stores visited
2. **`get_wrapped_products(year_param)`** - Top 10 products by quantity, top by spend, category breakdown
3. **`get_wrapped_patterns(year_param)`** - Shopping frequency, peak week, favorite day of week, store loyalty %

---

### Frontend - Types & Hook

#### [NEW] `src/types/wrapped.ts`

TypeScript interfaces for wrapped data:
- `WrappedOverview` - spending totals, counts
- `WrappedProduct` - product name, count, total spend
- `WrappedPatterns` - time patterns, habits
- `ShopperPersonality` - archetype name, traits

---

#### [NEW] `src/hooks/useWrappedStats.ts`

TanStack Query hook that:
- Calls the 3 RPC functions
- Derives "Shopper Personality" archetype client-side
- Provides loading/error states
- Caches results appropriately

---

### Frontend - Components

#### [NEW] `src/components/wrapped/` (directory with 8+ files)

| Component | Purpose |
|-----------|---------|
| `WrappedSlide.tsx` | Base slide container with animations/transitions |
| `HeroSlide.tsx` | "Your 2025 Wrapped" intro with animation |
| `SpendingSlide.tsx` | Total spent, average per trip, peak week |
| `TopProductsSlide.tsx` | #1 product, top 5 carousel |
| `StoreLoyaltySlide.tsx` | Home store, stores visited, savings |
| `PersonalitySlide.tsx` | Shopper archetype reveal (fun moment!) |
| `SummarySlide.tsx` | Final card with share button |
| `SlideProgress.tsx` | Progress indicators / dots |

**Design notes:**
- Full-screen, mobile-first slides
- Gradient backgrounds with category/personality colors
- Smooth page transitions (Framer Motion)
- Tap/swipe navigation

---

### Frontend - Page & Routing

#### [NEW] `src/pages/Wrapped.tsx`

Main page component that:
- Handles slide navigation state
- Keyboard + touch gestures
- Loads data via `useWrappedStats`
- Renders slides conditionally

---

#### [MODIFY] [App.tsx](file:///Users/csandahl/Projects/grocer-gist-2.0/src/App.tsx)

Add lazy-loaded route:

```tsx
const Wrapped = lazy(() => import("./pages/Wrapped"));
// ...
<Route path="/wrapped" element={<Wrapped />} />
```

---

#### [MODIFY] [Navigation.tsx](file:///Users/csandahl/Projects/grocer-gist-2.0/src/components/Navigation.tsx)

Add nav link with 🎉 icon (seasonal visibility option).

---

## Statistics Included

### 📊 Spending Stats
- **Total Yearly Spending** - The big headline number
- **Average Per Visit** - How much per shopping trip
- **Peak Spending Week** - Your biggest week
- **Month-over-Month Trend** - Visualized

### 🛒 Product Stats  
- **#1 Product** - Your signature grocery item
- **Top 5 Products** - Most purchased
- **Category Champion** - Your dominant category
- **Product Variety Score** - Unique products tried

### 🏪 Store Stats
- **Home Store** - Most visited store
- **Stores Visited** - Total count
- **Store Loyalty %** - How loyal are you?

### ⏰ Time Stats
- **Shopping Frequency** - Trips per month
- **Favorite Day** - Most common shopping day
- **Holiday Spikes** - Peak shopping events

### 🎭 Fun/Shareable Stats
- **Shopper Personality** - Archetypes like:
  - 🏆 "Budget Boss" - High savings focus
  - 🌿 "Health Hero" - Produce champion  
  - 🍫 "Snack Samurai" - Snacks category leader
  - 🔄 "Variety Voyager" - High product diversity
  - 💎 "Brand Loyalist" - Consistent purchases

---

## Step-by-Step Tasks

### Phase 1: Data Layer
1. [ ] Write SQL migration with 3 RPC functions
2. [ ] Apply migration locally (`supabase db push` or deploy)
3. [ ] Test RPCs directly in Supabase dashboard

### Phase 2: Frontend Foundation  
4. [ ] Create `src/types/wrapped.ts` with interfaces
5. [ ] Create `src/hooks/useWrappedStats.ts` hook
6. [ ] Create `src/lib/personalityCalculator.ts` for archetype logic

### Phase 3: UI Components
7. [ ] Create `src/components/wrapped/WrappedSlide.tsx` base component
8. [ ] Create `src/components/wrapped/SlideProgress.tsx`
9. [ ] Build individual slides (Hero, Spending, Products, Store, Personality, Summary)
10. [ ] Add animations and transitions

### Phase 4: Page & Navigation
11. [ ] Create `src/pages/Wrapped.tsx`
12. [ ] Add route to `App.tsx`
13. [ ] Add navigation link

### Phase 5: Polish
14. [ ] Add keyboard navigation (arrow keys)
15. [ ] Add touch/swipe support
16. [ ] Responsive design adjustments
17. [ ] Add share functionality (copy image or link)

---

## Verification Plan

### Automated Tests

```bash
# Type checking - catches interface mismatches
npx tsc --noEmit

# Linting - catches code style issues  
npm run lint

# Production build - catches bundling issues
npm run build
```

### Manual Verification

**Pre-requisites:**
- At least 10+ receipts in database spanning multiple months
- Receipts from 2+ different stores
- Variety of product categories

**Test Steps:**

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to Wrapped:**
   - Open `http://localhost:8080/wrapped`
   - Should see loading state, then Hero slide

3. **Test Slide Navigation:**
   - Click/tap right side → advances to next slide
   - Click/tap left side → goes to previous slide
   - Arrow keys ← → should work
   - Swipe left/right on mobile should work

4. **Verify Data Accuracy:**
   - Compare "Total Spent" with Dashboard totals
   - Verify "Top Product" matches manual calculation
   - Check "Home Store" is correct

5. **Test Edge Cases:**
   - User with 0 receipts → graceful empty state
   - User with only 1 receipt → still works

6. **Test Sharing:**
   - Click share button → copies shareable content

---

## Dependencies

**Existing (no new installs):**
- React, TypeScript, Tailwind CSS
- TanStack Query (data fetching)
- Recharts (if we add mini charts)
- date-fns with Swedish locale
- Supabase client

**Optional new install:**
- `framer-motion` for premium slide animations

> [!NOTE]
> Framer Motion is optional. Can achieve basic transitions with CSS + Tailwind animate utilities.

---

## Acceptance Criteria

- [ ] User can access `/wrapped` page from navigation
- [ ] All 6+ slides render with real data
- [ ] Navigation works via click, keyboard, and touch
- [ ] Personality archetype is calculated and displayed
- [ ] Page is visually polished with animations
- [ ] Works on mobile viewport
- [ ] Graceful handling when no data exists
- [ ] Build passes without errors

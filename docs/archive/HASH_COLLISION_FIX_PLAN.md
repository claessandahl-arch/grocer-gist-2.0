# Hash Collision Fix Plan

> **Status:** Planned | **Priority:** Medium | **Created:** 2026-02-07

## Problem Statement

The perceptual hash duplicate detection system can produce **false positives** when two different receipts from the same store have visually similar layouts. This causes legitimate receipts to be blocked from upload.

### Root Cause

The current implementation uses a **perceptual hash algorithm** (`imageHash.ts`) that generates a visual fingerprint of receipt images. While this works well for detecting true duplicates, it can produce identical hashes for visually similar but distinct receipts because:

1. All ICA Nära receipts have identical header/footer layouts
2. Similar purchase amounts produce similar visual content density
3. The hash is designed for perceptual similarity, not exact matching

### Example Case

```
File: ICA Nära Älvsjö 2025-09-29.pdf
Hash: 0fffffff8fcfdfff-ff7fffffffffffff

Collision with:
Store: ICA Nära Älvsjö | Date: 2026-02-01 | Amount: 70.90 kr
```

Two completely different receipts (4 months apart) produced the same hash.

---

## Proposed Solutions

### Option A: Add Receipt Date to Hash Key (Recommended) ⭐

**Change:** Include the parsed receipt date as part of the duplicate detection key.

**Implementation:**
1. After PDF text extraction, parse the receipt date first
2. Change duplicate check from `(user_id, image_hash)` to `(user_id, image_hash, receipt_date)`
3. Update `receipt_image_hashes` table schema to include receipt_date
4. Same hash + same date = true duplicate; same hash + different date = allowed

**Pros:**
- Minimal false positives (unlikely to have same store, same hash, same date unless truly duplicate)
- No changes to hash algorithm
- Backwards compatible

**Cons:**
- Requires date parsing before duplicate check (adds complexity)
- Unable to detect duplicates if date parsing fails

---

### Option B: Increase Hash Precision

**Change:** Use a higher-resolution perceptual hash.

**Implementation:**
1. Increase hash size from 64-bit to 256-bit
2. Use multiple hash algorithms (average hash + difference hash + perceptual hash)
3. Combine hashes for better discrimination

**Pros:**
- More accurate fingerprinting
- No structural changes to duplicate logic

**Cons:**
- Still possible to have collisions (just less likely)
- More computation per upload
- Breaks existing hash comparisons (migration needed)

---

### Option C: Force Upload Override (Quick Fix)

**Change:** Add a "Force Upload" button when duplicate is detected.

**Implementation:**
1. When duplicate detected, show warning dialog with details
2. User can choose "Skip" (current behavior) or "Upload Anyway"
3. On "Upload Anyway", proceed without duplicate check

**Pros:**
- Fastest to implement
- User has control
- No algorithm or schema changes

**Cons:**
- Relies on user judgment
- Doesn't prevent mistakes (true duplicates may get through)
- Poor UX for bulk uploads

---

### Option D: Content-Based Verification

**Change:** When hash collision detected, verify using parsed receipt metadata.

**Implementation:**
1. If hash matches, parse both receipts
2. Compare: store name, date, total amount, item count
3. If metadata differs significantly, allow upload

**Pros:**
- Highest accuracy
- Uses existing structured parser

**Cons:**
- Requires parsing before duplicate decision
- Slower initial upload
- Parser must work reliably for this to work

---

## Recommended Approach

**Implement Option A (Date Key) + Option C (Force Override) as fallback**

### Phase 1: Force Upload Override (1-2 hours)
- Add dialog when duplicate detected
- User can choose to skip or force upload
- Log force uploads for monitoring

### Phase 2: Date-Based Deduplication (3-4 hours)
- Update schema: `receipt_image_hashes` add `receipt_date` column (nullable)
- Change unique constraint to `(user_id, image_hash, receipt_date)`
- Pre-parse date before duplicate check
- If date parsing fails, fall back to hash-only check

---

## Affected Files

| File | Change |
|------|--------|
| `src/pages/Upload.tsx` | Add force upload dialog |
| `src/lib/imageHash.ts` | (No change for Option A) |
| `supabase/migrations/*.sql` | Add receipt_date to hash table |
| `supabase/functions/parse-receipt/index.ts` | (No change) |

---

## Testing Checklist

- [ ] Verify same receipt, same date = blocked (true duplicate)
- [ ] Verify same hash, different date = allowed
- [ ] Verify force upload bypasses check
- [ ] Verify bulk upload handles mixed duplicates/unique
- [ ] Verify orphan hash cleanup still works

---

## References

- Hash collision example: `0fffffff8fcfdfff-ff7fffffffffffff` (2025-09-29 vs 2026-02-01)
- Related code: [`src/lib/imageHash.ts`](../src/lib/imageHash.ts)
- Duplicate check: [`src/pages/Upload.tsx:208-224`](../src/pages/Upload.tsx)

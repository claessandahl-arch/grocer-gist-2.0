/**
 * Comparison unit constants for price comparison feature
 * 
 * Determines how products in each category should be compared:
 * - kg: Price per kilogram (fruit, meat, fish, snacks)
 * - L: Price per liter (drinks, some dairy)
 * - st: Price per unit/piece (bread, ready meals, household)
 * 
 * Future: Admin can override these per product via product_unit_info table
 */

export type ComparisonUnit = 'kg' | 'L' | 'st';

/**
 * Default comparison unit per category
 * Used when no product-specific override exists
 */
export const CATEGORY_COMPARISON_UNITS: Record<string, ComparisonUnit> = {
    // Weight-based comparison (kr/kg)
    frukt_och_gront: 'kg',      // Fruit & vegetables - sold by weight
    kott_fagel_chark: 'kg',     // Meat & poultry - sold by weight
    fisk_skaldjur: 'kg',        // Fish & seafood - sold by weight
    delikatess: 'kg',           // Cheese, olives - sold by weight
    skafferi: 'kg',             // Pasta, rice, flour - compare by weight
    sotsaker_snacks: 'kg',      // Chips, candy - compare by weight
    frysvaror: 'kg',            // Frozen goods - compare by weight

    // Volume-based comparison (kr/L)
    drycker: 'L',               // All drinks - compare per liter

    // Unit-based comparison (kr/st)
    mejeri: 'st',               // Yoghurt, cheese packages - per container (user decision)
    brod_bageri: 'st',          // Bread - per loaf/bag
    fardigmat: 'st',            // Ready meals - per portion
    hushall_hygien: 'st',       // Cleaning products - per unit

    // Default
    pant: 'st',                 // Deposit - per item
    other: 'st',                // Unknown - default to per unit
};

/**
 * Human-readable labels for comparison units
 */
export const COMPARISON_UNIT_LABELS: Record<ComparisonUnit, string> = {
    kg: 'kr/kg',
    L: 'kr/L',
    st: 'kr/st',
};

/**
 * Swedish labels for comparison units
 */
export const COMPARISON_UNIT_NAMES: Record<ComparisonUnit, string> = {
    kg: 'per kilo',
    L: 'per liter',
    st: 'per styck',
};

/**
 * Get the default comparison unit for a category
 */
export function getComparisonUnitForCategory(category: string | null): ComparisonUnit {
    if (!category) return 'st';
    return CATEGORY_COMPARISON_UNITS[category] ?? 'st';
}

/**
 * Normalize content to base units
 * - g, gr, gram → kg (divide by 1000)
 * - ml, cl, dl → L (divide appropriately)
 */
export function normalizeToBaseUnit(
    amount: number,
    unit: string
): { amount: number; unit: ComparisonUnit } | null {
    const lowerUnit = unit.toLowerCase().trim();

    // Weight conversions → kg
    if (['kg', 'kilo', 'kilogram'].includes(lowerUnit)) {
        return { amount, unit: 'kg' };
    }
    if (['g', 'gr', 'gram'].includes(lowerUnit)) {
        return { amount: amount / 1000, unit: 'kg' };
    }

    // Volume conversions → L
    if (['l', 'liter', 'litre'].includes(lowerUnit)) {
        return { amount, unit: 'L' };
    }
    if (['dl', 'deciliter'].includes(lowerUnit)) {
        return { amount: amount / 10, unit: 'L' };
    }
    if (['cl', 'centiliter'].includes(lowerUnit)) {
        return { amount: amount / 100, unit: 'L' };
    }
    if (['ml', 'milliliter'].includes(lowerUnit)) {
        return { amount: amount / 1000, unit: 'L' };
    }

    // Units
    if (['st', 'styck', 'piece', 'pcs', 'pack'].includes(lowerUnit)) {
        return { amount, unit: 'st' };
    }

    return null; // Unknown unit
}

/**
 * Check if a category expects normalized comparison
 * Used to determine if we should show "!" indicator for missing data
 */
export function categoryExpectsNormalization(category: string | null): boolean {
    if (!category) return false;
    const expectedUnit = CATEGORY_COMPARISON_UNITS[category];
    // kg and L categories expect normalized data
    return expectedUnit === 'kg' || expectedUnit === 'L';
}

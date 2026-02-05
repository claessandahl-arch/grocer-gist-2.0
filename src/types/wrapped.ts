// TypeScript interfaces for Grocery Wrapped feature

export interface WrappedOverview {
    total_spending: number;
    receipt_count: number;
    unique_products: number;
    stores_visited: number;
    avg_per_receipt: number;
    first_receipt_date: string;
    last_receipt_date: string;
}

export interface WrappedProduct {
    product_name: string;
    total_quantity: number;
    total_spent: number;
    purchase_count: number;
}

export interface CategoryBreakdown {
    category: string;
    category_total: number;
    product_count: number;
}

export interface WrappedProducts {
    top_by_quantity: WrappedProduct[];
    top_by_spending: WrappedProduct[];
    category_breakdown: CategoryBreakdown[];
    unique_products_count: number;
}

export interface PeakWeek {
    week_start: string;
    total_spent: number;
    receipt_count: number;
}

export interface HomeStore {
    store_name: string;
    visit_count: number;
}

export interface WrappedPatterns {
    shopping_frequency: number; // trips per month
    peak_week: PeakWeek;
    favorite_day: number; // 0-6 (Sunday-Saturday)
    home_store: HomeStore;
    store_loyalty_percent: number;
    stores_visited_count: number;
}

export type ShopperArchetype =
    | 'budget_boss'
    | 'health_hero'
    | 'snack_samurai'
    | 'variety_voyager'
    | 'brand_loyalist'
    | 'convenience_seeker';

export interface ShopperPersonality {
    archetype: ShopperArchetype;
    title: string;
    emoji: string;
    description: string;
    traits: string[];
}

export interface WrappedStats {
    overview: WrappedOverview;
    products: WrappedProducts;
    patterns: WrappedPatterns;
    personality: ShopperPersonality;
}

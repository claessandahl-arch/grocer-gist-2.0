import {
    ShopperArchetype,
    ShopperPersonality,
    WrappedOverview,
    WrappedProducts,
    WrappedPatterns,
} from '@/types/wrapped';

/**
 * Calculates shopper personality archetype based on wrapped statistics
 */
export function calculateShopperPersonality(
    overview: WrappedOverview,
    products: WrappedProducts,
    patterns: WrappedPatterns
): ShopperPersonality {
    // Score different personality traits
    const scores = {
        budget_boss: 0,
        health_hero: 0,
        snack_samurai: 0,
        variety_voyager: 0,
        brand_loyalist: 0,
        convenience_seeker: 0,
    };

    // Budget Boss: Low avg spending, high frequency
    if (overview.avg_per_receipt < 300) scores.budget_boss += 3;
    if (patterns.shopping_frequency > 8) scores.budget_boss += 2;

    // Health Hero: High produce/hälsa category
    const healthCategories = products.category_breakdown.filter((cat) =>
        ['frukt_gront', 'halsa', 'mejeri'].includes(cat.category.toLowerCase())
    );
    const healthSpend = healthCategories.reduce((sum, cat) => sum + cat.category_total, 0);
    const healthPercent = (healthSpend / overview.total_spending) * 100;
    if (healthPercent > 30) scores.health_hero += 4;
    if (healthPercent > 20) scores.health_hero += 2;

    // Snack Samurai: High snacks/godis category
    const snackCategories = products.category_breakdown.filter((cat) =>
        ['godis_snacks', 'glass', 'brod_kakor'].includes(cat.category.toLowerCase())
    );
    const snackSpend = snackCategories.reduce((sum, cat) => sum + cat.category_total, 0);
    const snackPercent = (snackSpend / overview.total_spending) * 100;
    if (snackPercent > 20) scores.snack_samurai += 4;
    if (snackPercent > 15) scores.snack_samurai += 2;

    // Variety Voyager: High unique products count
    if (products.unique_products_count > 200) scores.variety_voyager += 4;
    if (products.unique_products_count > 100) scores.variety_voyager += 2;
    if (patterns.stores_visited_count > 3) scores.variety_voyager += 2;

    // Brand Loyalist: Low store count, high loyalty percent
    if (patterns.store_loyalty_percent > 70) scores.brand_loyalist += 4;
    if (patterns.stores_visited_count <= 2) scores.brand_loyalist += 2;

    // Convenience Seeker: High frequency, same store, moderate spending
    if (patterns.shopping_frequency > 10) scores.convenience_seeker += 2;
    if (patterns.store_loyalty_percent > 80) scores.convenience_seeker += 2;
    if (overview.avg_per_receipt < 500) scores.convenience_seeker += 1;

    // Find highest scoring archetype
    const archetype = Object.keys(scores).reduce((a, b) =>
        scores[a as ShopperArchetype] > scores[b as ShopperArchetype] ? a : b
    ) as ShopperArchetype;

    // Return personality details
    return getPersonalityDetails(archetype);
}

function getPersonalityDetails(archetype: ShopperArchetype): ShopperPersonality {
    const personalities: Record<ShopperArchetype, ShopperPersonality> = {
        budget_boss: {
            archetype: 'budget_boss',
            title: 'Budget Boss',
            emoji: '🏆',
            description: 'Du är en mästare på att hålla koll på utgifterna!',
            traits: [
                'Lågt genomsnittspris per besök',
                'Regelbunden handlare',
                'Strategisk inköpare',
            ],
        },
        health_hero: {
            archetype: 'health_hero',
            title: 'Hälsohjälte',
            emoji: '🌿',
            description: 'Frukt, grönt och hälsosamma val är din grej!',
            traits: [
                'Hög andel frukt & grönt',
                'Medveten konsument',
                'Hälsosam livsstil',
            ],
        },
        snack_samurai: {
            archetype: 'snack_samurai',
            title: 'Snacks-Samuraj',
            emoji: '🍫',
            description: 'Godis, snacks och godsaker är din specialitet!',
            traits: [
                'Hög andel snacks',
                'Gillar små njutningar',
                'Spontan shoppare',
            ],
        },
        variety_voyager: {
            archetype: 'variety_voyager',
            title: 'Variationsvandrare',
            emoji: '🔄',
            description: 'Du älskar att testa nya produkter och affärer!',
            traits: [
                'Många unika produkter',
                'Besöker flera butiker',
                'Nyfiken konsument',
            ],
        },
        brand_loyalist: {
            archetype: 'brand_loyalist',
            title: 'Märkeslojalist',
            emoji: '💎',
            description: 'Du vet vad du gillar och håller dig till det!',
            traits: [
                'Hög butikstrohet',
                'Återköper favoriter',
                'Konsekventa val',
            ],
        },
        convenience_seeker: {
            archetype: 'convenience_seeker',
            title: 'Bekvämlighetsköpare',
            emoji: '⚡',
            description: 'Snabbt in och ut, alltid samma butik!',
            traits: [
                'Handlar ofta',
                'Snabba besök',
                'Nära hemma',
            ],
        },
    };

    return personalities[archetype];
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    WrappedOverview,
    WrappedProducts,
    WrappedPatterns,
    WrappedStats,
} from '@/types/wrapped';
import { calculateShopperPersonality } from '@/lib/personalityCalculator';

/**
 * Hook to fetch and combine all Grocery Wrapped statistics
 * @param year - Year to fetch wrapped data for (defaults to previous year)
 */
export function useWrappedStats(year?: number) {
    return useQuery({
        queryKey: ['wrapped-stats', year],
        queryFn: async (): Promise<WrappedStats> => {
            // Default to previous year if not specified
            const targetYear = year ?? (new Date().getFullYear() - 1);

            // Fetch all three RPC functions in parallel
            const [overviewRes, productsRes, patternsRes] = await Promise.all([
                supabase.rpc('get_wrapped_overview', { year_param: targetYear }),
                supabase.rpc('get_wrapped_products', { year_param: targetYear }),
                supabase.rpc('get_wrapped_patterns', { year_param: targetYear }),
            ]);

            // Check for errors
            if (overviewRes.error) throw overviewRes.error;
            if (productsRes.error) throw productsRes.error;
            if (patternsRes.error) throw patternsRes.error;

            // Validate data existence
            if (!overviewRes.data || !productsRes.data || !patternsRes.data) {
                throw new Error("Incomplete data received from server");
            }

            // Safe casting after null check
            // Note: In a production environment, we should use Zod for runtime schema validation here
            const overview = overviewRes.data as unknown as WrappedOverview;
            const products = productsRes.data as unknown as WrappedProducts;
            const patterns = patternsRes.data as unknown as WrappedPatterns;

            // Calculate personality archetype client-side
            const personality = calculateShopperPersonality(overview, products, patterns);

            return {
                overview,
                products,
                patterns,
                personality,
            };
        },
        // Cache for 5 minutes since wrapped data doesn't change frequently
        staleTime: 5 * 60 * 1000,
        // Retry on failure
        retry: 2,
    });
}


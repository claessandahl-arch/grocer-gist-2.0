import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

// Constants from src/lib/categoryConstants.ts
const CATEGORY_KEYS = [
  'frukt_och_gront',
  'mejeri',
  'kott_fagel_chark',
  'fisk_skaldjur',
  'brod_bageri',
  'skafferi',
  'frysvaror',
  'drycker',
  'sotsaker_snacks',
  'fardigmat',
  'hushall_hygien',
  'delikatess',
  'pant',
  'other'
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action } = await req.json()

    if (action === 'scan') {
        // Fetch all product mappings
        // Note: For large datasets, this should be paginated or done via SQL RPC. 
        // Given current scale (~1000 items), fetching all is acceptable for an admin tool.
        const { data: mappings, error } = await supabase
            .from('product_mappings')
            .select('id, original_name, mapped_name, category')
            .not('category', 'is', null);

        if (error) throw error;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invalidMappings = mappings.filter((m: any) => !CATEGORY_KEYS.includes(m.category));

        return new Response(
            JSON.stringify({ 
                count: invalidMappings.length, 
                examples: invalidMappings.slice(0, 5) 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    if (action === 'fix') {
        const { data: mappings, error } = await supabase
            .from('product_mappings')
            .select('id, category')
            .not('category', 'is', null);

        if (error) throw error;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invalidMappings = mappings.filter((m: any) => !CATEGORY_KEYS.includes(m.category));
        let fixedCount = 0;

        for (const mapping of invalidMappings) {
            let newCategory = 'other';
            const currentCat = mapping.category.toLowerCase().trim();

            // Attempt to fix common issues
            if (currentCat.includes(',')) {
                // Take first valid part if comma separated (e.g. "fruit, organic")
                const parts = currentCat.split(',');
                for (const part of parts) {
                    const cleanPart = part.trim();
                    if (CATEGORY_KEYS.includes(cleanPart)) {
                        newCategory = cleanPart;
                        break;
                    }
                }
            } else if (CATEGORY_KEYS.includes(currentCat)) {
                // Just whitespace or case issue
                newCategory = currentCat;
            } else if (currentCat === 'fruits_vegetables') newCategory = 'frukt_och_gront';
            else if (currentCat === 'dairy') newCategory = 'mejeri';
            else if (currentCat === 'meat') newCategory = 'kott_fagel_chark';
            else if (currentCat === 'bread') newCategory = 'brod_bageri';
            else if (currentCat === 'pantry') newCategory = 'skafferi';
            else if (currentCat === 'frozen') newCategory = 'frysvaror';
            else if (currentCat === 'drinks') newCategory = 'drycker';
            else if (currentCat === 'snacks') newCategory = 'sotsaker_snacks';
            
            // Update the record
            const { error: updateError } = await supabase
                .from('product_mappings')
                .update({ category: newCategory })
                .eq('id', mapping.id);
            
            if (!updateError) fixedCount++;
        }

        return new Response(
            JSON.stringify({ fixed: fixedCount }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { category, products } = await req.json();

        // Initialize Supabase client for auth check
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        // Check for auth header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'No authorization header' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Verify user
        const supabase = (await import("https://esm.sh/@supabase/supabase-js@2")).createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: { user }, error: authError } = await supabase.auth.getUser(
            authHeader.replace('Bearer ', '')
        );

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const userId = user.id;

        if (!category || !products || !Array.isArray(products)) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: category, products (array)' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured');
        }

        const promptText = `You are a product grouping assistant. Your task is to analyze product names within the same category and group products that represent the same item.

CATEGORY: ${category}

PRODUCTS:
${JSON.stringify(products, null, 2)}

RULES:
1. Group products that are the same item but with different spelling/variants.
   Example: "Zucchini", "Zuccini", "Green Zucchini" → group "Zucchini"
2. Use the shortest possible name as the groupName.
3. Products with a higher occurrence count should be weighted higher in analysis.
4. Be conservative - if unsure, do not create a group.
5. Provide a confidence score from 0-100 for each suggestion.

RETURN FORMAT (JSON):
{
  "suggestions": [
    {
      "groupName": "product_name",
      "products": ["original1", "original2"],
      "confidence": 85,
      "reasoning": "Explanation of why these products belong together"
    }
  ]
}`;

        console.log(`Processing ${products.length} products for category ${category}`);

        // Create a timeout controller
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 50000); // 50 second timeout

        try {
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GEMINI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
                body: JSON.stringify({
                    model: 'gemini-2.5-flash',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful assistant that groups grocery products based on similarity. Return valid JSON only.'
                        },
                        {
                            role: 'user',
                            content: promptText
                        }
                    ],
                    response_format: { type: "json_object" }
                }),
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('AI gateway error:', response.status, errorText);

                if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please try again in a moment.');
                }
                if (response.status === 402) {
                    throw new Error('AI credits exhausted. Please add more credits.');
                }

                throw new Error(`AI gateway returned ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;
            const parsedContent = JSON.parse(content);

            console.log(`Generated ${parsedContent.suggestions?.length || 0} suggestions`);

            return new Response(
                JSON.stringify(parsedContent),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                console.error('Request timeout after 50 seconds');
                throw new Error('Request took too long. Try selecting a category with fewer products.');
            }
            throw fetchError;
        }

    } catch (error) {
        console.error('Error in suggest-product-groups function:', error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

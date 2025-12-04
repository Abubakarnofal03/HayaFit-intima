import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const metaAccessToken = Deno.env.get('META_ACCESS_TOKEN');
    const metaCatalogId = Deno.env.get('META_CATALOG_ID');

    if (!metaAccessToken || !metaCatalogId) {
      throw new Error('META_ACCESS_TOKEN or META_CATALOG_ID not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching products and sales from database...');

    const [productsResponse, salesResponse] = await Promise.all([
      supabase
        .from('products')
        .select('id, name, slug, description, price, stock_quantity, images, categories(name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('sales')
        .select('*')
        .eq('is_active', true)
        .gt('end_date', new Date().toISOString())
    ]);

    if (productsResponse.error) throw productsResponse.error;
    if (salesResponse.error) throw salesResponse.error;

    const products = productsResponse.data;
    const sales = salesResponse.data || [];

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No products to sync',
          synced: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${products.length} products and ${sales.length} active sales`);

    const requests = products.map((product: any) => {
      // Calculate Sale Price
      const originalPrice = parseFloat(product.price);
      let salePrice = null;

      const productSale = sales.find((s: any) => s.product_id === product.id);
      const globalSale = sales.find((s: any) => s.is_global);
      const activeSale = productSale || globalSale;

      if (activeSale) {
        const discountAmount = (originalPrice * activeSale.discount_percentage) / 100;
        salePrice = originalPrice - discountAmount;
      }

      // Meta Catalog Batch API expects price in minor units (cents) as integer for some currencies/contexts
      // or standard decimal string. The error "must be an integer" suggests it wants minor units or just an integer string.
      // However, usually it accepts "100.00". If it strictly wants integer, it might be 10000 for 100.00.
      // Let's try sending as integer string of the main unit if it rejects decimal, OR minor units.
      // Given "Param data[price] must be an integer", let's try sending standard integer (no decimals).
      // If 7449.00 failed, maybe it wants 7449?

      // Update: User reported 2249 became 22.49. This confirms Meta is interpreting the integer as CENTS.
      // So we must multiply by 100 to send cents.
      const formattedPrice = Math.round(originalPrice * 100);
      const formattedSalePrice = salePrice ? Math.round(salePrice * 100) : null;

      const data: any = {
        name: product.name,
        description: product.description || '',
        url: `https://hayafitintima.shop/product/${product.slug}`,
        image_url: product.images && product.images.length > 0 ? product.images[0] : '',
        availability: product.stock_quantity > 0 ? 'in stock' : 'out of stock',
        condition: 'new',
        price: formattedPrice,
        currency: 'PKR',
        brand: 'HayaFit Intima',
        category: product.categories?.name || 'General',
      };

      if (formattedSalePrice) {
        data.sale_price = formattedSalePrice;
      }

      return {
        method: 'CREATE', // CREATE acts as upsert
        retailer_id: product.id,
        data: data,
      };
    });

    console.log('Sending batch request to Meta Catalog API...');
    console.log(`Catalog ID: ${metaCatalogId}`);

    // Log payload for debugging
    // console.log('Payload:', JSON.stringify(requests, null, 2)); 

    const formData = new URLSearchParams();
    formData.append('requests', JSON.stringify(requests));
    formData.append('access_token', metaAccessToken);

    const metaResponse = await fetch(
      `https://graph.facebook.com/v21.0/${metaCatalogId}/batch`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    const responseText = await metaResponse.text();
    console.log('Meta API Response:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse Meta API response:', e);
      throw new Error(`Invalid response from Meta API: ${responseText}`);
    }

    if (!metaResponse.ok) {
      console.error('Meta API Error:', result);
      throw new Error(result.error?.message || 'Failed to sync with Meta Catalog');
    }

    // Check for specific item errors in the batch response
    if (result.validation_status && result.validation_status.length > 0) {
      console.log('Validation Status:', JSON.stringify(result.validation_status, null, 2));
    }

    const successCount = result.handles?.length || requests.length;
    console.log(`Successfully synced ${successCount} products`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${successCount} products to Meta Catalog`,
        synced: successCount,
        total: products.length,
        details: result // Return full details for debugging
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in sync-meta-catalog:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Category mapping to Google Product Taxonomy
const categoryMap: Record<string, string> = {
  "Home & Kitchen": "632",
  "Electronics": "222",
  "Clothing": "166",
  "Beauty": "469",
  "Sports": "499",
  "Toys": "1253",
  "Books": "783",
  "Jewelry": "188",
  "Furniture": "436",
  "Office": "922",
};

const getGoogleCategory = (categoryName: string | null): string => {
  if (!categoryName) return "632"; // Default: Home & Garden
  return categoryMap[categoryName] || "632";
};

const escapeCsvField = (field: any): string => {
  if (field === null || field === undefined) return '';
  const stringField = String(field);
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching products and sales for TikTok feed...');

    // Fetch products and active sales
    const [productsResponse, salesResponse] = await Promise.all([
      supabase
        .from('products')
        .select(`
          *,
          categories(name),
          product_sizes(name),
          product_colors(name)
        `)
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

    console.log(`Found ${products?.length || 0} products and ${sales.length} active sales`);

    const storeDomain = "hayafitintima.shop";
    const brandName = "HayaFit Intima";
    const currency = "PKR";

    // TikTok Catalog CSV Headers (Standard 45 columns)
    const headers = [
      'sku_id',
      'title',
      'description',
      'availability',
      'condition',
      'price',
      'link',
      'image_link',
      'brand',
      'google_product_category',
      'product_type',
      'item_group_id',
      'size',
      'color',
      'gender',
      'age_group',
      'material',
      'pattern',
      'sale_price',
      'additional_image_link',
      'custom_label_0',
      'custom_label_1',
      'custom_label_2',
      'custom_label_3',
      'custom_label_4',
      'shipping',
      'tax',
      'shipping_weight',
      'shipping_height',
      'shipping_width',
      'shipping_length',
      'shipping_label',
      'multipack',
      'is_bundle',
      'adult',
      'identifier_exists',
      'gtin',
      'mpn',
      'ios_url',
      'ios_app_store_id',
      'ios_app_name',
      'android_url',
      'android_package',
      'android_app_name',
      'fb_product_category'
    ];

    // Generate CSV rows
    const rows = products?.map((product: any) => {
      const categoryName = product.categories?.name || '';
      const availability = (product.stock_quantity || 0) > 0 ? 'in stock' : 'out of stock';
      const productUrl = `https://hayafitintima.shop/product/${product.slug}`;
      const mainImage = product.images?.[0] || '';
      const additionalImages = product.images?.slice(1, 4).join(',') || '';

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

      const formattedSalePrice = salePrice ? `${Math.round(salePrice)} ${currency}` : '';

      // Get sizes and colors as comma-separated strings
      const sizes = product.product_sizes?.map((s: any) => s.name).join(',') || '';
      const colors = product.product_colors?.map((c: any) => c.name).join(',') || '';

      // Clean description
      const cleanDescription = (product.description || '')
        .replace(/[\t\n\r]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 5000); // TikTok limit is higher than 500

      // Clean title
      const cleanTitle = (product.name || '')
        .replace(/[\t\n\r]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return [
        product.id, // sku_id
        cleanTitle, // title
        cleanDescription, // description
        availability, // availability
        'new', // condition
        `${product.price} ${currency}`, // price
        productUrl, // link
        mainImage, // image_link
        brandName, // brand
        getGoogleCategory(categoryName), // google_product_category
        categoryName, // product_type
        product.id, // item_group_id (using same as ID for now as we aren't exploding variants)
        sizes, // size
        colors, // color
        'female', // gender (assuming based on store type, or make dynamic)
        'adult', // age_group
        '', // material
        '', // pattern
        formattedSalePrice, // sale_price
        additionalImages, // additional_image_link
        '', // custom_label_0
        '', // custom_label_1
        '', // custom_label_2
        '', // custom_label_3
        '', // custom_label_4
        '', // shipping
        '', // tax
        product.weight_kg ? `${product.weight_kg} kg` : '', // shipping_weight
        '', // shipping_height
        '', // shipping_width
        '', // shipping_length
        '', // shipping_label
        '', // multipack
        '', // is_bundle
        'no', // adult
        'no', // identifier_exists
        '', // gtin
        '', // mpn
        '', // ios_url
        '', // ios_app_store_id
        '', // ios_app_name
        '', // android_url
        '', // android_package
        '', // android_app_name
        ''  // fb_product_category
      ].map(escapeCsvField).join(',');
    }) || [];

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');

    console.log(`Generated CSV feed with ${rows.length} products`);

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="tiktok-catalog-feed-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error: any) {
    console.error('Error generating TikTok feed:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

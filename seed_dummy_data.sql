-- Seed Data for HayaFit Intima Store

-- Insert Categories
WITH inserted_categories AS (
  INSERT INTO public.categories (name, slug, description, image_url, meta_title, meta_description, focus_keywords)
  VALUES 
    (
      'Lingerie', 
      'lingerie', 
      'Elegant and comfortable lingerie for every occasion.', 
      'https://images.unsplash.com/photo-1596472537359-98f30452126f?auto=format&fit=crop&w=800&q=80',
      'Shop Premium Lingerie | HayaFit Intima',
      'Discover our collection of premium lingerie. Comfort meets elegance.',
      ARRAY['lingerie', 'underwear', 'bra', 'panties']
    ),
    (
      'Sleepwear', 
      'sleepwear', 
      'Cozy and stylish sleepwear for a perfect night''s rest.', 
      'https://images.unsplash.com/photo-1518544866330-527142b3d792?auto=format&fit=crop&w=800&q=80',
      'Women''s Sleepwear & Pajamas | HayaFit Intima',
      'Shop our range of comfortable sleepwear and pajamas.',
      ARRAY['sleepwear', 'pajamas', 'nightwear']
    ),
    (
      'Activewear', 
      'activewear', 
      'High-performance activewear for your fitness journey.', 
      'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=800&q=80',
      'Women''s Activewear | HayaFit Intima',
      'Stylish and functional activewear for yoga, gym, and running.',
      ARRAY['activewear', 'gym clothes', 'yoga pants', 'sports bra']
    )
  RETURNING id, slug
)
-- Insert Products
INSERT INTO public.products (
  name, 
  slug, 
  description, 
  price, 
  category_id, 
  images, 
  sku, 
  stock_quantity, 
  is_featured, 
  shipping_cost, 
  weight_kg,
  meta_title,
  meta_description,
  focus_keywords
)
VALUES 
  -- Product 1: Lace Bralette Set (Lingerie)
  (
    'Lace Bralette Set',
    'lace-bralette-set',
    'A stunning lace bralette set featuring delicate floral patterns and adjustable straps for the perfect fit. Soft, breathable fabric ensures all-day comfort.',
    45.00,
    (SELECT id FROM inserted_categories WHERE slug = 'lingerie'),
    ARRAY['https://images.unsplash.com/photo-1616150638538-23b472277b3b?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1596472537359-98f30452126f?auto=format&fit=crop&w=800&q=80'],
    'LIN-001',
    50,
    true,
    5.00,
    0.2,
    'Lace Bralette Set - Black | HayaFit Intima',
    'Shop our Lace Bralette Set. Elegant design with premium comfort.',
    ARRAY['bralette', 'lace lingerie', 'black lingerie']
  ),
  -- Product 2: Silk Pajama Set (Sleepwear)
  (
    'Silk Pajama Set',
    'silk-pajama-set',
    'Luxurious 100% silk pajama set in a classic button-down style. Smooth against the skin, temperature regulating, and incredibly chic.',
    89.99,
    (SELECT id FROM inserted_categories WHERE slug = 'sleepwear'),
    ARRAY['https://images.unsplash.com/photo-1595991209266-5c11d8526331?auto=format&fit=crop&w=800&q=80'],
    'SLP-001',
    30,
    true,
    0.00,
    0.4,
    'Luxury Silk Pajama Set | HayaFit Intima',
    'Experience luxury with our Silk Pajama Set. Perfect for lounging.',
    ARRAY['silk pajamas', 'luxury sleepwear', 'loungewear']
  ),
  -- Product 3: Seamless Yoga Leggings (Activewear)
  (
    'Seamless Yoga Leggings',
    'seamless-yoga-leggings',
    'High-waisted seamless leggings designed for maximum flexibility and support. Moisture-wicking fabric keeps you dry during intense workouts.',
    35.50,
    (SELECT id FROM inserted_categories WHERE slug = 'activewear'),
    ARRAY['https://images.unsplash.com/photo-1506619216599-9d16d0903dfd?auto=format&fit=crop&w=800&q=80'],
    'ACT-001',
    100,
    false,
    5.00,
    0.3,
    'Seamless Yoga Leggings | HayaFit Intima',
    'Best seamless yoga leggings for comfort and performance.',
    ARRAY['yoga leggings', 'gym tights', 'activewear']
  ),
  -- Product 4: Satin Robe (Lingerie)
  (
    'Satin Robe',
    'satin-robe',
    'A silky smooth satin robe with a tie waist and kimono sleeves. The perfect cover-up for your morning routine or evening relaxation.',
    55.00,
    (SELECT id FROM inserted_categories WHERE slug = 'lingerie'),
    ARRAY['https://images.unsplash.com/photo-1582719188393-bb71ca45dbb9?auto=format&fit=crop&w=800&q=80'],
    'LIN-002',
    40,
    false,
    5.00,
    0.3,
    'Classic Satin Robe | HayaFit Intima',
    'Wrap yourself in elegance with our Classic Satin Robe.',
    ARRAY['satin robe', 'kimono robe', 'loungewear']
  );

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Minus, Plus, ShoppingCart, X, Star, ShieldCheck, Truck, Banknote, Package } from "lucide-react";
import { addToGuestCart } from "@/lib/cartUtils";
import { formatPrice } from "@/lib/currency";
import { LoadingScreen } from "@/components/LoadingScreen";
import { calculateSalePrice } from "@/lib/saleUtils";
import { Badge } from "@/components/ui/badge";
import { trackAddToCart as trackMetaAddToCart } from "@/lib/metaPixel";
import { trackViewContent, trackAddToCart as trackTikTokAddToCart } from "@/lib/tiktokPixel";
import { trackEvent } from "@/hooks/useAnalytics";
import { SEOHead } from "@/components/SEOHead";
import { organizationSchema, productSchema, breadcrumbSchema } from "@/lib/structuredData";
import ProductReviews from "@/components/ProductReviews";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent } from "@/components/ui/dialog";


const ProductDetail = ({ key }: { key?: string }) => {
  const { slug } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [zoomDialogOpen, setZoomDialogOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Simulate real-time activity for social proof
  const [recentPurchases] = useState(() => Math.floor(Math.random() * 24) + 6); // 6-29 purchases

  // Reset component state when slug changes
  useEffect(() => {
    setQuantity(1);
    setSelectedImageIndex(0);
    setSelectedVariation(null);
    setSelectedColor(null);
    setSelectedSize(null);

    // Invalidate all queries to ensure fresh data
    queryClient.invalidateQueries({ queryKey: ['product', slug] });
    queryClient.invalidateQueries({ queryKey: ['product-variations'] });
    queryClient.invalidateQueries({ queryKey: ['product-colors'] });
    queryClient.invalidateQueries({ queryKey: ['product-sizes'] });
    queryClient.invalidateQueries({ queryKey: ['related-products'] });
  }, [slug, queryClient]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Handle sticky bar on scroll
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, categories(*)").eq("slug", slug).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: sales } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .eq("is_active", true)
        .gt("end_date", new Date().toISOString());
      if (error) throw error;
      return data;
    },
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ["related-products", product?.category_id],
    queryFn: async () => {
      if (!product?.category_id) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(*)")
        .eq("category_id", product.category_id)
        .neq("id", product.id)
        .limit(4);
      if (error) throw error;
      return data;
    },
    enabled: !!product,
  });

  const { data: variations } = useQuery({
    queryKey: ["product-variations", product?.id],
    queryFn: async () => {
      if (!product?.id) return [];
      const { data, error } = await supabase
        .from("product_variations")
        .select("*")
        .eq("product_id", product.id)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!product,
  });

  const { data: colors } = useQuery({
    queryKey: ["product-colors", product?.id],
    queryFn: async () => {
      if (!product?.id) return [];
      const { data, error } = await supabase
        .from("product_colors")
        .select("*")
        .eq("product_id", product.id)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!product,
  });

  const { data: sizes } = useQuery({
    queryKey: ["product-sizes", product?.id],
    queryFn: async () => {
      if (!product?.id) return [];
      const { data, error } = await supabase
        .from("product_sizes")
        .select("*")
        .eq("product_id", product.id)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!product,
  });

  // Set first variation as default when variations load
  useEffect(() => {
    if (variations && variations.length > 0 && !selectedVariation) {
      setSelectedVariation(variations[0]);
    }
  }, [variations, selectedVariation]);

  // Set first color as default when colors load
  useEffect(() => {
    if (colors && colors.length > 0 && !selectedColor) {
      setSelectedColor(colors[0]);
    }
  }, [colors, selectedColor]);

  // Set first size as default when sizes load
  useEffect(() => {
    if (sizes && sizes.length > 0 && !selectedSize) {
      setSelectedSize(sizes[0]);
    }
  }, [sizes, selectedSize]);

  const addToCart = useMutation({
    mutationFn: async () => {
      // Check stock availability
      if (selectedColor && selectedColor.quantity < quantity) {
        throw new Error(`Only ${selectedColor.quantity} items available in stock`);
      }
      if (selectedVariation && !selectedColor && selectedVariation.quantity < quantity) {
        throw new Error(`Only ${selectedVariation.quantity} items available in stock`);
      }
      if (selectedSize && !selectedColor && !selectedVariation && selectedSize.quantity < quantity) {
        throw new Error(`Only ${selectedSize.quantity} items available in stock`);
      }

      // Determine the price to use (color > variation > size > product)
      const priceToUse = selectedColor
        ? selectedColor.price
        : selectedVariation
          ? selectedVariation.price
          : selectedSize
            ? selectedSize.price
            : product.price;

      if (user) {
        // Check if item already exists in cart (considering both variation and color)
        const { data: existingItems } = await supabase
          .from("cart_items")
          .select("*")
          .eq("user_id", user.id)
          .eq("product_id", product.id);

        let existingItem = null;
        if (existingItems && existingItems.length > 0) {
          // Find exact match including variation, color, and size
          existingItem = existingItems.find(item =>
            item.variation_id === (selectedVariation?.id || null) &&
            item.color_id === (selectedColor?.id || null) &&
            item.size_id === (selectedSize?.id || null)
          );
        }

        if (existingItem) {
          // Update quantity of existing item
          const { error } = await supabase
            .from("cart_items")
            .update({ quantity: existingItem.quantity + quantity })
            .eq("id", existingItem.id);
          if (error) throw error;
        } else {
          // Insert new cart item
          const { error } = await supabase.from("cart_items").insert({
            user_id: user.id,
            product_id: product.id,
            quantity,
            variation_id: selectedVariation?.id || null,
            variation_name: selectedVariation?.name || null,
            variation_price: selectedVariation?.price || null,
            color_id: selectedColor?.id || null,
            color_name: selectedColor?.name || null,
            color_code: selectedColor?.color_code || null,
            color_price: selectedColor?.price || null,
            size_id: selectedSize?.id || null,
            size_name: selectedSize?.name || null,
            size_price: selectedSize?.price || null,
          });
          if (error) throw error;
        }
      } else {
        // Guest cart
        addToGuestCart({
          product_id: product.id,
          quantity,
          product_name: product.name,
          product_price: product.price,
          product_image: product.images?.[0],
          variation_id: selectedVariation?.id || null,
          variation_name: selectedVariation?.name || null,
          variation_price: selectedVariation?.price || null,
          color_id: selectedColor?.id || null,
          color_name: selectedColor?.name || null,
          color_code: selectedColor?.color_code || null,
          color_price: (selectedColor?.price && parseFloat(selectedColor.price) > 0)
            ? parseFloat(selectedColor.price)
            : null,
          size_id: selectedSize?.id || null,
          size_name: selectedSize?.name || null,
          size_price: (selectedSize?.price && parseFloat(selectedSize.price) > 0)
            ? parseFloat(selectedSize.price)
            : null,
          shipping_cost: product.shipping_cost,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });

      // Calculate sale price for tracking (use color > variation > size > product price)
      const basePrice = (selectedColor?.price && parseFloat(selectedColor.price) > 0)
        ? parseFloat(selectedColor.price)
        : selectedVariation
          ? selectedVariation.price
          : selectedSize
            ? selectedSize.price
            : product.price;
      const productSale = sales?.find((s) => s.product_id === product.id);
      const globalSale = sales?.find((s) => s.is_global);
      const { finalPrice } = calculateSalePrice(basePrice, productSale, globalSale);

      // Track Meta Pixel AddToCart event
      trackMetaAddToCart(product.id, product.name, basePrice);

      // Track TikTok Pixel AddToCart event
      trackTikTokAddToCart(product.id, product.name, finalPrice);

      // Track analytics event
      trackEvent('add_to_cart', {
        product_id: product.id,
        product_name: product.name,
        price: finalPrice,
        quantity,
        variation_id: selectedVariation?.id,
        variation_name: selectedVariation?.name,
        color_id: selectedColor?.id,
        color_name: selectedColor?.name,
        size_id: selectedSize?.id,
        size_name: selectedSize?.name,
      });

      toast({
        title: "Added to cart",
        description: "Product has been added to your cart.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBuyNow = async () => {
    await addToCart.mutateAsync();
    // Wait for cart to be refetched before navigating
    await queryClient.refetchQueries({ queryKey: ["cart"] });
    navigate("/checkout");
  };

  // Calculate sale price (needed for tracking)
  // Use color price if selected and has value, otherwise variation price, otherwise size price, otherwise product price
  const displayPrice = (selectedColor?.price && parseFloat(selectedColor.price) > 0)
    ? parseFloat(selectedColor.price)
    : selectedVariation
      ? selectedVariation.price
      : selectedSize
        ? selectedSize.price
        : product?.price || 0;
  const productSale = sales?.find((s) => s.product_id === product?.id);
  const globalSale = sales?.find((s) => s.is_global);
  const applySaleToItem = selectedColor
    ? selectedColor.apply_sale !== false
    : selectedVariation
      ? selectedVariation.apply_sale !== false
      : selectedSize
        ? selectedSize.apply_sale !== false
        : true;
  const { finalPrice, discount } = calculateSalePrice(displayPrice, productSale, globalSale, applySaleToItem);

  // Calculate total price (finalPrice * quantity)
  const totalPrice = finalPrice * quantity;

  // Track TikTok Pixel ViewContent event when product loads
  useEffect(() => {
    if (product) {
      trackViewContent(product.id, product.name, finalPrice);
    }
  }, [product, finalPrice]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <LoadingScreen message="Loading product details..." />
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Product not found</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Keep product images separate from banner images
  const productImages = product.images || [];

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      organizationSchema,
      productSchema({
        name: product.name,
        description: product.description || product.name,
        price: finalPrice,
        images: productImages,
        sku: product.sku,
        stock_quantity: product.stock_quantity,
      }),
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Shop", url: "/shop" },
        ...(product.categories
          ? [{ name: product.categories.name, url: `/shop?category=${product.categories.slug}` }]
          : []),
        { name: product.name, url: `/product/${product.slug}` },
      ]),
    ],
  };

  return (
    <>
      <SEOHead
        title={product.meta_title || `${product.name} | Buy Online at HayaFit Intima`}
        description={
          product.meta_description ||
          `Buy ${product.name} online in Pakistan. Premium quality intimate wear at HayaFit Intima with fast delivery.`
        }
        keywords={product.focus_keywords || [product.name, product.categories?.name || "", "buy online Pakistan", "intimate wear"]}
        canonicalUrl={`https://hayafitintima.com/product/${product.slug}`}
        ogImage={productImages[0]}
        ogType="product"
        structuredData={structuredData}
      />

      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />

        <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left Column: Media Gallery */}
            <div className="lg:col-span-7 space-y-6">
              {/* Main Image/Carousel */}
              <div className="relative rounded-xl overflow-hidden bg-secondary/10 border border-border/50 shadow-sm group animate-in fade-in slide-in-from-bottom-4 duration-700">
                {product.is_video && product.video_url ? (
                  <video
                    src={product.video_url}
                    className="w-full h-full object-cover aspect-[4/5] md:aspect-square lg:aspect-[4/5]"
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <Carousel className="w-full" setApi={(api) => {
                    api?.on("select", () => {
                      setSelectedImageIndex(api.selectedScrollSnap());
                    });
                  }}>
                    <CarouselContent>
                      {productImages.map((img: string, index: number) => (
                        <CarouselItem key={index}>
                          <div
                            className="relative aspect-[4/5] md:aspect-square lg:aspect-[4/5] cursor-zoom-in overflow-hidden flex items-center justify-center bg-secondary/5"
                            onClick={() => setZoomDialogOpen(true)}
                          >
                            <img
                              src={img}
                              alt={`${product.name} - View ${index + 1}`}
                              className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CarouselNext className="right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Carousel>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                  {discount && (
                    <Badge className="bg-destructive text-destructive-foreground rounded-none px-3 py-1 text-sm font-bold shadow-md">
                      -{discount}% OFF
                    </Badge>
                  )}
                  {product.stock_quantity > 0 && product.stock_quantity < 5 && (
                    <Badge className="bg-orange-500 text-white rounded-none px-3 py-1 text-sm font-bold shadow-md">
                      Low Stock
                    </Badge>
                  )}
                </div>
              </div>

              {/* Thumbnails */}
              {productImages.length > 1 && (
                <div className="grid grid-cols-5 gap-3">
                  {productImages.map((img: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === index
                        ? "border-primary ring-1 ring-primary ring-offset-1"
                        : "border-transparent hover:border-primary/50"
                        }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Product Info */}
            <div className="lg:col-span-5 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              <div className="sticky top-24 space-y-8">
                {/* Header */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      {product.categories && (
                        <Link
                          to={`/shop?category=${product.categories.slug}`}
                          className="text-sm text-primary font-medium hover:underline mb-2 block"
                        >
                          {product.categories.name}
                        </Link>
                      )}
                      <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                        {product.name}
                      </h1>
                    </div>
                  </div>

                  {/* Reviews Summary Placeholder */}
                  <div className="flex items-center gap-2">
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">(4.8/5 based on {recentPurchases} reviews)</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl md:text-4xl font-bold text-primary">
                      {formatPrice(finalPrice * quantity)}
                    </span>
                    {discount && (
                      <span className="text-xl text-muted-foreground line-through decoration-destructive/30">
                        {formatPrice(displayPrice * quantity)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                {/* Selectors */}
                <div className="space-y-6">
                  {/* Variations */}
                  {variations && variations.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-foreground">
                          Select Size / Variation
                        </label>
                        <Button
                          variant="link"
                          className="h-auto p-0 text-xs text-primary"
                          onClick={() => setSizeGuideOpen(true)}
                        >
                          Size Guide
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {variations.map((v: any) => (
                          <button
                            key={v.id}
                            onClick={() => {
                              setSelectedVariation(v);
                            }}
                            className={`min-w-[4rem] px-4 py-2 text-sm border rounded-sm transition-all ${selectedVariation?.id === v.id
                              ? "border-primary bg-primary text-primary-foreground shadow-md"
                              : "border-input hover:border-primary/50 hover:bg-accent"
                              }`}
                          >
                            {v.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sizes */}
                  {sizes && sizes.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-foreground">
                        Select Size
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {sizes.map((s: any) => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setSelectedSize(s);
                            }}
                            className={`min-w-[3rem] px-3 py-2 text-sm border rounded-sm transition-all ${selectedSize?.id === s.id
                              ? "border-primary bg-primary text-primary-foreground shadow-md"
                              : "border-input hover:border-primary/50 hover:bg-accent"
                              }`}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Colors */}
                  {colors && colors.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-foreground">
                        Select Color: <span className="font-normal text-muted-foreground">{selectedColor?.name}</span>
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {colors.map((c: any) => (
                          <button
                            key={c.id}
                            onClick={() => setSelectedColor(c)}
                            className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor?.id === c.id
                              ? "border-primary ring-1 ring-primary ring-offset-2 scale-110"
                              : "border-transparent hover:scale-105"
                              }`}
                            style={{ backgroundColor: c.color_code }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground">Quantity</label>
                    <div className="flex items-center w-32 border rounded-sm bg-background">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-none"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="flex-1 text-center font-medium">{quantity}</div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-none"
                        onClick={() => {
                          const maxQty = selectedColor
                            ? selectedColor.quantity
                            : selectedVariation
                              ? selectedVariation.quantity
                              : (product.stock_quantity || 99);
                          setQuantity(Math.min(maxQty, quantity + 1));
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-4">
                  <Button
                    className="w-full h-14 text-lg uppercase tracking-widest font-bold rounded-sm shadow-lg btn-liquid-primary"
                    onClick={handleBuyNow}
                    disabled={
                      addToCart.isPending ||
                      (selectedColor ? selectedColor.quantity === 0 :
                        selectedVariation ? selectedVariation.quantity === 0 :
                          selectedSize ? selectedSize.quantity === 0 :
                            product.stock_quantity === 0)
                    }
                  >
                    Buy Now
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-14 text-lg uppercase tracking-widest font-bold rounded-sm border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                    onClick={() => addToCart.mutate()}
                    disabled={
                      addToCart.isPending ||
                      (selectedColor ? selectedColor.quantity === 0 :
                        selectedVariation ? selectedVariation.quantity === 0 :
                          selectedSize ? selectedSize.quantity === 0 :
                            product.stock_quantity === 0)
                    }
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Add to Cart
                  </Button>
                </div>

                {/* Trust Signals */}
                <div className="grid grid-cols-3 gap-4 pt-6">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-primary">
                      <Truck className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium">Free Delivery</span>
                  </div>
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-primary">
                      <Banknote className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium">Cash on Delivery</span>
                  </div>
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-primary">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium">Privacy Assured</span>
                  </div>
                </div>

                {/* Description */}
                <div className="pt-6 space-y-4">
                  <h3 className="font-display text-xl font-semibold">About this item</h3>
                  <div
                    className="prose prose-sm text-muted-foreground leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: product.description || product.name }}
                  />
                </div>

                {/* FAQ Accordion */}
                <div className="pt-6">
                  <h3 className="font-display text-xl font-semibold mb-4">Common Questions</h3>
                  <div className="space-y-2">
                    <details className="group border rounded-lg px-4 py-2">
                      <summary className="flex justify-between items-center cursor-pointer list-none font-medium text-sm py-2">
                        <span>🚚 What are the delivery charges?</span>
                        <span className="transition group-open:rotate-180">▼</span>
                      </summary>
                      <p className="text-sm text-muted-foreground mt-2 pb-2">
                        We offer FREE delivery all across Pakistan. No hidden charges!
                      </p>
                    </details>
                    <details className="group border rounded-lg px-4 py-2">
                      <summary className="flex justify-between items-center cursor-pointer list-none font-medium text-sm py-2">
                        <span>💳 What payment methods do you accept?</span>
                        <span className="transition group-open:rotate-180">▼</span>
                      </summary>
                      <p className="text-sm text-muted-foreground mt-2 pb-2">
                        We accept Cash on Delivery (COD) and online bank transfers.
                      </p>
                    </details>
                    <details className="group border rounded-lg px-4 py-2">
                      <summary className="flex justify-between items-center cursor-pointer list-none font-medium text-sm py-2">
                        <span>🔄 Return Policy?</span>
                        <span className="transition group-open:rotate-180">▼</span>
                      </summary>
                      <p className="text-sm text-muted-foreground mt-2 pb-2">
                        7-day easy return policy. Full refund if not satisfied.
                      </p>
                    </details>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Banner Images */}
          {product.banner_image && product.banner_image.length > 0 && (
            <div className="mt-16 space-y-6">
              {product.banner_image.map((banner: string, index: number) => (
                <div key={index} className="w-full rounded-xl overflow-hidden shadow-lg">
                  <img
                    src={banner}
                    alt={`${product.name} banner ${index + 1}`}
                    className="w-full h-auto object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Reviews */}
          <div className="mt-16">
            <ProductReviews productId={product.id} />
          </div>

          {/* Related Products */}
          {relatedProducts && relatedProducts.length > 0 && (
            <div className="mt-16">
              <div className="text-center mb-10">
                <h2 className="font-display text-3xl font-bold mb-3">You May Also Like</h2>
                <p className="text-muted-foreground">Curated picks just for you</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct: any) => {
                  const relatedProductSale = sales?.find((s) => s.product_id === relatedProduct.id);
                  const relatedGlobalSale = sales?.find((s) => s.is_global);
                  const { finalPrice: relatedFinalPrice, discount: relatedDiscount } = calculateSalePrice(
                    relatedProduct.price,
                    relatedProductSale,
                    relatedGlobalSale,
                  );

                  return (
                    <Card
                      key={relatedProduct.id}
                      className="group overflow-hidden rounded-xl border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer"
                    >
                      <Link to={`/product/${relatedProduct.slug}`}>
                        <div className="aspect-[4/5] relative overflow-hidden bg-secondary/10">
                          {relatedDiscount && (
                            <Badge className="absolute top-2 left-2 z-10 bg-destructive text-white font-bold">
                              -{relatedDiscount}%
                            </Badge>
                          )}
                          {relatedProduct.images?.[0] && (
                            <img
                              src={relatedProduct.images[0]}
                              alt={relatedProduct.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-display font-semibold truncate mb-2">{relatedProduct.name}</h3>
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-primary">{formatPrice(relatedFinalPrice)}</span>
                            {relatedDiscount && (
                              <span className="text-xs text-muted-foreground line-through">
                                {formatPrice(relatedProduct.price)}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

        </main>
        <Footer />
      </div>

      {/* Image Zoom Dialog */}
      <Dialog open={zoomDialogOpen} onOpenChange={setZoomDialogOpen}>
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
          <div className="relative w-full h-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 z-50 rounded-full bg-background/80 hover:bg-background text-foreground"
              onClick={() => setZoomDialogOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            {product.images && product.images[selectedImageIndex] && (
              <img
                src={product.images[selectedImageIndex]}
                alt={`${product.name} zoom`}
                className="w-auto h-auto max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Size Guide Dialog */}
      <Dialog open={sizeGuideOpen} onOpenChange={setSizeGuideOpen}>
        <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
          <div className="relative w-full h-full flex flex-col">
            <div className="p-4 border-b flex items-center justify-between bg-secondary/10">
              <h3 className="font-display text-lg font-bold">Size Guide</h3>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-background/80"
                onClick={() => setSizeGuideOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[80vh]">
              <img
                src="/size-guide-chart.png"
                alt="Size Guide Chart"
                className="w-full h-auto object-contain rounded-md"
              />
              <div className="mt-6 space-y-4 text-sm text-muted-foreground">
                <h4 className="font-semibold text-foreground">How to Measure</h4>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Bust:</strong> Measure around the fullest part of your bust.</li>
                  <li><strong>Waist:</strong> Measure around your natural waistline, keeping the tape comfortably loose.</li>
                  <li><strong>Hips:</strong> Measure around the fullest part of your hips.</li>
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sticky Mobile Bar */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom duration-300 md:hidden pb-safe">
          <div className="p-3 flex items-center gap-2 max-w-full overflow-hidden">
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className="text-xs font-medium truncate w-full">{product.name}</p>
              <p className="text-base font-bold text-primary leading-tight">{formatPrice(finalPrice)}</p>
            </div>
            <Button
              className="flex-none px-6 btn-liquid-primary font-bold shadow-lg text-sm h-10"
              onClick={handleBuyNow}
            >
              Buy Now
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductDetail;

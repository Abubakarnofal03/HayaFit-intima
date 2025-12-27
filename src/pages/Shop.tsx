import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Star, SlidersHorizontal, Grid3x3, List } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { addToGuestCart } from "@/lib/cartUtils";
import { formatPrice } from "@/lib/currency";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/SEOHead";
import { organizationSchema, breadcrumbSchema } from "@/lib/structuredData";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { calculateSalePrice } from "@/lib/saleUtils";
import { trackAddToCart } from "@/lib/metaPixel";
import { trackEvent } from "@/hooks/useAnalytics";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 10;

const Shop = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedCategory = searchParams.get("category");
    const [minPrice, setMinPrice] = useState("0");
    const [maxPrice, setMaxPrice] = useState("50000");
    const [debouncedMinPrice, setDebouncedMinPrice] = useState("0");
    const [debouncedMaxPrice, setDebouncedMaxPrice] = useState("50000");
    const [user, setUser] = useState<any>(null);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Debounce price changes
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedMinPrice(minPrice);
            setDebouncedMaxPrice(maxPrice);
        }, 500); // Wait 500ms after user stops typing

        return () => clearTimeout(timer);
    }, [minPrice, maxPrice]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });
    }, []);

    const { data: categories, isLoading: categoriesLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');
            if (error) throw error;
            return data;
        },
    });

    const { data: sales } = useQuery({
        queryKey: ['sales'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('sales')
                .select('*')
                .eq('is_active', true)
                .gt('end_date', new Date().toISOString());
            if (error) throw error;
            return data;
        },
    });

    const { data: productsData, isLoading: productsLoading } = useQuery({
        queryKey: ['products', selectedCategory, debouncedMinPrice, debouncedMaxPrice, currentPage],
        queryFn: async () => {
            let query = supabase
                .from('products')
                .select('*, categories(*)', { count: 'exact' })
                .gte('price', parseFloat(debouncedMinPrice))
                .lte('price', parseFloat(debouncedMaxPrice));

            if (selectedCategory) {
                const category = categories?.find(c => c.slug === selectedCategory);
                if (category) {
                    query = query.eq('category_id', category.id);
                }
            }

            const from = (currentPage - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            const { data, error, count } = await query
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: false })
                .range(from, to);
            if (error) throw error;
            return { products: data, count };
        },
        enabled: !!categories,
    });

    // Fetch all product colors and sizes for display on cards
    const { data: allProductColors } = useQuery({
        queryKey: ['all-product-colors'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('product_colors')
                .select('id, product_id, name, color_code, sort_order')
                .order('sort_order');
            if (error) throw error;
            return data;
        },
    });

    const { data: allProductSizes } = useQuery({
        queryKey: ['all-product-sizes'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('product_sizes')
                .select('id, product_id, name, sort_order')
                .order('sort_order');
            if (error) throw error;
            return data;
        },
    });

    const products = productsData?.products;
    const totalCount = productsData?.count || 0;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, debouncedMinPrice, debouncedMaxPrice]);

    // Scroll to top when page changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    const addToCart = useMutation({
        mutationFn: async (product: any) => {
            if (!user) {
                addToGuestCart({
                    product_id: product.id,
                    quantity: 1,
                    product_name: product.name,
                    product_price: product.price,
                    product_image: product.images?.[0],
                });
                return product;
            }

            const { data: existingItem } = await supabase
                .from('cart_items')
                .select('*')
                .eq('user_id', user.id)
                .eq('product_id', product.id)
                .maybeSingle();

            if (existingItem) {
                const { error } = await supabase
                    .from('cart_items')
                    .update({ quantity: existingItem.quantity + 1 })
                    .eq('id', existingItem.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('cart_items')
                    .insert({
                        user_id: user.id,
                        product_id: product.id,
                        quantity: 1,
                    });
                if (error) throw error;
            }

            return product;
        },
        onSuccess: (product) => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });

            // Track Meta Pixel AddToCart event
            trackAddToCart(product.id, product.name, product.price);

            // Track analytics event
            trackEvent('add_to_cart', {
                product_id: product.id,
                product_name: product.name,
                price: product.price,
            });

            toast({
                title: "Added to cart",
                description: "Product has been added to your cart.",
            });
        },
    });

    const handleCategoryChange = (value: string) => {
        if (value === "all") {
            setSearchParams({});
        } else {
            setSearchParams({ category: value });
        }
    };

    const renderSkeletonLoader = () => (
        <section className="py-8 md:py-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
                    {/* Filters Sidebar Skeleton */}
                    <div className="lg:col-span-1 space-y-4 md:space-y-6">
                        <Card className="glass-card rounded-xl">
                            <CardContent className="p-4 md:p-6">
                                <Skeleton className="h-6 w-20 mb-4" />
                                <div className="space-y-4 md:space-y-6">
                                    <div>
                                        <Skeleton className="h-4 w-16 mb-3" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    <div>
                                        <Skeleton className="h-4 w-20 mb-3" />
                                        <div className="grid grid-cols-2 gap-2">
                                            <Skeleton className="h-16 w-full" />
                                            <Skeleton className="h-16 w-full" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Products Grid Skeleton */}
                    <div className="lg:col-span-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {[...Array(6)].map((_, index) => (
                                <Card key={index} className="glass-card overflow-hidden rounded-xl">
                                    <Skeleton className="aspect-square w-full" />
                                    <CardContent className="p-3 md:p-4 space-y-2">
                                        <Skeleton className="h-3 w-24" />
                                        <Skeleton className="h-5 w-full" />
                                        <Skeleton className="h-3 w-16" />
                                        <Skeleton className="h-6 w-28" />
                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                            <Skeleton className="h-8 w-full" />
                                            <Skeleton className="h-8 w-full" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );

    const isLoading = categoriesLoading || productsLoading;

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <section className="py-8 md:py-12 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <Skeleton className="h-12 w-64 mx-auto mb-4" />
                        <Skeleton className="h-4 w-96 mx-auto" />
                    </div>
                </section>
                {renderSkeletonLoader()}
                <Footer />
            </div>
        );
    }

    const selectedCategoryData = categories?.find(c => c.slug === selectedCategory);
    const pageTitle = selectedCategoryData
        ? `Shop ${selectedCategoryData.name} Online | HayaFit Intima`
        : "Shop All Products Online | HayaFit Intima";
    const pageDescription = selectedCategoryData
        ? `Browse premium ${selectedCategoryData.name.toLowerCase()} online in Pakistan. Quality products, fast delivery at hayafitintima.store`
        : "Discover premium home decor, wallets, accessories, and furniture at hayafitintima.store – fast delivery across Pakistan.";
    const pageKeywords = selectedCategoryData?.focus_keywords || [
        'online shopping Pakistan',
        'home decor',
        'wallets',
        'furniture',
        'accessories',
        'buy online Pakistan'
    ];

    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            organizationSchema,
            breadcrumbSchema([
                { name: "Home", url: "/" },
                { name: "Shop", url: "/shop" },
                ...(selectedCategoryData ? [{ name: selectedCategoryData.name, url: `/shop?category=${selectedCategory}` }] : [])
            ])
        ]
    };

    return (
        <>
            <SEOHead
                title={pageTitle}
                description={pageDescription}
                keywords={pageKeywords}
                canonicalUrl={selectedCategory ? `https://hayafitintima.store/shop?category=${selectedCategory}` : "https://hayafitintima.store/shop"}
                structuredData={structuredData}
            />

            <div className="min-h-screen flex flex-col">
                <Navbar />

                <main className="flex-1">
                    <section className="py-8 md:py-12 bg-muted/30">
                        <div className="container mx-auto px-4">
                            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-3 md:mb-4 gold-accent pb-6 md:pb-8">
                                Our Collection
                            </h1>
                            <p className="text-center text-muted-foreground max-w-2xl mx-auto text-sm md:text-base px-4">
                                Explore our curated selection of premium products
                            </p>
                        </div>
                    </section>

                    <section className="py-8 md:py-12">
                        <div className="container mx-auto px-4">
                            {/* Mobile Filter Button */}
                            <div className="lg:hidden mb-4">
                                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                                    <SheetTrigger asChild>
                                        <Button variant="outline" className="w-full">
                                            <SlidersHorizontal className="h-4 w-4 mr-2" />
                                            Filters
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left" className="w-[280px] sm:w-[350px]">
                                        <SheetHeader>
                                            <SheetTitle>Filter Products</SheetTitle>
                                        </SheetHeader>
                                        <div className="mt-6 space-y-6">
                                            <div>
                                                <label className="text-sm font-medium mb-3 block">Category</label>
                                                <Select value={selectedCategory || "all"} onValueChange={handleCategoryChange}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="All Categories" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Categories</SelectItem>
                                                        {categories?.map((category) => (
                                                            <SelectItem key={category.id} value={category.slug}>
                                                                {category.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium mb-3 block">
                                                    Price Range
                                                </label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <Label className="text-xs">Min</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={minPrice}
                                                            onChange={(e) => setMinPrice(e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Max</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={maxPrice}
                                                            onChange={(e) => setMaxPrice(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    Showing: {formatPrice(parseFloat(debouncedMinPrice))} - {formatPrice(parseFloat(debouncedMaxPrice))}
                                                </p>
                                            </div>

                                            <Button
                                                className="w-full"
                                                onClick={() => setMobileFiltersOpen(false)}
                                            >
                                                Apply Filters
                                            </Button>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
                                {/* Filters Sidebar - Desktop Only */}
                                <div className="hidden lg:block lg:col-span-1 space-y-4 md:space-y-6">
                                    <Card className="glass-card rounded-xl">
                                        <CardContent className="p-4 md:p-6">
                                            <h3 className="font-display text-base md:text-lg font-semibold mb-3 md:mb-4">Filters</h3>

                                            <div className="space-y-4 md:space-y-6">
                                                <div>
                                                    <label className="text-xs md:text-sm font-medium mb-2 md:mb-3 block">Category</label>
                                                    <Select value={selectedCategory || "all"} onValueChange={handleCategoryChange}>
                                                        <SelectTrigger className="w-full text-sm">
                                                            <SelectValue placeholder="All Categories" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">All Categories</SelectItem>
                                                            {categories?.map((category) => (
                                                                <SelectItem key={category.id} value={category.slug}>
                                                                    {category.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <label className="text-xs md:text-sm font-medium mb-2 md:mb-3 block">
                                                        Price Range
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <Label className="text-xs">Min</Label>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                value={minPrice}
                                                                onChange={(e) => setMinPrice(e.target.value)}
                                                                className="text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-xs">Max</Label>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                value={maxPrice}
                                                                onChange={(e) => setMaxPrice(e.target.value)}
                                                                className="text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        Showing: {formatPrice(parseFloat(debouncedMinPrice))} - {formatPrice(parseFloat(debouncedMaxPrice))}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Products Grid */}
                                <div className="col-span-1 lg:col-span-3">
                                    {/* Top Bar with View Toggle and Product Count */}
                                    <div className="flex items-center justify-between mb-6">
                                        <p className="text-sm text-muted-foreground font-medium">
                                            {totalCount} {totalCount === 1 ? 'product' : 'products'}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant={viewMode === 'grid' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setViewMode('grid')}
                                                className="h-9 w-9 p-0"
                                            >
                                                <Grid3x3 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant={viewMode === 'list' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setViewMode('list')}
                                                className="h-9 w-9 p-0"
                                            >
                                                <List className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {products?.length === 0 ? (
                                        <div className="text-center py-12">
                                            <p className="text-muted-foreground">No products found with the selected filters.</p>
                                        </div>
                                    ) : (
                                        <div className={`grid gap-4 md:gap-6 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                            {products?.map((product) => {
                                                const productSale = sales?.find(s => s.product_id === product.id);
                                                const globalSale = sales?.find(s => s.is_global);
                                                const { finalPrice, discount } = calculateSalePrice(product.price, productSale, globalSale);

                                                // Get colors and sizes for this product
                                                const productColors = allProductColors?.filter(c => c.product_id === product.id) || [];
                                                const productSizes = allProductSizes?.filter(s => s.product_id === product.id) || [];

                                                // Show first 3 colors, hide rest
                                                const displayedColors = productColors.slice(0, 3);
                                                const remainingColors = productColors.length - 3;

                                                return (
                                                    <Link key={product.id} to={`/product/${product.slug}`} className="block transition-all duration-300 active:scale-95">
                                                        <Card className="glass-card glass-hover overflow-hidden rounded-xl group relative cursor-pointer border-border/50">
                                                            {/* Elegant Discount Badge */}
                                                            {discount && (
                                                                <Badge className="absolute top-3 left-3 z-10 bg-rose-100 text-rose-700 border border-rose-200 shadow-sm rounded-sm px-2 py-0.5 text-xs font-semibold">
                                                                    {discount}% OFF
                                                                </Badge>
                                                            )}
                                                            {product.is_featured && !discount && (
                                                                <Badge className="absolute top-3 left-3 z-10 bg-accent/80 text-accent-foreground backdrop-blur-sm shadow-sm rounded-sm px-2 py-0.5 text-xs">
                                                                    <Star className="h-3 w-3 mr-1" fill="currentColor" />
                                                                    Featured
                                                                </Badge>
                                                            )}

                                                            {/* Product Image */}
                                                            <div className="aspect-square bg-muted/30 relative overflow-hidden">
                                                                {product.images?.[0] && (
                                                                    <img
                                                                        src={product.images[0]}
                                                                        alt={product.name}
                                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                                    />
                                                                )}
                                                            </div>

                                                            <CardContent className="p-4 space-y-3">
                                                                {/* Category */}
                                                                <p className="text-xs text-muted-foreground uppercase tracking-wide truncate">
                                                                    {product.categories?.name}
                                                                </p>

                                                                {/* Product Name */}
                                                                <h3 className="font-display text-base md:text-lg font-semibold line-clamp-2 leading-snug">
                                                                    {product.name}
                                                                </h3>

                                                                {/* Color Swatches */}
                                                                {productColors.length > 0 && (
                                                                    <div className="flex items-center gap-2 pt-1">
                                                                        {displayedColors.map((color) => (
                                                                            <div
                                                                                key={color.id}
                                                                                className="w-6 h-6 rounded-full border-2 border-border shadow-sm transition-transform hover:scale-110"
                                                                                style={{ backgroundColor: color.color_code }}
                                                                                title={color.name}
                                                                            />
                                                                        ))}
                                                                        {remainingColors > 0 && (
                                                                            <span className="text-xs text-muted-foreground ml-1">
                                                                                +{remainingColors} more
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Price */}
                                                                <div className="flex items-baseline gap-2">
                                                                    {discount ? (
                                                                        <>
                                                                            <p className="text-xl font-bold text-rose-600">
                                                                                {formatPrice(finalPrice)}
                                                                            </p>
                                                                            <p className="text-sm text-muted-foreground line-through">
                                                                                {formatPrice(product.price)}
                                                                            </p>
                                                                        </>
                                                                    ) : (
                                                                        <p className="text-xl font-bold text-foreground">
                                                                            {formatPrice(product.price)}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                {/* Sale Badge */}
                                                                {discount && (
                                                                    <Badge variant="outline" className="text-xs border-rose-200 text-rose-700 bg-rose-50">
                                                                        Sale
                                                                    </Badge>
                                                                )}

                                                                {/* Size Options */}
                                                                {productSizes.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                                                        {productSizes.slice(0, 5).map((size) => (
                                                                            <span
                                                                                key={size.id}
                                                                                className="px-2 py-0.5 text-xs border border-border rounded-sm bg-background/50"
                                                                            >
                                                                                {size.name}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {/* Stock Status */}
                                                                {product.stock_quantity !== undefined && product.stock_quantity < 10 && product.stock_quantity > 0 && (
                                                                    <p className="text-xs text-orange-500">
                                                                        Only {product.stock_quantity} left in stock!
                                                                    </p>
                                                                )}
                                                                {product.stock_quantity === 0 && (
                                                                    <p className="text-xs text-destructive">Out of stock</p>
                                                                )}

                                                                {/* Action Buttons */}
                                                                <div className="grid grid-cols-2 gap-2 pt-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            addToCart.mutate(product);
                                                                        }}
                                                                        disabled={addToCart.isPending || product.stock_quantity === 0}
                                                                        className="text-xs md:text-sm border-primary/30 hover:bg-primary/5"
                                                                    >
                                                                        <ShoppingCart className="h-3 w-3 md:h-4 md:w-4" />
                                                                    </Button>
                                                                    <Button size="sm" className="text-xs md:text-sm">
                                                                        View
                                                                    </Button>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Pagination */}
                                    {!isLoading && products && products.length > 0 && totalPages > 1 && (
                                        <div className="mt-8 flex justify-center">
                                            <Pagination>
                                                <PaginationContent>
                                                    <PaginationItem>
                                                        <PaginationPrevious
                                                            href="#"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (currentPage > 1) setCurrentPage(currentPage - 1);
                                                            }}
                                                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                                        />
                                                    </PaginationItem>

                                                    {[...Array(totalPages)].map((_, index) => {
                                                        const pageNumber = index + 1;

                                                        // Show first page, last page, current page, and pages around current
                                                        if (
                                                            pageNumber === 1 ||
                                                            pageNumber === totalPages ||
                                                            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                                        ) {
                                                            return (
                                                                <PaginationItem key={pageNumber}>
                                                                    <PaginationLink
                                                                        href="#"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            setCurrentPage(pageNumber);
                                                                        }}
                                                                        isActive={currentPage === pageNumber}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        {pageNumber}
                                                                    </PaginationLink>
                                                                </PaginationItem>
                                                            );
                                                        } else if (
                                                            pageNumber === currentPage - 2 ||
                                                            pageNumber === currentPage + 2
                                                        ) {
                                                            return (
                                                                <PaginationItem key={pageNumber}>
                                                                    <PaginationEllipsis />
                                                                </PaginationItem>
                                                            );
                                                        }
                                                        return null;
                                                    })}

                                                    <PaginationItem>
                                                        <PaginationNext
                                                            href="#"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                                                            }}
                                                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                                        />
                                                    </PaginationItem>
                                                </PaginationContent>
                                            </Pagination>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <Footer />
            </div>
        </>
    );
};

export default Shop;
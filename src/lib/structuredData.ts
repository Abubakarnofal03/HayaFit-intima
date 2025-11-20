// Generate structured data (JSON-LD) for different content types

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "HayaFit Intima",
  "alternateName": "hayafitintima.store",
  "url": "https://hayafitintima.store",
  "logo": "https://hayafitintima.store/logo.jpg",
  "description": "Pakistan's premier online store for women's intimate wear, lingerie, bras, panties, nightwear, and intimate accessories. Premium quality products with discreet delivery across Pakistan.",
  "sameAs": [
    "https://facebook.com/hayafitintima",
    "https://instagram.com/hayafitintima"
  ]
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "HayaFit Intima",
  "url": "https://hayafitintima.store",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://hayafitintima.store/shop?search={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

export const productSchema = (product: {
  name: string;
  description: string;
  price: number;
  images: string[];
  sku?: string;
  stock_quantity?: number;
}) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  "name": product.name,
  "description": product.description || product.name,
  "image": product.images.map(img => img.startsWith('http') ? img : `https://hayafitintima.store${img}`),
  "sku": product.sku || product.name,
  "brand": {
    "@type": "Brand",
    "name": "HayaFit Intima"
  },
  "offers": {
    "@type": "Offer",
    "url": typeof window !== 'undefined' ? window.location.href : '',
    "priceCurrency": "PKR",
    "price": product.price,
    "availability": product.stock_quantity && product.stock_quantity > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    "seller": {
      "@type": "Organization",
      "name": "HayaFit Intima"
    }
  }
});

export const breadcrumbSchema = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url.startsWith('http') ? item.url : `https://hayafitintima.store${item.url}`
  }))
});

export const blogPostSchema = (post: {
  title: string;
  excerpt: string;
  author: string;
  created_at: string;
  featured_image_url?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": post.title,
  "description": post.excerpt,
  "author": {
    "@type": "Person",
    "name": post.author
  },
  "publisher": {
    "@type": "Organization",
    "name": "HayaFit Intima",
    "logo": {
      "@type": "ImageObject",
      "url": "https://hayafitintima.store/logo.jpg"
    }
  },
  "datePublished": post.created_at,
  "image": post.featured_image_url
    ? (post.featured_image_url.startsWith('http') ? post.featured_image_url : `https://hayafitintima.store${post.featured_image_url}`)
    : "https://hayafitintima.store/logo.jpg"
});

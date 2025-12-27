import { Link } from "react-router-dom";
import { Facebook, Instagram } from "lucide-react";
import logo from "@/assets/logo.jpg";

export const Footer = () => {
  const handleLinkClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="glass border-t py-12">
      <div className="container mx-auto px-4">
        {/* SEO-rich footer text */}
        <div className="text-center mb-8 max-w-3xl mx-auto">
          <p className="text-sm text-muted-foreground">
            <strong>hayafitintima.store</strong> is your premier online shopping destination in Pakistan for
            premium <strong>women's lingerie</strong>, elegant <strong>bras</strong>, comfortable <strong>panties</strong>,
            quality <strong>nightwear</strong>, and <strong>intimate accessories</strong>.
            Shop with confidence and enjoy discreet delivery nationwide.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img src={logo} alt="HayaFit Intima - Women's Intimate Wear in Pakistan" className="h-16 w-auto mb-4" />
            <p className="text-sm mb-4">Premium intimate wear and lingerie for every woman.</p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/share/1EgybenFiL/" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors" aria-label="Visit our Facebook page">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/theshoppingcart.official?igsh=MTMzbGd3ZXhvMHFvbA==" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors" aria-label="Visit our Instagram page">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shop" onClick={handleLinkClick} className="hover:text-accent transition-colors">Shop All Products</Link></li>
              <li><Link to="/blog" onClick={handleLinkClick} className="hover:text-accent transition-colors">Blog</Link></li>
              <li><Link to="/about" onClick={handleLinkClick} className="hover:text-accent transition-colors">About Us</Link></li>
              <li><Link to="/contact" onClick={handleLinkClick} className="hover:text-accent transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Shop by Category</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shop?category=bras" onClick={handleLinkClick} className="hover:text-accent transition-colors">Bras</Link></li>
              <li><Link to="/shop?category=panties" onClick={handleLinkClick} className="hover:text-accent transition-colors">Panties</Link></li>
              <li><Link to="/shop?category=lingerie-sets" onClick={handleLinkClick} className="hover:text-accent transition-colors">Lingerie Sets</Link></li>
              <li><Link to="/shop?category=nightwear" onClick={handleLinkClick} className="hover:text-accent transition-colors">Nightwear</Link></li>
              <li><Link to="/shop?category=shapewear" onClick={handleLinkClick} className="hover:text-accent transition-colors">Shapewear</Link></li>
              <li><Link to="/shop?category=accessories" onClick={handleLinkClick} className="hover:text-accent transition-colors">Intimate Accessories</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/contact" onClick={handleLinkClick} className="hover:text-accent transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm">
          <p>&copy; 2025 HayaFit Intima. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
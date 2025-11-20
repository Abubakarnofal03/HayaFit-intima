import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-center mb-4 gold-accent pb-8">
              About HayaFit Intima
            </h1>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="prose prose-lg mx-auto">
              <p className="text-lg leading-relaxed mb-6">
                Welcome to HayaFit Intima, where comfort meets confidence. We curate a
                distinguished collection of premium intimate wear and lingerie for
                women who appreciate quality, elegance, and the perfect fit.
              </p>

              <h2 className="font-display text-3xl font-bold mt-12 mb-4">Our Story</h2>
              <p className="leading-relaxed mb-6">
                Founded with a vision to empower women through premium intimate wear,
                HayaFit Intima has become synonymous with quality, comfort, and confidence. Each
                piece in our collection is carefully selected to meet our exacting standards of
                fit, fabric quality, and style.
              </p>

              <h2 className="font-display text-3xl font-bold mt-12 mb-4">Our Values</h2>
              <ul className="space-y-4 mb-6">
                <li className="flex items-start">
                  <span className="text-accent mr-3 text-xl">•</span>
                  <div>
                    <strong>Quality First:</strong> We never compromise on the quality of our products.
                    Every item is crafted with attention to detail and built to last.
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-3 text-xl">•</span>
                  <div>
                    <strong>Comfort & Style:</strong> Our collections feature designs that
                    blend comfort with elegance, ensuring you feel confident and beautiful every day.
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-3 text-xl">•</span>
                  <div>
                    <strong>Customer Satisfaction:</strong> Your satisfaction is our priority. We're
                    committed to providing exceptional service and support throughout your shopping journey.
                  </div>
                </li>
              </ul>

              <h2 className="font-display text-3xl font-bold mt-12 mb-4">What We Offer</h2>
              <p className="leading-relaxed mb-6">
                From premium lingerie that makes you feel beautiful to comfortable bras that provide
                perfect support, from elegant nightwear to everyday essentials – our collection caters to every
                woman's intimate wear needs with style, comfort, and discretion.
              </p>

              <div className="bg-muted/50 glass-card p-8 rounded-xl mt-12">
                <p className="text-center italic text-lg">
                  "True confidence starts with comfort. It's in the fit, the fabric, and how you feel."
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
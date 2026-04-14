import { Link } from 'wouter';
import { ChevronLeft, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsOfService() {
  return (
    <div className="min-h-screen" style={{ background: '#FAF7FF' }}>
      {/* Header */}
      <header className="bg-white sticky top-0 z-40" style={{ borderBottom: '1px solid #E8D5F5', boxShadow: '0 2px 12px rgba(74,29,107,0.06)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2" style={{ color: '#7B3FA0' }}>
              <ChevronLeft size={16} />
              返回
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Gem size={18} style={{ color: '#4A1D6B' }} />
            <h1 className="text-xl font-medium tracking-widest" style={{ color: '#2D1B4E', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>服務條款</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-sm p-8 space-y-6" style={{ border: '1px solid #E8D5F5', boxShadow: '0 2px 8px rgba(74,29,107,0.06)' }}>
          <div>
            <h2 className="text-2xl font-light tracking-widest mb-2" style={{ color: '#2D1B4E', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Terms and Conditions</h2>
            {/* Gold divider */}
            <div style={{ height: '1px', background: 'linear-gradient(90deg, #C9A84C, transparent)', width: '120px', margin: '8px 0 12px 0' }} />
            <p className="text-sm font-light" style={{ color: '#B07FCC' }}>Last updated: April 14, 2026</p>
          </div>

          <div className="space-y-6 text-sm font-light leading-relaxed" style={{ color: '#2D1B4E', lineHeight: '1.9' }}>
            <p>
              These Terms and Conditions ("Terms") govern your access to and use of the website and services provided by <strong>Jade Emporium</strong> ("Company", "we", "us" or "our"). By accessing or using the website to view, browse, or purchase jadeite jewellery and related products ("Products"), you agree to be bound by these Terms. If you do not agree, do not use the website or make any purchases through it.
            </p>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>1. Services Provided</h3>
              <p>
                Jade Emporium operates an online retail platform specialising in natural jadeite jewellery, jade ornaments, and related accessories. We source, curate, and sell authentic jade products directly to customers worldwide.
              </p>
              <p className="mt-2">
                All products listed on our platform are described to the best of our knowledge. We strive to provide accurate descriptions, photographs, and grading information for each item.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>2. Product Authenticity &amp; Certification</h3>
              <p>
                Jade Emporium is committed to selling only natural, untreated (Grade A) jadeite unless explicitly stated otherwise in the product listing. Where applicable, products are accompanied by a gemological certificate issued by a recognised laboratory.
              </p>
              <p className="mt-2">
                We do not guarantee the investment value of any jade product. Jade is a natural gemstone and its market value may fluctuate. Purchases should be made for personal enjoyment, collection, or gifting purposes.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>3. Pricing &amp; Payment</h3>
              <p>
                All prices are displayed in USD and are subject to change without prior notice. The price applicable to your order is the price displayed at the time of checkout.
              </p>
              <p className="mt-2">
                We accept multiple payment methods as displayed at checkout. All transactions are processed securely. You are responsible for any applicable taxes, customs duties, or import fees in your jurisdiction.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>4. Shipping &amp; Delivery</h3>
              <p>
                We ship worldwide. Estimated delivery times and shipping fees are displayed at checkout. Jade Emporium is not responsible for delays caused by customs clearance, natural disasters, or other circumstances beyond our control.
              </p>
              <p className="mt-2">
                All orders are carefully packaged to ensure safe delivery. A tracking number will be provided upon dispatch.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>5. Returns &amp; Refunds</h3>
              <p>
                We accept returns within 14 days of delivery for items that are damaged, defective, or significantly different from their description. Items must be returned in their original condition and packaging.
              </p>
              <p className="mt-2">
                Custom orders, engraved items, and items marked as final sale are non-refundable. To initiate a return, please contact our customer service team with your order details and photographs of the item.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>6. Intellectual Property</h3>
              <p>
                All content on this website, including photographs, descriptions, logos, and design elements, is the property of Jade Emporium and is protected by applicable intellectual property laws. You may not reproduce, distribute, or use any content without our prior written consent.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>7. Limitation of Liability</h3>
              <p>
                To the fullest extent permitted by law, Jade Emporium shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our website or products. Our total liability shall not exceed the amount paid for the specific product giving rise to the claim.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>8. Governing Law</h3>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of Hong Kong Special Administrative Region. Any disputes shall be subject to the exclusive jurisdiction of the courts of Hong Kong.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>9. Contact Us</h3>
              <p>For any questions regarding these Terms, please contact us at:</p>
              <div className="mt-3 p-4 rounded-sm" style={{ background: '#F5EEFF', border: '1px solid #E8D5F5' }}>
                <p className="font-medium" style={{ color: '#4A1D6B' }}>Jade Emporium</p>
                <p className="mt-1">UNIT 2703, 27/F YEN SHENG CENTRE 64</p>
                <p>HOI YUEN ROAD, KWUN TONG</p>
                <p>Kowloon, Hong Kong</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

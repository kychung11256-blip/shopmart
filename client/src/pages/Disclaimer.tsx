import { Link } from 'wouter';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Disclaimer() {
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
            <AlertCircle size={18} style={{ color: '#4A1D6B' }} />
            <h1 className="text-xl font-medium tracking-widest" style={{ color: '#2D1B4E', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>免責聲明</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-sm p-8 space-y-6" style={{ border: '1px solid #E8D5F5', boxShadow: '0 2px 8px rgba(74,29,107,0.06)' }}>
          <div>
            <h2 className="text-2xl font-light tracking-widest mb-2" style={{ color: '#2D1B4E', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Disclaimer</h2>
            <div style={{ height: '1px', background: 'linear-gradient(90deg, #C9A84C, transparent)', width: '120px', margin: '8px 0 12px 0' }} />
            <p className="text-sm font-light" style={{ color: '#B07FCC' }}>Last updated: April 14, 2026</p>
          </div>

          <div className="space-y-6 text-sm font-light leading-relaxed" style={{ color: '#2D1B4E', lineHeight: '1.9' }}>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>1. Nature of Products</h3>
              <p>
                Jade Emporium sells natural jadeite jewellery and jade ornaments sourced from reputable suppliers. All products are described to the best of our knowledge, including grade, colour, and treatment status. However, as jade is a natural gemstone, slight variations in colour, texture, and pattern between individual pieces are inherent characteristics and not considered defects.
              </p>
              <p className="mt-2">
                Product photographs are taken under controlled lighting conditions and may not perfectly represent the exact colour or lustre of the item as viewed in different lighting environments. We recommend contacting our team for additional photographs or video if you require a more accurate representation before purchase.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>2. No Investment Advice</h3>
              <p>
                Jade Emporium does not provide investment, financial, or valuation advice. All jade products are sold for personal enjoyment, collection, or gifting purposes only. The market value of jade and jadeite products is subject to fluctuation based on market conditions, consumer demand, and other factors beyond our control.
              </p>
              <p className="mt-2">
                Nothing on this website should be construed as a representation or guarantee of future value, appreciation, or resale potential of any product. Jade Emporium expressly disclaims any liability for financial decisions made based on information presented on this website.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>3. Gemological Certification</h3>
              <p>
                Where a gemological certificate is provided, it is issued by an independent third-party laboratory and reflects the laboratory's assessment at the time of testing. Jade Emporium is not responsible for any discrepancies arising from subsequent re-testing by different laboratories, as grading standards and methodologies may vary between institutions.
              </p>
              <p className="mt-2">
                Certificates accompany the specific piece they were issued for and are non-transferable. Jade Emporium does not guarantee that any uncertified product will receive a specific grade upon independent testing.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>4. Website Information</h3>
              <p>
                The information provided on this website, including product descriptions, care guides, and educational content about jade, is for general informational purposes only. While we strive for accuracy, Jade Emporium makes no warranties, express or implied, regarding the completeness, accuracy, or reliability of any information on this website.
              </p>
              <p className="mt-2">
                Jade Emporium reserves the right to modify, update, or remove any content on this website at any time without prior notice. Prices and product availability are subject to change without notice.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>5. Service Availability</h3>
              <p>
                Jade Emporium provides its online services on an "as-is" and "as-available" basis. We do not guarantee that the website will be uninterrupted, error-free, or free from viruses or other harmful components. We shall not be liable for any temporary unavailability of the website due to technical maintenance, upgrades, or circumstances beyond our control.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>6. Third-Party Services</h3>
              <p>
                Our website may utilise third-party services including payment processors, logistics providers, and communication platforms. Jade Emporium is not responsible for the availability, accuracy, or reliability of these third-party services. Any issues arising from third-party service failures, including payment processing errors or delivery delays, should be addressed directly with the relevant service provider where applicable.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>7. Limitation of Liability</h3>
              <p>
                To the fullest extent permitted by applicable law, Jade Emporium and its directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our website or products, including but not limited to loss of profits, loss of data, or loss of goodwill.
              </p>
              <p className="mt-2">
                Our total liability for any claim arising out of or relating to these terms or our products shall not exceed the amount you paid for the specific product giving rise to the claim.
              </p>
            </div>

            <div className="p-4 rounded-sm mt-6" style={{ background: '#F5EEFF', border: '1px solid #E8D5F5' }}>
              <p className="text-sm font-medium mb-1" style={{ color: '#4A1D6B' }}>Customer Assurance</p>
              <p className="text-sm" style={{ color: '#2D1B4E' }}>
                We are committed to providing authentic, high-quality jadeite products and a trustworthy shopping experience. If you have any questions or concerns about a product or your order, please contact our customer service team — we are here to help.
              </p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

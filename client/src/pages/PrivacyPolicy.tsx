import { Link } from 'wouter';
import { ChevronLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
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
            <Shield size={18} style={{ color: '#4A1D6B' }} />
            <h1 className="text-xl font-medium tracking-widest" style={{ color: '#2D1B4E', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>隱私權政策</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-sm p-8 space-y-6" style={{ border: '1px solid #E8D5F5', boxShadow: '0 2px 8px rgba(74,29,107,0.06)' }}>
          <div>
            <h2 className="text-2xl font-light tracking-widest mb-2" style={{ color: '#2D1B4E', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Privacy Policy</h2>
            <div style={{ height: '1px', background: 'linear-gradient(90deg, #C9A84C, transparent)', width: '120px', margin: '8px 0 12px 0' }} />
            <p className="text-sm font-light" style={{ color: '#B07FCC' }}>Last updated: April 14, 2026</p>
          </div>

          <div className="space-y-6 text-sm font-light leading-relaxed" style={{ color: '#2D1B4E', lineHeight: '1.9' }}>
            <p>
              This Privacy Policy describes how <strong>Jade Emporium</strong> ("we", "us", or "our") collects, uses, and protects your personal information when you visit our website or make a purchase. We are committed to safeguarding your privacy and handling your data with transparency and care.
            </p>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>1. Information We Collect</h3>

              <p className="font-medium mb-2" style={{ color: '#7B3FA0' }}>1.1 Personal Information</p>
              <p>When you create an account, place an order, or contact us, we may collect:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>Name, email address, phone number, and postal/shipping address</li>
                <li>Payment information (processed securely via our payment partners; we do not store full card details)</li>
                <li>Order history and purchase records</li>
                <li>Account credentials (username and encrypted password)</li>
                <li>Communications with our customer service team</li>
              </ul>

              <p className="font-medium mb-2 mt-4" style={{ color: '#7B3FA0' }}>1.2 Usage Information</p>
              <p>When you browse our website, we automatically collect:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>IP address and device information</li>
                <li>Browser type and settings</li>
                <li>Pages visited, products viewed, and features used</li>
                <li>Date, time, and duration of visits</li>
                <li>Referral source (how you found our website)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>2. How We Use Your Information</h3>
              <p>We use your personal information to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>Process and fulfil your orders, including shipping and delivery</li>
                <li>Send order confirmations, shipping notifications, and receipts</li>
                <li>Provide customer support and respond to enquiries</li>
                <li>Verify your identity and prevent fraudulent transactions</li>
                <li>Improve our website, product offerings, and customer experience</li>
                <li>Send promotional communications (only with your consent; you may unsubscribe at any time)</li>
                <li>Comply with legal and regulatory obligations in Hong Kong and other applicable jurisdictions</li>
              </ul>
            </div>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>3. Data Sharing and Disclosure</h3>
              <p>We do not sell your personal information. We may share your data with trusted third parties solely for the purpose of operating our business:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li><strong>Logistics and shipping providers</strong> — to deliver your orders</li>
                <li><strong>Payment processors</strong> — to securely handle transactions</li>
                <li><strong>Customer communication platforms</strong> — to manage support enquiries</li>
                <li><strong>Analytics services</strong> — to understand website usage (data is anonymised where possible)</li>
                <li><strong>Legal and regulatory authorities</strong> — when required by applicable law or court order</li>
              </ul>
              <p className="mt-3">All third-party partners are required to handle your data in accordance with applicable data protection laws and our data processing agreements.</p>
            </div>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>4. Data Security</h3>
              <p>
                We implement appropriate technical and organisational measures to protect your personal information from unauthorised access, disclosure, alteration, or destruction. These measures include SSL/TLS encryption for data transmission, access controls, and regular security assessments.
              </p>
              <p className="mt-2">
                While we take every reasonable precaution, no method of transmission over the internet is 100% secure. We encourage you to use a strong, unique password for your account and to contact us immediately if you suspect any unauthorised activity.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>5. Data Retention</h3>
              <p>
                We retain your personal information for as long as necessary to fulfil the purposes outlined in this Privacy Policy, or as required by applicable law. Order records are typically retained for 7 years in compliance with Hong Kong tax and commercial regulations. You may request deletion of your account data at any time, subject to our legal retention obligations.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>6. Your Rights</h3>
              <p>Under the Personal Data (Privacy) Ordinance (Cap. 486) of Hong Kong and other applicable laws, you have the right to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>Access and receive a copy of your personal information</li>
                <li>Correct inaccurate or incomplete personal information</li>
                <li>Request deletion of your personal information (subject to legal obligations)</li>
                <li>Withdraw consent for marketing communications at any time</li>
                <li>Lodge a complaint with the Office of the Privacy Commissioner for Personal Data (Hong Kong)</li>
              </ul>
              <p className="mt-3">To exercise any of these rights, please contact us at the address provided in Section 10.</p>
            </div>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>7. Cookies and Similar Technologies</h3>
              <p>
                We use cookies and similar technologies to enhance your browsing experience, remember your preferences, and analyse website traffic. Essential cookies are required for the website to function properly. You may disable non-essential cookies through your browser settings, though this may affect certain features of our website.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>8. International Data Transfers</h3>
              <p>
                As we ship worldwide, your personal information (particularly shipping addresses) may be transferred to and processed in countries outside Hong Kong. We take appropriate safeguards to ensure your information is protected in accordance with this Privacy Policy and applicable data protection laws.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>9. Changes to this Privacy Policy</h3>
              <p>
                We may update this Privacy Policy from time to time. When we make significant changes, we will notify you by posting a notice on our website or sending an email to your registered address. Your continued use of our website after the effective date of the updated policy constitutes your acceptance of the changes.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium mb-3 tracking-wide" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>10. Contact Us</h3>
              <p>If you have any questions or concerns regarding this Privacy Policy, please contact us at:</p>
              <div className="mt-3 p-4 rounded-sm" style={{ background: '#F5EEFF', border: '1px solid #E8D5F5' }}>
                <p className="font-medium" style={{ color: '#4A1D6B' }}>Jade Emporium — Data Privacy Officer</p>
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

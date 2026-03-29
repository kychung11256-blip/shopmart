import { Link } from 'wouter';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ChevronLeft size={18} />
              返回
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">隱私權政策</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Privacy Policy</h2>
            <p className="text-sm text-gray-500">Last updated: March 29, 2026</p>
          </div>

          <div className="prose prose-sm max-w-none space-y-4 text-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">1. Information We Collect</h3>
              
              <h4 className="font-semibold text-gray-800 mt-4 mb-2">1.1 Personal Information</h4>
              <p>We may collect the following types of personal information:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Contact information (such as name, email address, phone number, and postal address)</li>
                <li>Business information (such as company name, job title, and business type)</li>
                <li>Financial information (such as bank account details and transaction history)</li>
                <li>Identity verification information (such as date of birth and identification documents)</li>
                <li>User account information (such as username, password, and account preferences)</li>
              </ul>

              <h4 className="font-semibold text-gray-800 mt-4 mb-2">1.2 Usage Information</h4>
              <p>When you use our services, we may automatically collect information about your interactions with our platform, including:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>IP address and device information</li>
                <li>Browser type and settings</li>
                <li>Operating system</li>
                <li>Pages visited and features used</li>
                <li>Date and time of access</li>
                <li>Referral source</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2. How We Use Your Information</h3>
              <p>We use the information we collect for various purposes, including to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Verify your identity and prevent fraud</li>
                <li>Communicate with you about our services, updates, and promotional offers</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Monitor and analyze usage patterns and trends</li>
                <li>Comply with legal and regulatory requirements</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3. Data Sharing and Disclosure</h3>
              <p>We may share your information with the following categories of third parties:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Service providers that help us operate our business and provide services</li>
                <li>Financial institutions and payment processors to facilitate transactions</li>
                <li>Identity verification services to verify your identity</li>
                <li>Professional advisors, such as lawyers, accountants, and insurers</li>
                <li>Regulatory authorities and law enforcement agencies when required by law</li>
                <li>Potential buyers or investors in the event of a business transaction (such as a merger or acquisition)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4. Data Security</h3>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. These measures include encryption, access controls, and regular security assessments.
              </p>
              <p>
                However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">5. Data Retention</h3>
              <p>
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. The criteria used to determine our retention periods include:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>The length of time we have an ongoing relationship with you</li>
                <li>Legal obligations to which we are subject</li>
                <li>Whether retention is advisable in light of our legal position (such as for statutes of limitations, litigation, or regulatory investigations)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6. Your Rights</h3>
              <p>
                Depending on your location, you may have certain rights regarding your personal information, including:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>The right to access and receive a copy of your personal information</li>
                <li>The right to correct inaccurate or incomplete personal information</li>
                <li>The right to delete your personal information</li>
                <li>The right to restrict or object to processing of your personal information</li>
                <li>The right to data portability</li>
                <li>The right to withdraw consent where processing is based on consent</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">7. Cookies and Similar Technologies</h3>
              <p>
                We use cookies and similar technologies to collect information about your browsing activities and to distinguish you from other users of our website. Cookies help us provide you with a better experience and allow us to improve our services.
              </p>
              <p>
                You can set your browser to refuse all or some browser cookies, or to alert you when cookies are being sent. If you disable or refuse cookies, please note that some parts of our website may become inaccessible or not function properly.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">8. International Data Transfers</h3>
              <p>
                We may transfer your personal information to countries other than the one in which you reside. When we transfer personal information across borders, we take appropriate safeguards to ensure that your information is protected in accordance with this Privacy Policy and applicable data protection laws.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">9. Children's Privacy</h3>
              <p>
                Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected personal information from a child without verification of parental consent, we will take steps to remove that information from our servers.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">10. Changes to this Privacy Policy</h3>
              <p>
                We may update this Privacy Policy from time to time in response to changing legal, technical, or business developments. When we update our Privacy Policy, we will take appropriate measures to inform you, consistent with the significance of the changes we make.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">11. Contact Us</h3>
              <p>
                If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us using the information provided on our website.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

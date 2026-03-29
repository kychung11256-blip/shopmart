import { Link } from 'wouter';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ChevronLeft size={18} />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Disclaimer</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <div className="prose prose-sm max-w-none space-y-4 text-gray-700">
            <p className="text-base leading-relaxed">
              This website serves as a trading platform between members (i.e., consumers and designers). Products listed on the platform are uploaded and sold by designers. After consumers complete their purchases and payments on the platform, the sales contract is established between the consumer and the designer. The platform cannot and will not intervene in or interfere with transactions between designers and consumers. If any consumer disputes arise regarding purchased products, they must be handled and resolved directly between the consumer and the designer.
            </p>

            <p className="text-base leading-relaxed">
              If a consumer encounters a dispute on the platform (such as a designer refusing to fulfill shipment, provide after-sales service, payment disputes, or avoiding contact), the platform will make efforts to assist the consumer in contacting the designer. When necessary, the platform may provide the designer's contact information (company name, personal name, phone number, email) to the consumer. However, this does not mean the platform assumes any obligation to intervene in disputes between designers and consumers, nor does it assume joint liability for any legal consequences arising from such disputes.
            </p>

            <p className="text-base leading-relaxed">
              Regarding the content and product information uploaded by designers and design studios, if consumers have any questions, they should directly contact the designer through the platform's contact functions and messaging features. All related legal responsibilities should be borne by the designer. The platform makes no legal guarantees, warranties, or assumes any joint liability for the content and product information uploaded by designers.
            </p>

            <p className="text-base leading-relaxed">
              You expressly understand and agree that the online services provided by this platform (including but not limited to the website, mobile web pages, and mobile applications), database systems, and program design (referred to as "this service") are provided on an "as-is" basis. The platform does not guarantee the following:
            </p>

            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>This service meets the needs of users</li>
              <li>The content and system programs of this service are uninterrupted, timely provided, and error-free</li>
              <li>Products or services purchased through this service will meet your expectations</li>
              <li>The accuracy of all information provided by members</li>
            </ul>

            <p className="text-base leading-relaxed">
              The platform may, at its discretion, make specification changes and version upgrades at any time. If the online service is temporarily suspended as a result, the platform assumes no liability for any compensation to consumers.
            </p>

            <p className="text-base leading-relaxed">
              Third-party services designated by this platform (including but not limited to banks or convenience stores) are the sole responsibility of those third parties for the quality and content of their services. Therefore, when using this service, verification may fail due to third-party system issues, network quality problems, or other force majeure events. If the basic information you provided is incorrect, causing this service to be unable to promptly notify you of emergency handling methods for abnormal situations, the platform assumes no liability for any damages.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mt-6">
              <p className="text-sm font-semibold text-yellow-900 mb-2">Important Notice</p>
              <p className="text-sm text-yellow-800">
                To protect consumer rights, please complete transactions on this platform. If you have any questions, please feel free to contact our customer service team.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

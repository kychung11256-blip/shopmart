import { Link } from 'wouter';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsOfService() {
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
          <h1 className="text-2xl font-bold text-gray-800">服務條款</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Terms and Conditions</h2>
            <p className="text-sm text-gray-500">Last updated: March 29, 2026</p>
          </div>

          <div className="prose prose-sm max-w-none space-y-4 text-gray-700">
            <p>
              These Terms and Conditions ("Terms") govern your access to and use of the website and services provided by First Priority Asset Management LLC ("Company", "we", "us" or "our"). By accessing or using the website to view, purchase, or interact with non-fungible token (NFT) artwork ("NFTs", "Artwork"), you agree to be bound by these Terms. If you do not agree, do not use the website or purchase any NFTs through it.
            </p>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">1. Services Provided</h3>
              <p>
                The Company operates a digital marketplace and showcase platform where independent third-party artists ("Artists") may list NFTs for sale.
              </p>
              <p>
                We act solely as a platform facilitating the display and sale of NFTs created and issued by third-party Artists. We do not create, mint, or originate the Artwork listed by Artists and we do not represent that we are the creator or owner of any Artwork listed on the platform.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2. No Investment Advice; Not an Investment Product</h3>
              <p>
                NFTs available through our website are digital collectible items offered by third-party Artists for personal, entertainment, or aesthetic purposes only.
              </p>
              <p>
                NFTs are not investment products and are not sold as, nor should they be considered, financial, tax, legal, or investment advice. The Company does not provide investment advice, and nothing on the website should be relied upon as an offer, recommendation, or solicitation to buy, sell, or hold any NFT for investment purposes.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3. Pricing, Ownership & Transfer</h3>
              <p>
                Price information for each NFT is set by the Artist or seller and displayed on the listing at the time of sale.
              </p>
              <p>
                Title, ownership, and transfer of an NFT occur on the underlying blockchain when the relevant transaction is confirmed on that blockchain and subject to the rules of that blockchain and any marketplace smart contract used. We do not control blockchain confirmations, gas fees, or any other protocol-level aspects.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4. No Warranty on Value; Risk Acknowledgement</h3>
              <p>
                You acknowledge and agree that the market value of NFTs is speculative and volatile. The Company makes no representations or warranties concerning past, present, or future value of any NFT.
              </p>
              <p>
                We expressly disclaim responsibility for any gains, losses, depreciation, or appreciation in value of any NFT purchased, owned, displayed, transferred, or sold through the platform. You accept full responsibility for any financial or other consequences that may result from acquiring or owning an NFT.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">5. Refunds & Final Sales</h3>
              <p>
                All NFT purchases through our platform are final and non-refundable, except where required by applicable law or unless the listing explicitly states otherwise.
              </p>
              <p>
                By purchasing an NFT you accept that the Company will not provide refunds for any reason including but not limited to: dissatisfaction with the Artwork, change in market value, issues with the underlying blockchain, or claims against an Artist.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6. Artist Representations & Third-Party Content</h3>
              <p>
                Artists are solely responsible for the content and representations of their listings including accuracy of descriptions, ownership of intellectual property rights, and lawful rights to sell or license the Artwork.
              </p>
              <p>
                We do not guarantee, endorse, or verify the authenticity, ownership, provenance, or copyright status of any Artwork listed by Artists. If you believe an Artwork infringes your rights, please follow our takedown/report procedure or contact us at the address below.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">7. Our Role in Resale and Secondary Markets</h3>
              <p>
                The Company does not act as an agent for resale and does not itself resell NFTs on behalf of clients unless explicitly agreed in a separate, written agreement. We do not hold, custody, or broker NFTs for buyers or sellers as part of routine marketplace operations.
              </p>
              <p>
                Any secondary sales, royalties, or resale transactions are managed according to the Artist's listing terms, smart contract logic, and the applicable blockchain; the Company is not responsible for executing or guaranteeing secondary market activity.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-6">
              <p className="text-sm text-gray-700">
                For the complete Terms and Conditions, please contact us or visit our website. This page displays the key sections of our terms governing your use of our platform.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onReject: () => void;
}

const TERMS_CONTENT = `Terms and Conditions
Last updated: March 29, 2026

These Terms and Conditions ("Terms") govern your access to and use of the website and services provided by First Priority Asset Management LLC ("Company", "we", "us" or "our"). By accessing or using the website to view, purchase, or interact with non-fungible token (NFT) artwork ("NFTs", "Artwork"), you agree to be bound by these Terms. If you do not agree, do not use the website or purchase any NFTs through it.

1. Services Provided
The Company operates a digital marketplace and showcase platform where independent third-party artists ("Artists") may list NFTs for sale.
We act solely as a platform facilitating the display and sale of NFTs created and issued by third-party Artists. We do not create, mint, or originate the Artwork listed by Artists and we do not represent that we are the creator or owner of any Artwork listed on the platform.

2. No Investment Advice; Not an Investment Product
NFTs available through our website are digital collectible items offered by third-party Artists for personal, entertainment, or aesthetic purposes only.
NFTs are not investment products and are not sold as, nor should they be considered, financial, tax, legal, or investment advice. The Company does not provide investment advice, and nothing on the website should be relied upon as an offer, recommendation, or solicitation to buy, sell, or hold any NFT for investment purposes.

3. Pricing, Ownership & Transfer
Price information for each NFT is set by the Artist or seller and displayed on the listing at the time of sale.
Title, ownership, and transfer of an NFT occur on the underlying blockchain when the relevant transaction is confirmed on that blockchain and subject to the rules of that blockchain and any marketplace smart contract used. We do not control blockchain confirmations, gas fees, or any other protocol-level aspects.

4. No Warranty on Value; Risk Acknowledgement
You acknowledge and agree that the market value of NFTs is speculative and volatile. The Company makes no representations or warranties concerning past, present, or future value of any NFT.
We expressly disclaim responsibility for any gains, losses, depreciation, or appreciation in value of any NFT purchased, owned, displayed, transferred, or sold through the platform. You accept full responsibility for any financial or other consequences that may result from acquiring or owning an NFT.

5. Refunds & Final Sales
All NFT purchases through our platform are final and non-refundable, except where required by applicable law or unless the listing explicitly states otherwise.
By purchasing an NFT you accept that the Company will not provide refunds for any reason including but not limited to: dissatisfaction with the Artwork, change in market value, issues with the underlying blockchain, or claims against an Artist.

6. Artist Representations & Third-Party Content
Artists are solely responsible for the content and representations of their listings including accuracy of descriptions, ownership of intellectual property rights, and lawful rights to sell or license the Artwork.
We do not guarantee, endorse, or verify the authenticity, ownership, provenance, or copyright status of any Artwork listed by Artists. If you believe an Artwork infringes your rights, please follow our takedown/report procedure or contact us at the address below.

7. Our Role in Resale and Secondary Markets
The Company does not act as an agent for resale and does not itself resell NFTs on behalf of clients unless explicitly agreed in a separate, written agreement. We do not hold, custody, or broker NFTs for buyers or sellers as part of routine marketplace operations.
Any secondary sales, royalties, or resale transactions are managed according to the Artist's listing terms, smart contract logic, and the applicable blockchain; the Company is not responsible for executing or guaranteeing secondary market activity.

8. Fees, Taxes, and Blockchain Costs
The Company may charge transaction fees for NFT sales as disclosed on the website. You are responsible for all applicable taxes, including sales tax, VAT, income tax, and any other taxes related to your NFT purchases or ownership. The Company is not responsible for blockchain transaction fees ("gas fees") or any other protocol-level costs.`;

export default function TermsAndConditionsModal({
  isOpen,
  onAccept,
  onReject,
}: TermsAndConditionsModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom =
      Math.abs(
        element.scrollHeight - element.scrollTop - element.clientHeight
      ) < 10;
    setHasScrolledToBottom(isAtBottom);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Terms and Conditions
          </h2>
          <button
            onClick={onReject}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 text-sm text-gray-700 leading-relaxed"
        >
          <div className="whitespace-pre-wrap text-xs sm:text-sm">
            {TERMS_CONTENT}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-3">
          {!hasScrolledToBottom && (
            <p className="text-xs text-gray-500 text-center">
              Please scroll down to read the full terms
            </p>
          )}
          <div className="flex gap-3">
            <Button
              onClick={onReject}
              variant="outline"
              className="flex-1 text-sm"
            >
              Reject
            </Button>
            <Button
              onClick={onAccept}
              disabled={!hasScrolledToBottom}
              className="flex-1 text-sm bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onReject: () => void;
}

const TERMS_CONTENT = `Terms and Conditions
Last updated: April 14, 2026

These Terms and Conditions ("Terms") govern your access to and use of the website and services provided by Jade Emporium ("Company", "we", "us" or "our"). By accessing or using the website to view, browse, or purchase jadeite jewellery and related products ("Products"), you agree to be bound by these Terms. If you do not agree, do not use the website or make any purchases through it.

1. Services Provided
Jade Emporium operates an online retail platform specialising in natural jadeite jewellery, jade ornaments, and related accessories. We source, curate, and sell authentic jade products directly to customers worldwide.

All products listed on our platform are described to the best of our knowledge. We strive to provide accurate descriptions, photographs, and grading information for each item.

2. Product Authenticity & Certification
Jade Emporium is committed to selling only natural, untreated (Grade A) jadeite unless explicitly stated otherwise in the product listing. Where applicable, products are accompanied by a gemological certificate issued by a recognised laboratory.

We do not guarantee the investment value of any jade product. Jade is a natural gemstone and its market value may fluctuate. Purchases should be made for personal enjoyment, collection, or gifting purposes.

3. Pricing & Payment
All prices are displayed in USD and are subject to change without prior notice. The price applicable to your order is the price displayed at the time of checkout.

We accept multiple payment methods as displayed at checkout. All transactions are processed securely. You are responsible for any applicable taxes, customs duties, or import fees in your jurisdiction.

4. Shipping & Delivery
We ship worldwide. Estimated delivery times and shipping fees are displayed at checkout. Jade Emporium is not responsible for delays caused by customs clearance, natural disasters, or other circumstances beyond our control.

All orders are carefully packaged to ensure safe delivery. A tracking number will be provided upon dispatch.

5. Returns & Refunds
We accept returns within 14 days of delivery for items that are damaged, defective, or significantly different from their description. Items must be returned in their original condition and packaging.

Custom orders, engraved items, and items marked as final sale are non-refundable. To initiate a return, please contact our customer service team with your order details and photographs of the item.

6. Intellectual Property
All content on this website, including photographs, descriptions, logos, and design elements, is the property of Jade Emporium and is protected by applicable intellectual property laws. You may not reproduce, distribute, or use any content without our prior written consent.

7. Limitation of Liability
To the fullest extent permitted by law, Jade Emporium shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our website or products. Our total liability shall not exceed the amount paid for the specific product giving rise to the claim.

8. Governing Law
These Terms shall be governed by and construed in accordance with the laws of Hong Kong Special Administrative Region. Any disputes shall be subject to the exclusive jurisdiction of the courts of Hong Kong.

9. Contact Us
For any questions regarding these Terms, please contact us at:
Jade Emporium
UNIT 2703, 27/F YEN SHENG CENTRE 64
HOI YUEN ROAD, KWUN TONG
Kowloon, Hong Kong`;

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
      <div className="bg-white rounded-sm shadow-xl w-full max-w-md max-h-[90vh] flex flex-col" style={{ border: '1px solid #E8D5F5' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid #E8D5F5' }}>
          <h2 className="text-base font-medium tracking-widest" style={{ color: '#2D1B4E', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>
            Terms and Conditions
          </h2>
          <button
            onClick={onReject}
            className="transition-colors"
            style={{ color: '#B07FCC' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#4A1D6B')}
            onMouseLeave={e => (e.currentTarget.style.color = '#B07FCC')}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 text-sm leading-relaxed"
          style={{ color: '#2D1B4E' }}
        >
          <div className="whitespace-pre-wrap text-xs sm:text-sm font-light" style={{ lineHeight: '1.8' }}>
            {TERMS_CONTENT}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 space-y-3" style={{ borderTop: '1px solid #E8D5F5', background: '#FAF7FF' }}>
          {!hasScrolledToBottom && (
            <p className="text-xs text-center" style={{ color: '#B07FCC' }}>
              Please scroll down to read the full terms
            </p>
          )}
          <div className="flex gap-3">
            <Button
              onClick={onReject}
              variant="outline"
              className="flex-1 text-sm"
              style={{ borderColor: '#E8D5F5', color: '#7B3FA0' }}
            >
              Reject
            </Button>
            <Button
              onClick={onAccept}
              disabled={!hasScrolledToBottom}
              className="flex-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#4A1D6B', color: 'white' }}
            >
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Link } from 'wouter';
import { ChevronLeft, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function Disclaimer() {
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');

  const content = {
    zh: {
      title: '免責聲明',
      backButton: '返回',
      languageToggle: 'EN',
      importantNote: '重要提醒',
      paragraphs: [
        '本網站僅係提供會員間（即消費者與設計師）交易之平台，刊登之商品是由設計師自行上傳銷售，消費者於平台完成選購商品並付款後，買賣契約成立於消費者與設計師之間，平台無法，亦不會介入、干涉設計師與消費者間買賣交易。若消費者就其選購之商品後續衍生消費爭議，需由消費者與設計師間自行處理及解決。',
        '如消費者於平台選購商品產生消費爭議（如：設計師拒絕履行出貨、售後服務、付款糾紛或避不出面等），平台將盡力協助消費者與設計師聯繫，必要時得將設計師聯絡方式（公司、個人名稱、電話、email）提供予消費者，然此不代表平台就設計師與消費者間之消費爭議有介入處理義務，亦不就消費爭議衍生之法律責任與其中一方連帶負責。',
        '關於設計師及設計館上架內容與商品資訊，消費者如有疑問，應逕透過平台聯絡設計師、傳送訊息等功能向設計師聯繫、詢問，相關法律責任亦應由該設計師自行負責。本平台對於設計師上架內容與商品資訊並不負任何法律上之保證、擔保或連帶賠償責任。',
        '您明確了解並同意本平台提供之網路服務（包含但不限於網站及手機版網頁及手機應用程式等）、資料庫系統及程式設計（下稱「本服務」）僅以「現狀」提供服務，本平台不保證以下事項：',
      ],
      bulletPoints: [
        '本服務符合使用者的需求',
        '本服務內容及系統程式不受干擾、及時提供或免於出錯',
        '您經由本服務購買之商品或服務將符合您的期望',
        '所有會員自行填寫資料之正確性',
      ],
      paragraph5: '且本平台得依其判斷隨時進行規格變更及版本升級，如因此暫時停止網路服務，本平台不對消費者為任何賠償。',
      paragraph6: '本服務指定之第三方服務（包含但不限於銀行或超商），所提供之服務品質及內容由該第三方自行負責。故使用本服務時，可能由於第三方本身系統問題、相關作業網路連線品質問題或其他不可抗拒因素，造成驗證無法完成。若您所提供之基本資料有誤，造成本服務無法即時通知您異常狀況之緊急處理方式時，本平台對此將不負任何損害賠償責任。',
      noteText: '為保障消費者權益，請消費者於本平台上完成交易，如有任何疑問，歡迎來信或聯繫我們的客服團隊。',
    },
    en: {
      title: 'Disclaimer',
      backButton: 'Back',
      languageToggle: '中文',
      importantNote: 'Important Notice',
      paragraphs: [
        'This website serves as a trading platform between members (i.e., consumers and designers). Products listed on the platform are uploaded and sold by designers. After consumers complete their purchases and payments on the platform, the sales contract is established between the consumer and the designer. The platform cannot and will not intervene in or interfere with transactions between designers and consumers. If any consumer disputes arise regarding purchased products, they must be handled and resolved directly between the consumer and the designer.',
        'If a consumer encounters a dispute on the platform (such as a designer refusing to fulfill shipment, provide after-sales service, payment disputes, or avoiding contact), the platform will make efforts to assist the consumer in contacting the designer. When necessary, the platform may provide the designer\'s contact information (company name, personal name, phone number, email) to the consumer. However, this does not mean the platform assumes any obligation to intervene in disputes between designers and consumers, nor does it assume joint liability for any legal consequences arising from such disputes.',
        'Regarding the content and product information uploaded by designers and design studios, if consumers have any questions, they should directly contact the designer through the platform\'s contact functions and messaging features. All related legal responsibilities should be borne by the designer. The platform makes no legal guarantees, warranties, or assumes any joint liability for the content and product information uploaded by designers.',
        'You expressly understand and agree that the online services provided by this platform (including but not limited to the website, mobile web pages, and mobile applications), database systems, and program design (referred to as "this service") are provided on an "as-is" basis. The platform does not guarantee the following:',
      ],
      bulletPoints: [
        'This service meets the needs of users',
        'The content and system programs of this service are uninterrupted, timely provided, and error-free',
        'Products or services purchased through this service will meet your expectations',
        'The accuracy of all information provided by members',
      ],
      paragraph5: 'The platform may, at its discretion, make specification changes and version upgrades at any time. If the online service is temporarily suspended as a result, the platform assumes no liability for any compensation to consumers.',
      paragraph6: 'Third-party services designated by this platform (including but not limited to banks or convenience stores) are the sole responsibility of those third parties for the quality and content of their services. Therefore, when using this service, verification may fail due to third-party system issues, network quality problems, or other force majeure events. If the basic information you provided is incorrect, causing this service to be unable to promptly notify you of emergency handling methods for abnormal situations, the platform assumes no liability for any damages.',
      noteText: 'To protect consumer rights, please complete transactions on this platform. If you have any questions, please feel free to contact our customer service team.',
    },
  };

  const currentContent = content[language];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ChevronLeft size={18} />
                {currentContent.backButton}
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">{currentContent.title}</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
            className="gap-2"
          >
            <Globe size={16} />
            {currentContent.languageToggle}
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <div className="prose prose-sm max-w-none space-y-4 text-gray-700">
            {currentContent.paragraphs.map((paragraph, index) => (
              <p key={index} className="text-base leading-relaxed">
                {paragraph}
              </p>
            ))}

            <ul className="list-disc list-inside space-y-2 ml-2">
              {currentContent.bulletPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>

            <p className="text-base leading-relaxed">{currentContent.paragraph5}</p>

            <p className="text-base leading-relaxed">{currentContent.paragraph6}</p>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mt-6">
              <p className="text-sm font-semibold text-yellow-900 mb-2">{currentContent.importantNote}</p>
              <p className="text-sm text-yellow-800">
                {currentContent.noteText}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

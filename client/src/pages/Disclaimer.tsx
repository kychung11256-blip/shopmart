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
              返回
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">免責聲明</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <div className="prose prose-sm max-w-none space-y-4 text-gray-700">
            <p className="text-base leading-relaxed">
              本網站僅係提供會員間（即消費者與設計師）交易之平台，刊登之商品是由設計師自行上傳銷售，消費者於平台完成選購商品並付款後，買賣契約成立於消費者與設計師之間，平台無法，亦不會介入、干涉設計師與消費者間買賣交易。若消費者就其選購之商品後續衍生消費爭議，需由消費者與設計師間自行處理及解決。
            </p>

            <p className="text-base leading-relaxed">
              如消費者於平台選購商品產生消費爭議（如：設計師拒絕履行出貨、售後服務、付款糾紛或避不出面等），平台將盡力協助消費者與設計師聯繫，必要時得將設計師聯絡方式（公司、個人名稱、電話、email）提供予消費者，然此不代表平台就設計師與消費者間之消費爭議有介入處理義務，亦不就消費爭議衍生之法律責任與其中一方連帶負責。
            </p>

            <p className="text-base leading-relaxed">
              關於設計師及設計館上架內容與商品資訊，消費者如有疑問，應逕透過平台聯絡設計師、傳送訊息等功能向設計師聯繫、詢問，相關法律責任亦應由該設計師自行負責。本平台對於設計師上架內容與商品資訊並不負任何法律上之保證、擔保或連帶賠償責任。
            </p>

            <p className="text-base leading-relaxed">
              您明確了解並同意本平台提供之網路服務（包含但不限於網站及手機版網頁及手機應用程式等）、資料庫系統及程式設計（下稱「本服務」）僅以「現狀」提供服務，本平台不保證以下事項：
            </p>

            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>本服務符合使用者的需求</li>
              <li>本服務內容及系統程式不受干擾、及時提供或免於出錯</li>
              <li>您經由本服務購買之商品或服務將符合您的期望</li>
              <li>所有會員自行填寫資料之正確性</li>
            </ul>

            <p className="text-base leading-relaxed">
              且本平台得依其判斷隨時進行規格變更及版本升級，如因此暫時停止網路服務，本平台不對消費者為任何賠償。
            </p>

            <p className="text-base leading-relaxed">
              本服務指定之第三方服務（包含但不限於銀行或超商），所提供之服務品質及內容由該第三方自行負責。故使用本服務時，可能由於第三方本身系統問題、相關作業網路連線品質問題或其他不可抗拒因素，造成驗證無法完成。若您所提供之基本資料有誤，造成本服務無法即時通知您異常狀況之緊急處理方式時，本平台對此將不負任何損害賠償責任。
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mt-6">
              <p className="text-sm font-semibold text-yellow-900 mb-2">重要提醒</p>
              <p className="text-sm text-yellow-800">
                為保障消費者權益，請消費者於本平台上完成交易，如有任何疑問，歡迎來信或聯繫我們的客服團隊。
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

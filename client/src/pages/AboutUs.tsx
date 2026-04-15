import { Link } from 'wouter';
import { ChevronLeft, Gem, Mountain, Award, Globe, MapPin, Pickaxe, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AboutUs() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen" style={{ background: '#FAF7FF' }}>
      {/* Header */}
      <header className="bg-white sticky top-0 z-40" style={{ borderBottom: '1px solid #E8D5F5', boxShadow: '0 2px 12px rgba(74,29,107,0.06)' }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2" style={{ color: '#7B3FA0' }}>
              <ChevronLeft size={16} />
              {language === 'zh' ? '返回' : 'Back'}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Gem size={18} style={{ color: '#4A1D6B' }} />
            <h1 className="text-xl font-medium tracking-widest" style={{ color: '#2D1B4E', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {language === 'zh' ? '關於我們' : 'About Us'}
            </h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1A0A2E 0%, #4A1D6B 50%, #2D1B4E 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #C9A84C 0%, transparent 50%), radial-gradient(circle at 80% 50%, #7B3FA0 0%, transparent 50%)' }} />
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{ background: 'linear-gradient(135deg, #C9A84C, #E8D5A0)' }}>
            <Gem size={28} className="text-white" />
          </div>
          <h2 className="text-3xl md:text-5xl font-light text-white tracking-[0.15em] mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Jade Emporium
          </h2>
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)', width: '200px', margin: '0 auto 1.5rem' }} />
          <p className="text-lg md:text-xl font-light tracking-widest" style={{ color: '#C9A84C', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            {language === 'zh' ? '越南青光翡翠礦業有限公司 — 台灣分公司' : 'Vietnam Green Light Jade Mining Co., Ltd. — Taiwan Branch'}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Company Overview */}
        <div className="bg-white rounded-sm p-8 md:p-10 mb-8" style={{ border: '1px solid #E8D5F5', boxShadow: '0 2px 8px rgba(74,29,107,0.06)' }}>
          <div className="flex items-center gap-3 mb-6">
            <Mountain size={22} style={{ color: '#C9A84C' }} />
            <h3 className="text-xl md:text-2xl font-light tracking-widest" style={{ color: '#2D1B4E', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {language === 'zh' ? '公司簡介' : 'Company Overview'}
            </h3>
          </div>
          <div style={{ height: '1px', background: 'linear-gradient(90deg, #C9A84C, transparent)', width: '120px', margin: '0 0 1.5rem 0' }} />

          <div className="space-y-5 text-sm md:text-base font-light leading-relaxed" style={{ color: '#2D1B4E', lineHeight: '2' }}>
            <p>
              {language === 'zh'
                ? '翡翠閣（Jade Emporium）為越南青光翡翠礦業有限公司之台灣分公司，專營高品質天然翡翠珠寶。母公司在越南擁有超過五十年的翡翠開採歷史，礦區遍佈越南北部的會卡（Hui Ka）、木那（Mu Na）、莫西沙（Mo Si Sa）及馬薩（Ma Sa）等知名翡翠產區。'
                : 'Jade Emporium is the Taiwan branch of Vietnam Green Light Jade Mining Co., Ltd., specialising in premium natural jadeite jewellery. Our parent company has over 50 years of jade mining history in Vietnam, with mining operations spanning the renowned jadeite-producing regions of northern Vietnam — including Hui Ka, Mu Na, Mo Si Sa, and Ma Sa.'}
            </p>
            <p>
              {language === 'zh'
                ? '我們的原石經過嚴格篩選後，由中國大陸及香港的資深玉雕師傅進行切割、設計與精雕，再經批發渠道流通至全球市場。公司每年在香港及中國大陸舉辦翡翠拍賣會，其中頂級臻品更獲選送至佳士得（Christie\'s）、蘇富比（Sotheby\'s）及保利拍賣（Poly Auction）等國際知名拍賣行上拍，深受全球藏家青睞。'
                : 'After rigorous selection, our rough stones are sent to master carvers in mainland China and Hong Kong for cutting, design, and meticulous sculpting, before being distributed through wholesale channels to global markets. Every year, we hold jadeite auctions in Hong Kong and mainland China; our finest pieces are selected for sale at internationally renowned auction houses such as Christie\'s, Sotheby\'s, and Poly Auction, earning the admiration of collectors worldwide.'}
            </p>
          </div>
        </div>

        {/* Vertically Integrated Production */}
        <div className="bg-white rounded-sm p-8 md:p-10 mb-8" style={{ border: '1px solid #E8D5F5', boxShadow: '0 2px 8px rgba(74,29,107,0.06)' }}>
          <div className="flex items-center gap-3 mb-6">
            <Pickaxe size={22} style={{ color: '#C9A84C' }} />
            <h3 className="text-xl md:text-2xl font-light tracking-widest" style={{ color: '#2D1B4E', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {language === 'zh' ? '垂直整合生產' : 'Vertically Integrated Production'}
            </h3>
          </div>
          <div style={{ height: '1px', background: 'linear-gradient(90deg, #C9A84C, transparent)', width: '120px', margin: '0 0 1.5rem 0' }} />

          <div className="space-y-5 text-sm md:text-base font-light leading-relaxed" style={{ color: '#2D1B4E', lineHeight: '2' }}>
            <p>
              {language === 'zh'
                ? '翡翠閣採用從礦山到櫃檯的垂直整合經營模式，完整掌控翡翠從開採、原石篩選、設計、雕刻到拋光打磨的每一道工序。這種一條龍的生產體系不僅確保了每件作品的品質與工藝水準，更讓我們能以更具競爭力的價格，將頂級翡翠珠寶直接呈獻給消費者。'
                : 'Jade Emporium operates a vertically integrated business model — from mine to counter — maintaining full control over every stage of production: mining, rough stone selection, design, carving, and polishing. This end-to-end production system not only guarantees the quality and craftsmanship of every piece, but also allows us to offer premium jadeite jewellery directly to consumers at highly competitive prices.'}
            </p>
          </div>

          {/* Production Flow */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
            {(language === 'zh'
              ? [
                  { step: '01', label: '礦區開採', desc: '越南北部礦區' },
                  { step: '02', label: '原石篩選', desc: '專業鑑定分級' },
                  { step: '03', label: '設計雕刻', desc: '大師級工藝' },
                  { step: '04', label: '拋光打磨', desc: '精細後期處理' },
                  { step: '05', label: '品質認證', desc: '權威機構鑑定' },
                ]
              : [
                  { step: '01', label: 'Mining', desc: 'Northern Vietnam' },
                  { step: '02', label: 'Selection', desc: 'Expert grading' },
                  { step: '03', label: 'Design & Carving', desc: 'Master craftsmanship' },
                  { step: '04', label: 'Polishing', desc: 'Fine finishing' },
                  { step: '05', label: 'Certification', desc: 'Authoritative appraisal' },
                ]
            ).map((item) => (
              <div key={item.step} className="text-center p-4 rounded-sm" style={{ background: '#FAF7FF', border: '1px solid #E8D5F5' }}>
                <div className="text-2xl font-light mb-1" style={{ color: '#C9A84C', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{item.step}</div>
                <div className="text-sm font-medium mb-1" style={{ color: '#4A1D6B' }}>{item.label}</div>
                <div className="text-xs font-light" style={{ color: '#7B3FA0' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* International Auctions */}
        <div className="bg-white rounded-sm p-8 md:p-10 mb-8" style={{ border: '1px solid #E8D5F5', boxShadow: '0 2px 8px rgba(74,29,107,0.06)' }}>
          <div className="flex items-center gap-3 mb-6">
            <Award size={22} style={{ color: '#C9A84C' }} />
            <h3 className="text-xl md:text-2xl font-light tracking-widest" style={{ color: '#2D1B4E', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {language === 'zh' ? '國際拍賣殿堂' : 'International Auction Presence'}
            </h3>
          </div>
          <div style={{ height: '1px', background: 'linear-gradient(90deg, #C9A84C, transparent)', width: '120px', margin: '0 0 1.5rem 0' }} />

          <div className="space-y-5 text-sm md:text-base font-light leading-relaxed" style={{ color: '#2D1B4E', lineHeight: '2' }}>
            <p>
              {language === 'zh'
                ? '我們的頂級翡翠臻品長期獲選進入國際三大拍賣行，包括佳士得（Christie\'s）、蘇富比（Sotheby\'s）及保利拍賣（Poly Auction），屢創佳績。這不僅是對我們翡翠品質的最高肯定，更彰顯了越南青光翡翠礦業在全球翡翠行業中的領導地位。'
                : 'Our finest jadeite pieces are regularly selected for sale at the world\'s three leading auction houses — Christie\'s, Sotheby\'s, and Poly Auction — consistently achieving outstanding results. This is not only the highest affirmation of our jade quality, but also a testament to Vietnam Green Light Jade Mining\'s leadership position in the global jadeite industry.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {[
              { name: "Christie's", zh: '佳士得', desc: language === 'zh' ? '全球頂級拍賣行，翡翠珠寶專場常客' : 'World-class auction house, regular jadeite jewellery specialist' },
              { name: "Sotheby's", zh: '蘇富比', desc: language === 'zh' ? '國際藝術與珠寶拍賣權威' : 'International authority in art and jewellery auctions' },
              { name: 'Poly Auction', zh: '保利拍賣', desc: language === 'zh' ? '亞洲最大拍賣行之一，翡翠專場領先' : 'One of Asia\'s largest auction houses, leading jadeite specialist' },
            ].map((auction) => (
              <div key={auction.name} className="p-6 rounded-sm text-center" style={{ background: 'linear-gradient(135deg, #1A0A2E, #2D1B4E)', border: '1px solid #4A1D6B' }}>
                <Sparkles size={20} className="mx-auto mb-3" style={{ color: '#C9A84C' }} />
                <div className="text-lg font-light text-white tracking-widest mb-1" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{auction.name}</div>
                {language === 'zh' && <div className="text-xs mb-2" style={{ color: '#C9A84C' }}>{auction.zh}</div>}
                <div className="text-xs font-light" style={{ color: '#B07FCC' }}>{auction.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Showrooms */}
        <div className="bg-white rounded-sm p-8 md:p-10 mb-8" style={{ border: '1px solid #E8D5F5', boxShadow: '0 2px 8px rgba(74,29,107,0.06)' }}>
          <div className="flex items-center gap-3 mb-6">
            <MapPin size={22} style={{ color: '#C9A84C' }} />
            <h3 className="text-xl md:text-2xl font-light tracking-widest" style={{ color: '#2D1B4E', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {language === 'zh' ? '台灣展示中心' : 'Taiwan Showrooms'}
            </h3>
          </div>
          <div style={{ height: '1px', background: 'linear-gradient(90deg, #C9A84C, transparent)', width: '120px', margin: '0 0 1.5rem 0' }} />

          <div className="space-y-5 text-sm md:text-base font-light leading-relaxed mb-8" style={{ color: '#2D1B4E', lineHeight: '2' }}>
            <p>
              {language === 'zh'
                ? '翡翠閣在台灣設有三間實體展示中心，歡迎蒞臨鑑賞。我們的專業顧問將為您提供一對一的翡翠鑑賞服務，協助您挑選最適合的翡翠珠寶。'
                : 'Jade Emporium operates three physical showrooms across Taiwan. We welcome you to visit and appreciate our collection in person. Our professional consultants will provide personalised one-on-one jadeite appreciation services to help you select the perfect piece.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(language === 'zh'
              ? [
                  { city: '台北', area: '復興展示中心', address: '台北市大安區復興南路', icon: '🏛️' },
                  { city: '台南', area: '永華展示中心', address: '台南市安平區永華路', icon: '🏛️' },
                  { city: '新竹', area: '竹北展示中心', address: '新竹縣竹北市光明六路', icon: '🏛️' },
                ]
              : [
                  { city: 'Taipei', area: 'Fuxing Showroom', address: 'Fuxing South Road, Da\'an District, Taipei', icon: '🏛️' },
                  { city: 'Tainan', area: 'Yonghua Showroom', address: 'Yonghua Road, Anping District, Tainan', icon: '🏛️' },
                  { city: 'Hsinchu', area: 'Zhubei Showroom', address: 'Guangming 6th Road, Zhubei City, Hsinchu', icon: '🏛️' },
                ]
            ).map((showroom) => (
              <div key={showroom.city} className="p-6 rounded-sm" style={{ background: '#FAF7FF', border: '1px solid #E8D5F5' }}>
                <div className="text-2xl mb-3">{showroom.icon}</div>
                <div className="text-lg font-light tracking-widest mb-1" style={{ color: '#4A1D6B', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{showroom.city}</div>
                <div className="text-sm font-medium mb-2" style={{ color: '#2D1B4E' }}>{showroom.area}</div>
                <div className="flex items-start gap-1.5">
                  <MapPin size={12} className="mt-1 shrink-0" style={{ color: '#C9A84C' }} />
                  <span className="text-xs font-light" style={{ color: '#7B3FA0' }}>{showroom.address}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Reach */}
        <div className="bg-white rounded-sm p-8 md:p-10 mb-8" style={{ border: '1px solid #E8D5F5', boxShadow: '0 2px 8px rgba(74,29,107,0.06)' }}>
          <div className="flex items-center gap-3 mb-6">
            <Globe size={22} style={{ color: '#C9A84C' }} />
            <h3 className="text-xl md:text-2xl font-light tracking-widest" style={{ color: '#2D1B4E', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {language === 'zh' ? '全球佈局' : 'Global Reach'}
            </h3>
          </div>
          <div style={{ height: '1px', background: 'linear-gradient(90deg, #C9A84C, transparent)', width: '120px', margin: '0 0 1.5rem 0' }} />

          <div className="space-y-5 text-sm md:text-base font-light leading-relaxed" style={{ color: '#2D1B4E', lineHeight: '2' }}>
            <p>
              {language === 'zh'
                ? '從越南礦山到台灣展廳，從香港批發市場到國際拍賣殿堂，翡翠閣的業務網絡遍及亞洲及全球。我們致力於將最優質的天然翡翠帶給每一位愛玉之人，傳承東方玉石文化的千年底蘊。'
                : 'From Vietnamese mines to Taiwanese showrooms, from Hong Kong wholesale markets to international auction halls, Jade Emporium\'s business network spans across Asia and the world. We are committed to bringing the finest natural jadeite to every jade enthusiast, carrying forward the millennia-old heritage of Eastern jade culture.'}
            </p>
          </div>

          {/* Key Figures */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {(language === 'zh'
              ? [
                  { figure: '50+', label: '年開採歷史' },
                  { figure: '4', label: '大礦區' },
                  { figure: '3', label: '間台灣展廳' },
                  { figure: '3', label: '大國際拍賣行' },
                ]
              : [
                  { figure: '50+', label: 'Years of Mining' },
                  { figure: '4', label: 'Mining Regions' },
                  { figure: '3', label: 'Taiwan Showrooms' },
                  { figure: '3', label: 'Int\'l Auction Houses' },
                ]
            ).map((stat) => (
              <div key={stat.label} className="text-center p-5 rounded-sm" style={{ background: 'linear-gradient(135deg, #1A0A2E, #2D1B4E)', border: '1px solid #4A1D6B' }}>
                <div className="text-3xl md:text-4xl font-light mb-2" style={{ color: '#C9A84C', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{stat.figure}</div>
                <div className="text-xs font-light tracking-wider" style={{ color: '#B07FCC' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-8">
          <p className="text-sm font-light mb-6" style={{ color: '#7B3FA0', lineHeight: '1.8' }}>
            {language === 'zh'
              ? '歡迎蒞臨翡翠閣，探索屬於您的翡翠珍品。'
              : 'Welcome to Jade Emporium. Discover the jadeite treasure that belongs to you.'}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/products">
              <Button className="px-8 py-3 tracking-widest text-sm" style={{ background: 'linear-gradient(135deg, #4A1D6B, #7B3FA0)', color: '#FAF7FF', border: 'none' }}>
                {language === 'zh' ? '瀏覽商品' : 'Browse Products'}
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="px-8 py-3 tracking-widest text-sm" style={{ borderColor: '#C9A84C', color: '#4A1D6B' }}>
                {language === 'zh' ? '返回首頁' : 'Back to Home'}
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6" style={{ background: '#1A0A2E' }}>
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)', margin: '0 0 1.5rem 0' }} />
          <p className="text-xs tracking-widest font-light" style={{ color: '#7B3FA0' }}>
            Copyright © 2013-2026 Jade Emporium Ltd. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

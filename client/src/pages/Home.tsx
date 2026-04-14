/**
 * Jade Emporium - Home Page (Frontend)
 * Design: 奢華翡翠珠寶電商風 - 深紫金色調
 * Layout: 頂部雙層導航 + 左側分類欄 + 主內容區域
 * Primary: #4A1D6B (Deep Purple), Accent: #C9A84C (Gold)
 * Background: #FAF7FF (Ivory White)
 *
 * API Integration: 使用 TRPC 實時獲取商品和分類數據
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingCart, Search, User, ChevronRight, Phone, MessageCircle, ArrowUp, Heart, MapPin, Globe, LogOut, Gem, Shield, Truck, Award } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/_core/hooks/useAuth';
import { t } from '@/lib/translations';
import { trpc } from '@/lib/trpc';
import TermsAndConditionsModal from '@/components/TermsAndConditionsModal';
import { useTermsAgreement } from '@/hooks/useTermsAgreement';

// 默認 Banner 幻燈片（備用 - 當 API 無法加載時使用）
const defaultBannerSlides: any[] = [];

// Product type from API
interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number | null;
  image?: string | null;
  categoryId?: number | null;
  sold?: number;
  rating?: number | null;
  description?: string | null;
  stock?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Category type from API
interface Category {
  id: number;
  name: string;
  nameEn?: string | null;
  icon?: string | null;
  order?: number;
}

function ProductCard({ product }: { product: Product }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const isSoldOut = typeof product.stock === 'number' && product.stock <= 0;

  return (
    <div
      className={`product-card bg-white border rounded-sm overflow-hidden group ${
        isSoldOut
          ? 'border-purple-100 opacity-60 cursor-not-allowed'
          : 'border-purple-100 cursor-pointer'
      }`}
      onClick={() => !isSoldOut && navigate(`/product/${product.id}`)}
    >
      <div className="relative overflow-hidden" style={{ paddingTop: '100%' }}>
        <img
          src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop'}
          alt={product.name}
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${
            isSoldOut ? 'grayscale' : 'group-hover:scale-108'
          }`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop';
          }}
        />
        {/* Sold out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-purple-900/40 flex items-center justify-center">
            <span className="bg-purple-900 text-white text-xs font-medium px-3 py-1 rounded-full tracking-wider">
              {language === 'zh' ? '已售罄' : 'SOLD OUT'}
            </span>
          </div>
        )}
        {!isSoldOut && (
          <button
            onClick={(e) => { e.stopPropagation(); setIsWishlisted(!isWishlisted); }}
            className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart size={13} className={isWishlisted ? 'fill-purple-600 text-purple-600' : 'text-purple-300'} />
          </button>
        )}
        {!isSoldOut && product.originalPrice && product.originalPrice > product.price && (
          <div className="absolute top-2 left-2 bg-[#C9A84C] text-white text-xs px-2 py-0.5 rounded-sm tracking-wider font-medium">
            -{Math.round((1 - product.price / product.originalPrice) * 100)}%
          </div>
        )}
      </div>
      <div className="p-3 border-t border-purple-50">
        <p className={`text-sm line-clamp-2 min-h-[2.5rem] leading-snug font-light tracking-wide ${
          isSoldOut ? 'text-gray-400' : 'text-[#2D1B4E]'
        }`}>{product.name}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`price-current text-base ${isSoldOut ? 'text-gray-400' : ''}`}>${product.price.toFixed(2)}</span>
          {!isSoldOut && product.originalPrice && product.originalPrice > product.price && (
            <span className="price-original text-xs">${product.originalPrice.toFixed(2)}</span>
          )}
        </div>
        {isSoldOut ? (
          <p className="text-xs text-purple-400 font-medium mt-1">{language === 'zh' ? '已售罄' : 'Out of Stock'}</p>
        ) : (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-purple-300">{language === 'zh' ? '已售' : 'Sold'}: {product.sold || 0}</span>
            {typeof product.stock === 'number' && product.stock > 0 && (
              <>
                <span className="text-purple-100">|</span>
                <span className="text-xs text-purple-500">{language === 'zh' ? '庫存' : 'Stock'}: {product.stock}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { language, toggleLanguage } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  // Terms and Conditions agreement
  const { hasAgreed, isLoading: termsLoading, acceptTerms, rejectTerms } = useTermsAgreement();
  const showTermsModal = hasAgreed === false && !termsLoading;

  // 使用 TRPC 獲取購物車數據
  const { data: cartItems = [] } = trpc.cart.list.useQuery(undefined, { enabled: isAuthenticated });

  // 計算購物車項目總數
  const cartCount = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);

  // 使用 TRPC 獲取商品、分類和 Banner 數據
  const { data: apiProducts = [], isLoading: productsLoading } = trpc.products.list.useQuery({ limit: 100 });
  const { data: apiCategories = [], isLoading: categoriesLoading } = trpc.categories.list.useQuery();
  const { data: bannerData = [] } = trpc.banners.getActive.useQuery();

  // 直接使用 API 數據
  const products: Product[] = apiProducts.map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    originalPrice: p.originalPrice,
    image: p.image,
    categoryId: p.categoryId,
    sold: p.sold || 0,
    rating: p.rating,
    description: p.description,
    stock: p.stock || 0,
    status: p.status || 'active',
  }));
  const categories: Category[] = apiCategories.map((c: any) => ({
    id: c.id,
    name: c.name,
    nameEn: c.nameEn,
    icon: c.icon || '💎',
    order: c.order || 0,
  }));

  // 過濾商品
  const filteredProducts = activeCategory
    ? products.filter((p) => p.categoryId === activeCategory)
    : products;

  // 使用動態 Banner 數據
  const bannerSlides = bannerData.length > 0
    ? bannerData.map((banner: any) => ({
        id: banner.id,
        image: banner.image,
        title: language === 'zh' ? banner.title : (banner.titleEn || banner.title),
        subtitle: language === 'zh' ? banner.subtitle : (banner.subtitleEn || banner.subtitle),
        cta: language === 'zh' ? banner.ctaText : (banner.ctaTextEn || banner.ctaText || '查看詳情'),
        link: banner.link,
      }))
    : defaultBannerSlides;

  useEffect(() => {
    if (bannerSlides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [bannerSlides.length]);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // If user hasn't agreed to terms, show only the modal
  if (showTermsModal) {
    return (
      <div className="min-h-screen" style={{ background: '#FAF7FF' }}>
        <TermsAndConditionsModal
          isOpen={true}
          onAccept={acceptTerms}
          onReject={() => {
            rejectTerms();
            window.location.href = 'about:blank';
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAF7FF' }}>

      {/* Top utility bar */}
      <div style={{ background: '#1A0A2E', color: '#B07FCC' }} className="text-xs py-1.5 hidden sm:block">
        <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white transition-colors tracking-wide">Home</Link>
            <span className="hover:text-white transition-colors cursor-pointer tracking-wide">Collect this site</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/orders" className="hover:text-white transition-colors tracking-wide">My Order</Link>
            <span className="hover:text-white transition-colors cursor-pointer tracking-wide">Apply for</span>
            <span className="hover:text-white transition-colors cursor-pointer tracking-wide">Mobile Mall</span>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <header className="bg-white sticky top-0 z-50" style={{ borderBottom: '1px solid #E8D5F5', boxShadow: '0 2px 12px rgba(74,29,107,0.08)' }}>
        <div className="max-w-[1200px] mx-auto px-2 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4A1D6B, #7B3FA0)' }}>
              <Gem size={16} className="text-white" />
            </div>
            <span className="font-semibold hidden sm:block tracking-widest text-sm" style={{ color: '#2D1B4E', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.2rem', letterSpacing: '0.15em' }}>Jade Emporium</span>
          </Link>

          {/* Search bar */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <div className="flex rounded-sm overflow-hidden" style={{ border: '1.5px solid #7B3FA0' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'zh' ? '搜尋翡翠珠寶...' : 'Search jadeite jewellery...'}
                className="flex-1 px-3 py-1.5 text-sm outline-none bg-white"
                style={{ color: '#2D1B4E' }}
              />
              <button
                className="text-white px-4 py-1.5 transition-colors"
                style={{ background: '#4A1D6B' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#7B3FA0')}
                onMouseLeave={e => (e.currentTarget.style.background = '#4A1D6B')}
              >
                <Search size={15} />
              </button>
            </div>
            {/* Search tags */}
            <div className="flex gap-3 mt-1 flex-wrap">
              {(language === 'zh'
                ? ['翡翠手鐲', '翡翠吊墜', '翡翠戒指', '翡翠耳環', '玉石項鍊']
                : ['Jade Bangle', 'Jade Pendant', 'Jade Ring', 'Jade Earring', 'Jadeite']
              ).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="text-xs transition-colors"
                  style={{ color: '#B07FCC' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#4A1D6B')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#B07FCC')}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <button
              onClick={toggleLanguage}
              className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs sm:text-sm rounded transition-colors"
              style={{ color: '#7B3FA0' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#4A1D6B'; e.currentTarget.style.background = '#F5EEFF'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#7B3FA0'; e.currentTarget.style.background = 'transparent'; }}
              title={language === 'zh' ? 'Switch to English' : 'Switch to Chinese'}
            >
              <Globe size={16} />
              <span className="font-medium tracking-wider">{language === 'zh' ? 'EN' : 'ZH'}</span>
            </button>

            <Link href="/cart" className="relative p-2 transition-colors" style={{ color: '#7B3FA0' }}>
              <ShoppingCart size={21} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-white text-xs rounded-full flex items-center justify-center" style={{ background: '#C9A84C', fontSize: '10px' }}>
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 text-sm transition-colors"
                  style={{ color: '#7B3FA0' }}
                >
                  <User size={20} />
                  <span className="hidden sm:block font-light tracking-wide">{user.name}</span>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-sm z-50" style={{ border: '1px solid #E8D5F5', boxShadow: '0 8px 32px rgba(74,29,107,0.12)' }}>
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid #E8D5F5' }}>
                      <p className="text-sm font-medium" style={{ color: '#2D1B4E' }}>{user.name}</p>
                      <p className="text-xs" style={{ color: '#B07FCC' }}>{user.email}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block" style={{
                        background: user.role === 'admin' ? '#F5EEFF' : '#EEF2FF',
                        color: user.role === 'admin' ? '#4A1D6B' : '#4338CA'
                      }}>
                        {user.role === 'admin' ? (language === 'zh' ? '管理員' : 'Admin') : (language === 'zh' ? '用戶' : 'User')}
                      </span>
                    </div>
                    <Link href="/orders" className="block px-4 py-2 text-sm transition-colors" style={{ color: '#2D1B4E' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F5EEFF')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {language === 'zh' ? '我的訂單' : 'My Orders'}
                    </Link>
                    {user.role === 'admin' && (
                      <Link href="/admin" className="block px-4 py-2 text-sm transition-colors" style={{ color: '#2D1B4E' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F5EEFF')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        {language === 'zh' ? '管理儀表板' : 'Admin Dashboard'}
                      </Link>
                    )}
                    <button
                      onClick={() => { logout(); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors"
                      style={{ color: '#7B3FA0', borderTop: '1px solid #E8D5F5' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F5EEFF')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <LogOut size={14} />
                      {language === 'zh' ? '登出' : 'Logout'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-1.5 text-sm transition-colors" style={{ color: '#7B3FA0' }}>
                <User size={20} />
                <span className="hidden sm:block font-light tracking-widest text-xs">{language === 'zh' ? '登入' : 'SIGN IN'}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="max-w-[1200px] mx-auto px-4 py-5">
        <div className="flex gap-5">
          {/* Left category sidebar */}
          <aside className="w-44 shrink-0 hidden lg:block">
            <div className="bg-white rounded-sm overflow-hidden" style={{ border: '1px solid #E8D5F5', boxShadow: '0 2px 8px rgba(74,29,107,0.06)' }}>
              <div className="px-4 py-2.5" style={{ background: '#4A1D6B' }}>
                <span className="text-white text-xs tracking-widest font-light uppercase">{language === 'zh' ? '商品分類' : 'Categories'}</span>
              </div>
              {categoriesLoading ? (
                <div className="p-4 text-center text-purple-300 text-sm">{language === 'zh' ? '加載中...' : 'Loading...'}</div>
              ) : (
                <>
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                    style={{
                      background: activeCategory === null ? '#F5EEFF' : 'transparent',
                      color: activeCategory === null ? '#4A1D6B' : '#2D1B4E',
                      borderBottom: '1px solid #F5EEFF',
                      fontWeight: activeCategory === null ? '500' : '300',
                    }}
                  >
                    {language === 'zh' ? '全部分類' : 'All Categories'}
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                      style={{
                        background: activeCategory === cat.id ? '#F5EEFF' : 'transparent',
                        color: activeCategory === cat.id ? '#4A1D6B' : '#2D1B4E',
                        borderBottom: '1px solid #F5EEFF',
                        fontWeight: activeCategory === cat.id ? '500' : '300',
                      }}
                    >
                      {cat.name}
                    </button>
                  ))}
                </>
              )}
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Hero Banner Carousel */}
            {bannerSlides.length > 0 ? (
              <div className="relative rounded-sm overflow-hidden mb-5" style={{ height: '340px' }}>
                {bannerSlides.map((slide, idx) => (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                  >
                    <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center" style={{ background: 'linear-gradient(to right, rgba(26,10,46,0.75) 0%, rgba(26,10,46,0.3) 60%, transparent 100%)' }}>
                      <div className="ml-10 text-white">
                        <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: '#C9A84C' }}>{language === 'zh' ? '精選珍品' : 'Featured Collection'}</p>
                        <h2 className="text-3xl font-light tracking-wide" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{slide.title}</h2>
                        {slide.subtitle && <p className="text-sm mt-1 font-light opacity-80 tracking-wider">{slide.subtitle}</p>}
                        <button
                          onClick={() => slide.link ? window.location.href = slide.link : null}
                          className="mt-5 text-white text-xs tracking-[0.2em] px-6 py-2.5 transition-all"
                          style={{ border: '1px solid #C9A84C', background: 'transparent' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#C9A84C'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          {slide.cta || (language === 'zh' ? '探索更多' : 'EXPLORE MORE')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Slide indicators */}
                <div className="absolute bottom-4 right-6 flex gap-2">
                  {bannerSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className="transition-all"
                      style={{
                        width: idx === currentSlide ? '20px' : '6px',
                        height: '2px',
                        background: idx === currentSlide ? '#C9A84C' : 'rgba(255,255,255,0.5)',
                        border: 'none',
                        padding: 0,
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative rounded-sm overflow-hidden mb-5 flex items-center justify-center" style={{ height: '340px', background: 'linear-gradient(135deg, #1A0A2E 0%, #4A1D6B 100%)' }}>
                <div className="text-center">
                  <Gem size={40} className="mx-auto mb-3" style={{ color: '#C9A84C' }} />
                  <p className="text-white/60 text-sm tracking-widest">{language === 'zh' ? '翡翠珍品' : 'JADE COLLECTION'}</p>
                </div>
              </div>
            )}

            {/* Products section */}
            <section className="bg-white rounded-sm mb-5" style={{ border: '1px solid #E8D5F5', boxShadow: '0 2px 8px rgba(74,29,107,0.06)' }}>
              <div className="section-title flex items-center justify-between">
                <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.1rem', letterSpacing: '0.08em' }}>
                  {t('recommended', language)}
                </span>
                <Link href="/products" className="text-xs flex items-center gap-1 transition-colors" style={{ color: '#B07FCC' }}>
                  {t('more', language)} <ChevronRight size={12} />
                </Link>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {productsLoading ? (
                  <div className="col-span-full text-center py-12" style={{ color: '#B07FCC' }}>
                    <Gem size={28} className="mx-auto mb-2 animate-pulse" />
                    <p className="text-sm tracking-widest">{language === 'zh' ? '加載珍品中...' : 'Loading...'}</p>
                  </div>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12" style={{ color: '#B07FCC' }}>
                    <p className="text-sm tracking-widest">{language === 'zh' ? '暫無商品' : 'No products available'}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Top List */}
            <section className="bg-white rounded-sm mb-5" style={{ border: '1px solid #E8D5F5', boxShadow: '0 2px 8px rgba(74,29,107,0.06)' }}>
              <div className="section-title flex items-center justify-between">
                <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.1rem', letterSpacing: '0.08em' }}>
                  {language === 'zh' ? '熱銷排行' : 'Top Sellers'}
                </span>
                <Link href="/products" className="text-xs flex items-center gap-1 transition-colors" style={{ color: '#B07FCC' }}>
                  {t('more', language)} <ChevronRight size={12} />
                </Link>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {products.slice(0, 8).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Trust badges - jade luxury style */}
      <div className="py-8 mt-2" style={{ background: 'white', borderTop: '1px solid #E8D5F5', borderBottom: '1px solid #E8D5F5' }}>
        <div className="max-w-[1200px] mx-auto px-4">
          {/* Gold divider */}
          <div className="jade-divider mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: <Gem size={22} />, title: language === 'zh' ? '天然翡翠' : 'Natural Jadeite', desc: language === 'zh' ? '100% A貨保證' : '100% Grade A Certified' },
              { icon: <Shield size={22} />, title: language === 'zh' ? '正品保障' : 'Authenticity Guarantee', desc: language === 'zh' ? '附鑑定證書' : 'With Certificate' },
              { icon: <Truck size={22} />, title: language === 'zh' ? '全球配送' : 'Worldwide Shipping', desc: language === 'zh' ? '安全包裝' : 'Secure Packaging' },
              { icon: <Award size={22} />, title: language === 'zh' ? '專業鑑定' : 'Expert Appraisal', desc: language === 'zh' ? '30年翡翠經驗' : '30 Years Experience' },
            ].map((badge) => (
              <div key={badge.title} className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#F5EEFF', color: '#4A1D6B' }}>
                  {badge.icon}
                </div>
                <div>
                  <p className="text-sm font-medium tracking-wide" style={{ color: '#2D1B4E', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '0.95rem' }}>{badge.title}</p>
                  <p className="text-xs mt-0.5 font-light" style={{ color: '#B07FCC' }}>{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="jade-divider mt-6" />
        </div>
      </div>

      {/* Footer */}
      <footer className="py-10" style={{ background: '#1A0A2E', color: '#B07FCC' }}>
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4A1D6B, #7B3FA0)' }}>
                  <Gem size={15} className="text-white" />
                </div>
                <span className="text-white font-light tracking-[0.2em]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.1rem' }}>Jade Emporium</span>
              </div>
              <p className="text-sm font-light leading-relaxed tracking-wide" style={{ color: '#B07FCC' }}>
                {language === 'zh' ? '您的一站式翡翠珠寶購物中心' : 'Your premier jadeite jewellery destination.'}
              </p>
            </div>
            <div>
              <h4 className="text-white font-light mb-4 tracking-widest text-xs uppercase">{language === 'zh' ? '快速連結' : 'Quick Links'}</h4>
              <ul className="space-y-2 text-sm font-light">
                {(language === 'zh' ? ['首頁', '商品', '分類', '促銷', '關於我們'] : ['Home', 'Products', 'Categories', 'Promotions', 'About Us']).map((link) => (
                  <li key={link}>
                    <a href="#" className="transition-colors hover:text-white tracking-wide">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-light mb-4 tracking-widest text-xs uppercase">{language === 'zh' ? '幫助 / 政策' : 'Help / Policy'}</h4>
              <ul className="space-y-2 text-sm font-light">
                <li><Link href="/terms-of-service" className="transition-colors hover:text-white tracking-wide">{language === 'zh' ? '服務條款' : 'Terms of Service'}</Link></li>
                <li><Link href="/privacy-policy" className="transition-colors hover:text-white tracking-wide">{language === 'zh' ? '隱私權政策' : 'Privacy Policy'}</Link></li>
                <li><Link href="/disclaimer" className="transition-colors hover:text-white tracking-wide">{language === 'zh' ? '免責聲明' : 'Disclaimer'}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-light mb-4 tracking-widest text-xs uppercase">{language === 'zh' ? '聯繫方式' : 'Contact'}</h4>
              <div className="space-y-3 text-sm font-light">
                <div className="flex items-center gap-2">
                  <Phone size={13} style={{ color: '#C9A84C' }} />
                  <span className="tracking-wide">400-2647-3947</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={13} className="mt-0.5 shrink-0" style={{ color: '#C9A84C' }} />
                  <span className="whitespace-pre-line leading-relaxed">{`UNIT 2703, 27/F YEN SHENG CENTRE 64\nHOI YUEN ROAD, KWUN TONG\nKowloon`}</span>
                </div>
              </div>
            </div>
          </div>
          {/* Gold divider */}
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)', margin: '0 0 1.5rem 0' }} />
          <p className="text-center text-xs tracking-widest font-light" style={{ color: '#7B3FA0' }}>
            Copyright © 2013-2026 Jade Emporium Ltd. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Right floating buttons */}
      <div className="fixed right-4 bottom-20 flex flex-col gap-2 z-40">
        <button
          className="w-11 h-11 bg-white flex flex-col items-center justify-center gap-0.5 transition-all"
          style={{ border: '1px solid #E8D5F5', boxShadow: '0 2px 12px rgba(74,29,107,0.12)', borderRadius: '2px', color: '#7B3FA0' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#7B3FA0'; e.currentTarget.style.color = '#4A1D6B'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8D5F5'; e.currentTarget.style.color = '#7B3FA0'; }}
        >
          <MessageCircle size={15} />
          <span className="text-xs leading-none" style={{ fontSize: '9px', letterSpacing: '0.05em' }}>{language === 'zh' ? '服務' : 'Service'}</span>
        </button>

        {showBackToTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-11 h-11 bg-white flex flex-col items-center justify-center gap-0.5 transition-all"
            style={{ border: '1px solid #E8D5F5', boxShadow: '0 2px 12px rgba(74,29,107,0.12)', borderRadius: '2px', color: '#7B3FA0' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#7B3FA0'; e.currentTarget.style.color = '#4A1D6B'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8D5F5'; e.currentTarget.style.color = '#7B3FA0'; }}
          >
            <ArrowUp size={15} />
            <span className="text-xs leading-none" style={{ fontSize: '9px', letterSpacing: '0.05em' }}>{language === 'zh' ? '頂部' : 'Top'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * ShopMart - Home Page (Frontend)
 * Design: 活力促銷電商風 - 紅白主色調
 * Layout: 頂部雙層導航 + 左側分類欄 + 主內容區域
 * Primary: #E93323 (Red), Background: #F5F5F5
 * 
 * API Integration: 使用 TRPC 實時獲取商品和分類數據
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingCart, Search, User, ChevronRight, Phone, MessageCircle, ArrowUp, Heart, MapPin, Globe, LogOut } from 'lucide-react';
import { products as defaultProducts, categories as defaultCategories } from '@/lib/data';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { t } from '@/lib/translations';
import { getProductName, getCategoryName } from '@/lib/data-translations';
import { trpc } from '@/lib/trpc';
import type { Product } from '@/lib/data';
import { toast } from 'sonner';

// Unsplash product images for categories
const categoryImages = [
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200&h=200&fit=crop',
];

const bannerSlides = [
  {
    id: 1,
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663458665119/8Wwg5mRcrYyNGMcAgK6gn2/banner-fashion-JeSN33rLX87SGrwxcroe5B.webp',
    title: 'New Arrivals',
    subtitle: 'Elegant Dress Collection',
    cta: 'Shop Now',
  },
  {
    id: 2,
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663458665119/8Wwg5mRcrYyNGMcAgK6gn2/banner-electronics-7i74hvSeGRXxTEuJNZKVcx.webp',
    title: 'Latest Tech',
    subtitle: 'Gadgets & Electronics',
    cta: 'Explore',
  },
  {
    id: 3,
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663458665119/8Wwg5mRcrYyNGMcAgK6gn2/hero-banner-e7LkPqEqJMoLrHu2UyeUy2.webp',
    title: 'Summer Sale',
    subtitle: 'Up to 50% Off',
    cta: 'Grab Deals',
  },
];

// 轉換數據庫商品格式為前端格式
function convertDbProductToFrontend(dbProduct: any): Product {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    price: dbProduct.price / 100, // 從分轉換為元
    originalPrice: dbProduct.originalPrice ? dbProduct.originalPrice / 100 : undefined,
    image: dbProduct.image,
    categoryId: dbProduct.categoryId,
    sold: dbProduct.sold || 0,
    rating: dbProduct.rating ? dbProduct.rating / 100 : 0, // 從 0-500 轉換為 0-5
    description: dbProduct.description,
    stock: dbProduct.stock || 0,
    status: dbProduct.status || 'active',
    createdAt: dbProduct.createdAt,
    updatedAt: dbProduct.updatedAt,
  };
}

// 轉換數據庫分類格式為前端格式
function convertDbCategoryToFrontend(dbCategory: any): any {
  return {
    id: dbCategory.id,
    name: dbCategory.name,
    nameEn: dbCategory.nameEn,
    icon: dbCategory.icon || '📦',
    order: dbCategory.order || 0,
  };
}

function ProductCard({ product }: { product: Product }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [, navigate] = useLocation();
  const { language } = useLanguage();

  return (
    <div className="product-card bg-white border border-gray-100 rounded overflow-hidden group cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
      <div className="relative overflow-hidden" style={{ paddingTop: '100%' }}>
        <img
          src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop'}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop';
          }}
        />
        <button
          onClick={(e) => { e.stopPropagation(); setIsWishlisted(!isWishlisted); }}
          className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart size={14} className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
        </button>
        {product.originalPrice && product.originalPrice > product.price && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded">
            -{Math.round((1 - product.price / product.originalPrice) * 100)}%
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm text-gray-700 line-clamp-2 min-h-[2.5rem] leading-tight">{getProductName(product.id, language)}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="price-current text-base">${product.price.toFixed(2)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="price-original text-xs">${product.originalPrice.toFixed(2)}</span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">{product.sold} {language === 'zh' ? '已賣' : 'Sold'}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  // 從 TRPC 獲取購物車數據
  const { data: cartItems = [] } = trpc.cart.list.useQuery();
  
  // 計算購物車項目總數
  const cartCount = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { language, toggleLanguage } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  
  // 使用 TRPC 獲取商品和分類數據
  const { data: apiProducts = [], isLoading: productsLoading } = trpc.products.list.useQuery({ limit: 100 });
  const { data: apiCategories = [], isLoading: categoriesLoading } = trpc.categories.list.useQuery();
  
  // 轉換 API 數據為前端格式
  const products = apiProducts.length > 0 
    ? apiProducts.map(convertDbProductToFrontend)
    : defaultProducts;
  
  const categories = apiCategories.length > 0
    ? apiCategories.map(convertDbCategoryToFrontend)
    : defaultCategories;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const topListProducts = products.slice(0, 3);
  const promotionProducts = products.slice(4, 8);
  const recommendedProducts = products.slice(0, 2);
  const shopStreetProducts = products.slice(0, 3);
  const topOneProducts = products.slice(0, 3);
  const youMayLikeProducts = products.slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top utility bar */}
      <div className="bg-gray-700 text-gray-300 text-xs py-1.5 hidden sm:block">
        <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="hover:text-white transition-colors cursor-pointer">Collect this site</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/orders" className="hover:text-white transition-colors">My Order</Link>
            <span className="hover:text-white transition-colors cursor-pointer">Apply for</span>
            <span className="hover:text-white transition-colors cursor-pointer">Mobile Mall</span>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-2 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-600 rounded flex items-center justify-center">
              <ShoppingCart size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-800 text-base sm:text-lg hidden sm:block">ShopMart</span>
          </Link>

          {/* Search bar - hidden on mobile */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <div className="flex border-2 border-red-500 rounded overflow-hidden">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Please enter the item to search"
                className="flex-1 px-3 py-1.5 text-xs sm:text-sm outline-none"
              />
              <button className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-5 py-1.5 sm:py-2 transition-colors">
                <Search size={16} />
              </button>
            </div>
            {/* Hot search tags */}
            <div className="flex gap-2 mt-1 flex-wrap">
              {['Tea', 'Keyboard', 'Shoes', 'Dress', 'Fragrance'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="text-xs text-gray-500 hover:text-red-500 transition-colors"
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
              className="flex items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1.5 text-xs sm:text-sm text-gray-600 hover:text-red-500 hover:bg-gray-100 rounded transition-colors"
              title={language === 'zh' ? 'Switch to English' : 'Switch to Chinese'}
            >
              <Globe size={18} />
              <span className="font-medium text-xs sm:text-sm">{language === 'zh' ? 'EN' : 'ZH'}</span>
            </button>
            
            <Link href="/cart" className="relative p-2 hover:text-red-500 transition-colors">
              <ShoppingCart size={22} className="text-gray-600" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-500 transition-colors"
                >
                  <User size={20} />
                  <span className="hidden sm:block font-medium">{user.name}</span>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded shadow-lg border border-gray-100 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role === 'admin' ? (language === 'zh' ? '管理員' : 'Admin') : (language === 'zh' ? '用戶' : 'User')}
                      </span>
                    </div>
                    <Link href="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      {language === 'zh' ? '我的訂單' : 'My Orders'}
                    </Link>
                    {user.role === 'admin' && (
                      <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        {language === 'zh' ? '管理儀表板' : 'Admin Dashboard'}
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-gray-100"
                    >
                      <LogOut size={16} />
                      {language === 'zh' ? '登出' : 'Logout'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-500 transition-colors">
                <User size={20} />
                <span className="hidden sm:block font-medium">{language === 'zh' ? '登入' : 'SIGN IN'}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="max-w-[1200px] mx-auto px-4 py-4">
        <div className="flex gap-4">
          {/* Left category sidebar */}
          <aside className="w-44 shrink-0 hidden lg:block">
            <div className="bg-white rounded shadow-sm overflow-hidden">
              {categoriesLoading ? (
                <div className="p-4 text-center text-gray-500">{language === 'zh' ? '加載中...' : 'Loading...'}</div>
              ) : (
                <>
                  <button
                    onClick={() => setActiveCategory(null)}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors border-b border-gray-50 ${
                      activeCategory === null
                        ? 'bg-red-500 text-white font-medium'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-red-500'
                    }`}
                  >
                    {language === 'zh' ? '全部分類' : 'All Categories'}
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors border-b border-gray-50 last:border-0 ${
                        activeCategory === cat.id
                          ? 'bg-red-500 text-white font-medium'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-red-500'
                      }`}
                    >
                      {getCategoryName(cat.name, language)}
                    </button>
                  ))}
                </>
              )}
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Hero Banner Carousel */}
            <div className="relative rounded overflow-hidden mb-4" style={{ height: '320px' }}>
              {bannerSlides.map((slide, idx) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${idx === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                >
                  <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent flex items-center">
                    <div className="ml-12 text-white">
                      <p className="text-sm uppercase tracking-widest opacity-80">{slide.title}</p>
                      <h2 className="text-3xl font-bold mt-1">{slide.subtitle}</h2>
                      <button className="mt-4 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded text-sm font-medium transition-colors">
                        {slide.cta}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {/* Slide indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {bannerSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-2 h-2 rounded-full transition-colors ${idx === currentSlide ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </div>

            {/* Recommended section */}
            <section className="bg-white rounded shadow-sm mb-4">
              <div className="section-title flex items-center justify-between">
                <span>{t('recommended', language)}</span>
                <Link href="/products" className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
                  {t('more', language)} <ChevronRight size={12} />
                </Link>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {productsLoading ? (
                  <div className="col-span-full text-center text-gray-500 py-8">{language === 'zh' ? '加載商品中...' : 'Loading products...'}</div>
                ) : (
                  <>
                    {recommendedProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                    {/* Placeholder cards */}
                    <div className="bg-gray-50 border border-dashed border-gray-200 rounded flex items-center justify-center min-h-[180px] text-gray-300 text-sm">
                      {language === 'zh' ? '更多商品' : 'More Products'}
                    </div>
                    <div className="bg-gray-50 border border-dashed border-gray-200 rounded flex items-center justify-center min-h-[180px] text-gray-300 text-sm">
                      {language === 'zh' ? '敬請期待' : 'Coming Soon'}
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* SHOP STREET + TOP ONE side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* SHOP STREET */}
              <section className="bg-white rounded shadow-sm">
                <div className="section-title flex items-center justify-between">
                  <span className="font-bold tracking-wide">{language === 'zh' ? '購物街' : 'SHOP STREET'}</span>
                  <Link href="/products" className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
                    <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="p-3 grid grid-cols-2 gap-2">
                  {shopStreetProducts.map((product) => (
                    <div key={product.id} className="group cursor-pointer">
                      <div className="relative overflow-hidden rounded" style={{ paddingTop: '100%' }}>
                        <img
                          src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop'}
                          alt={product.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop'; }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1">{product.name}</p>
                      <span className="price-current text-sm">${product.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* TOP ONE */}
              <section className="bg-white rounded shadow-sm">
                <div className="section-title flex items-center justify-between">
                  <span className="font-bold tracking-wide">{language === 'zh' ? '熱銷排行' : 'TOP ONE'}</span>
                  <Link href="/products" className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
                    <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="p-3 space-y-2">
                  {topOneProducts.map((product, idx) => (
                    <div key={product.id} className="flex items-center gap-3 group cursor-pointer hover:bg-gray-50 rounded p-1 transition-colors">
                      <div className="relative shrink-0">
                        <div className="w-16 h-16 rounded overflow-hidden">
                          <img
                            src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop'}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop'; }}
                          />
                        </div>
                        <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-orange-400' : 'bg-yellow-500'
                        }`}>
                          {idx + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 line-clamp-2">{product.name}</p>
                        <span className="price-current text-sm">${product.price.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Top List */}
            <section className="bg-white rounded shadow-sm mb-4">
              <div className="section-title flex items-center justify-between">
                <span>{language === 'zh' ? '排行榜' : 'Top List'}</span>
                <Link href="/products" className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
                  {t('more', language)} <ChevronRight size={12} />
                </Link>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {topListProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>

            {/* Promotions */}
            <section className="bg-white rounded shadow-sm mb-4">
              <div className="section-title flex items-center justify-between">
                <span>{language === 'zh' ? '促銷活動' : 'Promotions'}</span>
                <Link href="/products" className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
                  {t('more', language)} <ChevronRight size={12} />
                </Link>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {promotionProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>

            {/* You May Also Like */}
            <section className="bg-white rounded shadow-sm mb-4">
              <div className="section-title">{language === 'zh' ? '您可能也喜歡' : 'You May Also Like'}</div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {youMayLikeProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Trust badges */}
      <div className="bg-white border-t border-gray-100 py-6 mt-4">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🏪', title: language === 'zh' ? '商品齊全' : 'Complete variety', desc: language === 'zh' ? '百萬商品' : 'Millions of products' },
              { icon: '🚚', title: language === 'zh' ? '快速配送' : 'Fast delivery', desc: language === 'zh' ? '同日配送' : 'Same day shipping' },
              { icon: '✅', title: language === 'zh' ? '正品保證' : 'Genuine product', desc: language === 'zh' ? '100%正品' : '100% authentic' },
              { icon: '💰', title: language === 'zh' ? '天天低價' : 'Low price every day', desc: language === 'zh' ? '最優惠價格' : 'Best deals guaranteed' },
            ].map((badge) => (
              <div key={badge.title} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-xl shrink-0">
                  {badge.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">{badge.title}</p>
                  <p className="text-xs text-gray-400">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-8">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                  <ShoppingCart size={16} className="text-white" />
                </div>
                <span className="text-white font-bold text-lg">ShopMart</span>
              </div>
              <p className="text-sm">{language === 'zh' ? '您的一站式在線購物目的地，擁有數百萬種商品。' : 'Your one-stop online shopping destination with millions of products.'}</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">{language === 'zh' ? '快速連結' : 'Quick Links'}</h4>
              <ul className="space-y-1.5 text-sm">
                {(language === 'zh' ? ['首頁', '商品', '分類', '促銷', '關於我們'] : ['Home', 'Products', 'Categories', 'Promotions', 'About Us']).map((link) => (
                  <li key={link}><a href="#" className="hover:text-white transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">{language === 'zh' ? '客戶服務' : 'Customer Service'}</h4>
              <ul className="space-y-1.5 text-sm">
                {(language === 'zh' ? ['我的帳戶', '訂單追蹤', '退貨', '常見問題', '聯繫我們'] : ['My Account', 'Order Tracking', 'Returns', 'FAQ', 'Contact Us']).map((link) => (
                  <li key={link}><a href="#" className="hover:text-white transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">{language === 'zh' ? '聯繫方式' : 'Contact'}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone size={14} />
                  <span>400-2647-3947</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 shrink-0" />
                  <span>{language === 'zh' ? '西安市奇行時代廣場A座1101-04室' : 'Room 1101-04, Block A, Qihang Times Square, Xi\'an City'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-4 text-center text-xs">
            <p>Copyright © 2013-2024 ShopMart Network Technology Co., Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Right floating buttons */}
      <div className="fixed right-4 bottom-20 flex flex-col gap-2 z-40">
        <button className="w-12 h-12 bg-white border border-gray-200 shadow-md rounded flex flex-col items-center justify-center gap-0.5 hover:border-red-400 hover:text-red-500 transition-colors group">
          <MessageCircle size={16} className="text-gray-500 group-hover:text-red-500" />
          <span className="text-xs text-gray-500 group-hover:text-red-500 leading-none">{language === 'zh' ? '服務' : 'Service'}</span>
        </button>

        {showBackToTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-12 h-12 bg-white border border-gray-200 shadow-md rounded flex flex-col items-center justify-center gap-0.5 hover:border-red-400 hover:text-red-500 transition-colors group"
          >
            <ArrowUp size={16} className="text-gray-500 group-hover:text-red-500" />
            <span className="text-xs text-gray-500 group-hover:text-red-500 leading-none">{language === 'zh' ? '頂部' : 'Top'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

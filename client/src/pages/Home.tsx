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
import { useAuth } from '@/_core/hooks/useAuth';
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

// 默認 Banner 幻燈片（備用）
const defaultBannerSlides = [
  {
    id: 1,
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663458665119/8Wwg5mRcrYyNGMcAgK6gn2/banner-fashion-JeSN33rLX87SGrwxcroe5B.webp',
    title: 'New Arrivals',
    subtitle: 'Elegant Dress Collection',
    cta: 'Shop Now',
    productId: null,
  },
  {
    id: 2,
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663458665119/8Wwg5mRcrYyNGMcAgK6gn2/banner-electronics-7i74hvSeGRXxTEuJNZKVcx.webp',
    title: 'Latest Tech',
    subtitle: 'Gadgets & Electronics',
    cta: 'Explore',
    productId: null,
  },
  {
    id: 3,
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663458665119/8Wwg5mRcrYyNGMcAgK6gn2/hero-banner-e7LkPqEqJMoLrHu2UyeUy2.webp',
    title: 'Summer Sale',
    subtitle: 'Up to 50% Off',
    cta: 'Grab Deals',
    productId: null,
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

// 轉換 NFT 商品格式為前端格式
function convertNFTProductToFrontend(nftProduct: any): Product {
  return {
    id: nftProduct.id,
    name: nftProduct.name,
    price: nftProduct.price,
    originalPrice: nftProduct.originalPrice,
    image: nftProduct.image || 'https://via.placeholder.com/300x300?text=NFT',
    categoryId: 0,
    sold: 0,
    rating: 0,
    description: nftProduct.description || 'NFT Asset',
    stock: 1,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
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
        <p className="text-sm text-gray-700 line-clamp-2 min-h-[2.5rem] leading-tight">{product.name}</p>
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
  const [activeCategory, setActiveCategory] = useState<number | null>(1);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { language, toggleLanguage } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  
  // 使用 TRPC 獲取購物車數據
  const { data: cartItems = [] } = trpc.cart.list.useQuery(undefined, { enabled: isAuthenticated });
  
  // 計算購物車項目總數
  const cartCount = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
  
  // 使用 TRPC 獲取 NFT 商品（商家庫存）
  const { data: nftProductsData, isLoading: nftLoading } = trpc.nftProducts.getMerchantNFTProducts.useQuery();
  const nftProducts = (nftProductsData?.products || []).map(convertNFTProductToFrontend);
  
  // 使用 TRPC 獲取商品和分類數據
  const { data: apiProducts = [], isLoading: productsLoading } = trpc.products.list.useQuery({ limit: 100 });
  const { data: apiCategories = [], isLoading: categoriesLoading } = trpc.categories.list.useQuery();
  
  // 轉換 API 數據為前端格式（不使用本地後備數據，確保與數據庫同步）
  const dbProducts = apiProducts.map(convertDbProductToFrontend);
  const categories = apiCategories.map(convertDbCategoryToFrontend);
  
  // 合併 NFT 商品和數據庫商品 - 優先顯示 NFT 商品，然後是數據庫商品
  const products = [...nftProducts, ...dbProducts];

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
  
  // 生成動態 Banner 幻燈片 - 使用熱銷商品圖片，確保圖片有效
  const bannerSlides = topOneProducts.length > 0 
    ? topOneProducts.map((product, idx) => {
        // 如果商品圖片無效或缺失，使用默認 Banner 圖片
        const imageUrl = product.image && product.image.trim() && !product.image.includes('placeholder')
          ? product.image
          : defaultBannerSlides[idx % defaultBannerSlides.length].image;
        return {
          id: idx + 1,
          image: imageUrl,
          title: product.name,
          subtitle: `$${product.price.toFixed(2)}`,
          cta: 'View Details',
          productId: product.id,
        };
      })
    : defaultBannerSlides;

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

            {/* NFT Marketplace section */}
            <section className="bg-white rounded shadow-sm mb-4">
              <div className="section-title flex items-center justify-between">
                <span>{nftLoading ? 'Loading NFT Products...' : 'NFT Marketplace'}</span>
                <Link href="/nft-marketplace" className="text-red-500 text-sm hover:underline flex items-center gap-1">
                  More <ChevronRight size={16} />
                </Link>
              </div>
              {nftLoading ? (
                <div className="p-8 text-center text-gray-500">Loading NFT products...</div>
              ) : nftProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
                  {nftProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">No NFT products available</div>
              )}
            </section>

            {/* Top list section */}
            <section className="bg-white rounded shadow-sm mb-4">
              <div className="section-title">
                <span>{language === 'zh' ? '熱銷商品' : 'Hot Products'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
                {topListProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>

            {/* Promotion section */}
            <section className="bg-white rounded shadow-sm mb-4">
              <div className="section-title">
                <span>{language === 'zh' ? '促銷商品' : 'Promotion'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
                {promotionProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>

            {/* You may like section */}
            <section className="bg-white rounded shadow-sm">
              <div className="section-title">
                <span>{language === 'zh' ? '你可能喜歡' : 'You May Like'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
                {youMayLikeProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Back to top button */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-40"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
}

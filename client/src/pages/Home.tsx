import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingCart, Search, User, ChevronRight, ArrowUp, Heart, Globe, LogOut } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import type { Product } from '@/lib/data';

// 圖片代理 URL 生成函數
function getProxyImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop';
  }
  
  // 如果是 data URL（SVG 佔位符），直接返回
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  // 如果是本地 URL，直接返回
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  // 對於遠程 URL，使用代理端點
  return `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
}

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

// 轉換 NFT 商品格式為前端格式
function convertNFTProductToFrontend(nftProduct: any): Product {
  return {
    id: nftProduct.id,
    name: nftProduct.name,
    price: nftProduct.price,
    originalPrice: nftProduct.originalPrice,
    image: nftProduct.image,
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

function ProductCard({ product, nftData }: { product: Product; nftData?: any }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [, navigate] = useLocation();

  const handleClick = () => {
    if (nftData) {
      // NFT 商品：導航到 NFT 詳情頁面
      navigate(`/nft/${nftData.contractAddress}/${nftData.tokenId}`);
    } else {
      // 普通商品：導航到商品詳情頁面
      navigate(`/product/${product.id}`);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const colors = ['6366f1', 'ec4899', 'f59e0b', '10b981', '06b6d4', '8b5cf6'];
    const colorIdx = (product.id.toString().charCodeAt(0)) % colors.length;
    const bgColor = colors[colorIdx];
    
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent) {
      parent.style.backgroundColor = `#${bgColor}`;
      parent.style.display = 'flex';
      parent.style.alignItems = 'center';
      parent.style.justifyContent = 'center';
      
      // 移除舊的文本 div
      const oldDiv = parent.querySelector('.nft-placeholder-text');
      if (oldDiv) oldDiv.remove();
      
      // 創建新的文本 div
      const textDiv = document.createElement('div');
      textDiv.className = 'nft-placeholder-text text-white text-center text-sm font-medium px-2';
      textDiv.textContent = product.name;
      parent.appendChild(textDiv);
    }
  };

  return (
    <div 
      className="product-card bg-white border border-gray-100 rounded overflow-hidden group cursor-pointer" 
      onClick={handleClick}
    >
      <div className="relative overflow-hidden" style={{ paddingTop: '100%' }}>
        <img
          src={getProxyImageUrl(product.image)}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={handleImageError}
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
        <p className="text-xs text-gray-400 mt-1">{product.sold} Sold</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { language, toggleLanguage } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  
  // 使用 TRPC 獲取 NFT 商品（商家庫存）
  // 每次頁面加載時強制重新獲取，禁用快取
  const { data: nftProductsData, isLoading: nftLoading } = trpc.nftProducts.getMerchantNFTProducts.useQuery(undefined, {
    refetchOnMount: 'stale',
    refetchOnWindowFocus: 'stale',
    staleTime: 0, // 禁用快取，總是視為過期
  });
  const nftProducts = (nftProductsData?.products || []).map(convertNFTProductToFrontend);

  // 在頁面加載時強制重新獲取 NFT 商品
  const utils = trpc.useUtils();
  useEffect(() => {
    // 清除快取，強制重新獲取
    utils.nftProducts.getMerchantNFTProducts.invalidate();
  }, [utils]);

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

  return (
    <div className="min-h-screen bg-gray-50">
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

          {/* Search bar */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <div className="flex border-2 border-red-500 rounded overflow-hidden">
              <input
                type="text"
                placeholder="Please enter the item to search"
                className="flex-1 px-3 py-1.5 text-xs sm:text-sm outline-none"
              />
              <button className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-5 py-1.5 sm:py-2 transition-colors">
                <Search size={16} />
              </button>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <button
              onClick={toggleLanguage}
              className="flex items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1.5 text-xs sm:text-sm text-gray-600 hover:text-red-500 hover:bg-gray-100 rounded transition-colors"
            >
              <Globe size={18} />
              <span className="font-medium text-xs sm:text-sm">{language === 'zh' ? 'EN' : 'ZH'}</span>
            </button>
            
            <Link href="/cart" className="relative p-2 hover:text-red-500 transition-colors">
              <ShoppingCart size={22} className="text-gray-600" />
            </Link>

            {isAuthenticated && user ? (
              <div className="relative group">
                <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-500 transition-colors">
                  <User size={20} />
                  <span className="hidden sm:block font-medium">{user.name}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded shadow-lg border border-gray-100 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-500 transition-colors">
                <User size={20} />
                <span className="hidden sm:block font-medium">Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-[1200px] mx-auto px-4 py-4">
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
                {nftProductsData?.products?.map((nftProduct: any) => {
                  const product = convertNFTProductToFrontend(nftProduct);
                  return (
                    <ProductCard 
                      key={product.id} 
                      product={product}
                      nftData={nftProduct.nftData}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">No NFT products available</div>
            )}
          </section>

          {/* Back to top button */}
          {showBackToTop && (
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-8 right-8 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
            >
              <ArrowUp size={20} />
            </button>
          )}
        </main>
      </div>
    </div>
  );
}

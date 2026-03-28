/**
 * ShopMart - NFT Detail Page
 * Design: 活力促銷電商風 - 紅白主色調
 * API Integration: 使用 TRPC 實時獲取 NFT 詳情
 */

import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { ShoppingCart, User, Heart, Share2, ChevronRight, Plus, Minus, Truck, Shield, RefreshCw, Globe, LogOut, Copy, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

// 圖片代理 URL 生成函數
function getProxyImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return 'https://via.placeholder.com/400x400?text=NFT';
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

interface NFTDetail {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  contractAddress: string;
  tokenId: string;
  chainId: string;
  creator?: string;
  collectionName?: string;
}

export default function NFTDetail() {
  const params = useParams<{ contractAddress: string; tokenId: string }>();
  const contractAddress = params.contractAddress || '';
  const tokenId = params.tokenId || '';
  
  const [nft, setNft] = useState<NFTDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  const { language, toggleLanguage } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  // TRPC 購物車操作
  const addToCartMutation = trpc.cart.add.useMutation();
  const utils = trpc.useUtils();

  // 使用 TRPC 查詢 NFT 詳情
  const { data: nftData, isLoading: isLoadingNFT, error: nftError } = trpc.nftProducts.getNFTDetail.useQuery(
    { contractAddress, tokenId },
    { enabled: !!contractAddress && !!tokenId }
  );

  useEffect(() => {
    if (nftData) {
      setNft({
        id: nftData.id,
        name: nftData.name,
        description: nftData.description,
        image: nftData.image,
        price: nftData.price,
        contractAddress: nftData.contractAddress,
        tokenId: nftData.tokenId,
        chainId: nftData.chainId,
        creator: nftData.creator,
        collectionName: nftData.collectionName,
      });
      setError(null);
      setIsLoading(false);
    }
    if (nftError) {
      setError(nftError instanceof Error ? nftError.message : 'Failed to load NFT');
      setIsLoading(false);
    }
  }, [nftData, nftError]);

  useEffect(() => {
    setIsLoading(isLoadingNFT);
  }, [isLoadingNFT]);

  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true);
      if (!nft) throw new Error('NFT not found');
      
      // NFT 商品直接添加到本地購物車（購物車 API 只支持 numeric productId）
      const cart = JSON.parse(localStorage.getItem('shopmart_cart') || '[]');
      const existingItem = cart.find((item: any) => item.id === nft.id);
      
      if (existingItem) {
        existingItem.quantity += qty;
      } else {
        cart.push({
          id: nft.id,
          name: nft.name,
          price: nft.price,
          image: nft.image,
          quantity: qty,
          nftData: {
            contractAddress: nft.contractAddress,
            tokenId: nft.tokenId,
            chainId: nft.chainId,
          },
        });
      }
      
      localStorage.setItem('shopmart_cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
      
      toast.success(language === 'zh' ? '已添加到購物車' : 'Added to cart');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    try {
      if (!nft) throw new Error('NFT not found');
      
      // NFT 商品直接添加到本地購物車（購物車 API 只支持 numeric productId）
      const cart = JSON.parse(localStorage.getItem('shopmart_cart') || '[]');
      const existingItem = cart.find((item: any) => item.id === nft.id);
      
      if (existingItem) {
        existingItem.quantity += qty;
      } else {
        cart.push({
          id: nft.id,
          name: nft.name,
          price: nft.price,
          image: nft.image,
          quantity: qty,
          nftData: {
            contractAddress: nft.contractAddress,
            tokenId: nft.tokenId,
            chainId: nft.chainId,
          },
        });
      }
      
      localStorage.setItem('shopmart_cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
      
      navigate('/checkout');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to proceed to checkout');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(language === 'zh' ? '已複製' : 'Copied');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{language === 'zh' ? '加載中...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (error || !nft) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || (language === 'zh' ? 'NFT 未找到' : 'NFT not found')}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded transition-colors"
          >
            {language === 'zh' ? '返回首頁' : 'Back to Home'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top utility bar */}
      <div className="bg-gray-700 text-gray-300 text-xs py-1.5 hidden sm:block">
        <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="hover:text-white transition-colors">{language === 'zh' ? '首頁' : 'Home'}</a>
            <span className="hover:text-white transition-colors cursor-pointer">{language === 'zh' ? '收藏本站' : 'Collect'}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/orders" className="hover:text-white transition-colors">{language === 'zh' ? '我的訂單' : 'My Orders'}</a>
            <span className="hover:text-white transition-colors cursor-pointer">{language === 'zh' ? '申請' : 'Apply'}</span>
            <span className="hover:text-white transition-colors cursor-pointer">{language === 'zh' ? '移動商城' : 'Mobile'}</span>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-2 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-600 rounded flex items-center justify-center">
              <ShoppingCart size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-800 text-base sm:text-lg hidden sm:block">ShopMart</span>
          </a>

          {/* Spacer */}
          <div className="flex-1"></div>

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
            
            <a href="/cart" className="relative p-2 hover:text-red-500 transition-colors">
              <ShoppingCart size={22} className="text-gray-600" />
            </a>
            
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
                    </div>
                    <a href="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      {language === 'zh' ? '我的訂單' : 'My Orders'}
                    </a>
                    {user.role === 'admin' && (
                      <a href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        {language === 'zh' ? '管理儀表板' : 'Admin Dashboard'}
                      </a>
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
              <a href="/login" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-500 transition-colors">
                <User size={20} />
                <span className="hidden sm:block font-medium">{language === 'zh' ? '登入' : 'SIGN IN'}</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-[1200px] mx-auto px-4 py-3 text-sm text-gray-600">
        <a href="/" className="hover:text-red-500 transition-colors">{language === 'zh' ? '首頁' : 'Home'}</a>
        <span className="mx-2">/</span>
        <a href="/" className="hover:text-red-500 transition-colors">{language === 'zh' ? 'NFT 商城' : 'NFT Marketplace'}</a>
        <span className="mx-2">/</span>
        <span className="text-gray-800 font-medium">{nft.name}</span>
      </div>

      {/* Main content */}
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: NFT Image */}
          <div className="flex flex-col">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden sticky top-20">
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                <img
                  src={getProxyImageUrl(nft.image)}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=NFT';
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right: NFT Details */}
          <div className="flex flex-col">
            {/* Title and collection */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{nft.name}</h1>
              {nft.collectionName && (
                <p className="text-gray-600 text-lg">{nft.collectionName}</p>
              )}
            </div>

            {/* NFT Info */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="space-y-4">
                {/* Token Address */}
                <div className="flex items-start justify-between">
                  <span className="text-gray-600 font-medium">{language === 'zh' ? 'NFT 合約地址' : 'Nft Token Address'}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-800 font-mono text-sm">{nft.contractAddress}</span>
                    <button
                      onClick={() => copyToClipboard(nft.contractAddress)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Copy size={16} className="text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Blockchain */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">{language === 'zh' ? '區塊鏈' : 'Blockchain'}</span>
                  <span className="text-gray-800 font-semibold uppercase">{nft.chainId}</span>
                </div>

                {/* Token ID */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">{language === 'zh' ? 'Token ID' : 'Token ID'}</span>
                  <span className="text-gray-800 font-semibold">{nft.tokenId}</span>
                </div>

                {/* Creator */}
                {nft.creator && (
                  <div className="flex items-start justify-between">
                    <span className="text-gray-600 font-medium">{language === 'zh' ? '創建者' : 'Creator'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-800 font-mono text-sm">{nft.creator}</span>
                      <button
                        onClick={() => copyToClipboard(nft.creator || '')}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Copy size={16} className="text-gray-600" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Price section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-gray-800">${nft.price.toFixed(2)}</span>
              </div>

              {/* Quantity selector */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-gray-600 font-medium">{language === 'zh' ? '數量' : 'Quantity'}:</span>
                <div className="flex items-center border border-gray-300 rounded">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="p-2 hover:bg-gray-100 transition-colors"
                  >
                    <Minus size={18} className="text-gray-600" />
                  </button>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center border-0 outline-none"
                    min="1"
                  />
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="p-2 hover:bg-gray-100 transition-colors"
                  >
                    <Plus size={18} className="text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="flex-1 bg-white border-2 border-red-500 text-red-500 hover:bg-red-50 font-medium py-3 rounded transition-colors disabled:opacity-50"
                >
                  <ShoppingCart size={18} className="inline mr-2" />
                  {language === 'zh' ? '加入購物車' : 'Add to Cart'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={isAddingToCart}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded transition-colors disabled:opacity-50"
                >
                  {language === 'zh' ? '立即購買' : 'Buy Now'}
                </button>
              </div>
            </div>

            {/* Wishlist and share */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-600 hover:text-red-500 hover:border-red-500 font-medium py-3 rounded transition-colors"
              >
                <Heart size={18} className={isWishlisted ? 'fill-red-500 text-red-500' : ''} />
                {language === 'zh' ? '收藏' : 'Wishlist'}
              </button>
              <button
                onClick={() => {
                  const url = window.location.href;
                  navigator.clipboard.writeText(url);
                  toast.success(language === 'zh' ? '已複製分享鏈接' : 'Link copied');
                }}
                className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-600 hover:text-red-500 hover:border-red-500 font-medium py-3 rounded transition-colors"
              >
                <Share2 size={18} />
                {language === 'zh' ? '分享' : 'Share'}
              </button>
            </div>

            {/* Shipping info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6 space-y-3">
              <div className="flex items-start gap-3">
                <Truck size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800">{language === 'zh' ? '免費配送' : 'Free Shipping'}</p>
                  <p className="text-sm text-gray-600">{language === 'zh' ? '全球免費配送' : 'Free worldwide shipping'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800">{language === 'zh' ? '安全保障' : 'Secure Payment'}</p>
                  <p className="text-sm text-gray-600">{language === 'zh' ? '100% 安全支付' : '100% secure payment'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RefreshCw size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800">{language === 'zh' ? '退貨保障' : 'Easy Returns'}</p>
                  <p className="text-sm text-gray-600">{language === 'zh' ? '30 天內無條件退貨' : '30-day money-back guarantee'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description section */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{language === 'zh' ? '詳情描述' : 'Description'}</h2>
          <p className="text-gray-700 leading-relaxed">
            {nft.description || (language === 'zh' ? '暫無詳情描述' : 'No description available')}
          </p>
        </div>
      </div>
    </div>
  );
}

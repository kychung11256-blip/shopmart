/**
 * Jade Emporium - Product Detail Page
 * Design: 活力促銷電商風 - 紅白主色調
 * API Integration: 使用 TRPC 實時獲取商品詳情
 */

import { useState } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { ShoppingCart, Search, User, Star, Heart, Share2, ChevronRight, Plus, Minus, Truck, Shield, RefreshCw, Globe, LogOut } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

// Product type from API
interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number | null;
  image?: string | null;
  categoryId?: number | null;
  sold: number;
  rating?: number | null;
  description?: string | null;
  stock?: number;
  status?: string;
}

// 直接將 API 數據映射為 Product
function mapApiProduct(p: any): Product {
  return {
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
  };
}

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const productId = parseInt(params.id || '1');
  
  // 使用 TRPC 獲取商品詳情
  const { data: apiProduct, isLoading, error } = trpc.products.getById.useQuery(productId);
  
  // 直接使用 API 數據
  const product = apiProduct 
    ? mapApiProduct(apiProduct)
    : null;

  // 獲取相關商品（如果商品存在）
  const { data: relatedApiProducts = [] } = trpc.products.list.useQuery({ 
    categoryId: product?.categoryId || undefined,
    limit: 4 
  });
  
  const relatedProducts = relatedApiProducts
    .map(mapApiProduct)
    .filter(p => product && p.id !== product.id)
    .slice(0, 4);

  const [qty, setQty] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { language, toggleLanguage } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  // TRPC 購物車操作
  const addToCartMutation = trpc.cart.add.useMutation();
  const clearCartMutation = trpc.cart.clear.useMutation();
  const utils = trpc.useUtils();

  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true);
      if (!product) throw new Error('Product not found');
      
      if (isAuthenticated) {
        // 登入用戶：添加到服務器購物車
        await addToCartMutation.mutateAsync({
          productId: product.id,
          quantity: qty,
        });
        // 使購物車數據失效，觸發重新獲取
        await utils.cart.list.invalidate();
      } else {
        // 未登入用戶：添加到本地購物車
        const localCart = localStorage.getItem('shopmart_cart');
        const cartItems = localCart ? JSON.parse(localCart) : [];
        
        const existingItem = cartItems.find((item: any) => item.product.id === product.id);
        if (existingItem) {
          existingItem.qty += qty;
        } else {
          cartItems.push({
            product: product,
            qty: qty,
            selected: true,
          });
        }
        
        localStorage.setItem('shopmart_cart', JSON.stringify(cartItems));
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cartItems } }));
      }
      
      toast.success(`Added ${qty} × "${product.name}" to cart!`);
      setQty(1);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add item to cart');
    } finally {
      setIsAddingToCart(false);
    }
  }

  const handleBuyNow = async () => {
    try {
      setIsAddingToCart(true);
      if (!product) throw new Error('Product not found');
      
      if (isAuthenticated) {
        // 登入用戶：清空購物車，只添加當前商品
        await clearCartMutation.mutateAsync();
        await addToCartMutation.mutateAsync({
          productId: product.id,
          quantity: qty,
        });
        await utils.cart.list.invalidate();
      } else {
        // 未登入用戶：清空本地購物車，只添加當前商品
        const cartItems = [{ product, qty, selected: true }];
        localStorage.setItem('shopmart_cart', JSON.stringify(cartItems));
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cartItems } }));
      }
      
      toast.success('Redirecting to checkout...');
      setTimeout(() => navigate('/checkout'), 500);
    } catch (error: any) {
      toast.error(error.message || 'Failed to proceed to checkout');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // 如果商品不存在或出錯，顯示錯誤頁面
  if (!isLoading && !product) {
    return (
      <div className="min-h-screen bg-[#FAF7FF] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-2">The product you're looking for doesn't exist or has been deleted.</p>
          {error && <p className="text-sm text-[#4A1D6B] mb-6">Error: {error.message}</p>}
          <Link href="/" className="inline-block bg-[#4A1D6B] text-white px-6 py-2 rounded hover:bg-[#7B3FA0]">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // 如果還在加載，顯示加載狀態
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7FF] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7B3FA0] mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAF7FF] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Error Loading Product</h1>
          <p className="text-gray-600 mb-6">Unable to load the product. Please try again.</p>
          <Link href="/" className="inline-block bg-[#4A1D6B] text-white px-6 py-2 rounded hover:bg-[#7B3FA0]">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;
  const isSoldOut = typeof product.stock === 'number' && product.stock <= 0;

  return (
    <div className="min-h-screen bg-[#FAF7FF]">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-[#7B3FA0] rounded flex items-center justify-center">
              <ShoppingCart size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-800 text-lg hidden sm:block">Jade Emporium</span>
          </Link>
          <div className="flex-1 max-w-2xl hidden md:block">
            <div className="flex border-2 border-[#7B3FA0] rounded overflow-hidden">
              <input type="text" placeholder="Search products..." className="flex-1 px-4 py-2 text-sm outline-none" />
              <button className="bg-[#4A1D6B] text-white px-5 py-2"><Search size={16} /></button>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={toggleLanguage}
              className="flex items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1.5 text-xs sm:text-sm text-gray-600 hover:text-[#4A1D6B] hover:bg-gray-100 rounded transition-colors"
              title={language === 'zh' ? 'Switch to English' : 'Switch to Chinese'}
            >
              <Globe size={18} />
              <span className="font-medium text-xs sm:text-sm">{language === 'zh' ? 'EN' : 'ZH'}</span>
            </button>
            <Link href="/cart">
              <button className="relative p-2">
                <ShoppingCart size={22} className="text-gray-600" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#4A1D6B] text-white text-xs rounded-full flex items-center justify-center">3</span>
              </button>
            </Link>
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#4A1D6B] transition-colors"
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
                    <Link href="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#FAF7FF] transition-colors">
                      {language === 'zh' ? '我的訂單' : 'My Orders'}
                    </Link>
                    {user.role === 'admin' && (
                      <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#FAF7FF] transition-colors">
                        {language === 'zh' ? '管理儀表板' : 'Admin Dashboard'}
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-[#7B3FA0] hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-gray-100"
                    >
                      <LogOut size={16} />
                      {language === 'zh' ? '登出' : 'Logout'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#4A1D6B]">
                <User size={20} />
                <span className="hidden sm:block">SIGN IN</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-[1200px] mx-auto px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-[#4A1D6B]">{language === 'zh' ? '首頁' : 'Home'}</Link>
          <ChevronRight size={14} />
          <Link href="/products" className="hover:text-[#4A1D6B]">{language === 'zh' ? '商品' : 'Products'}</Link>
          <ChevronRight size={14} />
          <span className="text-gray-700 line-clamp-1 max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 pb-8">
        {/* Product main info */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-4">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">
              {language === 'zh' ? '加載商品詳情中...' : 'Loading product details...'}
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              {/* Product image */}
              <div className="w-full md:w-80 md:shrink-0">
                <div className="relative rounded-lg overflow-hidden border border-gray-100" style={{ paddingTop: '100%' }}>
                  <img
                    src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'}
                    alt={product.name}
                    className={`absolute inset-0 w-full h-full object-cover ${isSoldOut ? 'grayscale' : ''}`}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'; }}
                  />
                  {discountPercent > 0 && !isSoldOut && (
                    <div className="absolute top-3 left-3 bg-[#4A1D6B] text-white text-sm px-2 py-1 rounded font-medium">
                      -{discountPercent}%
                    </div>
                  )}
                  {isSoldOut && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-gray-800 text-white text-base font-bold px-5 py-2 rounded-full">
                        {language === 'zh' ? '已售罄' : 'Sold Out'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  {[product.image, product.image, product.image].map((img, idx) => (
                    <div key={idx} className="w-16 h-16 rounded border-2 border-gray-100 overflow-hidden cursor-pointer hover:border-red-400 transition-colors">
                      <img src={img || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop'} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop'; }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Product info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold text-gray-800 leading-snug">{product.name}</h1>

                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={14} className={s <= Math.floor(product.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                    ))}
                    <span className="text-sm text-gray-500 ml-1">{product.rating || 0}</span>
                  </div>
                  <span className="text-sm text-gray-400">{product.sold} {language === 'zh' ? '已賣' : 'sold'}</span>
                </div>

                {/* 庫存與已售狀態區塊 */}
                <div className="flex items-center gap-4 mt-3 py-2.5 px-3 bg-[#FAF7FF] rounded-lg border border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">{language === 'zh' ? '已售' : 'Sold'}:</span>
                    <span className="text-sm font-semibold text-gray-700">{product.sold}</span>
                  </div>
                  <div className="w-px h-4 bg-gray-200" />
                  {isSoldOut ? (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
                      <span className="text-sm font-semibold text-[#4A1D6B]">{language === 'zh' ? '已售罄' : 'Out of Stock'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-xs text-gray-400">{language === 'zh' ? '庫存' : 'Stock'}:</span>
                      <span className="text-sm font-semibold text-green-600">{product.stock}</span>
                      <span className="text-xs text-gray-400">{language === 'zh' ? '件' : 'units'}</span>
                    </div>
                  )}
                </div>

                <div className="bg-[#FAF7FF] rounded-lg p-4 mt-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-[#4A1D6B]">${product.price.toFixed(2)}</span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-lg text-gray-400 line-through">${product.originalPrice.toFixed(2)}</span>
                    )}
                    {discountPercent > 0 && (
                      <span className="bg-red-100 text-[#4A1D6B] text-sm px-2 py-0.5 rounded font-medium">
                        {language === 'zh' ? '節省' : 'Save'} {discountPercent}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-20 shrink-0">{language === 'zh' ? '分類' : 'Category'}:</span>
                    <span className="text-sm text-gray-700">{product.categoryId || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-20 shrink-0">{language === 'zh' ? '數量' : 'Quantity'}:</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 border border-gray-200 rounded flex items-center justify-center hover:border-red-400 transition-colors">
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center font-medium">{qty}</span>
                      <button onClick={() => setQty(Math.min(product.stock ?? 999, qty + 1))} className="w-8 h-8 border border-gray-200 rounded flex items-center justify-center hover:border-red-400 transition-colors">
                        <Plus size={14} />
                      </button>
                      <span className="text-xs text-gray-400 ml-2">{product.stock} {language === 'zh' ? '可用' : 'available'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleAddToCart}
                    disabled={isSoldOut || isAddingToCart}
                    className="flex-1 border-2 border-[#7B3FA0] text-[#4A1D6B] hover:bg-red-50 py-3 rounded font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent"
                  >
                    <ShoppingCart size={18} />
                    {isSoldOut ? (language === 'zh' ? '已售罄' : 'Sold Out') : (language === 'zh' ? '加入購物車' : 'Add to Cart')}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={isSoldOut || isAddingToCart}
                    className="flex-1 bg-[#4A1D6B] hover:bg-[#7B3FA0] text-white py-3 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {isSoldOut ? (language === 'zh' ? '已售罄' : 'Sold Out') : (language === 'zh' ? '立即購買' : 'Buy Now')}
                  </button>
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={`w-12 h-12 border rounded flex items-center justify-center transition-colors ${isWishlisted ? 'border-red-400 bg-red-50 text-[#4A1D6B]' : 'border-gray-200 text-gray-400 hover:border-red-400'}`}
                  >
                    <Heart size={18} className={isWishlisted ? 'fill-red-500' : ''} />
                  </button>
                </div>

                {/* Trust badges */}
                <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-gray-100">
                  {[
                    { icon: Truck, zh: '免運費', en: 'Free Shipping' },
                    { icon: Shield, zh: '100%正品', en: '100% Authentic' },
                  ].map((badge) => (
                    <div key={badge.zh} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <badge.icon size={14} className="text-red-400" />
                      <div className="flex flex-col leading-tight">
                        <span>{language === 'zh' ? badge.zh : badge.en}</span>
                        <span className="text-gray-400 text-xs">{language === 'zh' ? badge.en : badge.zh}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Product details tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-4">
          <div className="flex border-b border-gray-100">
            {['description', 'specifications', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab ? 'text-[#4A1D6B] border-b-2 border-[#7B3FA0]' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {language === 'zh' 
                  ? (tab === 'description' ? '描述' : tab === 'specifications' ? '規格' : '評論')
                  : tab
                }
              </button>
            ))}
          </div>
          <div className="p-6">
            {activeTab === 'description' && (
              <div className="text-sm text-gray-600 leading-relaxed">
                <p>{product.description || (language === 'zh' ? '此商品暫無描述。' : 'No description available for this product.')}</p>
                <p className="mt-3">
                  {language === 'zh' 
                    ? '這是一件高質量的商品，經過嚴格的質量控制，確保您獲得最好的產品。'
                    : 'This high-quality product is carefully crafted to meet your needs. Our products undergo rigorous quality control to ensure you receive only the best.'
                  }
                </p>
              </div>
            )}
            {activeTab === 'specifications' && (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-50">
                  {[
                    { label: language === 'zh' ? '分類' : 'Category', value: product?.categoryId || 'N/A' },
                    { label: language === 'zh' ? '評分' : 'Rating', value: `${product?.rating || 0} / 5.0` },
                    { label: language === 'zh' ? '總銷售' : 'Total Sold', value: product?.sold.toString() || '0' },
                    { label: language === 'zh' ? '庫存' : 'Stock', value: (product?.stock ?? 0).toString() },
                    { label: language === 'zh' ? '狀態' : 'Status', value: product?.status || 'unknown' },
                  ].map((spec) => (
                    <tr key={spec.label}>
                      <td className="py-2.5 text-gray-500 w-40">{spec.label}</td>
                      <td className="py-2.5 text-gray-700">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {[
                  { name: 'Alice J.', rating: 5, comment: language === 'zh' ? '優秀的產品！完全如描述。非常滿意我的購買。' : 'Excellent product! Exactly as described. Very happy with my purchase.', date: '2024-03-15' },
                  { name: 'Bob S.', rating: 4, comment: language === 'zh' ? '質量很好，配送快速。推薦給其他人。' : 'Good quality, fast shipping. Would recommend to others.', date: '2024-03-10' },
                  { name: 'Carol W.', rating: 5, comment: language === 'zh' ? '完美！物美價廉。會再次購買。' : 'Perfect! Great value for money. Will buy again.', date: '2024-03-05' },
                ].map((review, idx) => (
                  <div key={idx} className="border-b border-gray-50 pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-700">{review.name}</span>
                      <div className="flex">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={12} className={s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400 ml-auto">{review.date}</span>
                    </div>
                    <p className="text-sm text-gray-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related products */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {language === 'zh' ? '相關商品' : 'Related Products'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {relatedProducts.map(product => (
              <Link key={product.id} href={`/product/${product.id}`}>
                <div className="product-card bg-[#FAF7FF] border border-gray-100 rounded overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
                  <div className="relative overflow-hidden" style={{ paddingTop: '100%' }}>
                    <img
                      src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop'}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop'; }}
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-gray-700 line-clamp-2">{product.name}</p>
                    <span className="price-current text-sm font-medium text-[#4A1D6B]">${product.price.toFixed(2)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky bottom CTA buttons for mobile */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="flex gap-3 p-4">
          <button
            onClick={handleAddToCart}
            disabled={isSoldOut || isAddingToCart}
            className="flex-1 border-2 border-[#7B3FA0] text-[#4A1D6B] hover:bg-red-50 py-3 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent flex items-center justify-center gap-2"
          >
            <ShoppingCart size={18} />
            {isSoldOut ? (
              <span>{language === 'zh' ? '已售罄' : 'Sold Out'}</span>
            ) : (
              <>
                <span className="hidden xs:inline">{language === 'zh' ? '加入購物車' : 'Add to Cart'}</span>
                <span className="xs:hidden">{language === 'zh' ? '購物車' : 'Cart'}</span>
              </>
            )}
          </button>
          <button
            onClick={handleBuyNow}
            disabled={isSoldOut || isAddingToCart}
            className="flex-1 bg-[#4A1D6B] hover:bg-[#7B3FA0] text-white py-3 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isSoldOut ? (language === 'zh' ? '已售罄' : 'Sold Out') : (language === 'zh' ? '立即購買' : 'Buy Now')}
          </button>
        </div>
      </div>

      {/* Add padding to prevent content from being hidden behind sticky buttons on mobile */}
      <div className="h-24 md:h-0"></div>
    </div>
  );
}

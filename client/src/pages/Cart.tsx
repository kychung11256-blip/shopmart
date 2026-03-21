/**
 * ShopMart - Cart Page
 * Design: 活力促銷電商風 - 紅白主色調
 * Mobile Optimized: 響應式布局，手機版本購物車適配
 * API Integration: 使用 TRPC 實時同步購物車數據
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingCart, Search, User, Trash2, Plus, Minus, ChevronRight, ArrowLeft, Globe, LogOut } from 'lucide-react';
import { products as defaultProducts } from '@/lib/data';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { t } from '@/lib/translations';
import { trpc } from '@/lib/trpc';
import type { Product } from '@/lib/data';

interface CartItem {
  product: Product;
  qty: number;
  selected: boolean;
}

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
    rating: dbProduct.rating ? dbProduct.rating / 100 : 0,
    description: dbProduct.description,
    stock: dbProduct.stock || 0,
    status: dbProduct.status || 'active',
    createdAt: dbProduct.createdAt,
    updatedAt: dbProduct.updatedAt,
  };
}

export default function Cart() {
  const [, navigate] = useLocation();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { language, toggleLanguage } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();

  // 使用 TRPC 獲取購物車數據
  const { data: apiCartItems = [], isLoading: cartLoading } = trpc.cart.list.useQuery();
  const { data: allProducts = [] } = trpc.products.list.useQuery({ limit: 200 });

  // 初始化購物車
  useEffect(() => {
    if (cartLoading) {
      setIsLoading(true);
      return;
    }

    if (apiCartItems.length === 0) {
      // 如果購物車為空，使用默認數據
      setCartItems(
        defaultProducts.slice(0, 3).map(p => ({ product: p, qty: 1, selected: true }))
      );
      setIsLoading(false);
      return;
    }

    // 將 API 購物車項目與商品信息合併
    const convertedProducts = allProducts.map(convertDbProductToFrontend);
    const items: CartItem[] = apiCartItems.map((cartItem: any) => {
      const product = convertedProducts.find(p => p.id === cartItem.productId);
      return {
        product: product || defaultProducts[0],
        qty: cartItem.quantity,
        selected: true,
      };
    });

    setCartItems(items);
    setIsLoading(false);
  }, [apiCartItems, allProducts, cartLoading]);

  const selectedItems = cartItems.filter(item => item.selected);
  const totalPrice = selectedItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const totalOriginal = selectedItems.reduce((sum, item) => sum + (item.product.originalPrice || item.product.price) * item.qty, 0);
  const savings = totalOriginal - totalPrice;

  const handleQtyChange = (id: number, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.product.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const handleRemove = (id: number) => {
    setCartItems(prev => prev.filter(item => item.product.id !== id));
    toast.success(language === 'zh' ? '已移除商品' : 'Item removed from cart');
  };

  const handleToggleSelect = (id: number) => {
    setCartItems(prev => prev.map(item =>
      item.product.id === id ? { ...item, selected: !item.selected } : item
    ));
  };

  const handleSelectAll = () => {
    const allSelected = cartItems.every(item => item.selected);
    setCartItems(prev => prev.map(item => ({ ...item, selected: !allSelected })));
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      toast.error(language === 'zh' ? '請選擇至少一件商品' : 'Please select at least one item');
      return;
    }
    toast.success(language === 'zh' ? '進行結帳...' : 'Proceeding to checkout...');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-2 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-4">
          <Link href="/" className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-600 rounded flex items-center justify-center">
              <ShoppingCart size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-800 text-base sm:text-lg hidden sm:block">ShopMart</span>
          </Link>
          
          {/* Search bar - hidden on mobile */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <div className="flex border-2 border-red-500 rounded overflow-hidden">
              <input type="text" placeholder="Search products..." className="flex-1 px-3 py-1.5 text-xs sm:text-sm outline-none" />
              <button className="bg-red-500 text-white px-3 sm:px-5 py-1.5 sm:py-2"><Search size={16} /></button>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <button
              onClick={toggleLanguage}
              className="flex items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1.5 text-xs sm:text-sm text-gray-600 hover:text-red-500 hover:bg-gray-100 rounded transition-colors"
              title={language === 'zh' ? 'Switch to English' : 'Switch to Chinese'}
            >
              <Globe size={18} />
              <span className="font-medium text-xs sm:text-sm">{language === 'zh' ? 'EN' : 'ZH'}</span>
            </button>
            
            <button className="relative p-2 hover:text-red-500 transition-colors">
              <ShoppingCart size={20} className="text-red-500" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{cartItems.length}</span>
            </button>
            
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-500 transition-colors"
                >
                  <User size={18} />
                  <span className="hidden sm:block font-medium text-xs sm:text-sm">{user.name}</span>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded shadow-lg border border-gray-100 z-50">
                    <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100">
                      <p className="text-xs sm:text-sm font-medium text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-gray-100"
                    >
                      <LogOut size={14} />
                      {language === 'zh' ? '登出' : 'Logout'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-1 text-xs sm:text-sm text-gray-600 hover:text-red-500 transition-colors">
                <User size={18} />
                <span className="hidden sm:block font-medium">{language === 'zh' ? '登入' : 'SIGN IN'}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-[1200px] mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
          <Link href="/" className="hover:text-red-500">{language === 'zh' ? '首頁' : 'Home'}</Link>
          <ChevronRight size={14} />
          <span className="text-gray-700">{language === 'zh' ? '購物車' : 'Shopping Cart'}</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-2 sm:px-4 pb-6 sm:pb-8">
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-16 text-center">
            <ShoppingCart size={60} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 text-base sm:text-lg">{language === 'zh' ? '加載購物車中...' : 'Loading cart...'}</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-16 text-center">
            <ShoppingCart size={60} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 text-base sm:text-lg">{language === 'zh' ? '購物車為空' : 'Your cart is empty'}</p>
            <Link href="/products">
              <button className="mt-4 bg-red-500 hover:bg-red-600 text-white px-6 sm:px-8 py-2 sm:py-2.5 rounded font-medium transition-colors text-sm sm:text-base">
                {language === 'zh' ? '繼續購物' : 'Continue Shopping'}
              </button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
            {/* Cart items */}
            <div className="flex-1 min-w-0">
              {/* Header row - hidden on mobile */}
              <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-3 hidden sm:flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={cartItems.every(item => item.selected)}
                  onChange={handleSelectAll}
                  className="w-4 h-4 accent-red-500"
                />
                <span className="text-xs sm:text-sm text-gray-600">{language === 'zh' ? '全選' : 'Select All'} ({cartItems.length})</span>
                <span className="ml-auto text-xs sm:text-sm text-gray-400">{language === 'zh' ? '價格' : 'Price'}</span>
              </div>

              {/* Items */}
              <div className="space-y-2 sm:space-y-3">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="bg-white rounded-lg shadow-sm p-2 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => handleToggleSelect(item.product.id)}
                      className="w-4 h-4 accent-red-500 shrink-0 mt-1 sm:mt-0"
                    />
                    <img
                      src={item.product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop'}
                      alt={item.product.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">{item.product.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{item.product.categoryId || 'N/A'}</p>
                    </div>
                    
                    {/* Quantity and price - responsive layout */}
                    <div className="w-full sm:w-auto flex items-center justify-between sm:flex-col gap-2 sm:gap-0">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button onClick={() => handleQtyChange(item.product.id, -1)} className="w-6 h-6 sm:w-7 sm:h-7 border border-gray-200 rounded flex items-center justify-center hover:border-red-400 transition-colors">
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-xs sm:text-sm font-medium">{item.qty}</span>
                        <button onClick={() => handleQtyChange(item.product.id, 1)} className="w-6 h-6 sm:w-7 sm:h-7 border border-gray-200 rounded flex items-center justify-center hover:border-red-400 transition-colors">
                          <Plus size={12} />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-red-500 font-bold text-sm sm:text-base">${(item.product.price * item.qty).toFixed(2)}</p>
                        {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                          <p className="text-xs text-gray-400 line-through">${(item.product.originalPrice * item.qty).toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                    
                    <button onClick={() => handleRemove(item.product.id)} className="text-gray-300 hover:text-red-500 transition-colors shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <Link href="/">
                <button className="mt-3 sm:mt-4 flex items-center gap-2 text-xs sm:text-sm text-gray-500 hover:text-red-500 transition-colors">
                  <ArrowLeft size={14} />
                  {language === 'zh' ? '繼續購物' : 'Continue Shopping'}
                </button>
              </Link>
            </div>

            {/* Order summary - responsive */}
            <div className="w-full lg:w-64 shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-3 sm:p-5 sticky top-20">
                <h3 className="font-semibold text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">{language === 'zh' ? '訂單摘要' : 'Order Summary'}</h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>{language === 'zh' ? '小計' : 'Subtotal'} ({selectedItems.length} {language === 'zh' ? '件' : 'items'})</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-green-500">
                      <span>{language === 'zh' ? '節省' : 'You save'}</span>
                      <span>-${savings.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>{language === 'zh' ? '運費' : 'Shipping'}</span>
                    <span>{language === 'zh' ? '免費' : 'Free'}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold text-gray-800">
                    <span>{language === 'zh' ? '總計' : 'Total'}</span>
                    <span className="text-red-500">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white py-2.5 sm:py-3 rounded font-medium transition-colors text-xs sm:text-sm"
                >
                  {language === 'zh' ? '結帳' : 'Checkout'}
                </button>
                <button className="w-full mt-2 border border-gray-200 hover:border-gray-300 text-gray-700 py-2 sm:py-2.5 rounded font-medium transition-colors text-xs sm:text-sm">
                  {language === 'zh' ? '繼續購物' : 'Continue Shopping'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

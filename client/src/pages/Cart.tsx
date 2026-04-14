/**
 * Jade Emporium - Cart Page
 * Completely rewritten to eliminate infinite loop issues
 * Key strategy: Avoid useMemo/useCallback chains, use simple state management
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingCart, Search, User, Trash2, Plus, Minus, Globe, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/_core/hooks/useAuth';
import { t } from '@/lib/translations';
import { trpc } from '@/lib/trpc';
import type { Product } from '@/lib/data';

interface CartItem {
  id?: number;
  product: Product;
  qty: number;
  selected: boolean;
}

// 將 API 商品格式轉為前端 Product 格式（API 已返回美元，無需再除以 100）
function convertApiProductToFrontend(apiProduct: any): Product {
  return {
    id: apiProduct.id,
    name: apiProduct.name,
    price: apiProduct.price,
    originalPrice: apiProduct.originalPrice || undefined,
    image: apiProduct.image,
    categoryId: apiProduct.categoryId,
    sold: apiProduct.sold || 0,
    rating: apiProduct.rating || 0,
    description: apiProduct.description,
    stock: apiProduct.stock || 0,
    status: apiProduct.status || 'active',
    createdAt: apiProduct.createdAt,
    updatedAt: apiProduct.updatedAt,
  };
}

export default function Cart() {
  const [, navigate] = useLocation();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());
  const { language, toggleLanguage } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();

  // 使用 TRPC 獲取購物車數據（只在登入時）
  const { data: apiCartItems = [], isLoading: cartLoading } = trpc.cart.list.useQuery(undefined, {
    enabled: isAuthenticated === true,
    staleTime: 0, // 每次都重新獲取最新數據
    refetchOnWindowFocus: true,
  });
  const removeCartMutation = trpc.cart.remove.useMutation();
  const utils = trpc.useUtils();

  // ============ SINGLE EFFECT - 唯一的初始化 effect ============
  // 這個 effect 只依賴於原始數據，不依賴任何計算結果
  useEffect(() => {
    // 未登入用戶：購物車為空
    if (!isAuthenticated) {
      setCartItems([]);
      setIsLoading(false);
      return;
    }

    // 登入用戶：還在加載中
    if (cartLoading) {
      return;
    }

    // 登入用戶：購物車為空
    if (apiCartItems.length === 0) {
      setCartItems([]);
      setIsLoading(false);
      return;
    }

    // 登入用戶：映射購物車商品
    // 直接在 effect 內部做轉換，避免創建新的 useMemo
    const items: CartItem[] = [];
    
    for (const cartItem of apiCartItems) {
      // cart.list 已包含 price 和 productName，直接使用
      const product: Product = {
        id: cartItem.productId,
        name: (cartItem as any).productName || `Product #${cartItem.productId}`,
        price: (cartItem as any).price || 0,
        originalPrice: (cartItem as any).originalPrice || undefined,
        image: (cartItem as any).image || '',
        categoryId: (cartItem as any).categoryId || 0,
        sold: (cartItem as any).sold ?? 0,
        rating: (cartItem as any).rating ?? 0,
        description: (cartItem as any).description || '',
        stock: (cartItem as any).stock ?? 999,
        status: 'active',
        createdAt: cartItem.createdAt,
        updatedAt: cartItem.updatedAt,
      };
      items.push({
        id: cartItem.id,
        product: product,
        qty: cartItem.quantity,
        selected: true,
      });
    }

    setCartItems(items);
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, cartLoading, apiCartItems]); // 依賴完整的 apiCartItems 確保內容變更時也能更新

  // ============ 計算選中項目和總價 ============
  // 直接計算，不使用 useMemo
  const selectedItems = cartItems.filter(item => item.selected);
  const totalPrice = selectedItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const totalOriginal = selectedItems.reduce((sum, item) => sum + (item.product.originalPrice || item.product.price) * item.qty, 0);
  const savings = totalOriginal - totalPrice;
  // 偵測選中商品中是否有售罄商品
  const soldOutItems = selectedItems.filter(item => typeof item.product.stock === 'number' && item.product.stock <= 0);
  const hasSoldOutItems = soldOutItems.length > 0;

  // ============ 事件處理函數 ============
  // 直接定義，不使用 useCallback
  const handleQtyChange = (id: number, delta: number) => {
    setCartItems(prev => {
      const updated = prev.map(item => {
        if (item.product.id === id) {
          const newQty = Math.max(1, item.qty + delta);
          return { ...item, qty: newQty };
        }
        return item;
      });
      return updated;
    });
  };

  const handleRemove = async (cartItemId: number | undefined, productId: number) => {
    if (!isAuthenticated || !cartItemId) {
      setCartItems(prev => prev.filter(item => item.product.id !== productId));
      toast.success(language === 'zh' ? '已移除商品' : 'Item removed from cart');
      return;
    }

    try {
      setRemovingIds(prev => new Set(prev).add(cartItemId));
      await removeCartMutation.mutateAsync(cartItemId);
      setCartItems(prev => prev.filter(item => item.product.id !== productId));
      await utils.cart.list.invalidate();
      toast.success(language === 'zh' ? '已移除商品' : 'Item removed from cart');
    } catch (error: any) {
      toast.error(error.message || (language === 'zh' ? '移除失敗' : 'Failed to remove item'));
    } finally {
      setRemovingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartItemId);
        return newSet;
      });
    }
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
    if (hasSoldOutItems) {
      const names = soldOutItems.map(i => i.product.name).join('、');
      toast.error(language === 'zh' ? `以下商品已售罄，請移除後再結帳：${names}` : `The following items are sold out, please remove them before checkout: ${names}`);
      return;
    }
    navigate('/checkout');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7FF] flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">{language === 'zh' ? '加載中...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7FF]">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-2 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-4">
          <Link href="/" className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#7B3FA0] rounded flex items-center justify-center">
              <ShoppingCart size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-800 text-base sm:text-lg hidden sm:block">Jade Emporium</span>
          </Link>
          
          <div className="flex-1 max-w-2xl hidden md:block">
            <div className="flex border-2 border-[#7B3FA0] rounded overflow-hidden">
              <input type="text" placeholder="Search products..." className="flex-1 px-3 py-1.5 text-xs sm:text-sm outline-none" />
              <button className="bg-[#4A1D6B] text-white px-3 sm:px-5 py-1.5 sm:py-2"><Search size={16} /></button>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <button
              onClick={toggleLanguage}
              className="flex items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1.5 text-xs sm:text-sm text-gray-600 hover:text-[#4A1D6B] hover:bg-gray-100 rounded transition-colors"
            >
              <Globe size={18} />
              <span className="font-medium text-xs sm:text-sm">{language === 'zh' ? 'EN' : 'ZH'}</span>
            </button>
            
            <button className="relative p-2 hover:text-[#4A1D6B] transition-colors">
              <ShoppingCart size={20} className="text-[#4A1D6B]" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#4A1D6B] text-white text-xs rounded-full flex items-center justify-center">{cartItems.length}</span>
            </button>
            
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#4A1D6B] transition-colors"
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
                    <Link href="/orders" className="block px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-[#FAF7FF]">
                      {language === 'zh' ? '我的訂單' : 'My Orders'}
                    </Link>
                    {user.role === 'admin' && (
                      <Link href="/admin" className="block px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-[#FAF7FF]">
                        {language === 'zh' ? '管理儀表板' : 'Admin Dashboard'}
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-[#7B3FA0] hover:bg-red-50 border-t border-gray-100 flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      {language === 'zh' ? '登出' : 'Logout'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#4A1D6B]">
                <User size={18} />
                <span className="hidden sm:block font-medium text-xs sm:text-sm">{language === 'zh' ? '登入' : 'SIGN IN'}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Cart Items */}
          <main className="flex-1">
            <div className="bg-white rounded shadow-sm p-4">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">{language === 'zh' ? '購物車' : 'Shopping Cart'}</h1>

              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">{language === 'zh' ? '購物車為空' : 'Your cart is empty'}</p>
                  <Link href="/" className="inline-block bg-[#4A1D6B] text-white px-6 py-2 rounded hover:bg-[#7B3FA0]">
                    {language === 'zh' ? '繼續購物' : 'Continue Shopping'}
                  </Link>
                </div>
              ) : (
                <>
                  {/* Select All */}
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                    <input
                      type="checkbox"
                      checked={cartItems.every(item => item.selected)}
                      onChange={handleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">{language === 'zh' ? '全選' : 'Select All'}</span>
                  </div>

                  {/* Cart Items List */}
                  {cartItems.map(item => (
                    <div key={item.product.id} className="flex gap-3 sm:gap-4 py-4 border-b last:border-0">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleToggleSelect(item.product.id)}
                        className="w-4 h-4 mt-1 cursor-pointer"
                      />
                      <img src={item.product.image ?? ''} alt={item.product.name} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 line-clamp-2">{item.product.name}</p>
                        <p className="text-sm text-gray-500 mt-1">${item.product.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleQtyChange(item.product.id, -1)} className="p-1 hover:bg-gray-100 rounded">
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center">{item.qty}</span>
                        <button onClick={() => handleQtyChange(item.product.id, 1)} className="p-1 hover:bg-gray-100 rounded">
                          <Plus size={16} />
                        </button>
                      </div>
                      <p className="font-medium text-gray-800 w-20 text-right">${(item.product.price * item.qty).toFixed(2)}</p>
                      <button
                        onClick={() => handleRemove(item.id, item.product.id)}
                        disabled={removingIds.has(item.id || 0)}
                        className="p-1 text-[#4A1D6B] hover:bg-red-50 rounded disabled:opacity-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </main>

          {/* Order Summary */}
          {cartItems.length > 0 && (
            <aside className="w-full md:w-80">
              <div className="bg-white rounded shadow-sm p-4 sticky top-16 md:top-20">
                <h2 className="text-lg font-bold text-gray-800 mb-4">{language === 'zh' ? '訂單摘要' : 'Order Summary'}</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === 'zh' ? '小計' : 'Subtotal'}</span>
                    <span className="font-medium">${totalPrice.toFixed(2)}</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{language === 'zh' ? '節省' : 'Savings'}</span>
                      <span>-${savings.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-3">
                    <span>{language === 'zh' ? '總計' : 'Total'}</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                {hasSoldOutItems && (
                  <div className="text-xs text-[#4A1D6B] bg-red-50 border border-red-200 rounded p-2 mt-3">
                    ⚠️ {language === 'zh' ? '購物車中有售罄商品，請移除後再結帳' : 'Some selected items are sold out. Please remove them before checkout.'}
                  </div>
                )}
                <button
                  onClick={handleCheckout}
                  disabled={selectedItems.length === 0 || hasSoldOutItems}
                  className="w-full bg-[#4A1D6B] text-white py-3 rounded font-medium mt-4 hover:bg-[#7B3FA0] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {language === 'zh' ? '結帳' : 'Checkout'}
                </button>
                <Link href="/" className="block text-center text-[#4A1D6B] hover:text-[#7B3FA0] mt-3 text-sm font-medium">
                  {language === 'zh' ? '繼續購物' : 'Continue Shopping'}
                </Link>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ShopMart - Cart Page
 * Design: 活力促銷電商風 - 紅白主色調
 * Mobile Optimized: 響應式布局，手機版本購物車適配
 * API Integration: 使用 TRPC 實時同步購物車數據
 */

import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingCart, Search, User, Trash2, Plus, Minus, ChevronRight, ArrowLeft, Globe, LogOut } from 'lucide-react';
// 不再使用本地硬編碼商品數據，確保與數據庫同步
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/_core/hooks/useAuth';
import { t } from '@/lib/translations';
import { trpc } from '@/lib/trpc';
import type { Product } from '@/lib/data';

interface CartItem {
  id?: number; // 購物車項目 ID（用於刪除）
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
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set()); // 追蹤正在刪除的項目
  const { language, toggleLanguage } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();

  // 使用 TRPC 獲取購物車數據（只在登入時）
  const { data: apiCartItems = [], isLoading: cartLoading, refetch: refetchCart } = trpc.cart.list.useQuery(undefined, {
    enabled: isAuthenticated, // 只在登入時才調用
  });
  const { data: allProducts = [] } = trpc.products.list.useQuery({ limit: 200 });
  
  // 轉換並穩定商品列表，避免無限循環
  const convertedProducts = useMemo(() => allProducts.map(convertDbProductToFrontend), [allProducts]);

  // TRPC 變更操作
  const removeCartMutation = trpc.cart.remove.useMutation();

  // 監聽購物車更新事件（只在未登入時）
  useEffect(() => {
    // 只在未登入用戶時監聽本地購物車更新
    if (isAuthenticated) return;

    const handleCartUpdated = () => {
      try {
        const localCart = localStorage.getItem('shopmart_cart');
        if (localCart) {
          const items = JSON.parse(localCart) as CartItem[];
          const validItems = items.filter(item => 
            convertedProducts.find(p => p.id === item.product.id)
          ).map(item => ({
            ...item,
            product: convertedProducts.find(p => p.id === item.product.id)!
          }));
          setCartItems(validItems);
        }
      } catch (error) {
        console.error('Error loading local cart:', error);
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdated);
    return () => window.removeEventListener('cartUpdated', handleCartUpdated);
  }, [isAuthenticated]);

  // 初始化購物車 - 支持未登入用戶的本地購物車
  useEffect(() => {
    if (isAuthenticated) {
      // 登入用戶：使用 API 購物車
      if (cartLoading) {
        setIsLoading(true);
        return;
      }

      if (apiCartItems.length === 0) {
        setCartItems([]);
        setIsLoading(false);
        return;
      }

      const items: CartItem[] = apiCartItems
        .map((cartItem: any) => {
          const product = convertedProducts.find(p => p.id === cartItem.productId);
          if (!product) return null;
          return {
            id: cartItem.id,
            product: product,
            qty: cartItem.quantity,
            selected: true,
          } as CartItem;
        })
        .filter((item): item is CartItem => item !== null);

      setCartItems(items);
      setIsLoading(false);
    } else {
      // 未登入用戶：使用本地 localStorage 購物車
      try {
        const localCart = localStorage.getItem('shopmart_cart');
        if (localCart) {
          const items = JSON.parse(localCart) as CartItem[];
          const validItems = items.filter(item => 
            convertedProducts.find(p => p.id === item.product.id)
          ).map(item => ({
            ...item,
            product: convertedProducts.find(p => p.id === item.product.id)!
          }));
          setCartItems(validItems);
        } else {
          setCartItems([]);
        }
      } catch (error) {
        console.error('Error loading local cart:', error);
        setCartItems([]);
      }
      setIsLoading(false);
    }
  }, [isAuthenticated, cartLoading, apiCartItems]);

  // 當商品列表改變時，更新購物車中的商品信息
  useEffect(() => {
    if (cartItems.length === 0 || convertedProducts.length === 0) return;
    
    setCartItems(prevItems => 
      prevItems.map(item => {
        const updatedProduct = convertedProducts.find(p => p.id === item.product.id);
        return updatedProduct ? { ...item, product: updatedProduct } : item;
      })
    );
  }, [convertedProducts]);

  const selectedItems = cartItems.filter(item => item.selected);
  const totalPrice = selectedItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const totalOriginal = selectedItems.reduce((sum, item) => sum + (item.product.originalPrice || item.product.price) * item.qty, 0);
  const savings = totalOriginal - totalPrice;

  const handleQtyChange = (id: number, delta: number) => {
    setCartItems(prev => {
      const updated = prev.map(item => {
        if (item.product.id === id) {
          const newQty = Math.max(1, item.qty + delta);
          return { ...item, qty: newQty };
        }
        return item;
      });
      // 保存到本地存儲（如果未登入）
      if (!isAuthenticated) {
        localStorage.setItem('shopmart_cart', JSON.stringify(updated));
      }
      return updated;
    });
  };

  // 修復：調用 API 刪除購物車項目
  const handleRemove = async (cartItemId: number | undefined, productId: number) => {
    if (!isAuthenticated || !cartItemId) {
      // 未登入或沒有購物車項目 ID：直接從本地狀態刪除
      setCartItems(prev => {
        const updated = prev.filter(item => item.product.id !== productId);
        if (!isAuthenticated) {
          localStorage.setItem('shopmart_cart', JSON.stringify(updated));
        }
        return updated;
      });
      toast.success(language === 'zh' ? '已移除商品' : 'Item removed from cart');
      return;
    }

    try {
      // 登入用戶：調用 API 刪除
      // 標記為正在刪除
      setRemovingIds(prev => new Set(prev).add(cartItemId));

      // 調用 API 刪除購物車項目
      await removeCartMutation.mutateAsync(cartItemId);

      // 從本地狀態刪除
      setCartItems(prev => prev.filter(item => item.product.id !== productId));

      // 重新獲取購物車數據以確保同步
      await refetchCart();

      toast.success(language === 'zh' ? '已移除商品' : 'Item removed from cart');
    } catch (error: any) {
      toast.error(error.message || (language === 'zh' ? '移除失敗' : 'Failed to remove item'));
      console.error('Error removing cart item:', error);
    } finally {
      // 取消標記
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
    // Navigate to checkout page
    navigate('/checkout');
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
                    <Link href="/orders" className="block px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      {language === 'zh' ? '我的訂單' : 'My Orders'}
                    </Link>
                    {user.role === 'admin' && (
                      <Link href="/admin" className="block px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        {language === 'zh' ? '管理儀表板' : 'Admin Dashboard'}
                      </Link>
                    )}
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

      {/* Main content */}
      <main className="max-w-[1200px] mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Page title */}
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            {language === 'zh' ? '購物車' : 'Shopping Cart'}
          </h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 mb-4">
              {language === 'zh' ? '購物車為空' : 'Your cart is empty'}
            </p>
            <Link href="/" className="inline-block bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 transition-colors">
              {language === 'zh' ? '繼續購物' : 'Continue Shopping'}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Cart items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={cartItems.every(item => item.selected)}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {language === 'zh' ? '全選' : 'Select All'}
                  </span>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <div key={item.product.id} className="px-4 sm:px-6 py-4 flex gap-4 hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleToggleSelect(item.product.id)}
                        className="w-4 h-4 rounded mt-1"
                      />
                      <img
                        src={item.product.image || ''}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 truncate">{item.product.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {language === 'zh' ? '價格' : 'Price'}: ${item.product.price.toFixed(2)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => handleQtyChange(item.product.id, -1)}
                            className="p-1 hover:bg-gray-200 rounded"
                            disabled={removingIds.has(item.id || 0)}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center">{item.qty}</span>
                          <button
                            onClick={() => handleQtyChange(item.product.id, 1)}
                            className="p-1 hover:bg-gray-200 rounded"
                            disabled={removingIds.has(item.id || 0)}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-800">
                          ${(item.product.price * item.qty).toFixed(2)}
                        </p>
                        <button
                          onClick={() => handleRemove(item.id, item.product.id)}
                          className="text-red-500 hover:text-red-700 text-sm mt-2"
                          disabled={removingIds.has(item.id || 0)}
                        >
                          {removingIds.has(item.id || 0) ? '...' : <Trash2 size={16} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 sticky top-20">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  {language === 'zh' ? '訂單摘要' : 'Order Summary'}
                </h2>
                <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{language === 'zh' ? '小計' : 'Subtotal'}</span>
                    <span className="font-medium">${totalPrice.toFixed(2)}</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>{language === 'zh' ? '節省' : 'Savings'}</span>
                      <span className="font-medium">-${savings.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-800 mb-4">
                  <span>{language === 'zh' ? '總計' : 'Total'}</span>
                  <span className="text-red-500">${totalPrice.toFixed(2)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full bg-red-500 text-white py-3 rounded font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                  disabled={selectedItems.length === 0}
                >
                  {language === 'zh' ? '結帳' : 'Checkout'}
                </button>
                <Link
                  href="/"
                  className="block text-center text-red-500 hover:text-red-700 text-sm mt-3"
                >
                  {language === 'zh' ? '繼續購物' : 'Continue Shopping'}
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

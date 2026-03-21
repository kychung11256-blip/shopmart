/**
 * ShopMart - Products Page
 * Design: 活力促銷電商風 - 紅白主色調
 * API Integration: 使用 TRPC 實時獲取商品數據
 */

import { useState, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingCart, Search, User, ChevronRight, Filter, SlidersHorizontal, Heart, Star, Globe, LogOut } from 'lucide-react';
import { products as defaultProducts, categories as defaultCategories } from '@/lib/data';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import type { Product } from '@/lib/data';
import { toast } from 'sonner';

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
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [, navigate] = useLocation();
  
  // TRPC 購物車操作
  const addToCartMutation = trpc.cart.add.useMutation();
  const { user: authUser } = useAuth();
  
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!authUser) {
      toast.error('Please login to add items to cart');
      return;
    }
    
    try {
      setIsAddingToCart(true);
      await addToCartMutation.mutateAsync({
        productId: product.id,
        quantity: 1,
      });
      toast.success(`Added "${product.name}" to cart!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add item to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="product-card bg-white border border-gray-100 rounded overflow-hidden group cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
      <div className="relative overflow-hidden" style={{ paddingTop: '100%' }}>
        <img
          src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop'}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop'; }}
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
        <div className="flex items-center gap-1 mt-1">
          {[1,2,3,4,5].map(s => (
            <Star key={s} size={10} className={s <= Math.floor(product.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
          ))}
          <span className="text-xs text-gray-400 ml-1">({product.sold})</span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="price-current text-base">${product.price.toFixed(2)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="price-original text-xs">${product.originalPrice.toFixed(2)}</span>
          )}
        </div>
        <button 
          onClick={handleAddToCart}
          disabled={isAddingToCart}
          className="mt-2 w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-xs py-1.5 rounded transition-colors"
        >
          {isAddingToCart ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

export default function Products() {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('default');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { language, toggleLanguage } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  // 使用 TRPC 獲取商品和分類數據
  const { data: apiProducts = [], isLoading: productsLoading } = trpc.products.list.useQuery({ limit: 200 });
  const { data: apiCategories = [], isLoading: categoriesLoading } = trpc.categories.list.useQuery();

  // 轉換 API 數據為前端格式
  const products = apiProducts.length > 0 
    ? apiProducts.map(convertDbProductToFrontend)
    : defaultProducts;
  
  const categories = apiCategories.length > 0
    ? apiCategories.map(convertDbCategoryToFrontend)
    : defaultCategories;

  // 過濾和排序商品
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = activeCategory === null || p.categoryId === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      return matchesCategory && matchesSearch && matchesPrice;
    });
  }, [products, activeCategory, searchQuery, priceRange]);

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    if (sortBy === 'price_asc') sorted.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_desc') sorted.sort((a, b) => b.price - a.price);
    else if (sortBy === 'popular') sorted.sort((a, b) => b.sold - a.sold);
    else if (sortBy === 'rating') sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return sorted;
  }, [filteredProducts, sortBy]);

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
          <div className="flex-1 max-w-2xl hidden md:block">
            <div className="flex border-2 border-red-500 rounded overflow-hidden">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 px-3 py-1.5 text-xs sm:text-sm outline-none"
              />
              <button className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-5 py-1.5 sm:py-2 transition-colors">
                <Search size={16} />
              </button>
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
            <Link href="/cart" className="relative p-2 hover:text-red-500 transition-colors">
              <ShoppingCart size={22} className="text-gray-600" />
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

      {/* Breadcrumb */}
      <div className="max-w-[1200px] mx-auto px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-red-500">{language === 'zh' ? '首頁' : 'Home'}</Link>
          <ChevronRight size={14} />
          <span className="text-gray-700">{language === 'zh' ? '商品' : 'Products'}</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 pb-8">
        <div className="flex gap-4">
          {/* Sidebar filters */}
          <aside className="w-48 shrink-0 hidden lg:block">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              {/* Category filter */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Filter size={16} />
                  {language === 'zh' ? '分類' : 'Category'}
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveCategory(null)}
                    className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      activeCategory === null
                        ? 'bg-red-100 text-red-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {language === 'zh' ? '全部' : 'All'}
                  </button>
                  {categoriesLoading ? (
                    <div className="text-xs text-gray-500">{language === 'zh' ? '加載中...' : 'Loading...'}</div>
                  ) : (
                    categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          activeCategory === cat.id
                            ? 'bg-red-100 text-red-600 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Price filter */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <SlidersHorizontal size={16} />
                  {language === 'zh' ? '價格' : 'Price'}
                </h3>
                <div className="space-y-2">
                  {[
                    { label: '$0 - $100', min: 0, max: 100 },
                    { label: '$100 - $300', min: 100, max: 300 },
                    { label: '$300 - $500', min: 300, max: 500 },
                    { label: '$500+', min: 500, max: 10000 },
                  ].map(range => (
                    <button
                      key={range.label}
                      onClick={() => setPriceRange([range.min, range.max])}
                      className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                        priceRange[0] === range.min && priceRange[1] === range.max
                          ? 'bg-red-100 text-red-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Sort bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
              <div className="text-sm text-gray-600">
                {language === 'zh' ? '找到' : 'Found'} <span className="font-semibold text-gray-800">{sortedProducts.length}</span> {language === 'zh' ? '個商品' : 'products'}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{language === 'zh' ? '排序：' : 'Sort by:'}</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-200 rounded px-3 py-1.5 text-sm outline-none focus:border-red-400"
                >
                  <option value="default">{language === 'zh' ? '默認' : 'Default'}</option>
                  <option value="price_asc">{language === 'zh' ? '價格低到高' : 'Price: Low to High'}</option>
                  <option value="price_desc">{language === 'zh' ? '價格高到低' : 'Price: High to Low'}</option>
                  <option value="popular">{language === 'zh' ? '最熱銷' : 'Most Popular'}</option>
                  <option value="rating">{language === 'zh' ? '評分最高' : 'Highest Rated'}</option>
                </select>
              </div>
            </div>

            {/* Products grid */}
            {productsLoading ? (
              <div className="text-center py-12 text-gray-500">
                {language === 'zh' ? '加載商品中...' : 'Loading products...'}
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {language === 'zh' ? '未找到符合條件的商品' : 'No products found'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {sortedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

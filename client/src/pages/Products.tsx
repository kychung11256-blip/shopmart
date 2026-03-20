/**
 * ShopMart - Products Page
 * Design: 活力促銷電商風 - 紅白主色調
 */

import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingCart, Search, User, ChevronRight, Filter, SlidersHorizontal, Heart, Star } from 'lucide-react';
import { products, categories } from '@/lib/data';
import type { Product } from '@/lib/data';

function ProductCard({ product }: { product: Product }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [, navigate] = useLocation();

  return (
    <div className="product-card bg-white border border-gray-100 rounded overflow-hidden group cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
      <div className="relative overflow-hidden" style={{ paddingTop: '100%' }}>
        <img
          src={product.image}
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
            <Star key={s} size={10} className={s <= Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
          ))}
          <span className="text-xs text-gray-400 ml-1">({product.sold})</span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="price-current text-base">${product.price.toFixed(2)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="price-original text-xs">${product.originalPrice.toFixed(2)}</span>
          )}
        </div>
        <button className="mt-2 w-full bg-red-500 hover:bg-red-600 text-white text-xs py-1.5 rounded transition-colors">
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default function Products() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
    return matchesCategory && matchesSearch && matchesPrice;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'popular') return b.sold - a.sold;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <ShoppingCart size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-800 text-lg hidden sm:block">ShopMart</span>
          </Link>
          <div className="flex-1 max-w-2xl">
            <div className="flex border-2 border-red-500 rounded overflow-hidden">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 px-4 py-2 text-sm outline-none"
              />
              <button className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 transition-colors">
                <Search size={16} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button className="relative p-2">
              <ShoppingCart size={22} className="text-gray-600" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
            </button>
            <Link href="/login" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-500">
              <User size={20} />
              <span className="hidden sm:block">SIGN IN</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-[1200px] mx-auto px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-red-500">Home</Link>
          <ChevronRight size={14} />
          <span className="text-gray-700">All Products</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 pb-8">
        <div className="flex gap-4">
          {/* Filter sidebar */}
          <aside className="w-48 shrink-0 hidden lg:block">
            <div className="bg-white rounded shadow-sm p-4 mb-4">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Filter size={14} />
                Categories
              </h3>
              <div className="space-y-1">
                {['All', ...categories.map(c => c.name)].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                      activeCategory === cat
                        ? 'bg-red-50 text-red-500 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded shadow-sm p-4">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <SlidersHorizontal size={14} />
                Price Range
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Under $10', min: 0, max: 10 },
                  { label: '$10 - $50', min: 10, max: 50 },
                  { label: '$50 - $100', min: 50, max: 100 },
                  { label: '$100 - $300', min: 100, max: 300 },
                  { label: 'Over $300', min: 300, max: 9999 },
                ].map((range) => (
                  <button
                    key={range.label}
                    onClick={() => setPriceRange([range.min, range.max])}
                    className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${
                      priceRange[0] === range.min && priceRange[1] === range.max
                        ? 'bg-red-50 text-red-500'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Products grid */}
          <div className="flex-1 min-w-0">
            {/* Sort bar */}
            <div className="bg-white rounded shadow-sm p-3 mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">{sortedProducts.length} products found</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                {[
                  { value: 'default', label: 'Default' },
                  { value: 'popular', label: 'Popular' },
                  { value: 'price_asc', label: 'Price ↑' },
                  { value: 'price_desc', label: 'Price ↓' },
                  { value: 'rating', label: 'Rating' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      sortBy === option.value
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {sortedProducts.length === 0 && (
              <div className="bg-white rounded shadow-sm p-16 text-center">
                <p className="text-gray-400 text-lg">No products found</p>
                <p className="text-gray-300 text-sm mt-2">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

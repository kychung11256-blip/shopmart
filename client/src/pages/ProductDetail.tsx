/**
 * ShopMart - Product Detail Page
 * Design: 活力促銷電商風 - 紅白主色調
 */

import { useState } from 'react';
import { Link, useParams } from 'wouter';
import { ShoppingCart, Search, User, Star, Heart, Share2, ChevronRight, Plus, Minus, Truck, Shield, RefreshCw } from 'lucide-react';
import { products } from '@/lib/data';
import { toast } from 'sonner';

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const productId = parseInt(params.id || '1');
  const product = products.find(p => p.id === productId) || products[0];
  const relatedProducts = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  const [qty, setQty] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  const handleAddToCart = () => {
    toast.success(`Added ${qty} × "${product.name}" to cart!`);
  };

  const handleBuyNow = () => {
    toast.success('Proceeding to checkout...');
  };

  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

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
              <input type="text" placeholder="Search products..." className="flex-1 px-4 py-2 text-sm outline-none" />
              <button className="bg-red-500 text-white px-5 py-2"><Search size={16} /></button>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/cart">
              <button className="relative p-2">
                <ShoppingCart size={22} className="text-gray-600" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
              </button>
            </Link>
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
          <Link href="/products" className="hover:text-red-500">Products</Link>
          <ChevronRight size={14} />
          <span className="text-gray-700 line-clamp-1 max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 pb-8">
        {/* Product main info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <div className="flex gap-8">
            {/* Product image */}
            <div className="w-80 shrink-0">
              <div className="relative rounded-lg overflow-hidden border border-gray-100" style={{ paddingTop: '100%' }}>
                <img
                  src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'; }}
                />
                {discountPercent > 0 && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white text-sm px-2 py-1 rounded font-medium">
                    -{discountPercent}%
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
                <span className="text-sm text-gray-400">{product.sold} sold</span>
                <span className="text-sm text-gray-400">Stock: {product.stock}</span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-red-500">${product.price.toFixed(2)}</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-lg text-gray-400 line-through">${product.originalPrice.toFixed(2)}</span>
                  )}
                  {discountPercent > 0 && (
                    <span className="bg-red-100 text-red-500 text-sm px-2 py-0.5 rounded font-medium">Save {discountPercent}%</span>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-20 shrink-0">Category:</span>
                  <span className="text-sm text-gray-700">{product.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-20 shrink-0">Quantity:</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 border border-gray-200 rounded flex items-center justify-center hover:border-red-400 transition-colors">
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center font-medium">{qty}</span>
                    <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="w-8 h-8 border border-gray-200 rounded flex items-center justify-center hover:border-red-400 transition-colors">
                      <Plus size={14} />
                    </button>
                    <span className="text-xs text-gray-400 ml-2">{product.stock} available</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 border-2 border-red-500 text-red-500 hover:bg-red-50 py-3 rounded font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={18} />
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded font-medium transition-colors"
                >
                  Buy Now
                </button>
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`w-12 h-12 border rounded flex items-center justify-center transition-colors ${isWishlisted ? 'border-red-400 bg-red-50 text-red-500' : 'border-gray-200 text-gray-400 hover:border-red-400'}`}
                >
                  <Heart size={18} className={isWishlisted ? 'fill-red-500' : ''} />
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex gap-4 mt-5 pt-4 border-t border-gray-100">
                {[
                  { icon: Truck, text: 'Free Shipping' },
                  { icon: Shield, text: '100% Authentic' },
                  { icon: RefreshCw, text: '30-Day Returns' },
                ].map((badge) => (
                  <div key={badge.text} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <badge.icon size={14} className="text-red-400" />
                    {badge.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Product details tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-4">
          <div className="flex border-b border-gray-100">
            {['description', 'specifications', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="p-6">
            {activeTab === 'description' && (
              <div className="text-sm text-gray-600 leading-relaxed">
                <p>{product.description || 'No description available for this product.'}</p>
                <p className="mt-3">This high-quality product is carefully crafted to meet your needs. Our products undergo rigorous quality control to ensure you receive only the best.</p>
              </div>
            )}
            {activeTab === 'specifications' && (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-50">
                  {[
                    { label: 'Category', value: product.category },
                    { label: 'Rating', value: `${product.rating} / 5.0` },
                    { label: 'Total Sold', value: product.sold.toString() },
                    { label: 'Stock', value: product.stock.toString() },
                    { label: 'Status', value: product.status },
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
                  { name: 'Alice J.', rating: 5, comment: 'Excellent product! Exactly as described. Very happy with my purchase.', date: '2024-03-15' },
                  { name: 'Bob S.', rating: 4, comment: 'Good quality, fast shipping. Would recommend to others.', date: '2024-03-10' },
                  { name: 'Carol W.', rating: 5, comment: 'Perfect! Great value for money. Will buy again.', date: '2024-03-05' },
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
        {relatedProducts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="section-title">Related Products</div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {relatedProducts.map((p) => (
                <Link key={p.id} href={`/product/${p.id}`}>
                  <div className="product-card border border-gray-100 rounded overflow-hidden group cursor-pointer">
                    <div className="relative overflow-hidden" style={{ paddingTop: '100%' }}>
                      <img src={p.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop'} alt={p.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop'; }} />
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-gray-700 line-clamp-2">{p.name}</p>
                      <span className="price-current text-sm mt-1 block">${p.price.toFixed(2)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

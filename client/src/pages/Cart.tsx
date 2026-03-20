/**
 * ShopMart - Cart Page
 * Design: 活力促銷電商風 - 紅白主色調
 */

import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingCart, Search, User, Trash2, Plus, Minus, ChevronRight, ArrowLeft } from 'lucide-react';
import { products } from '@/lib/data';
import { toast } from 'sonner';

interface CartItem {
  product: typeof products[0];
  qty: number;
  selected: boolean;
}

export default function Cart() {
  const [, navigate] = useLocation();
  const [cartItems, setCartItems] = useState<CartItem[]>(
    products.slice(0, 3).map(p => ({ product: p, qty: 1, selected: true }))
  );

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
    toast.success('Item removed from cart');
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
      toast.error('Please select at least one item');
      return;
    }
    toast.success('Proceeding to checkout...');
  };

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
            <button className="relative p-2">
              <ShoppingCart size={22} className="text-red-500" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{cartItems.length}</span>
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
          <span className="text-gray-700">Shopping Cart</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 pb-8">
        {cartItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-16 text-center">
            <ShoppingCart size={60} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 text-lg">Your cart is empty</p>
            <Link href="/products">
              <button className="mt-4 bg-red-500 hover:bg-red-600 text-white px-8 py-2.5 rounded font-medium transition-colors">
                Continue Shopping
              </button>
            </Link>
          </div>
        ) : (
          <div className="flex gap-4">
            {/* Cart items */}
            <div className="flex-1 min-w-0">
              {/* Header row */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-3 flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={cartItems.every(item => item.selected)}
                  onChange={handleSelectAll}
                  className="w-4 h-4 accent-red-500"
                />
                <span className="text-sm text-gray-600">Select All ({cartItems.length})</span>
                <span className="ml-auto text-sm text-gray-400">Price</span>
              </div>

              {/* Items */}
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => handleToggleSelect(item.product.id)}
                      className="w-4 h-4 accent-red-500 shrink-0"
                    />
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 line-clamp-2">{item.product.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{item.product.category}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleQtyChange(item.product.id, -1)} className="w-7 h-7 border border-gray-200 rounded flex items-center justify-center hover:border-red-400 transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                      <button onClick={() => handleQtyChange(item.product.id, 1)} className="w-7 h-7 border border-gray-200 rounded flex items-center justify-center hover:border-red-400 transition-colors">
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="text-right shrink-0 w-24">
                      <p className="text-red-500 font-bold">${(item.product.price * item.qty).toFixed(2)}</p>
                      {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                        <p className="text-xs text-gray-400 line-through">${(item.product.originalPrice * item.qty).toFixed(2)}</p>
                      )}
                    </div>
                    <button onClick={() => handleRemove(item.product.id)} className="text-gray-300 hover:text-red-500 transition-colors shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <Link href="/">
                <button className="mt-4 flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors">
                  <ArrowLeft size={14} />
                  Continue Shopping
                </button>
              </Link>
            </div>

            {/* Order summary */}
            <div className="w-72 shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-5 sticky top-20">
                <h3 className="font-semibold text-gray-700 mb-4">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({selectedItems.length} items)</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-green-500">
                      <span>You save</span>
                      <span>-${savings.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="text-green-500">Free</span>
                  </div>
                  <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-800">
                    <span>Total</span>
                    <span className="text-red-500 text-lg">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded font-medium transition-colors"
                >
                  Checkout ({selectedItems.length})
                </button>
                <p className="text-xs text-gray-400 text-center mt-3">Secure checkout powered by ShopMart</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

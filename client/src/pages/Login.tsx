/**
 * ShopMart - Login Page
 * Design: 活力促銷電商風 - 紅白主色調
 */

import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingCart, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState<'login' | 'register'>('login');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsLoading(false);
    toast.success('Login successful!');
    navigate('/');
  };

  const handleAdminLogin = async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setIsLoading(false);
    toast.success('Admin login successful!');
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <ShoppingCart size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-800 text-lg">ShopMart</span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-red-500">← Back to Home</Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setTab('login')}
                className={`flex-1 py-4 text-sm font-medium transition-colors ${
                  tab === 'login'
                    ? 'text-red-500 border-b-2 border-red-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setTab('register')}
                className={`flex-1 py-4 text-sm font-medium transition-colors ${
                  tab === 'register'
                    ? 'text-red-500 border-b-2 border-red-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Register
              </button>
            </div>

            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {tab === 'login' ? 'Welcome back' : 'Create account'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {tab === 'register' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      className="w-full border border-gray-200 rounded px-4 py-2.5 text-sm outline-none focus:border-red-400 transition-colors"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full border border-gray-200 rounded pl-10 pr-4 py-2.5 text-sm outline-none focus:border-red-400 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full border border-gray-200 rounded pl-10 pr-10 py-2.5 text-sm outline-none focus:border-red-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {tab === 'login' && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input type="checkbox" className="rounded" />
                      Remember me
                    </label>
                    <a href="#" className="text-sm text-red-500 hover:underline">Forgot password?</a>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-3 rounded font-medium transition-colors"
                >
                  {isLoading ? 'Loading...' : tab === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-center text-sm text-gray-500 mb-4">Or continue with</p>
                <div className="grid grid-cols-2 gap-3">
                  <button className="border border-gray-200 rounded py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                    <span>🌐</span> Google
                  </button>
                  <button className="border border-gray-200 rounded py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                    <span>📘</span> Facebook
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={handleAdminLogin}
                  className="w-full border-2 border-red-500 text-red-500 hover:bg-red-50 py-2.5 rounded font-medium transition-colors text-sm"
                >
                  🔐 Admin Dashboard Login
                </button>
                <p className="text-center text-xs text-gray-400 mt-2">For store administrators only</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

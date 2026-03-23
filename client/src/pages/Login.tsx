/**
 * ShopMart - Login Page
 * Design: 活力促銷電商風 - 紅白主色調
 */

import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingCart, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { getLoginUrl, getSignUpUrl } from '@/const';

export default function Login() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const localLoginMutation = trpc.auth.localLogin.useMutation();
  const utils = trpc.useUtils();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(language === 'zh' ? '請輸入郵箱和密碼' : 'Please enter email and password');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await localLoginMutation.mutateAsync({ email, password });
      if (result.success) {
        toast.success(language === 'zh' ? '登入成功！' : 'Login successful!');
        await utils.auth.me.invalidate();
        navigate('/');
      }
    } catch (error: any) {
      const errorMessage = error?.message || (language === 'zh' ? '郵箱或密碼錯誤' : 'Invalid email or password');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
          <Link href="/" className="text-sm text-gray-500 hover:text-red-500">
            {language === 'zh' ? '← 返回首頁' : '← Back to Home'}
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">


            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {language === 'zh' ? '歡迎回來' : 'Welcome back'}
              </h2>

              <form onSubmit={handleLogin} className="space-y-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '郵箱' : 'Email'}
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={language === 'zh' ? '輸入您的郵箱' : 'Enter your email'}
                      className="w-full border border-gray-200 rounded pl-10 pr-4 py-2.5 text-sm outline-none focus:border-red-400 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '密碼' : 'Password'}
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={language === 'zh' ? '輸入您的密碼' : 'Enter your password'}
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

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" className="rounded" />
                    {language === 'zh' ? '記住我' : 'Remember me'}
                  </label>
                  <a href="#" className="text-sm text-red-500 hover:underline">
                    {language === 'zh' ? '忘記密碼？' : 'Forgot password?'}
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-3 rounded font-medium transition-colors"
                >
                  {isLoading 
                    ? (language === 'zh' ? '加載中...' : 'Loading...')
                    : (language === 'zh' ? '登入' : 'Sign In')
                  }
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-400">{language === 'zh' ? '或' : 'OR'}</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* OAuth Buttons */}
              <div className="space-y-3">
                <a
                  href={getLoginUrl()}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded font-medium transition-colors text-center text-sm"
                >
                  {language === 'zh' ? '用 Manus 登入' : 'Sign In with Manus'}
                </a>
                <a
                  href={getSignUpUrl()}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded font-medium transition-colors text-center text-sm"
                >
                  {language === 'zh' ? '用 Manus 註冊' : 'Sign Up with Manus'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

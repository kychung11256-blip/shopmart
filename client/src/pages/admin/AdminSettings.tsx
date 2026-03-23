/**
 * ShopMart Admin - Settings
 * Design: 深色側邊欄 + 白色內容區域
 */

import { useState, useEffect } from 'react';
import { Save, Store, Bell, Shield, Globe, CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { AdminLayout } from './Dashboard';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [storeName, setStoreName] = useState('ShopMart');
  const [storeEmail, setStoreEmail] = useState('admin@shopmart.com');
  const [storePhone, setStorePhone] = useState('400-2647-3947');
  const [storeAddress, setStoreAddress] = useState('Room 1101-04, Block A, Qihang Times Square, Xi\'an City');
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('UTC+8');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  // Stripe configuration state
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [isSavingStripe, setIsSavingStripe] = useState(false);
  
  // Stripe status query
  const { data: stripeStatus } = trpc.config.getStripeStatus.useQuery();
  const setStripeKeysMutation = trpc.config.setStripeKeys.useMutation();

  const tabs = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'localization', label: 'Localization', icon: Globe },
    { id: 'payment', label: 'Payment', icon: CreditCard },
  ];

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your store configuration</p>
      </div>

      <div className="flex gap-6">
        {/* Tabs sidebar */}
        <div className="w-48 shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-b border-gray-50 last:border-0 ${
                  activeTab === tab.id
                    ? 'bg-red-50 text-red-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings content */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-5">General Settings</h2>
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Email</label>
                  <input
                    type="email"
                    value={storeEmail}
                    onChange={(e) => setStoreEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Address</label>
                  <textarea
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 resize-none"
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-t border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Maintenance Mode</p>
                    <p className="text-xs text-gray-400">Temporarily disable the store for visitors</p>
                  </div>
                  <button
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${maintenanceMode ? 'bg-red-500' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${maintenanceMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <button
                  onClick={handleSave}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Save size={16} />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-5">Notification Settings</h2>
              <div className="space-y-4 max-w-lg">
                {[
                  { label: 'Email Notifications', desc: 'Receive email updates for important events', value: emailNotifications, onChange: setEmailNotifications },
                  { label: 'New Order Alerts', desc: 'Get notified when new orders are placed', value: orderAlerts, onChange: setOrderAlerts },
                  { label: 'Low Stock Alerts', desc: 'Alert when product stock falls below 10', value: lowStockAlerts, onChange: setLowStockAlerts },
                ].map((setting) => (
                  <div key={setting.label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{setting.label}</p>
                      <p className="text-xs text-gray-400">{setting.desc}</p>
                    </div>
                    <button
                      onClick={() => setting.onChange(!setting.value)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${setting.value ? 'bg-red-500' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${setting.value ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
                <button onClick={handleSave} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                  <Save size={16} />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-5">Security Settings</h2>
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input type="password" placeholder="••••••••" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input type="password" placeholder="••••••••" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input type="password" placeholder="••••••••" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400" />
                </div>
                <button onClick={handleSave} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                  <Save size={16} />
                  Update Password
                </button>
              </div>
            </div>
          )}

          {activeTab === 'localization' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-5">Localization</h2>
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400">
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CNY">CNY - Chinese Yuan</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400">
                    <option value="UTC+8">UTC+8 (Beijing, Shanghai)</option>
                    <option value="UTC+0">UTC+0 (London)</option>
                    <option value="UTC-5">UTC-5 (New York)</option>
                    <option value="UTC-8">UTC-8 (Los Angeles)</option>
                  </select>
                </div>
                <button onClick={handleSave} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                  <Save size={16} />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-5">Payment Settings</h2>
              <div className="space-y-6">
                {/* Stripe Configuration */}
                <div className="border-t border-gray-100 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-gray-800">Stripe Configuration</h3>
                      <p className="text-sm text-gray-500 mt-1">Configure your Stripe API keys for payment processing</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {stripeStatus?.secretKeyConfigured && stripeStatus?.publishableKeyConfigured ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle size={16} />
                          <span className="text-xs font-medium">Configured</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-orange-600">
                          <AlertCircle size={16} />
                          <span className="text-xs font-medium">Not Configured</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4 max-w-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                      <input
                        type="password"
                        value={stripeSecretKey}
                        onChange={(e) => setStripeSecretKey(e.target.value)}
                        placeholder="sk_test_..."
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400"
                      />
                      <p className="text-xs text-gray-400 mt-1">Your Stripe secret key (starts with sk_test_ or sk_live_)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Publishable Key</label>
                      <input
                        type="text"
                        value={stripePublishableKey}
                        onChange={(e) => setStripePublishableKey(e.target.value)}
                        placeholder="pk_test_..."
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400"
                      />
                      <p className="text-xs text-gray-400 mt-1">Your Stripe publishable key (starts with pk_test_ or pk_live_)</p>
                    </div>
                    <button
                      onClick={async () => {
                        if (!stripeSecretKey.trim() || !stripePublishableKey.trim()) {
                          toast.error('Please enter both Stripe keys');
                          return;
                        }
                        
                        setIsSavingStripe(true);
                        try {
                          await setStripeKeysMutation.mutateAsync({
                            secretKey: stripeSecretKey,
                            publishableKey: stripePublishableKey,
                          });
                          toast.success('Stripe keys configured successfully!');
                          setStripeSecretKey('');
                          setStripePublishableKey('');
                        } catch (error: any) {
                          toast.error(error?.message || 'Failed to save Stripe keys');
                        } finally {
                          setIsSavingStripe(false);
                        }
                      }}
                      disabled={isSavingStripe}
                      className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      {isSavingStripe ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Save Stripe Keys
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Other payment methods */}
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-4">Payment Methods</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Credit Card', desc: 'Accept Visa, Mastercard, Amex', enabled: true },
                      { name: 'PayPal', desc: 'Accept PayPal payments', enabled: true },
                      { name: 'Stripe', desc: 'Stripe payment gateway', enabled: stripeStatus?.secretKeyConfigured && stripeStatus?.publishableKeyConfigured },
                      { name: 'Alipay', desc: 'Accept Alipay payments', enabled: false },
                    ].map((method) => (
                      <div key={method.name} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{method.name}</p>
                          <p className="text-xs text-gray-400">{method.desc}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${method.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {method.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

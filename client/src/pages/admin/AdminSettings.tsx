/**
 * PinKoi Admin - Settings
 * Design: 深色側邊欄 + 白色內容區域
 */

import { useState, useEffect } from 'react';
import { Save, Store, Bell, Shield, Globe, CreditCard, Mail, Loader2, CheckCircle, AlertCircle, Send, Eye, EyeOff } from 'lucide-react';
import { AdminLayout } from './Dashboard';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [storeName, setStoreName] = useState('PinKoi');
  const [storeEmail, setStoreEmail] = useState('admin@shopmart.com');
  const [storePhone, setStorePhone] = useState('400-2647-3947');
  const [storeAddress, setStoreAddress] = useState("Room 1101-04, Block A, Qihang Times Square, Xi'an City");
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

  // Email SMTP configuration state
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('465');
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [fromName, setFromName] = useState('');
  const [fromAddress, setFromAddress] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  // Email template state
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Test email state
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Stripe status query
  const { data: stripeStatus } = trpc.config.getStripeStatus.useQuery();
  const setStripeKeysMutation = trpc.config.setStripeKeys.useMutation();

  // Email config queries
  const { data: emailConfig, refetch: refetchEmailConfig } = trpc.config.getEmailConfig.useQuery();
  const { data: emailTemplate, refetch: refetchEmailTemplate } = trpc.config.getEmailTemplate.useQuery();
  const setEmailConfigMutation = trpc.config.setEmailConfig.useMutation();
  const setEmailTemplateMutation = trpc.config.setEmailTemplate.useMutation();
  const sendTestEmailMutation = trpc.config.sendTestEmail.useMutation();

  // Load email config into state when data arrives
  useEffect(() => {
    if (emailConfig) {
      setEmailEnabled(emailConfig.enabled);
      setSmtpHost(emailConfig.smtpHost);
      setSmtpPort(emailConfig.smtpPort);
      setSmtpSecure(emailConfig.smtpSecure);
      setSmtpUser(emailConfig.smtpUser);
      setFromName(emailConfig.fromName);
      setFromAddress(emailConfig.fromAddress);
    }
  }, [emailConfig]);

  // Load email template into state when data arrives
  useEffect(() => {
    if (emailTemplate) {
      setTemplateSubject(emailTemplate.subject);
      setTemplateBody(emailTemplate.body);
    }
  }, [emailTemplate]);

  const tabs = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'localization', label: 'Localization', icon: Globe },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'email', label: 'Email', icon: Mail },
  ];

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };

  const handleSaveEmailConfig = async () => {
    if (!smtpHost.trim() || !smtpUser.trim() || !fromAddress.trim() || !fromName.trim()) {
      toast.error('Please fill in all required SMTP fields');
      return;
    }
    setIsSavingEmail(true);
    try {
      await setEmailConfigMutation.mutateAsync({
        smtpHost: smtpHost.trim(),
        smtpPort: smtpPort.trim() || '465',
        smtpSecure,
        smtpUser: smtpUser.trim(),
        smtpPass: smtpPass.trim() || undefined,
        fromName: fromName.trim(),
        fromAddress: fromAddress.trim(),
        enabled: emailEnabled,
      });
      toast.success('Email configuration saved!');
      setSmtpPass('');
      refetchEmailConfig();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save email configuration');
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateSubject.trim() || !templateBody.trim()) {
      toast.error('Subject and body are required');
      return;
    }
    setIsSavingTemplate(true);
    try {
      await setEmailTemplateMutation.mutateAsync({
        subject: templateSubject.trim(),
        body: templateBody.trim(),
      });
      toast.success('Email template saved!');
      refetchEmailTemplate();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress.trim()) {
      toast.error('Please enter a test email address');
      return;
    }
    setIsSendingTest(true);
    try {
      await sendTestEmailMutation.mutateAsync({ toEmail: testEmailAddress.trim() });
      toast.success(`Test email sent to ${testEmailAddress}`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send test email');
    } finally {
      setIsSendingTest(false);
    }
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
                      {isSavingStripe ? <><Loader2 size={16} className="animate-spin" />Saving...</> : <><Save size={16} />Save Stripe Keys</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Email Tab ─── */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              {/* SMTP Configuration Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">SMTP 邮件配置</h2>
                    <p className="text-sm text-gray-500 mt-1">配置发件邮箱，用于向买家发送订单确认邮件</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">启用邮件发送</span>
                    <button
                      onClick={() => setEmailEnabled(!emailEnabled)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${emailEnabled ? 'bg-green-500' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${emailEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                    {emailConfig?.enabled ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle size={15} />
                        <span className="text-xs font-medium">已启用</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-400">
                        <AlertCircle size={15} />
                        <span className="text-xs font-medium">未启用</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP 服务器地址 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="例如: smtp.gmail.com / smtp.qq.com"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">常用服务商：Gmail: smtp.gmail.com | QQ邮箱: smtp.qq.com | 163邮箱: smtp.163.com</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SMTP 端口</label>
                    <input
                      type="text"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      placeholder="465"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">SSL: 465 | TLS: 587 | 无加密: 25</p>
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <button
                      onClick={() => setSmtpSecure(!smtpSecure)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${smtpSecure ? 'bg-green-500' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${smtpSecure ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                    <div>
                      <p className="text-sm font-medium text-gray-700">SSL/TLS 加密</p>
                      <p className="text-xs text-gray-400">端口 465 推荐开启，端口 587 请关闭</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP 用户名（邮箱账号） <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP 密码 / 授权码 {emailConfig?.smtpPassConfigured && <span className="text-green-600 text-xs">(已设置)</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showSmtpPass ? 'text' : 'password'}
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        placeholder={emailConfig?.smtpPassConfigured ? '留空则保持原密码不变' : '输入邮箱密码或授权码'}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm outline-none focus:border-red-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSmtpPass(!showSmtpPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSmtpPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">QQ/163邮箱需使用「授权码」而非登录密码</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      发件人名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                      placeholder="例如: PinKoi 商城"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      发件人邮箱地址 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={fromAddress}
                      onChange={(e) => setFromAddress(e.target.value)}
                      placeholder="noreply@yourdomain.com"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">通常与 SMTP 用户名相同</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100">
                  <button
                    onClick={handleSaveEmailConfig}
                    disabled={isSavingEmail}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {isSavingEmail ? <><Loader2 size={16} className="animate-spin" />保存中...</> : <><Save size={16} />保存 SMTP 配置</>}
                  </button>
                </div>
              </div>

              {/* Test Email Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-2">发送测试邮件</h3>
                <p className="text-sm text-gray-500 mb-4">保存 SMTP 配置后，发送一封测试邮件验证配置是否正确</p>
                <div className="flex items-center gap-3 max-w-lg">
                  <input
                    type="email"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder="输入接收测试邮件的邮箱地址"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400"
                  />
                  <button
                    onClick={handleSendTestEmail}
                    disabled={isSendingTest}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    {isSendingTest ? <><Loader2 size={16} className="animate-spin" />发送中...</> : <><Send size={16} />发送测试</>}
                  </button>
                </div>
              </div>

              {/* Email Template Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">订单确认邮件模板</h3>
                    <p className="text-sm text-gray-500 mt-1">用户付款成功后自动发送此邮件</p>
                  </div>
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5"
                  >
                    <Eye size={14} />
                    {previewMode ? '编辑模式' : '预览效果'}
                  </button>
                </div>

                {/* Template variables hint */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
                  <p className="text-xs font-medium text-blue-700 mb-1">可用变量（自动替换）：</p>
                  <div className="flex flex-wrap gap-2">
                    {['{{orderNumber}}', '{{totalPrice}}', '{{customerName}}', '{{customerEmail}}', '{{items}}'].map(v => (
                      <code key={v} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{v}</code>
                    ))}
                  </div>
                </div>

                {!previewMode ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">邮件主题</label>
                      <input
                        type="text"
                        value={templateSubject}
                        onChange={(e) => setTemplateSubject(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">邮件正文（HTML 格式）</label>
                      <textarea
                        value={templateBody}
                        onChange={(e) => setTemplateBody(e.target.value)}
                        rows={16}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 font-mono resize-y"
                        placeholder="输入 HTML 格式的邮件正文..."
                      />
                      <p className="text-xs text-gray-400 mt-1">支持 HTML 标签，使用上方变量占位符实现动态内容</p>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={handleSaveTemplate}
                        disabled={isSavingTemplate}
                        className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        {isSavingTemplate ? <><Loader2 size={16} className="animate-spin" />保存中...</> : <><Save size={16} />保存模板</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <p className="text-xs text-gray-500">主题：<span className="font-medium text-gray-700">{templateSubject}</span></p>
                    </div>
                    <div
                      className="p-4"
                      dangerouslySetInnerHTML={{
                        __html: templateBody
                          .replace(/\{\{orderNumber\}\}/g, 'ORD-20240101-dlksnfsadnjfaklsd93793udhfk')
                          .replace(/\{\{totalPrice\}\}/g, '$99.00')
                          .replace(/\{\{customerName\}\}/g, 'Guest')
                          .replace(/\{\{customerEmail\}\}/g, 'customer@example.com')
                          .replace(/\{\{items\}\}/g, 'NFT Artwork × 1'),
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

/**
 * PinKoi Admin - Settings
 * Design: 深色側邊欄 + 白色內容區域
 */

import { useState, useEffect } from 'react';
import { Save, Store, Bell, Shield, Globe, CreditCard, Mail, Loader2, Eye, EyeOff, Send, FileText } from 'lucide-react';
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

  // Invoice configuration state
  const [invoiceCompanyName, setInvoiceCompanyName] = useState('');
  const [invoiceCompanyAddress, setInvoiceCompanyAddress] = useState('');
  const [invoiceCompanyEmail, setInvoiceCompanyEmail] = useState('');
  const [invoiceCompanyPhone, setInvoiceCompanyPhone] = useState('');
  const [invoiceRepName, setInvoiceRepName] = useState('');
  const [invoiceRepTitle, setInvoiceRepTitle] = useState('');
  const [invoiceSellerArtist, setInvoiceSellerArtist] = useState('');
  const [invoiceDisclaimer, setInvoiceDisclaimer] = useState('');
  const [invoiceLogoUrl, setInvoiceLogoUrl] = useState('');
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Stripe status query
  const { data: stripeStatus } = trpc.config.getStripeStatus.useQuery();
  const setStripeKeysMutation = trpc.config.setStripeKeys.useMutation();

  // Email config queries
  const { data: emailConfig, refetch: refetchEmailConfig } = trpc.config.getEmailConfig.useQuery();
  const { data: emailTemplate, refetch: refetchEmailTemplate } = trpc.config.getEmailTemplate.useQuery();
  const setEmailConfigMutation = trpc.config.setEmailConfig.useMutation();
  const setEmailTemplateMutation = trpc.config.setEmailTemplate.useMutation();
  const sendTestEmailMutation = trpc.config.sendTestEmail.useMutation();

  // Invoice config queries
  const { data: invoiceConfig, refetch: refetchInvoiceConfig } = trpc.config.getInvoiceConfig.useQuery();
  const setInvoiceConfigMutation = trpc.config.setInvoiceConfig.useMutation();
  const uploadInvoiceLogoMutation = trpc.config.uploadInvoiceLogo.useMutation();
  const deleteInvoiceLogoMutation = trpc.config.deleteInvoiceLogo.useMutation();

  // Payment methods toggle state
  const [whopEnabled, setWhopEnabled] = useState(true);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [transVoucherEnabled, setTransVoucherEnabled] = useState(false);
  const [ecomTrade24Enabled, setEcomTrade24Enabled] = useState(false);
  const [isSavingPaymentMethods, setIsSavingPaymentMethods] = useState(false);

  // Payment methods queries
  const { data: paymentMethods, refetch: refetchPaymentMethods } = trpc.config.getPaymentMethods.useQuery();
  const setPaymentMethodsMutation = trpc.config.setPaymentMethods.useMutation();

  // Invoice preview state
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const previewInvoiceMutation = trpc.config.previewInvoicePDF.useMutation();

  const handlePreviewInvoice = async () => {
    try {
      toast.loading('Generating preview...');
      const result = await previewInvoiceMutation.mutateAsync();
      toast.dismiss();
      // Convert base64 to blob URL
      const binaryStr = atob(result.pdfBase64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
      setShowInvoicePreview(true);
    } catch (err: any) {
      toast.dismiss();
      toast.error('Failed to generate preview: ' + (err?.message || 'Unknown error'));
    }
  };

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

  // Load payment methods into state when data arrives
  useEffect(() => {
    if (paymentMethods) {
      setWhopEnabled(paymentMethods.whopEnabled);
      setStripeEnabled(paymentMethods.stripeEnabled);
      setTransVoucherEnabled(paymentMethods.transVoucherEnabled ?? false);
      setEcomTrade24Enabled(paymentMethods.ecomTrade24Enabled ?? false);
    }
  }, [paymentMethods]);

  // Load invoice config into state when data arrives
  useEffect(() => {
    if (invoiceConfig) {
      setInvoiceCompanyName(invoiceConfig.companyName);
      setInvoiceCompanyAddress(invoiceConfig.companyAddress);
      setInvoiceCompanyEmail(invoiceConfig.companyEmail);
      setInvoiceCompanyPhone(invoiceConfig.companyPhone);
      setInvoiceRepName(invoiceConfig.companyRepName);
      setInvoiceRepTitle(invoiceConfig.companyRepTitle);
      setInvoiceSellerArtist(invoiceConfig.sellerArtistName);
      setInvoiceDisclaimer(invoiceConfig.disclaimerText);
      setInvoiceLogoUrl(invoiceConfig.companyLogoUrl || '');
    }
  }, [invoiceConfig]);

  const tabs = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'localization', label: 'Localization', icon: Globe },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'invoice', label: 'Invoice', icon: FileText },
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

  const handleUploadInvoiceLogo = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo file must be smaller than 5MB');
      return;
    }
    setIsUploadingLogo(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        const result = await uploadInvoiceLogoMutation.mutateAsync({
          fileBuffer: base64,
          fileName: file.name,
        });
        setInvoiceLogoUrl(result.url);
        toast.success('Logo uploaded successfully!');
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleDeleteInvoiceLogo = async () => {
    if (!invoiceLogoUrl) return;
    try {
      await deleteInvoiceLogoMutation.mutateAsync();
      setInvoiceLogoUrl('');
      toast.success('Logo deleted successfully!');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete logo');
    }
  };

  const handleSaveInvoiceConfig = async () => {
    if (!invoiceCompanyName.trim() || !invoiceCompanyAddress.trim() || !invoiceCompanyEmail.trim() || !invoiceRepName.trim() || !invoiceRepTitle.trim() || !invoiceDisclaimer.trim()) {
      toast.error('Please fill in all required invoice fields');
      return;
    }
    setIsSavingInvoice(true);
    try {
      await setInvoiceConfigMutation.mutateAsync({
        companyName: invoiceCompanyName.trim(),
        companyAddress: invoiceCompanyAddress.trim(),
        companyEmail: invoiceCompanyEmail.trim(),
        companyPhone: invoiceCompanyPhone.trim(),
        companyRepName: invoiceRepName.trim(),
        companyRepTitle: invoiceRepTitle.trim(),
        sellerArtistName: invoiceSellerArtist.trim(),
        disclaimerText: invoiceDisclaimer.trim(),
        companyLogoUrl: invoiceLogoUrl,
      });
      toast.success('Invoice settings saved! New PDFs will use these settings.');
      refetchInvoiceConfig();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save invoice settings');
    } finally {
      setIsSavingInvoice(false);
    }
  };

  return (
    <>
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
                  { label: 'Email Notifications', desc: 'Receive email alerts for important events', value: emailNotifications, set: setEmailNotifications },
                  { label: 'Order Alerts', desc: 'Get notified when new orders are placed', value: orderAlerts, set: setOrderAlerts },
                  { label: 'Low Stock Alerts', desc: 'Alert when product stock falls below threshold', value: lowStockAlerts, set: setLowStockAlerts },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => item.set(!item.value)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${item.value ? 'bg-red-500' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${item.value ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
                <button onClick={handleSave} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                  <Save size={16} />Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-5">Security Settings</h2>
              <div className="space-y-4 max-w-lg">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-700 font-medium">Authentication via Manus OAuth</p>
                  <p className="text-xs text-blue-500 mt-1">User authentication is handled securely through Manus OAuth. No password management required.</p>
                </div>
                <button onClick={handleSave} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                  <Save size={16} />Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'localization' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-5">Localization Settings</h2>
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400">
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="HKD">HKD - Hong Kong Dollar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400">
                    <option value="UTC+8">UTC+8 (Hong Kong / Singapore)</option>
                    <option value="UTC+0">UTC+0 (London)</option>
                    <option value="UTC-5">UTC-5 (New York)</option>
                    <option value="UTC-8">UTC-8 (Los Angeles)</option>
                  </select>
                </div>
                <button onClick={handleSave} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                  <Save size={16} />Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Payment Settings</h2>
                <p className="text-sm text-gray-500 mb-5">Enable or disable payment methods for your store. Changes take effect immediately.</p>
                <div className="space-y-4 max-w-lg">
                  {/* Whop Payment Toggle */}
                  <div className={`p-4 rounded-lg border transition-colors ${whopEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">Whop Payment Integration</p>
                        <p className="text-xs text-gray-500 mt-0.5">Process payments through Whop. Webhook is configured and active.</p>
                        {whopEnabled && (
                          <span className="inline-block mt-1.5 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">● Active</span>
                        )}
                        {!whopEnabled && (
                          <span className="inline-block mt-1.5 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">○ Disabled</span>
                        )}
                      </div>
                      <button
                        onClick={() => setWhopEnabled(!whopEnabled)}
                        className={`relative ml-4 w-12 h-6 rounded-full transition-colors flex-shrink-0 ${whopEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${whopEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Stripe Payment Toggle */}
                  <div className={`p-4 rounded-lg border transition-colors ${stripeEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">Stripe Integration</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {stripeStatus?.secretKeyConfigured
                            ? 'API keys configured. Enable to accept Stripe payments.'
                            : 'API keys not configured. Please set up Stripe keys first.'}
                        </p>
                        {stripeEnabled && (
                          <span className="inline-block mt-1.5 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">● Active</span>
                        )}
                        {!stripeEnabled && (
                          <span className="inline-block mt-1.5 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">○ Disabled</span>
                        )}
                      </div>
                      <button
                        onClick={() => setStripeEnabled(!stripeEnabled)}
                        className={`relative ml-4 w-12 h-6 rounded-full transition-colors flex-shrink-0 ${stripeEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${stripeEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  </div>

                  {/* TransVoucher Payment Toggle */}
                  <div className={`p-4 rounded-lg border transition-colors ${transVoucherEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">TransVoucher Integration</p>
                        <p className="text-xs text-gray-500 mt-0.5">Accept crypto & voucher payments via TransVoucher. Webhook URL: <code className="text-xs bg-gray-100 px-1 rounded">/api/transvoucher/webhook</code></p>
                        {transVoucherEnabled && (
                          <span className="inline-block mt-1.5 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">● Active</span>
                        )}
                        {!transVoucherEnabled && (
                          <span className="inline-block mt-1.5 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">○ Disabled</span>
                        )}
                      </div>
                      <button
                        onClick={() => setTransVoucherEnabled(!transVoucherEnabled)}
                        className={`relative ml-4 w-12 h-6 rounded-full transition-colors flex-shrink-0 ${transVoucherEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${transVoucherEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  </div>

                  {/* EcomTrade24 Payment Toggle */}
                  <div className={`p-4 rounded-lg border transition-colors ${ecomTrade24Enabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">EcomTrade24 Integration</p>
                        <p className="text-xs text-gray-500 mt-0.5">Accept credit card & more payments via EcomTrade24. Webhook URL: <code className="text-xs bg-gray-100 px-1 rounded">/api/ecomtrade24/webhook</code></p>
                        {ecomTrade24Enabled && (
                          <span className="inline-block mt-1.5 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">● Active</span>
                        )}
                        {!ecomTrade24Enabled && (
                          <span className="inline-block mt-1.5 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">○ Disabled</span>
                        )}
                      </div>
                      <button
                        onClick={() => setEcomTrade24Enabled(!ecomTrade24Enabled)}
                        className={`relative ml-4 w-12 h-6 rounded-full transition-colors flex-shrink-0 ${ecomTrade24Enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${ecomTrade24Enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={async () => {
                      setIsSavingPaymentMethods(true);
                      try {
                        await setPaymentMethodsMutation.mutateAsync({ whopEnabled, stripeEnabled, transVoucherEnabled, ecomTrade24Enabled });
                        await refetchPaymentMethods();
                        toast.success('Payment settings saved successfully!');
                      } catch (err: any) {
                        toast.error(err?.message || 'Failed to save payment settings');
                      } finally {
                        setIsSavingPaymentMethods(false);
                      }
                    }}
                    disabled={isSavingPaymentMethods}
                    className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {isSavingPaymentMethods ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {isSavingPaymentMethods ? 'Saving...' : 'Save Payment Settings'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-6">
              {/* SMTP Config Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">SMTP Email Configuration</h3>
                    <p className="text-sm text-gray-500 mt-1">Configure your email server for sending order confirmations</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Enable Email</span>
                    <button
                      onClick={() => setEmailEnabled(!emailEnabled)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${emailEnabled ? 'bg-green-500' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${emailEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4 max-w-lg">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host <span className="text-red-500">*</span></label>
                      <input type="text" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.exmail.qq.com" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                      <input type="text" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="465" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 py-2">
                    <button onClick={() => setSmtpSecure(!smtpSecure)} className={`relative w-11 h-6 rounded-full transition-colors ${smtpSecure ? 'bg-green-500' : 'bg-gray-200'}`}>
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${smtpSecure ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                    <div>
                      <p className="text-sm font-medium text-gray-700">SSL/TLS Encryption</p>
                      <p className="text-xs text-gray-400">Recommended for port 465</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Username <span className="text-red-500">*</span></label>
                    <input type="text" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="your@email.com" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Password / Auth Code {emailConfig?.smtpPassConfigured && <span className="text-green-600 text-xs">(Configured)</span>}
                    </label>
                    <div className="relative">
                      <input type={showSmtpPass ? 'text' : 'password'} value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} placeholder={emailConfig?.smtpPassConfigured ? 'Leave blank to keep existing password' : 'Enter password or auth code'} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm outline-none focus:border-red-400" />
                      <button type="button" onClick={() => setShowSmtpPass(!showSmtpPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showSmtpPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Name <span className="text-red-500">*</span></label>
                    <input type="text" value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="PinKoi Store" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Email Address <span className="text-red-500">*</span></label>
                    <input type="email" value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} placeholder="noreply@yourdomain.com" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400" />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100">
                  <button onClick={handleSaveEmailConfig} disabled={isSavingEmail} className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                    {isSavingEmail ? <><Loader2 size={16} className="animate-spin" />Saving...</> : <><Save size={16} />Save SMTP Config</>}
                  </button>
                </div>
              </div>

              {/* Test Email Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-2">Send Test Email</h3>
                <p className="text-sm text-gray-500 mb-4">After saving SMTP config, send a test email to verify the settings</p>
                <div className="flex items-center gap-3 max-w-lg">
                  <input type="email" value={testEmailAddress} onChange={(e) => setTestEmailAddress(e.target.value)} placeholder="Enter recipient email address" className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400" />
                  <button onClick={handleSendTestEmail} disabled={isSendingTest} className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap">
                    {isSendingTest ? <><Loader2 size={16} className="animate-spin" />Sending...</> : <><Send size={16} />Send Test</>}
                  </button>
                </div>
              </div>

              {/* Email Template Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">Order Confirmation Email Template</h3>
                    <p className="text-sm text-gray-500 mt-1">This email is sent automatically after successful payment</p>
                  </div>
                  <button onClick={() => setPreviewMode(!previewMode)} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5">
                    <Eye size={14} />
                    {previewMode ? 'Edit Mode' : 'Preview'}
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
                  <p className="text-xs font-medium text-blue-700 mb-1">Available variables (auto-replaced):</p>
                  <div className="flex flex-wrap gap-2">
                    {['{{orderNumber}}', '{{totalPrice}}', '{{customerName}}', '{{customerEmail}}', '{{items}}'].map(v => (
                      <code key={v} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{v}</code>
                    ))}
                  </div>
                </div>

                {!previewMode ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
                      <input type="text" value={templateSubject} onChange={(e) => setTemplateSubject(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Body (HTML format)</label>
                      <textarea value={templateBody} onChange={(e) => setTemplateBody(e.target.value)} rows={16} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 font-mono resize-y" placeholder="Enter HTML email body..." />
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <button onClick={handleSaveTemplate} disabled={isSavingTemplate} className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                        {isSavingTemplate ? <><Loader2 size={16} className="animate-spin" />Saving...</> : <><Save size={16} />Save Template</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <p className="text-xs text-gray-500">Subject: <span className="font-medium text-gray-700">{templateSubject}</span></p>
                    </div>
                    <div className="p-4" dangerouslySetInnerHTML={{
                      __html: templateBody
                        .replace(/\{\{orderNumber\}\}/g, 'ORD-20240101-dlksnfsadnjfaklsd93793udhfk')
                        .replace(/\{\{totalPrice\}\}/g, '$99.00')
                        .replace(/\{\{customerName\}\}/g, 'Guest')
                        .replace(/\{\{customerEmail\}\}/g, 'customer@example.com')
                        .replace(/\{\{items\}\}/g, 'NFT Artwork x 1'),
                    }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'invoice' && (
            <div className="space-y-6">
              {/* Company Info Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-gray-800">Invoice Settings</h2>
                  <p className="text-sm text-gray-500 mt-1">Configure company information and legal text that appears on all generated PDF invoices</p>
                </div>

                <div className="space-y-4 max-w-lg">
                  <div className="pb-3 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Company Logo</h3>
                    <p className="text-xs text-gray-400 mt-1">Displayed at the top of invoice PDFs</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                    {invoiceLogoUrl ? (
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img src={invoiceLogoUrl} alt="Company Logo" className="h-16 w-16 object-contain" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">Logo uploaded</p>
                              <p className="text-xs text-gray-400">Click to replace or delete</p>
                            </div>
                          </div>
                          <button
                            onClick={handleDeleteInvoiceLogo}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          id="logo-upload"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleUploadInvoiceLogo(e.target.files[0])}
                          disabled={isUploadingLogo}
                          className="hidden"
                        />
                        <label
                          htmlFor="logo-upload"
                          className="flex items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors"
                        >
                          <div className="text-center">
                            {isUploadingLogo ? (
                              <>
                                <Loader2 size={24} className="mx-auto mb-2 animate-spin text-red-500" />
                                <p className="text-sm text-gray-600">Uploading...</p>
                              </>
                            ) : (
                              <>
                                <p className="text-sm font-medium text-gray-700">Click to upload logo</p>
                                <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
                              </>
                            )}
                          </div>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="pb-3 border-b border-gray-100 pt-2">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Company Information</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={invoiceCompanyName}
                      onChange={(e) => setInvoiceCompanyName(e.target.value)}
                      placeholder="e.g. First Priority Asset Management LLC"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">Appears in the invoice header, Sold By section, and footer</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={invoiceCompanyAddress}
                      onChange={(e) => setInvoiceCompanyAddress(e.target.value)}
                      placeholder="e.g. 1640 Palm Ave, San Mateo, CA 94402"
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={invoiceCompanyEmail}
                      onChange={(e) => setInvoiceCompanyEmail(e.target.value)}
                      placeholder="contact@yourcompany.com"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Phone</label>
                    <input
                      type="text"
                      value={invoiceCompanyPhone}
                      onChange={(e) => setInvoiceCompanyPhone(e.target.value)}
                      placeholder="+1 (650) 555-0123"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400"
                    />
                  </div>

                  <div className="pb-3 pt-2 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Authorized Representative</h3>
                    <p className="text-xs text-gray-400 mt-1">Appears in the "Authorized by" section at the bottom of the invoice</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Representative Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={invoiceRepName}
                      onChange={(e) => setInvoiceRepName(e.target.value)}
                      placeholder="e.g. Andy Chan"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Representative Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={invoiceRepTitle}
                      onChange={(e) => setInvoiceRepTitle(e.target.value)}
                      placeholder="e.g. CEO of PaiKoi"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400"
                    />
                  </div>

                  <div className="pb-3 pt-2 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Seller / Artist</h3>
                    <p className="text-xs text-gray-400 mt-1">Appears in the "Seller / Artist" section of the invoice</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seller / Artist Name</label>
                    <input
                      type="text"
                      value={invoiceSellerArtist}
                      onChange={(e) => setInvoiceSellerArtist(e.target.value)}
                      placeholder="e.g. Amina Karim"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400"
                    />
                  </div>
                </div>
              </div>

              {/* Disclaimer Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-gray-800">Legal / Disclaimer Text</h3>
                  <p className="text-sm text-gray-500 mt-1">This text appears in the disclaimer section at the bottom of every invoice PDF</p>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
                  <p className="text-xs text-amber-700 font-medium">Format tip:</p>
                  <p className="text-xs text-amber-600 mt-1">Each line starting with "•" will be rendered as a bullet point. You can use plain text or start lines with "•" for bullet formatting.</p>
                </div>

                <textarea
                  value={invoiceDisclaimer}
                  onChange={(e) => setInvoiceDisclaimer(e.target.value)}
                  rows={10}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 font-mono resize-y"
                  placeholder={`• All NFT sales are final and non-refundable.\n• NFTs are created and provided by third-party artists; the Company acts only as a platform to facilitate the sale.\n• Buyer is responsible for any taxes, duties, or reporting obligations.`}
                />

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={handleSaveInvoiceConfig}
                    disabled={isSavingInvoice}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {isSavingInvoice
                      ? <><Loader2 size={16} className="animate-spin" />Saving...</>
                      : <><Save size={16} />Save Invoice Settings</>
                    }
                  </button>
                  <button
                    onClick={handlePreviewInvoice}
                    disabled={previewInvoiceMutation.isPending}
                    className="bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 border border-gray-300 px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {previewInvoiceMutation.isPending
                      ? <><Loader2 size={16} className="animate-spin" />Generating...</>
                      : <><FileText size={16} />Preview PDF</>
                    }
                  </button>
                  <p className="text-xs text-gray-400">Changes apply to all newly generated invoice PDFs</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>

    {/* Invoice Preview Modal */}
    {showInvoicePreview && previewPdfUrl && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowInvoicePreview(false)}>
        <div className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-red-500" />
              <h2 className="text-lg font-semibold text-gray-800">Invoice Preview</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Sample Data</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={previewPdfUrl}
                download="invoice-preview.pdf"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
              >
                <Save size={14} />Download
              </a>
              <button
                onClick={() => { setShowInvoicePreview(false); URL.revokeObjectURL(previewPdfUrl!); setPreviewPdfUrl(null); }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe
              src={previewPdfUrl}
              className="w-full h-full border-0"
              title="Invoice Preview"
            />
          </div>
        </div>
      </div>
      )}
    </>
  );
}

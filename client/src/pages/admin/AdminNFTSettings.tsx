/**
 * Admin NFT Settings Page
 * Configure Thirdweb API keys and merchant wallet address
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function AdminNFTSettings() {
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [merchantWallet, setMerchantWallet] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch current settings
  const { data: settings, isLoading: isLoadingSettings } = trpc.admin.getNFTSettings.useQuery();

  // Update settings mutation
  const updateSettings = trpc.admin.updateNFTSettings.useMutation({
    onSuccess: () => {
      setMessage({ type: 'success', text: 'NFT settings updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
    },
  });

  const handleSave = async () => {
    if (!merchantWallet) {
      setMessage({ type: 'error', text: 'Please enter merchant wallet address' });
      return;
    }

    setLoading(true);
    try {
      await updateSettings.mutateAsync({
        apiKey: apiKey || undefined,
        secretKey: secretKey || undefined,
        merchantWalletAddress: merchantWallet,
      });
    } finally {
      setLoading(false);
    }
  };

  // Load settings when fetched
  if (settings && !apiKey && !secretKey && !merchantWallet) {
    if (settings.apiKey) setApiKey(settings.apiKey);
    if (settings.secretKey) setSecretKey(settings.secretKey);
    if (settings.merchantWalletAddress) setMerchantWallet(settings.merchantWalletAddress);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">NFT Settings</h1>
        <p className="text-gray-600">Configure Thirdweb API credentials and merchant wallet</p>
      </div>

      {isLoadingSettings ? (
        <Card className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading settings...</span>
        </Card>
      ) : (
        <Card className="p-6 space-y-6">
          {/* Message Display */}
          {message && (
            <div
              className={`p-4 rounded-lg flex items-start gap-3 ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <p
                className={
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }
              >
                {message.text}
              </p>
            </div>
          )}

          {/* Merchant Wallet Address */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Merchant Wallet Address <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-600 mb-3">
              This wallet's NFT assets will be displayed as products in the marketplace
            </p>
            <input
              type="text"
              value={merchantWallet}
              onChange={(e) => setMerchantWallet(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              Example: 0x5d467E25C25945a10019e4045409746296cfd243
            </p>
          </div>

          {/* Thirdweb API Key */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Thirdweb API Key
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Get your API key from{' '}
              <a
                href="https://thirdweb.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Thirdweb Dashboard
              </a>
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Your API Key"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Thirdweb Secret Key */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Thirdweb Secret Key
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Your secret key for API authentication (keep this confidential)
            </p>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Your Secret Key"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={loading || !merchantWallet}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Info Box */}
      <Card className="p-4 bg-blue-50 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Set the merchant wallet address to display its NFT assets as products</li>
          <li>All NFTs in the merchant wallet will be automatically fetched and displayed</li>
          <li>Product prices are estimated based on NFT floor prices</li>
          <li>Thirdweb API keys are required to query NFT data</li>
        </ul>
      </Card>
    </div>
  );
}

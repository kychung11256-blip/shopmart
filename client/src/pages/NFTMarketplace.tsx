/**
 * NFT Marketplace Page
 * Display NFT assets from wallet as marketplace products
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

export default function NFTMarketplace() {
  const [walletAddress, setWalletAddress] = useState('0x5d467E25C25945a10019e4045409746296cfd243');
  const [apiKey, setApiKey] = useState('6adc0c22b790eb0f99ddf6751e2f81e6');
  const [secretKey, setSecretKey] = useState('3_J9f1tAknsqELfXjZp-VyElogXuy7kPaQo9mPDH7DAPjgQ4MacTgQ8hd03eoFzc8xWtqsAdEye0JQvyvmF-QQ');
  const [showForm, setShowForm] = useState(true);

  // Fetch NFT products
  const { data: nftProducts, isLoading, error } = trpc.nftProducts.getNFTProducts.useQuery(
    {
      walletAddress,
      apiKey,
      secretKey,
    },
    {
      enabled: !showForm && !!walletAddress && !!apiKey && !!secretKey,
    }
  );

  const handleFetchNFTs = () => {
    if (walletAddress && apiKey && secretKey) {
      setShowForm(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">NFT Marketplace</h1>
          <p className="text-lg opacity-90">Convert your NFT assets to marketplace products</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Configuration Form */}
        {showForm && (
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">NFT Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Wallet Address</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0x..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Thirdweb API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Your API Key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Thirdweb Secret Key</label>
                <input
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Your Secret Key"
                />
              </div>
              <Button
                onClick={handleFetchNFTs}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Fetch NFT Products
              </Button>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mr-2" />
            <span>Loading NFT products...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-6 mb-8 border-red-200 bg-red-50">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-red-800 mb-2">Error Loading NFTs</h3>
                <p className="text-red-700 text-sm">{error.message}</p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="mt-4 bg-red-600 hover:bg-red-700"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* NFT Products Grid */}
        {!showForm && nftProducts && nftProducts.success && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                NFT Products ({nftProducts.totalProducts})
              </h2>
              <Button
                onClick={() => setShowForm(true)}
                variant="outline"
              >
                Change Configuration
              </Button>
            </div>

            {nftProducts.totalProducts === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-gray-500 text-lg">No NFTs found for this wallet</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {nftProducts.products.map((product: any) => (
                  <Card
                    key={product.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Product Image */}
                    <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=NFT';
                        }}
                      />
                      <div className="absolute top-2 right-2 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                        NFT
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>

                      {/* Price */}
                      <div className="mb-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-purple-600">
                            ${product.price.toFixed(2)}
                          </span>
                          {product.originalPrice > product.price && (
                            <span className="text-sm text-gray-500 line-through">
                              ${product.originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">USD</p>
                      </div>

                      {/* NFT Details */}
                      <div className="bg-gray-50 p-3 rounded mb-4 text-xs">
                        <p className="text-gray-600 truncate">
                          <span className="font-semibold">Contract:</span> {product.nftData.contractAddress.slice(0, 10)}...
                        </p>
                        <p className="text-gray-600">
                          <span className="font-semibold">Token ID:</span> {product.nftData.tokenId}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-semibold">Chain:</span> {product.nftData.chainId.toUpperCase()}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <Button className="w-full bg-purple-600 hover:bg-purple-700">
                          Buy Now
                        </Button>
                        <Button variant="outline" className="w-full">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

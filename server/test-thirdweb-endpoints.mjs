/**
 * 測試多個 Thirdweb API 端點
 */

const apiKey = '6adc0c22b790eb0f99ddf6751e2f81e6';
const secretKey = '3_J9f1tAknsqELfXjZp-VyElogXuy7kPaQo9mPDH7DAPjgQ4MacTgQ8hd03eoFzc8xWtqsAdEye0JQvyvmF-QQ';
const walletAddress = '0x5d467E25C25945a10019e4045409746296cfd243';

const endpoints = [
  // Insight API endpoints
  `https://api.thirdweb.com/v1/nfts/balance/${walletAddress}?chain_id=56`,
  `https://insight.thirdweb.com/v1/nfts/balance/${walletAddress}?chain_id=56`,
  
  // Alternative paths
  `https://api.thirdweb.com/v1/wallet/${walletAddress}/nfts?chain_id=56`,
  `https://api.thirdweb.com/v1/nfts/${walletAddress}?chain_id=56`,
];

async function testEndpoint(url) {
  try {
    console.log(`\n[Test] Testing: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'x-client-id': apiKey,
        'x-secret-key': secretKey,
      }
    });
    
    console.log(`[Test] Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`[Test] ✅ Success! NFTs: ${data.nfts?.length || 0}`);
      return true;
    } else {
      const text = await response.text();
      console.log(`[Test] ❌ Error: ${response.statusText}`);
      console.log(`[Test] Body: ${text.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`[Test] ❌ Exception: ${error.message}`);
  }
  return false;
}

async function testAllEndpoints() {
  console.log('[Test] Testing Thirdweb API endpoints...');
  console.log('[Test] Wallet:', walletAddress);
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
}

testAllEndpoints();

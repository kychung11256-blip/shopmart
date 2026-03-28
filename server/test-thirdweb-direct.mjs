/**
 * 直接測試 Thirdweb API
 */

const apiKey = '6adc0c22b790eb0f99ddf6751e2f81e6';
const secretKey = '3_J9f1tAknsqELfXjZp-VyElogXuy7kPaQo9mPDH7DAPjgQ4MacTgQ8hd03eoFzc8xWtqsAdEye0JQvyvmF-QQ';
const walletAddress = '0x5d467E25C25945a10019e4045409746296cfd243';

async function testThirdwebAPI() {
  try {
    console.log('[Test] Testing Thirdweb API...');
    console.log('[Test] Wallet:', walletAddress);
    console.log('[Test] API Key:', apiKey.substring(0, 10) + '...');
    
    const url = `https://insight.thirdweb.com/v1/nfts/balance/${walletAddress}?chain_id=56`;
    console.log('[Test] URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'x-client-id': apiKey,
        'x-secret-key': secretKey,
      }
    });
    
    console.log('[Test] Response status:', response.status);
    console.log('[Test] Response statusText:', response.statusText);
    
    const text = await response.text();
    console.log('[Test] Response body length:', text.length);
    console.log('[Test] Response body:', text.substring(0, 500));
    
    if (response.ok) {
      try {
        const data = JSON.parse(text);
        console.log('[Test] ✅ Success! NFTs found:', data.nfts?.length || 0);
        console.log('[Test] Full response:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('[Test] Failed to parse JSON:', e.message);
      }
    } else {
      console.log('[Test] ❌ API Error:', response.statusText);
    }
  } catch (error) {
    console.error('[Test] ❌ Error:', error.message);
  }
}

testThirdwebAPI();

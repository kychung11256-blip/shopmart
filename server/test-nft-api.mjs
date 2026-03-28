/**
 * 測試 NFT API 端點
 */

async function testNFTAPI() {
  try {
    console.log('[Test] Starting NFT API test...');
    
    const response = await fetch('http://localhost:3000/api/trpc/nftProducts.getMerchantNFTProducts');
    
    console.log('[Test] Response status:', response.status);
    console.log('[Test] Response headers:', Object.fromEntries(response.headers));
    
    const text = await response.text();
    console.log('[Test] Response body:', text);
    
    if (response.ok) {
      try {
        const data = JSON.parse(text);
        console.log('[Test] Parsed JSON:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('[Test] Failed to parse JSON:', e.message);
      }
    }
  } catch (error) {
    console.error('[Test] Error:', error);
  }
}

testNFTAPI();

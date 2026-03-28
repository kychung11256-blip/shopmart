/**
 * NFT Testing Script
 * Test Thirdweb Insight API for NFT queries on BSC
 */

// Thirdweb credentials (provided by user)
const THIRDWEB_API_KEY = "6adc0c22b790eb0f99ddf6751e2f81e6";
const THIRDWEB_SECRET_KEY =
  "3_J9f1tAknsqELfXjZp-VyElogXuy7kPaQo9mPDH7DAPjgQ4MacTgQ8hd03eoFzc8xWtqsAdEye0JQvyvmF-QQ";

// Wallet address to query
const WALLET_ADDRESS = "0x5d467E25C25945a10019e4045409746296cfd243";

// BSC Chain ID
const BSC_CHAIN_ID = 56;

/**
 * Test NFT query on BSC (BNB Smart Chain) using Thirdweb Insight API
 */
async function testNFTQuery() {
  try {
    console.log("========================================");
    console.log("🔍 Testing Thirdweb Insight API");
    console.log("========================================");
    console.log(`API Key: ${THIRDWEB_API_KEY.substring(0, 10)}...`);
    console.log(`Wallet: ${WALLET_ADDRESS}`);
    console.log(`Chain: BSC (BNB Smart Chain) - Chain ID: ${BSC_CHAIN_ID}`);
    console.log("----------------------------------------");

    // Query NFT balances for wallet using Insight API
    console.log(`\n[1] Querying NFT balances for wallet: ${WALLET_ADDRESS}`);
    console.log(
      `    Endpoint: https://insight.thirdweb.com/v1/nfts/balance/{ownerAddress}`
    );

    const response = await fetch(
      `https://insight.thirdweb.com/v1/nfts/balance/${WALLET_ADDRESS}?chain_id=${BSC_CHAIN_ID}`,
      {
        method: "GET",
        headers: {
          "x-client-id": THIRDWEB_API_KEY,
          "x-secret-key": THIRDWEB_SECRET_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`    Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}\n${errorText}`
      );
    }

    const data = await response.json();
    const nfts = data.data || [];
    console.log(`✅ Query completed. Found ${nfts.length} NFTs`);

    // Display results
    console.log("\n[2] NFT Results:");
    console.log("----------------------------------------");

    if (nfts.length === 0) {
      console.log("❌ No NFTs found for this wallet on BSC");
    } else {
      nfts.forEach((nft, index) => {
        console.log(`\n📦 NFT #${index + 1}:`);
        console.log(`   Contract: ${nft.contract_address || "N/A"}`);
        console.log(`   Token ID: ${nft.token_id || "N/A"}`);
        console.log(`   Name: ${nft.name || "Unknown"}`);
        console.log(`   Symbol: ${nft.symbol || "N/A"}`);
        console.log(`   Balance: ${nft.balance || "1"}`);
        if (nft.image) {
          console.log(`   Image: ${nft.image}`);
        }
        if (nft.description) {
          console.log(`   Description: ${nft.description}`);
        }
      });
    }

    // Print raw data for debugging
    console.log("\n[3] Raw API Response (JSON):");
    console.log("----------------------------------------");
    console.log(JSON.stringify(data, null, 2));

    console.log("\n========================================");
    console.log("✅ Test completed successfully!");
    console.log("========================================");

    return {
      success: true,
      walletAddress: WALLET_ADDRESS,
      chainId: "bsc",
      chainIdNumber: BSC_CHAIN_ID,
      totalNFTs: nfts.length,
      nfts: nfts,
    };
  } catch (error) {
    console.error("\n❌ Error during NFT query:");
    console.error("----------------------------------------");
    console.error(`Error Type: ${error.constructor.name}`);
    console.error(`Message: ${error.message}`);
    if (error.stack) {
      console.error(`\nStack Trace:\n${error.stack}`);
    }
    console.error("----------------------------------------");

    return {
      success: false,
      error: error.message,
    };
  }
}

// Run the test
testNFTQuery().then((result) => {
  console.log("\n📊 Final Result:");
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
});

/**
 * Thirdweb Integration Module
 * Uses Thirdweb Insight API for querying NFT assets
 */

const INSIGHT_API_BASE = "https://insight.thirdweb.com";
const BSC_CHAIN_ID = 56; // BNB Smart Chain

/**
 * Get all NFT assets for a wallet address on BSC
 * @param walletAddress - Wallet address to query
 * @param apiKey - Thirdweb API Key (x-client-id)
 * @param secretKey - Thirdweb Secret Key (x-secret-key)
 */
export async function getNFTAssetsForWallet(
  walletAddress: string,
  apiKey: string,
  secretKey: string
) {
  try {
    console.log(
      `[Thirdweb] Querying NFT assets for wallet: ${walletAddress} on BSC`
    );

    // Use Thirdweb Insight API to get NFT balances
    const response = await fetch(
      `${INSIGHT_API_BASE}/v1/nfts/balance/${walletAddress}?chain_id=${BSC_CHAIN_ID}`,
      {
        method: "GET",
        headers: {
          "x-client-id": apiKey,
          "x-secret-key": secretKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}\n${errorText}`
      );
    }

    const data = await response.json();
    const nfts = data.data || [];

    console.log(
      `[Thirdweb] Found ${nfts.length} NFTs for wallet ${walletAddress}`
    );
    console.log("[Thirdweb] Raw NFT data:", JSON.stringify(nfts, null, 2));

    // Format and return the NFT data
    const formattedNFTs = nfts.map((nft: any) => ({
      contractAddress: nft.contract_address,
      tokenId: nft.token_id,
      tokenName: nft.contract?.name || "Unknown",
      tokenSymbol: nft.contract?.symbol || "NFT",
      chainId: "bsc",
      metadata: JSON.stringify({
        name: nft.collection?.name || nft.contract?.name,
        symbol: nft.contract?.symbol,
        type: nft.token_type,
        metadataUrl: nft.metadata_url,
      }),
      imageUrl: nft.image || null,
    }));

    console.log("[Thirdweb] Formatted NFTs:", formattedNFTs);

    return {
      success: true,
      walletAddress,
      chainId: "bsc",
      totalCount: nfts.length,
      nfts: formattedNFTs,
      rawData: nfts,
    };
  } catch (error) {
    console.error("[Thirdweb] Error fetching NFT assets:", error);
    throw error;
  }
}

/**
 * Transfer NFT from one address to another
 * @param contractAddress - NFT contract address
 * @param tokenId - Token ID to transfer
 * @param toAddress - Recipient address
 * @param fromPrivateKey - Sender's private key
 * @param apiKey - Thirdweb API Key
 */
export async function transferNFT(
  contractAddress: string,
  tokenId: string,
  toAddress: string,
  fromPrivateKey: string,
  apiKey: string
) {
  try {
    console.log(
      `[Thirdweb] Transferring NFT: ${contractAddress}/${tokenId} to ${toAddress}`
    );

    // Note: NFT transfer requires more complex setup with private key management
    // This is a placeholder for future implementation
    throw new Error(
      "NFT transfer functionality requires additional setup with wallet management"
    );
  } catch (error) {
    console.error("[Thirdweb] Error transferring NFT:", error);
    throw error;
  }
}

/**
 * Get NFT metadata for a specific token
 * @param contractAddress - NFT contract address
 * @param tokenId - Token ID
 * @param apiKey - Thirdweb API Key
 * @param secretKey - Thirdweb Secret Key
 */
export async function getNFTMetadata(
  contractAddress: string,
  tokenId: string,
  apiKey: string,
  secretKey: string
) {
  try {
    console.log(
      `[Thirdweb] Fetching metadata for NFT: ${contractAddress}/${tokenId}`
    );

    // Use Thirdweb Insight API to get NFT by token ID
    const response = await fetch(
      `${INSIGHT_API_BASE}/v1/nfts/${contractAddress}/${tokenId}?chain_id=${BSC_CHAIN_ID}`,
      {
        method: "GET",
        headers: {
          "x-client-id": apiKey,
          "x-secret-key": secretKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}\n${errorText}`
      );
    }

    const data = await response.json();
    console.log("[Thirdweb] NFT metadata:", data);

    return {
      success: true,
      contractAddress,
      tokenId,
      metadata: data,
    };
  } catch (error) {
    console.error("[Thirdweb] Error fetching NFT metadata:", error);
    throw error;
  }
}

/**
 * NFT Products Router
 * Convert NFT assets to marketplace products
 */

import { publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { getNFTAssetsForWallet } from "./thirdweb";

/**
 * Convert NFT to product format
 */
function convertNFTToProduct(nft: any, nftValue: number = 0) {
  return {
    id: `nft_${nft.contractAddress}_${nft.tokenId}`,
    name: nft.tokenName || "NFT Asset",
    description: `NFT from ${nft.tokenSymbol} collection`,
    price: nftValue, // Price in USD
    originalPrice: nftValue * 1.2, // Show 20% discount
    image: nft.imageUrl || "https://via.placeholder.com/300x300?text=NFT",
    category: "NFT",
    sold: 0,
    isNFT: true,
    nftData: {
      contractAddress: nft.contractAddress,
      tokenId: nft.tokenId,
      chainId: nft.chainId,
      metadata: nft.metadata,
    },
  };
}

/**
 * Get estimated USD value for NFT
 * This is a placeholder - in production, you'd use a price oracle
 */
function estimateNFTValueInUSD(nft: any): number {
  // Placeholder: Estimate based on collection name
  // In production, integrate with Thirdweb's pricing API or a price oracle
  const collectionName = nft.tokenName || "";

  // Mock pricing - replace with real pricing logic
  const basePrices: Record<string, number> = {
    "First Wave": 50, // Example: First Wave NFTs are worth ~$50
    default: 25,
  };

  return basePrices[collectionName] || basePrices.default;
}

export const nftProductsRouter = {
  /**
   * Get NFT assets for a wallet and convert to products
   */
  getNFTProducts: publicProcedure
    .input(
      z.object({
        walletAddress: z.string(),
        apiKey: z.string(),
        secretKey: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        console.log(
          `[NFT Products] Fetching NFT products for wallet: ${input.walletAddress}`
        );

        // Get NFT assets from Thirdweb
        const nftResult = await getNFTAssetsForWallet(
          input.walletAddress,
          input.apiKey,
          input.secretKey
        );

        if (!nftResult.success) {
          throw new Error("Failed to fetch NFT assets");
        }

        // Convert NFTs to products
        const products = nftResult.nfts.map((nft: any) => {
          const usdValue = estimateNFTValueInUSD(nft);
          return convertNFTToProduct(nft, usdValue);
        });

        console.log(
          `[NFT Products] Converted ${products.length} NFTs to products`
        );

        return {
          success: true,
          walletAddress: input.walletAddress,
          totalProducts: products.length,
          products,
          rawNFTs: nftResult.nfts,
        };
      } catch (error) {
        console.error("[NFT Products] Error fetching NFT products:", error);
        throw error;
      }
    }),

  /**
   * Get NFT product by ID
   */
  getNFTProduct: publicProcedure
    .input(
      z.object({
        productId: z.string(),
        apiKey: z.string(),
        secretKey: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        // Parse NFT product ID format: nft_{contractAddress}_{tokenId}
        const parts = input.productId.split("_");
        if (parts.length !== 3 || parts[0] !== "nft") {
          throw new Error("Invalid NFT product ID format");
        }

        const contractAddress = parts[1];
        const tokenId = parts[2];

        console.log(
          `[NFT Products] Fetching NFT product: ${contractAddress}/${tokenId}`
        );

        // In production, fetch from Thirdweb API
        // For now, return a placeholder
        return {
          success: true,
          product: {
            id: input.productId,
            name: "NFT Asset",
            description: "NFT from blockchain",
            price: 50,
            originalPrice: 60,
            image: "https://via.placeholder.com/300x300?text=NFT",
            category: "NFT",
            isNFT: true,
            nftData: {
              contractAddress,
              tokenId,
              chainId: "bsc",
            },
          },
        };
      } catch (error) {
        console.error("[NFT Products] Error fetching NFT product:", error);
        throw error;
      }
    }),

  /**
   * Estimate NFT value in USD
   */
  estimateNFTValue: publicProcedure
    .input(
      z.object({
        contractAddress: z.string(),
        tokenId: z.string(),
        collectionName: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        console.log(
          `[NFT Products] Estimating value for NFT: ${input.contractAddress}/${input.tokenId}`
        );

        // Mock NFT object for estimation
        const mockNFT = {
          tokenName: input.collectionName || "NFT",
        };

        const usdValue = estimateNFTValueInUSD(mockNFT);

        return {
          success: true,
          contractAddress: input.contractAddress,
          tokenId: input.tokenId,
          estimatedValueUSD: usdValue,
          currency: "USD",
        };
      } catch (error) {
        console.error("[NFT Products] Error estimating NFT value:", error);
        throw error;
      }
    }),
};

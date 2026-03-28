import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { getNFTAssetsForWallet, transferNFT } from "./thirdweb";
import { getDb } from "./db";
import { thirdwebConfig } from "../drizzle/schema";

/**
 * NFT Router - Handle NFT-related operations
 */
export const nftRouter = router({
  /**
   * Get all NFT assets for a wallet address on BSC
   */
  getWalletNFTs: publicProcedure
    .input(
      z.object({
        walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
      })
    )
    .query(async ({ input }) => {
      try {
        // Get Thirdweb API credentials from database
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const config = await db.query.thirdwebConfig.findFirst({
          where: (table, { isNotNull }) => isNotNull(table.thirdwebApiKey),
        });

        if (!config?.thirdwebApiKey || !config?.thirdwebSecretKey) {
          throw new Error("Thirdweb API credentials not configured");
        }

        console.log(
          `[NFT Router] Fetching NFTs for wallet: ${input.walletAddress}`
        );

        // Fetch NFTs from Thirdweb
        const result = await getNFTAssetsForWallet(
          input.walletAddress,
          config.thirdwebApiKey,
          config.thirdwebSecretKey
        );

        console.log("[NFT Router] NFT fetch result:", result);

        return result;
      } catch (error: any) {
        console.error("[NFT Router] Error fetching NFTs:", error);
        throw new Error(`Failed to fetch NFTs: ${error.message}`);
      }
    }),

  /**
   * Transfer NFT to another wallet
   */
  transferNFT: publicProcedure
    .input(
      z.object({
        contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid contract address"),
        tokenId: z.string(),
        toAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid recipient address"),
        fromPrivateKey: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Get Thirdweb API credentials from database
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const config = await db.query.thirdwebConfig.findFirst({
          where: (table, { isNotNull }) => isNotNull(table.thirdwebApiKey),
        });

        if (!config?.thirdwebApiKey) {
          throw new Error("Thirdweb API credentials not configured");
        }

        console.log(
          `[NFT Router] Transferring NFT: ${input.contractAddress}/${input.tokenId} to ${input.toAddress}`
        );

        // Transfer NFT
        const result = await transferNFT(
          input.contractAddress,
          input.tokenId,
          input.toAddress,
          input.fromPrivateKey,
          config.thirdwebApiKey
        );

        console.log("[NFT Router] NFT transfer result:", result);

        return result;
      } catch (error: any) {
        console.error("[NFT Router] Error transferring NFT:", error);
        throw new Error(`Failed to transfer NFT: ${error.message}`);
      }
    }),

  /**
   * Save Thirdweb API credentials
   */
  saveThirdwebCredentials: publicProcedure
    .input(
      z.object({
        apiKey: z.string(),
        secretKey: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log("[NFT Router] Saving Thirdweb credentials");

        // Check if credentials already exist
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const existing = await db.query.thirdwebConfig.findFirst();

        if (existing) {
          // Update existing credentials
          await db
            .update(thirdwebConfig)
            .set({
              thirdwebApiKey: input.apiKey,
              thirdwebSecretKey: input.secretKey,
              updatedAt: new Date(),
            })
            .where((table) => table.id.equals(existing.id));
        } else {
          // Insert new credentials
          await db.insert(thirdwebConfig).values({
            thirdwebApiKey: input.apiKey,
            thirdwebSecretKey: input.secretKey,
          });
        }

        console.log("[NFT Router] Thirdweb credentials saved successfully");

        return {
          success: true,
          message: "Thirdweb credentials saved successfully",
        };
      } catch (error: any) {
        console.error("[NFT Router] Error saving credentials:", error);
        throw new Error(`Failed to save credentials: ${error.message}`);
      }
    }),

  /**
   * Get Thirdweb API credentials status
   */
  getCredentialsStatus: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const config = await db.query.thirdwebConfig.findFirst();

      return {
        configured: !!config?.thirdwebApiKey && !!config?.thirdwebSecretKey,
        apiKeyExists: !!config?.thirdwebApiKey,
        secretKeyExists: !!config?.thirdwebSecretKey,
      };
    } catch (error: any) {
      console.error("[NFT Router] Error checking credentials status:", error);
      throw new Error(`Failed to check credentials: ${error.message}`);
    }
  }),
});

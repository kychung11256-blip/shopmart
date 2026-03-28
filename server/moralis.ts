/**
 * Moralis API 調用模塊
 * 用於獲取 NFT 數據和圖片
 */

interface MoralisNFTItem {
  token_id: string;
  token_address: string;
  name: string;
  symbol: string;
  contract_type: string;
  metadata: string;
  owner_of: string;
  amount: string;
  possible_spam: boolean;
  verified_collection: boolean;
  normalized_metadata?: {
    image?: string;
    image_url?: string;
    name?: string;
    description?: string;
  };
  collection_logo?: string;
  collection_banner_image?: string;
}

interface MoralisNFTResponse {
  status: string;
  page: number;
  page_size: number;
  cursor?: string;
  result: MoralisNFTItem[];
}

export class MoralisAPI {
  private apiKey: string;
  private baseUrl = 'https://deep-index.moralis.io/api/v2.2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 獲取錢包中特定合約的 NFT
   */
  async getNFTsByContract(
    walletAddress: string,
    contractAddress: string,
    chain: string = 'bsc'
  ): Promise<MoralisNFTResponse> {
    const url = `${this.baseUrl}/${walletAddress}/nft/${contractAddress}?chain=${chain}&format=decimal&media_items=false`;

    console.log('[Moralis] Fetching NFTs from:', url);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
          'X-API-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Moralis] API error:', response.status, errorText);
        throw new Error(`Moralis API returned status ${response.status}: ${errorText}`);
      }

      const data = await response.json() as MoralisNFTResponse;
      console.log('[Moralis] Successfully fetched', data.result.length, 'NFTs');

      return data;
    } catch (error) {
      console.error('[Moralis] Failed to fetch NFTs:', error);
      throw error;
    }
  }

  /**
   * 獲取錢包中的所有 NFT 集合
   */
  async getNFTCollections(
    walletAddress: string,
    chain: string = 'bsc'
  ): Promise<any> {
    const url = `${this.baseUrl}/${walletAddress}/nft/collections?chain=${chain}`;

    console.log('[Moralis] Fetching NFT collections from:', url);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
          'X-API-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Moralis] API error:', response.status, errorText);
        throw new Error(`Moralis API returned status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('[Moralis] Successfully fetched', data.result.length, 'collections');

      return data;
    } catch (error) {
      console.error('[Moralis] Failed to fetch collections:', error);
      throw error;
    }
  }

  /**
   * 從 NFT 數據中提取圖片 URL
   */
  extractImageUrl(nft: MoralisNFTItem): string | null {
    // 優先級順序：
    // 1. collection_logo
    // 2. collection_banner_image
    // 3. normalized_metadata.image
    // 4. normalized_metadata.image_url
    // 5. null

    if (nft.collection_logo) {
      console.log('[Moralis] Found image in collection_logo');
      console.log("[Moralis] collection_logo value:", nft.collection_logo);
      return nft.collection_logo;
    }

    if (nft.collection_banner_image) {
      console.log('[Moralis] Found image in collection_banner_image');
      return nft.collection_banner_image;
    }

    if (nft.normalized_metadata?.image) {
      console.log('[Moralis] Found image in normalized_metadata.image');
      return nft.normalized_metadata.image;
    }

    if (nft.normalized_metadata?.image_url) {
      console.log('[Moralis] Found image in normalized_metadata.image_url');
      return nft.normalized_metadata.image_url;
    }

    console.log('[Moralis] No image found for NFT', nft.token_id);
    return null;
  }
}

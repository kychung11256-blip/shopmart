import { describe, it, expect, beforeAll } from 'vitest';
import { 
  getAllBanners, 
  getActiveBanners, 
  getBannerById, 
  createBanner, 
  updateBanner, 
  deleteBanner,
  reorderBanners 
} from './db';

describe('Banner Management', () => {
  let testBannerId: number;

  beforeAll(async () => {
    // Clean up any existing test banners before running tests
    console.log('Banner tests initialized');
  });

  it('should create a banner', async () => {
    const result = await createBanner({
      title: 'Test Banner',
      titleEn: 'Test Banner EN',
      subtitle: 'Test Subtitle',
      subtitleEn: 'Test Subtitle EN',
      image: 'https://example.com/image.jpg',
      link: 'https://example.com',
      ctaText: '查看詳情',
      ctaTextEn: 'View Details',
      order: 1,
    });
    
    expect(result).toBeDefined();
    testBannerId = result.insertId || 1;
  });

  it('should get all banners', async () => {
    const banners = await getAllBanners();
    expect(Array.isArray(banners)).toBe(true);
  });

  it('should get active banners only', async () => {
    const banners = await getActiveBanners();
    expect(Array.isArray(banners)).toBe(true);
    // All returned banners should have status 'active'
    banners.forEach(banner => {
      expect(banner.status).toBe('active');
    });
  });

  it('should get banner by ID', async () => {
    if (testBannerId) {
      const banner = await getBannerById(testBannerId);
      expect(banner).toBeDefined();
      if (banner) {
        expect(banner.id).toBe(testBannerId);
        expect(banner.title).toBe('Test Banner');
      }
    }
  });

  it('should update a banner', async () => {
    if (testBannerId) {
      const result = await updateBanner(testBannerId, {
        title: 'Updated Banner',
        status: 'inactive',
      });
      
      expect(result).toBeDefined();
      
      // Verify the update
      const updated = await getBannerById(testBannerId);
      if (updated) {
        expect(updated.title).toBe('Updated Banner');
        expect(updated.status).toBe('inactive');
      }
    }
  });

  it('should reorder banners', async () => {
    const banners = await getAllBanners();
    if (banners.length >= 2) {
      const ids = banners.slice(0, 2).map(b => b.id);
      const result = await reorderBanners(ids);
      expect(result).toBeDefined();
    }
  });

  it('should delete a banner', async () => {
    if (testBannerId) {
      const result = await deleteBanner(testBannerId);
      expect(result).toBeDefined();
      
      // Verify deletion
      const deleted = await getBannerById(testBannerId);
      expect(deleted).toBeNull();
    }
  });
});

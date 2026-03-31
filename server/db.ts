import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date().toISOString();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date().toISOString();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

export async function getConfig(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get config: database not available");
    return null;
  }

  try {
    const { config } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    const result = await db.select().from(config).where(eq(config.key, key));
    return result.length > 0 ? result[0].value : null;
  } catch (error) {
    console.error("[Database] Failed to get config:", error);
    return null;
  }
}

export async function setConfig(key: string, value: string, description?: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot set config: database not available");
    return;
  }

  try {
    const { config } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    // Check if config already exists
    const existing = await db.select().from(config).where(eq(config.key, key));
    
    if (existing.length > 0) {
      // Update existing
      await db.update(config)
        .set({ value, description, updatedAt: new Date().toISOString() })
        .where(eq(config.key, key));
    } else {
      // Insert new
      await db.insert(config).values({
        key,
        value,
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("[Database] Failed to set config:", error);
    throw error;
  }
}


// Banner queries
export async function getAllBanners() {
  const db = await getDb();
  if (!db) return [];
  
  const { banners } = await import("../drizzle/schema");
  const { desc } = await import("drizzle-orm");
  
  try {
    const result = await db.select().from(banners).orderBy(desc(banners.order));
    return result || [];
  } catch (error) {
    console.error('[Database] Error fetching all banners:', error);
    return [];
  }
}

export async function getActiveBanners() {
  const db = await getDb();
  if (!db) return [];
  
  const { banners } = await import("../drizzle/schema");
  const { desc, eq } = await import("drizzle-orm");
  
  try {
    const result = await db.select().from(banners)
      .where(eq(banners.status, 'active'))
      .orderBy(desc(banners.order));
    return result || [];
  } catch (error) {
    console.error('[Database] Error fetching active banners:', error);
    return [];
  }
}

export async function getBannerById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const { banners } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  try {
    const result = await db.select().from(banners)
      .where(eq(banners.id, id))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error('[Database] Error fetching banner by ID:', error);
    return null;
  }
}

export async function createBanner(data: {
  title: string;
  titleEn?: string;
  subtitle?: string;
  subtitleEn?: string;
  image: string;
  link?: string;
  ctaText?: string;
  ctaTextEn?: string;
  order?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { banners } = await import("../drizzle/schema");
  
  const result = await db.insert(banners).values({
    title: data.title,
    titleEn: data.titleEn || null,
    subtitle: data.subtitle || null,
    subtitleEn: data.subtitleEn || null,
    image: data.image,
    link: data.link || null,
    ctaText: data.ctaText || null,
    ctaTextEn: data.ctaTextEn || null,
    order: data.order || 0,
    status: 'active',
  });
  
  return result;
}

export async function updateBanner(id: number, data: Partial<{
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  image: string;
  link: string;
  ctaText: string;
  ctaTextEn: string;
  order: number;
  status: 'active' | 'inactive';
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { banners } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  return db.update(banners)
    .set(data)
    .where(eq(banners.id, id));
}

export async function deleteBanner(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { banners } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  return db.delete(banners).where(eq(banners.id, id));
}

export async function reorderBanners(bannerIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { banners } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  for (let i = 0; i < bannerIds.length; i++) {
    await db.update(banners)
      .set({ order: i })
      .where(eq(banners.id, bannerIds[i]));
  }
}

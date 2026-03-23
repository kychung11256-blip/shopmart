import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import type { User } from "../drizzle/schema";
import { products, categories, orders, orderItems, cart, users, InsertProduct, InsertOrder, InsertOrderItem, InsertCartItem } from "../drizzle/schema";
import { eq, and, desc, asc } from "drizzle-orm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    // Local login for development/testing
    localLogin: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // Hardcoded test users for local development
        let user: User | null = null;
        if (input.email === 'admin@example.com' && input.password === 'admin123') {
          const existing = await db.select().from(users).where(eq(users.email, 'admin@example.com')).limit(1);
          if (existing.length > 0) {
            user = existing[0];
          } else {
            // Create admin user if doesn't exist
            await db.insert(users).values({
              openId: 'local-admin-001',
              email: 'admin@example.com',
              name: 'Admin User',
              role: 'admin',
              loginMethod: 'local',
            });
            const result = await db.select().from(users).where(eq(users.email, 'admin@example.com')).limit(1);
            user = result[0] || null;
          }
        } else if (input.email === 'user@example.com' && input.password === 'user123') {
          const existing = await db.select().from(users).where(eq(users.email, 'user@example.com')).limit(1);
          if (existing.length > 0) {
            user = existing[0];
          } else {
            // Create regular user if doesn't exist
            await db.insert(users).values({
              openId: 'local-user-001',
              email: 'user@example.com',
              name: 'Regular User',
              role: 'user',
              loginMethod: 'local',
            });
            const result = await db.select().from(users).where(eq(users.email, 'user@example.com')).limit(1);
            user = result[0] || null;
          }
        } else {
          throw new Error('Invalid email or password');
        }

        if (!user) {
          throw new Error('Failed to create or retrieve user');
        }

        // Create session token and set cookie
        const { sdk } = await import('./_core/sdk');
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || '',
          expiresInMs: 365 * 24 * 60 * 60 * 1000, // 1 year
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: 365 * 24 * 60 * 60 * 1000,
        });

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      }),
    // Local registration for development/testing
    localRegister: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // Check if user already exists
        const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (existing.length > 0) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email already registered',
          });
        }

        // Create new user
        const openId = `local-user-${Date.now()}`;
        await db.insert(users).values({
          openId,
          email: input.email,
          name: input.name,
          role: 'user',
          loginMethod: 'local',
        });

        const result = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        const user = result[0];

        if (!user) {
          throw new Error('Failed to create user');
        }

        // Create session token and set cookie
        const { sdk } = await import('./_core/sdk');
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || '',
          expiresInMs: 365 * 24 * 60 * 60 * 1000, // 1 year
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: 365 * 24 * 60 * 60 * 1000,
        });

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      }),
  }),

  // Products router
  products: router({
    uploadImage: adminProcedure
      .input(z.object({
        base64: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { storagePut } = await import('./storage');
          const buffer = Buffer.from(input.base64, 'base64');
          const key = `products/${Date.now()}-${input.fileName}`;
          const { url } = await storagePut(key, buffer, input.mimeType);
          console.log('[API] Image uploaded successfully:', url);
          return { success: true, url };
        } catch (error) {
          console.error('[API] Error uploading image:', error);
          throw error;
        }
      }),
    list: publicProcedure
      .input(z.object({
        categoryId: z.number().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        try {
          if (input.categoryId) {
            return await db.select().from(products).where(and(eq(products.status, 'active'), eq(products.categoryId, input.categoryId))).limit(input.limit).offset(input.offset);
          }
          return await db.select().from(products).where(eq(products.status, 'active')).limit(input.limit).offset(input.offset);
        } catch (error) {
          console.error("[API] Error fetching products:", error);
          return [];
        }
      }),
    getById: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        try {
          const result = await db.select().from(products).where(eq(products.id, input)).limit(1);
          return result[0] || null;
        } catch (error) {
          console.error("[API] Error fetching product:", error);
          return null;
        }
      }),
    listAll: adminProcedure
      .input(z.object({
        limit: z.number().default(200),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        try {
          return await db.select().from(products).limit(input.limit).offset(input.offset);
        } catch (error) {
          console.error("[API] Error fetching all products:", error);
          return [];
        }
      }),
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        price: z.number(),
        originalPrice: z.number().optional(),
        categoryId: z.number().optional(),
        image: z.string().optional(),
        stock: z.number().default(0),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        try {
          const newProduct: InsertProduct = {
            ...input,
            price: Math.round(input.price * 100),
            originalPrice: input.originalPrice ? Math.round(input.originalPrice * 100) : undefined,
          };
          const result = await db.insert(products).values(newProduct);
          return { success: true };
        } catch (error) {
          console.error("[API] Error creating product:", error);
          throw error;
        }
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.number().optional(),
        originalPrice: z.number().optional(),
        categoryId: z.number().optional(),
        image: z.string().optional(),
        stock: z.number().optional(),
        status: z.enum(['active', 'inactive', 'deleted']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        try {
          const { id, ...updates } = input;
          const updateData: any = { ...updates };
          // 使用 !== undefined 檢查，確保 0 值也能被轉換
          if (updates.price !== undefined) updateData.price = Math.round(updates.price * 100);
          if (updates.originalPrice !== undefined) updateData.originalPrice = Math.round(updates.originalPrice * 100);
          console.log('[API] Updating product', id, 'with data:', updateData);
          await db.update(products).set(updateData).where(eq(products.id, id));
          console.log('[API] Product updated successfully');
          return { success: true };
        } catch (error) {
          console.error("[API] Error updating product:", error);
          throw error;
        }
      }),
    delete: adminProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        try {
          await db.update(products).set({ status: 'deleted' }).where(eq(products.id, input));
          return { success: true };
        } catch (error) {
          console.error("[API] Error deleting product:", error);
          throw error;
        }
      }),
  }),

  // Categories router
  categories: router({
    list: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      try {
        return await db.select().from(categories).where(eq(categories.status, 'active')).orderBy(asc(categories.order));
      } catch (error) {
        console.error("[API] Error fetching categories:", error);
        return [];
      }
    }),
    listAll: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      try {
        return await db.select().from(categories).orderBy(asc(categories.order));
      } catch (error) {
        console.error('[API] Error fetching all categories:', error);
        return [];
      }
    }),
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        order: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        try {
          const newCategory = {
            name: input.name,
            description: input.description,
            order: input.order,
            status: 'active' as const,
          };
          await db.insert(categories).values(newCategory);
          console.log('[API] Category created successfully:', input.name);
          return { success: true };
        } catch (error) {
          console.error('[API] Error creating category:', error);
          throw error;
        }
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        order: z.number().optional(),
        status: z.enum(['active', 'inactive']).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        try {
          const { id, ...updates } = input;
          await db.update(categories).set(updates).where(eq(categories.id, id));
          console.log('[API] Category updated successfully:', id);
          return { success: true };
        } catch (error) {
          console.error('[API] Error updating category:', error);
          throw error;
        }
      }),
    delete: adminProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        try {
          await db.update(categories).set({ status: 'inactive' }).where(eq(categories.id, input));
          console.log('[API] Category deleted successfully:', input);
          return { success: true };
        } catch (error) {
          console.error('[API] Error deleting category:', error);
          throw error;
        }
      }),
  }),

  // Orders router
  orders: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        if (ctx.user?.role === 'admin') {
          return await db.select().from(orders).orderBy(desc(orders.createdAt));
        }
        return await db.select().from(orders).where(eq(orders.userId, ctx.user?.id || 0)).orderBy(desc(orders.createdAt));
      } catch (error) {
        console.error("[API] Error fetching orders:", error);
        return [];
      }
    }),
    create: protectedProcedure
      .input(z.object({
        items: z.array(z.object({ productId: z.number(), quantity: z.number() })),
        shippingAddress: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        try {
          const orderNumber = `ORD-${Date.now()}`;
          let totalPrice = 0;
          for (const item of input.items) {
            const product = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
            if (product[0]) totalPrice += product[0].price * item.quantity;
          }
          const newOrder: InsertOrder = {
            orderNumber,
            userId: ctx.user?.id || 0,
            totalPrice,
            shippingAddress: input.shippingAddress,
          };
          const orderResult = await db.insert(orders).values(newOrder);
          return { success: true, orderNumber };
        } catch (error) {
          console.error("[API] Error creating order:", error);
          throw error;
        }
      }),
    getById: protectedProcedure
      .input(z.number())
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        try {
          const order = await db.select().from(orders).where(and(eq(orders.id, input), eq(orders.userId, ctx.user?.id || 0))).limit(1);
          if (!order[0]) throw new Error('Order not found');
          const items = await db.select().from(orderItems).where(eq(orderItems.orderId, input));
          return { ...order[0], items };
        } catch (error) {
          console.error('[API] Error fetching order:', error);
          throw error;
        }
      }),
  }),

  // Cart router
  cart: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        return await db.select().from(cart).where(eq(cart.userId, ctx.user?.id || 0));
      } catch (error) {
        console.error("[API] Error fetching cart:", error);
        return [];
      }
    }),
    add: protectedProcedure
      .input(z.object({ productId: z.number(), quantity: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        try {
          const existing = await db.select().from(cart).where(and(eq(cart.userId, ctx.user?.id || 0), eq(cart.productId, input.productId))).limit(1);
          if (existing[0]) {
            await db.update(cart).set({ quantity: existing[0].quantity + input.quantity }).where(eq(cart.id, existing[0].id));
          } else {
            const newItem: InsertCartItem = { userId: ctx.user?.id || 0, productId: input.productId, quantity: input.quantity };
            await db.insert(cart).values(newItem);
          }
          return { success: true };
        } catch (error) {
          console.error("[API] Error adding to cart:", error);
          throw error;
        }
      }),
    remove: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        try {
          await db.delete(cart).where(eq(cart.id, input));
          return { success: true };
        } catch (error) {
          console.error("[API] Error removing from cart:", error);
          throw error;
        }
      }),
  }),



  // Stripe payment router
  payments: router({
    createCheckoutSession: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.number(),
          price: z.number(),
          name: z.string(),
        })),
        shippingAddress: z.string(),
        totalPrice: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const stripe = (await import('stripe')).default;
          const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY || '');
          
          const session = await stripeClient.checkout.sessions.create({
            mode: 'payment',
            customer_email: ctx.user?.email || undefined,
            client_reference_id: ctx.user?.id.toString(),
            metadata: {
              orderId: input.orderId.toString(),
              userId: ctx.user?.id.toString(),
              customerEmail: ctx.user?.email || '',
              customerName: ctx.user?.name || '',
            },
            line_items: input.items.map(item => ({
              price_data: {
                currency: 'usd',
                product_data: {
                  name: item.name,
                },
                unit_amount: Math.round(item.price * 100),
              },
              quantity: item.quantity,
            })),
            success_url: `${ctx.req.headers.origin || 'http://localhost:3000'}/orders?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${ctx.req.headers.origin || 'http://localhost:3000'}/checkout`,
            allow_promotion_codes: true,
          });
          
          // Save session ID to order
          const db = await getDb();
          if (db) {
            await db.update(orders).set({ stripeSessionId: session.id }).where(eq(orders.id, input.orderId));
          }
          
          return { sessionId: session.id, url: session.url };
        } catch (error) {
          console.error('[API] Error creating checkout session:', error);
          throw error;
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;

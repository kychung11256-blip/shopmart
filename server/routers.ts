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
import { convertProductsToAPI, convertProductToAPI, centsToDollars } from "./price-utils";

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
          let result;
          if (input.categoryId) {
            result = await db.select().from(products).where(and(eq(products.status, 'active'), eq(products.categoryId, input.categoryId))).limit(input.limit).offset(input.offset);
          } else {
            result = await db.select().from(products).where(eq(products.status, 'active')).limit(input.limit).offset(input.offset);
          }
          return convertProductsToAPI(result);
        } catch (error) {
          console.error("[API] Error fetching products:", error);
          return [];
        }
      }),
    getById: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        try {
          const db = await getDb();
          if (!db) {
            console.error('[API] Database connection failed for getById');
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Database connection failed',
            });
          }
          const result = await db.select().from(products).where(eq(products.id, input)).limit(1);
          if (!result || result.length === 0) {
            console.warn(`[API] Product not found: ${input}`);
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: `Product ${input} not found`,
            });
          }
          return convertProductToAPI(result[0]);
        } catch (error: any) {
          console.error('[API] Error fetching product:', error?.message || error);
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to fetch product: ${error?.message || 'Unknown error'}`,
          });
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
          const result = await db.select().from(products).limit(input.limit).offset(input.offset);
          return convertProductsToAPI(result);
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

    batchDelete: adminProcedure
      .input(z.object({
        ids: z.array(z.number()).min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        try {
          console.log('[API] Batch deleting products:', input.ids);
          for (const id of input.ids) {
            await db.update(products).set({ status: 'deleted' }).where(eq(products.id, id));
          }
          console.log('[API] Batch delete completed successfully');
          return { success: true, deletedCount: input.ids.length };
        } catch (error) {
          console.error('[API] Error batch deleting products:', error);
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
    batchDelete: adminProcedure
      .input(z.array(z.number()))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        try {
          if (input.length === 0) {
            throw new Error('No categories selected for deletion');
          }
          for (const id of input) {
            await db.update(categories).set({ status: 'inactive' }).where(eq(categories.id, id));
          }
          console.log('[API] Batch delete completed successfully');
          return { success: true, deletedCount: input.length };
        } catch (error) {
          console.error('[API] Error batch deleting categories:', error);
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
          // Query the newly created order to get its ID
          const createdOrder = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
          return { success: true, orderNumber, id: createdOrder[0]?.id || 0 };
        } catch (error) {
          console.error("[API] Error creating order:", error);
          throw error;
        }
      }),
    createGuest: publicProcedure
      .input(z.object({
        items: z.array(z.object({ productId: z.number(), quantity: z.number() })),
        shippingAddress: z.string(),
        guestEmail: z.string().email(),
        guestName: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        try {
          const orderNumber = `ORD-${Date.now()}`;
          let totalPrice = 0;
          for (const item of input.items) {
            const product = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
            if (product[0]) totalPrice += product[0].price * item.quantity;
          }
          // Create guest order with null userId
          const newOrder: InsertOrder = {
            orderNumber,
            userId: null as any,
            totalPrice,
            shippingAddress: input.shippingAddress,
          };
          const orderResult = await db.insert(orders).values(newOrder);
          // Query the newly created order to get its ID
          const createdOrder = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
          return { success: true, orderNumber, id: createdOrder[0]?.id || 0 };
        } catch (error) {
          console.error("[API] Error creating guest order:", error);
          throw error;
        }
      }),
    getById: publicProcedure
      .input(z.number())
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        try {
          // Allow anyone to view any order (for guest checkout support)
          // In production, you may want to add a secret token or time-based access control
          const order = await db.select().from(orders).where(eq(orders.id, input)).limit(1);
          if (!order[0]) throw new Error('Order not found');
          const items = await db.select().from(orderItems).where(eq(orderItems.orderId, input));
          return { ...order[0], items };
        } catch (error) {
          console.error('[API] Error fetching order:', error);
          throw error;
        }
      }),
    markAsPaid: publicProcedure
      .input(z.number())
      .mutation(async ({ input: orderId, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        try {
          // Update order payment status
          await db
            .update(orders)
            .set({
              paymentStatus: 'paid',
              status: 'processing',
              updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));
          return { success: true };
        } catch (error) {
          console.error('[API] Error marking order as paid:', error);
          throw error;
        }
      }),
    createNexapaySession: publicProcedure
      .input(z.object({
        orderId: z.number(),
        amount: z.number(),
        currency: z.string().default('USD'),
        customerEmail: z.string().email().optional(),
        successUrl: z.string(),
        cancelUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          const apiKey = process.env.NEXAPAY_API_KEY;
          if (!apiKey) {
            throw new Error('NEXAPAY_API_KEY not configured');
          }

          const nexapayUrl = 'https://nexapay.one/api/v1/payments';
          const payload = {
            amount: input.amount,
            currency: input.currency,
            crypto: 'USDC',
            description: `Order #${input.orderId}`,
            customer_email: input.customerEmail,
            success_url: input.successUrl,
            cancel_url: input.cancelUrl,
            callback_url: `${process.env.VITE_APP_URL || 'https://shopmart-8wwg5mrc.manus.space'}/api/webhooks/nexapay`,
          };

          console.log('[Nexapay] Creating payment session:', payload);

          const response = await fetch(nexapayUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': apiKey,
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('[Nexapay] API Error:', response.status, errorText);
            throw new Error(`Nexapay API Error: ${response.status} ${errorText}`);
          }

          const data = await response.json();
          console.log('[Nexapay] Payment session created:', data);

          return {
            success: true,
            checkoutUrl: data.payment?.checkout_url,
            orderId: data.payment?.order_id,
            paymentId: data.payment?.id,
          };
        } catch (error: any) {
          console.error('[Nexapay] Error creating payment session:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to create Nexapay payment session: ${error.message}`,
          });
        }
      }),
  }),

  // Cart router
  cart: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const cartItems = await db.select().from(cart).where(eq(cart.userId, ctx.user?.id || 0));
        const itemsWithProducts = await Promise.all(
          cartItems.map(async (item) => {
            const productResult = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
            const product = productResult[0];
            return {
              ...item,
              price: product?.price ? centsToDollars(product.price) : 0,
              productName: product?.name || 'Unknown Product',
            };
          })
        );
        return itemsWithProducts;
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
    clear: protectedProcedure
      .mutation(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        try {
          await db.delete(cart).where(eq(cart.userId, ctx.user?.id || 0));
          console.log(`[API] Cleared cart for user ${ctx.user?.id}`);
          return { success: true };
        } catch (error) {
          console.error("[API] Error clearing cart:", error);
          throw error;
        }
      }),
  }),



  // Stripe payment router
  payments: router({
    // Create Payment Intent for Payment Element
    createPaymentIntent: protectedProcedure
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
          const { getConfig } = await import('./db');
          const stripeSecretKey = await getConfig('STRIPE_SECRET_KEY') || process.env.STRIPE_SECRET_KEY;
          
          if (!stripeSecretKey) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Stripe API key is not configured. Please ask an administrator to configure Stripe keys.',
            });
          }
          
          const stripe = (await import('stripe')).default;
          const stripeClient = new stripe(stripeSecretKey);
          
          // Create Payment Intent
          const paymentIntent = await stripeClient.paymentIntents.create({
            amount: input.totalPrice, // Amount already in cents from frontend
            currency: 'usd',
            receipt_email: ctx.user?.email || undefined,
            metadata: {
              orderId: input.orderId.toString(),
              userId: ctx.user?.id.toString(),
              customerEmail: ctx.user?.email || '',
              customerName: ctx.user?.name || '',
              shippingAddress: input.shippingAddress,
            },
            automatic_payment_methods: {
              enabled: true,
            },
          });
          
          // Save Payment Intent ID to order
          const db = await getDb();
          if (db) {
            await db.update(orders).set({ 
              stripePaymentIntentId: paymentIntent.id,
              status: 'pending'
            }).where(eq(orders.id, input.orderId));
          }
          
          return { 
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
          };
        } catch (error: any) {
          console.error('[API] Error creating payment intent:', error?.message || error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to create payment intent: ${error?.message || 'Unknown error'}`,
          });
        }
      }),
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
          const { getConfig } = await import('./db');
          const stripeSecretKey = await getConfig('STRIPE_SECRET_KEY') || process.env.STRIPE_SECRET_KEY;
          
          if (!stripeSecretKey) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Stripe API key is not configured. Please ask an administrator to configure Stripe keys.',
            });
          }
          
          const stripe = (await import('stripe')).default;
          const stripeClient = new stripe(stripeSecretKey);
          
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
            success_url: `${ctx.req.headers.origin || 'http://localhost:3000'}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${ctx.req.headers.origin || 'http://localhost:3000'}/checkout`,
            allow_promotion_codes: true,
          });
          
          // Save session ID to order
          const db = await getDb();
          if (db) {
            await db.update(orders).set({ stripeSessionId: session.id }).where(eq(orders.id, input.orderId));
          }
          
          return { sessionId: session.id, url: session.url };
        } catch (error: any) {
          console.error('[API] Error creating checkout session:', error?.message || error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to create checkout session: ${error?.message || 'Unknown error'}`,
          });
        }
      }),
    // Create Star Pay Order
    createStarPayOrder: publicProcedure
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
        product: z.enum(['TRC20Buy', 'TRC20H5', 'USDCERC20Buy']),
        guestEmail: z.string().email().optional().or(z.literal('')),
        guestName: z.string().optional().or(z.literal('')),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const { createStarPayOrder, isValidStarPayProduct, formatStarPayAmount } = await import('../server/star-pay');
          
          // Validate product
          if (!isValidStarPayProduct(input.product)) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Invalid Star Pay product: ${input.product}`,
            });
          }
          
          // Format amount based on product type
          // Star Pay expects amount in USD with 2 decimal places
          // Example: $10.00 USD -> "10.00"
          const formattedAmount = input.totalPrice.toFixed(2);
          
          // Create Star Pay order
          const merchantRef = `ORDER-${input.orderId}-${Date.now()}`;
          
          // Get customer info from authenticated user or guest input
          const customerEmail = ctx.user?.email || input.guestEmail?.trim() || '';
          const customerName = ctx.user?.name || input.guestName?.trim() || 'Guest';
          
          if (!customerEmail) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Customer email is required for payment',
            });
          }
          
          const response = await createStarPayOrder(
            merchantRef,
            input.product,
            formattedAmount,
            'en_US',
            {
              customer_email: customerEmail,
              customer_name: customerName,
            }
          );
          
          // Parse Star Pay response
          let payUrl: string | null = null;
          if (response.code === 200 && response.params) {
            try {
              const params = typeof response.params === 'string' 
                ? JSON.parse(response.params) 
                : response.params;
              payUrl = params.payurl || null;
            } catch (e) {
              console.warn('[API] Failed to parse Star Pay params:', e);
              throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to parse payment URL from Star Pay',
              });
            }
          } else {
            console.error('[API] Star Pay error response:', response);
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `Star Pay API error: ${response.message || 'Unknown error'}`,
            });
          }
          
          if (!payUrl) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'No payment URL received from Star Pay',
            });
          }
          
          // Save merchant ref to order
          const db = await getDb();
          if (db) {
            await db.update(orders).set({ 
              stripePaymentIntentId: merchantRef,
              status: 'pending'
            }).where(eq(orders.id, input.orderId));
          }
          
          console.log('[API] Star Pay order created:', {
            orderId: input.orderId,
            merchantRef,
            amount: formattedAmount,
            product: input.product,
            payUrl,
          });
          
          // Return response with extracted payUrl
          return {
            code: response.code,
            message: response.message,
            url: payUrl,
            params: response.params,
          };
        } catch (error: any) {
          console.error('[API] Error creating Star Pay order:', error?.message || error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to create Star Pay order: ${error?.message || 'Unknown error'}`,
          });
        }
      }),
  }),
  verification: router({
    // Public: Get domain verification file content
    getCryptomusVerification: publicProcedure.query(async () => {
      // Return the Cryptomus verification token
      // This endpoint can be accessed at /api/trpc/verification.getCryptomusVerification
      return {
        token: 'cryptomus=20a47093',
      };
    }),
  }),
  config: router({
    // Admin-only: Set Stripe configuration
    setStripeKeys: adminProcedure
      .input(z.object({
        secretKey: z.string().min(1),
        publishableKey: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const { setConfig } = await import('./db');
        try {
          await setConfig('STRIPE_SECRET_KEY', input.secretKey, 'Stripe Secret Key');
          await setConfig('VITE_STRIPE_PUBLISHABLE_KEY', input.publishableKey, 'Stripe Publishable Key');
          return { success: true };
        } catch (error: any) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to save Stripe keys: ${error?.message || 'Unknown error'}`,
          });
        }
      }),
    // Admin-only: Get current Stripe configuration status
    getStripeStatus: adminProcedure.query(async () => {
      const { getConfig } = await import('./db');
      const secretKey = await getConfig('STRIPE_SECRET_KEY');
      const publishableKey = await getConfig('VITE_STRIPE_PUBLISHABLE_KEY');
      return {
        secretKeyConfigured: !!secretKey,
        publishableKeyConfigured: !!publishableKey,
      };
    }),
    // Public: Get Stripe Publishable Key for frontend
    getStripePublishableKey: publicProcedure.query(async () => {
      const { getConfig } = await import('./db');
      const publishableKey = await getConfig('VITE_STRIPE_PUBLISHABLE_KEY') || process.env.VITE_STRIPE_PUBLISHABLE_KEY;
      return {
        data: publishableKey || null,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;

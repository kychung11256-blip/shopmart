import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import type { User } from "../drizzle/schema";
import { products, categories, orders, orderItems, cart, users, InsertProduct, InsertOrder, InsertOrderItem, InsertCartItem } from "../drizzle/schema";
import { eq, and, desc, asc, count, sql, sum } from "drizzle-orm";
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
    uploadQrCode: adminProcedure
      .input(z.object({
        productId: z.number(),
        base64: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { storagePut } = await import('./storage');
          const buffer = Buffer.from(input.base64, 'base64');
          const key = `products/qrcodes/${input.productId}-${Date.now()}-${input.fileName}`;
          const { url } = await storagePut(key, buffer, input.mimeType);
          const db = await getDb();
          if (!db) throw new Error('Database not available');
          await db.update(products).set({ qrCodeUrl: url }).where(eq(products.id, input.productId));
          console.log('[API] QR code uploaded for product', input.productId, ':', url);
          return { success: true, url };
        } catch (error) {
          console.error('[API] Error uploading QR code:', error);
          throw error;
        }
      }),
    deleteQrCode: adminProcedure
      .input(z.number())
      .mutation(async ({ input: productId }) => {
        try {
          const db = await getDb();
          if (!db) throw new Error('Database not available');
          await db.update(products).set({ qrCodeUrl: null }).where(eq(products.id, productId));
          return { success: true };
        } catch (error) {
          console.error('[API] Error deleting QR code:', error);
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
        // Fetch orders
        const orderList = ctx.user?.role === 'admin'
          ? await db.select().from(orders).orderBy(desc(orders.createdAt))
          : await db.select().from(orders).where(eq(orders.userId, ctx.user?.id || 0)).orderBy(desc(orders.createdAt));

        if (orderList.length === 0) return [];

        // Fetch all order items for these orders in one query
        const orderIds = orderList.map((o) => o.id);
        const allItems = await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productId: orderItems.productId,
            quantity: orderItems.quantity,
            price: orderItems.price,
            productName: products.name,
            productImage: products.image,
          })
          .from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id))
          .where(sql`${orderItems.orderId} IN (${sql.join(orderIds.map(id => sql`${id}`), sql`, `)})`);

        // Attach items to each order
        const itemsByOrderId = allItems.reduce((acc, item) => {
          if (!acc[item.orderId]) acc[item.orderId] = [];
          acc[item.orderId].push(item);
          return acc;
        }, {} as Record<number, typeof allItems>);

        return orderList.map((order) => ({
          ...order,
          items: itemsByOrderId[order.id] || [],
        }));
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
          await db.insert(orders).values(newOrder);
          // Query the newly created order to get its ID
          const createdOrder = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
          const orderId = createdOrder[0]?.id;
          // Insert order items
          if (orderId) {
            for (const item of input.items) {
              const product = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
              if (product[0]) {
                const orderItem: InsertOrderItem = {
                  orderId,
                  productId: item.productId,
                  quantity: item.quantity,
                  price: product[0].price,
                };
                await db.insert(orderItems).values(orderItem);
              }
            }
          }
          return { success: true, orderNumber, id: orderId || 0 };
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
          // Validate stock and calculate total price
          for (const item of input.items) {
            const product = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
            if (!product[0]) throw new TRPCError({ code: 'NOT_FOUND', message: `Product ${item.productId} not found` });
            if (product[0].stock !== null && product[0].stock < item.quantity) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `商品「${product[0].name}」庫存不足，剩餘 ${product[0].stock} 件`,
              });
            }
            totalPrice += product[0].price * item.quantity;
          }
          // Create guest order with null userId
          const newOrder: InsertOrder = {
            orderNumber,
            userId: null as any,
            totalPrice,
            shippingAddress: input.shippingAddress,
          };
          await db.insert(orders).values(newOrder);
          // Query the newly created order to get its ID
          const createdOrder = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
          const orderId = createdOrder[0]?.id;
          // Insert order items
          if (orderId) {
            for (const item of input.items) {
              const product = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
              if (product[0]) {
                const orderItem: InsertOrderItem = {
                  orderId,
                  productId: item.productId,
                  quantity: item.quantity,
                  price: product[0].price,
                };
                await db.insert(orderItems).values(orderItem);
              }
            }
          }
          return { success: true, orderNumber, id: orderId || 0 };
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
      .input(z.object({
        orderId: z.number(),
        customerEmail: z.string().email().optional(),
        customerName: z.string().optional(),
        paymentMethod: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        try {
          // Update order payment status
          await db
            .update(orders)
            .set({
              paymentStatus: 'paid',
              status: 'processing',
              updatedAt: new Date().toISOString(),
            })
            .where(eq(orders.id, input.orderId));

          // Send confirmation email
          try {
            const { sendOrderConfirmationEmail } = await import('./email-service');
            const { generateInvoicePDF } = await import('./invoice-service');
            const { loadInvoiceConfig } = await import('./invoice-config');

            const orderResult = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
            const order = orderResult[0];
            if (order) {
              const customerEmail = input.customerEmail || order.shippingAddress || '';
              if (customerEmail && customerEmail.includes('@')) {
                const itemsWithProducts = await db
                  .select({ name: products.name, quantity: orderItems.quantity, price: orderItems.price, qrCodeUrl: products.qrCodeUrl })
                  .from(orderItems)
                  .innerJoin(products, eq(orderItems.productId, products.id))
                  .where(eq(orderItems.orderId, input.orderId));

                const customerName = input.customerName || 'Customer';
                const itemsSummary = itemsWithProducts.map(i => `${i.name} × ${i.quantity}`).join(', ') || 'Order details';
                const totalPriceStr = `$${(order.totalPrice / 100).toFixed(2)}`;
                const qrCodeItems = itemsWithProducts.filter(i => i.qrCodeUrl).map(i => ({ name: i.name, qrCodeUrl: i.qrCodeUrl! }));

                let invoicePdfBuffer: Buffer | undefined;
                try {
                  const invoiceConfig = await loadInvoiceConfig();
                  invoicePdfBuffer = await generateInvoicePDF({
                    invoiceNo: order.orderNumber,
                    date: new Date().toISOString().split('T')[0],
                    buyer: { name: customerName, email: customerEmail },
                    items: itemsWithProducts.map(i => ({ nftTitle: i.name, quantity: i.quantity, unitPrice: Math.round(i.price * 100) })),
                    paymentMethod: input.paymentMethod || 'Online',
                    config: invoiceConfig,
                  });
                } catch (pdfErr: any) {
                  console.warn('[markAsPaid] Failed to generate invoice PDF:', pdfErr.message);
                }

                await sendOrderConfirmationEmail({
                  toEmail: customerEmail,
                  customerName,
                  orderNumber: order.orderNumber,
                  totalPrice: totalPriceStr,
                  items: itemsSummary,
                  invoicePdfBuffer,
                  qrCodeItems: qrCodeItems.length > 0 ? qrCodeItems : undefined,
                });
                console.log(`[markAsPaid] Confirmation email sent to ${customerEmail} for order ${order.orderNumber}`);
              }
            }
          } catch (emailError: any) {
            console.error('[markAsPaid] Failed to send confirmation email:', emailError.message);
            // Don't fail the mutation if email fails
          }

          return { success: true };
        } catch (error) {
          console.error('[API] Error marking order as paid:', error);
          throw error;
        }
      }),
    updateStatus: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled']),
        trackingNumber: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
        }
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        try {
          const updateData: any = {
            status: input.status,
            updatedAt: new Date().toISOString(),
          };
          if (input.trackingNumber !== undefined) {
            updateData.trackingNumber = input.trackingNumber;
          }
          await db
            .update(orders)
            .set(updateData)
            .where(eq(orders.id, input.orderId));
          console.log(`[API] Order ${input.orderId} status updated to ${input.status} by admin ${ctx.user.id}`);
          return { success: true };
        } catch (error) {
          console.error('[API] Error updating order status:', error);
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

          // Use NexaPay API v1 endpoint (based on official documentation)
          const nexapayUrl = 'https://nexapay.one/api/v1/payments';
          
          // Convert orderId to string for NexaPay (it expects string order_id)
          const orderIdStr = String(input.orderId);
          
          // Build payload strictly following NexaPay API docs
          // Required: amount, currency
          // Optional: crypto, description, customer_email, success_url, cancel_url, callback_url
          const payload: any = {
            amount: input.amount,
            currency: input.currency,
            description: `Order #${input.orderId}`,
          };
          
          if (input.customerEmail) {
            payload.customer_email = input.customerEmail;
          }
          if (input.successUrl) {
            payload.success_url = input.successUrl;
          }
          if (input.cancelUrl) {
            payload.cancel_url = input.cancelUrl;
          }
          
          // Add webhook callback URL for payment notifications
          const origin = input.successUrl ? new URL(input.successUrl).origin : '';
          if (origin) {
            payload.callback_url = `${origin}/api/webhooks/nexapay`;
          }

          console.log('[Nexapay] Creating payment session:', payload);
          console.log('[Nexapay] API URL:', nexapayUrl);
          console.log('[Nexapay] API Key prefix:', apiKey.substring(0, 20) + '...');

          const response = await fetch(nexapayUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': apiKey,
            },
            body: JSON.stringify(payload),
          });

          console.log('[Nexapay] Response Status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[Nexapay] API Error:', response.status, errorText);
            console.error('[Nexapay] Request payload:', JSON.stringify(payload, null, 2));
            throw new Error(`Nexapay API Error: ${response.status} ${errorText}`);
          }

          const data = await response.json();
          console.log('[Nexapay] Payment session created:', JSON.stringify(data, null, 2));

          // NexaPay API v1 returns { success: boolean, payment: Payment }
          // The payment object contains: id, order_id, amount, currency, status, checkout_url
          if (!data.success || !data.payment) {
            console.error('[Nexapay] Invalid response format:', data);
            throw new Error('Nexapay API returned invalid response format');
          }

          const payment = data.payment;
          const checkoutUrl = payment.checkout_url;
          
          if (!checkoutUrl) {
            console.error('[Nexapay] No checkout URL in response:', data);
            throw new Error('Nexapay API did not return a checkout URL');
          }

          console.log('[Nexapay] Payment session successful:', {
            checkoutUrl,
            orderId: payment.order_id,
            paymentId: payment.id,
          });

          return {
            success: true,
            checkoutUrl,
            orderId: payment.order_id,
            paymentId: payment.id,
          };
        } catch (error: any) {
          console.error('[Nexapay] Error creating payment session:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to create Nexapay payment session: ${error.message}`,
          });
        }
      }),

    createWhopCheckout: publicProcedure
      .input(z.object({
        orderId: z.number(),
        amount: z.number(), // in dollars (e.g. 29.99)
        description: z.string().optional(),
        successUrl: z.string(),
        cancelUrl: z.string(),
        customerEmail: z.string().email().optional(),
        customerName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const apiKey = process.env.WHOP_API_KEY;
          const companyId = process.env.WHOP_COMPANY_ID;
          if (!apiKey || !companyId) throw new Error('Whop credentials not configured');

          const Whop = (await import('@whop/sdk')).default;
          const client = new Whop({ apiKey });

          const checkoutConfig = await client.checkoutConfigurations.create({
            plan: {
              company_id: companyId,
              currency: 'usd',
              initial_price: input.amount,
              plan_type: 'one_time',
              renewal_price: 0,
            },
            metadata: {
              order_id: String(input.orderId),
              customer_email: input.customerEmail || '',
              customer_name: input.customerName || '',
            },
            redirect_url: input.successUrl,
          } as any);

          // Build checkout URL from the configuration ID
          const checkoutUrl = `https://whop.com/checkout/${checkoutConfig.id}?redirect_url=${encodeURIComponent(input.successUrl)}`;

          // Store whop checkout config ID on the order
          const db = await getDb();
          if (db) {
            await db.update(orders)
              .set({ whopPaymentId: checkoutConfig.id, updatedAt: new Date().toISOString() })
              .where(eq(orders.id, input.orderId));
          }

          console.log('[Whop] Checkout config created:', checkoutConfig.id);
          return { success: true, checkoutUrl, checkoutConfigId: checkoutConfig.id };
        } catch (error: any) {
          console.error('[Whop] Error creating checkout:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to create Whop checkout: ${error.message}`,
          });
        }
      }),

    markWhopPaid: publicProcedure
      .input(z.object({
        orderId: z.number(),
        whopPaymentId: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        await db.update(orders)
          .set({ paymentStatus: 'paid', status: 'processing', whopPaymentId: input.whopPaymentId, updatedAt: new Date().toISOString() })
          .where(eq(orders.id, input.orderId));
        return { success: true };
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
  // Dashboard stats router
  dashboard: router({
    stats: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { totalProducts: 0, totalOrders: 0, totalUsers: 0, totalRevenue: 0, recentOrders: [] };
      try {
        const [productCount] = await db.select({ count: count() }).from(products).where(eq(products.status, 'active'));
        const [orderCount] = await db.select({ count: count() }).from(orders);
        const [userCount] = await db.select({ count: count() }).from(users);
        const [revenueResult] = await db.select({ total: sum(orders.totalPrice) }).from(orders).where(eq(orders.paymentStatus, 'paid'));
        const recentOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(10);
        return {
          totalProducts: productCount?.count || 0,
          totalOrders: orderCount?.count || 0,
          totalUsers: userCount?.count || 0,
          totalRevenue: revenueResult?.total ? Number(revenueResult.total) / 100 : 0,
          recentOrders,
        };
      } catch (error) {
        console.error('[API] Error fetching dashboard stats:', error);
        return { totalProducts: 0, totalOrders: 0, totalUsers: 0, totalRevenue: 0, recentOrders: [] };
      }
    }),
    // Monthly sales data for charts
    salesData: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      try {
        const result = await db.execute(sql`
          SELECT 
            DATE_FORMAT(createdAt, '%Y-%m') as month,
            SUM(totalPrice) as total,
            COUNT(*) as cnt
          FROM orders 
          WHERE paymentStatus = 'paid'
          GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
          ORDER BY month
        `);
        const rows = (result as any).rows || result;
        return (Array.isArray(rows) ? rows : []).map((r: any) => ({
          month: r.month,
          revenue: r.total ? Number(r.total) / 100 : 0,
          orders: Number(r.cnt || 0),
        }));
      } catch (error) {
        console.error('[API] Error fetching sales data:', error);
        return [];
      }
    }),
    // Category distribution
    categoryData: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      try {
        const result = await db.select({
          categoryId: products.categoryId,
          count: count(),
        }).from(products).where(eq(products.status, 'active')).groupBy(products.categoryId);
        // Join with category names
        const cats = await db.select().from(categories);
        const catMap = new Map(cats.map(c => [c.id, c.name]));
        return result.map(r => ({
          name: catMap.get(r.categoryId || 0) || 'Uncategorized',
          count: r.count,
        }));
      } catch (error) {
        console.error('[API] Error fetching category data:', error);
        return [];
      }
    }),
  }),

  // Admin users router
  adminUsers: router({
    list: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      try {
        return await db.select().from(users).orderBy(desc(users.createdAt));
      } catch (error) {
        console.error('[API] Error fetching users:', error);
        return [];
      }
    }),
    updateRole: adminProcedure
      .input(z.object({
        id: z.number(),
        role: z.enum(['admin', 'user']),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        try {
          await db.update(users).set({ role: input.role }).where(eq(users.id, input.id));
          return { success: true };
        } catch (error) {
          console.error('[API] Error updating user role:', error);
          throw error;
        }
      }),
    delete: adminProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        try {
          await db.delete(users).where(eq(users.id, input));
          return { success: true };
        } catch (error) {
          console.error('[API] Error deleting user:', error);
          throw error;
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
  banners: router({
    // Public: Get all active banners
    getActive: publicProcedure.query(async () => {
      const { getActiveBanners } = await import('./db');
      return await getActiveBanners();
    }),
    // Admin: Get all banners (including inactive)
    getAll: adminProcedure.query(async () => {
      const { getAllBanners } = await import('./db');
      return await getAllBanners();
    }),
    // Admin: Get banner by ID
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getBannerById } = await import('./db');
        const banner = await getBannerById(input.id);
        if (!banner) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Banner not found',
          });
        }
        return banner;
      }),
    // Admin: Create banner
    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        titleEn: z.string().optional(),
        subtitle: z.string().optional(),
        subtitleEn: z.string().optional(),
        image: z.string().min(1),
        link: z.string().optional().transform(v => v === '' ? undefined : v),
        ctaText: z.string().optional(),
        ctaTextEn: z.string().optional(),
        order: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createBanner } = await import('./db');
        try {
          await createBanner(input);
          return { success: true };
        } catch (error: any) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to create banner: ${error?.message || 'Unknown error'}`,
          });
        }
      }),
    // Admin: Update banner
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        titleEn: z.string().optional(),
        subtitle: z.string().optional(),
        subtitleEn: z.string().optional(),
        image: z.string().min(1).optional(),
        link: z.string().optional().transform(v => v === '' ? undefined : v),
        ctaText: z.string().optional(),
        ctaTextEn: z.string().optional(),
        order: z.number().optional(),
        status: z.enum(['active', 'inactive']).optional(),
      }))
      .mutation(async ({ input }) => {
        const { updateBanner } = await import('./db');
        const { id, ...data } = input;
        try {
          await updateBanner(id, data);
          return { success: true };
        } catch (error: any) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to update banner: ${error?.message || 'Unknown error'}`,
          });
        }
      }),
    // Admin: Delete banner
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteBanner } = await import('./db');
        try {
          await deleteBanner(input.id);
          return { success: true };
        } catch (error: any) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to delete banner: ${error?.message || 'Unknown error'}`,
          });
        }
      }),
    // Admin: Reorder banners
    reorder: adminProcedure
      .input(z.object({ bannerIds: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        const { reorderBanners } = await import('./db');
        try {
          await reorderBanners(input.bannerIds);
          return { success: true };
        } catch (error: any) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to reorder banners: ${error?.message || 'Unknown error'}`,
          });
        }
      }),
    // Admin: Upload banner image to S3
    uploadImage: adminProcedure
      .input(z.object({
        // base64-encoded file content (without data URL prefix)
        base64: z.string().min(1),
        // original file name for extension detection
        fileName: z.string().min(1),
        // MIME type e.g. image/jpeg
        mimeType: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const { storagePut } = await import('./storage');
        try {
          // Decode base64 to Buffer
          const buffer = Buffer.from(input.base64, 'base64');
          // Build a unique S3 key with random suffix to prevent enumeration
          const ext = input.fileName.split('.').pop() || 'jpg';
          const randomSuffix = Math.random().toString(36).substring(2, 10);
          const key = `banners/${Date.now()}-${randomSuffix}.${ext}`;
          const { url } = await storagePut(key, buffer, input.mimeType);
          return { url };
        } catch (error: any) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to upload banner image: ${error?.message || 'Unknown error'}`,
          });
        }
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

    // Admin: Get email configuration
    getEmailConfig: adminProcedure.query(async () => {
      const { getConfig } = await import('./db');
      const { EMAIL_CONFIG_KEYS } = await import('./email-service');
      return {
        smtpHost: await getConfig(EMAIL_CONFIG_KEYS.SMTP_HOST) || '',
        smtpPort: await getConfig(EMAIL_CONFIG_KEYS.SMTP_PORT) || '465',
        smtpSecure: (await getConfig(EMAIL_CONFIG_KEYS.SMTP_SECURE)) !== 'false',
        smtpUser: await getConfig(EMAIL_CONFIG_KEYS.SMTP_USER) || '',
        smtpPassConfigured: !!(await getConfig(EMAIL_CONFIG_KEYS.SMTP_PASS)),
        fromName: await getConfig(EMAIL_CONFIG_KEYS.FROM_NAME) || '',
        fromAddress: await getConfig(EMAIL_CONFIG_KEYS.FROM_ADDRESS) || '',
        enabled: (await getConfig(EMAIL_CONFIG_KEYS.ENABLED)) === 'true',
      };
    }),

    // Admin: Save email SMTP configuration
    setEmailConfig: adminProcedure
      .input(z.object({
        smtpHost: z.string().min(1),
        smtpPort: z.string().default('465'),
        smtpSecure: z.boolean().default(true),
        smtpUser: z.string().min(1),
        smtpPass: z.string().optional(), // Optional: only update if provided
        fromName: z.string().min(1),
        fromAddress: z.string().email(),
        enabled: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const { setConfig } = await import('./db');
        const { EMAIL_CONFIG_KEYS } = await import('./email-service');
        await setConfig(EMAIL_CONFIG_KEYS.SMTP_HOST, input.smtpHost, 'SMTP Host');
        await setConfig(EMAIL_CONFIG_KEYS.SMTP_PORT, input.smtpPort, 'SMTP Port');
        await setConfig(EMAIL_CONFIG_KEYS.SMTP_SECURE, String(input.smtpSecure), 'SMTP Secure (SSL/TLS)');
        await setConfig(EMAIL_CONFIG_KEYS.SMTP_USER, input.smtpUser, 'SMTP Username');
        if (input.smtpPass) {
          await setConfig(EMAIL_CONFIG_KEYS.SMTP_PASS, input.smtpPass, 'SMTP Password');
        }
        await setConfig(EMAIL_CONFIG_KEYS.FROM_NAME, input.fromName, 'Email From Name');
        await setConfig(EMAIL_CONFIG_KEYS.FROM_ADDRESS, input.fromAddress, 'Email From Address');
        await setConfig(EMAIL_CONFIG_KEYS.ENABLED, String(input.enabled), 'Email Sending Enabled');
        return { success: true };
      }),

    // Admin: Get email template
    getEmailTemplate: adminProcedure.query(async () => {
      const { getConfig } = await import('./db');
      const { EMAIL_CONFIG_KEYS, DEFAULT_EMAIL_TEMPLATE } = await import('./email-service');
      return {
        subject: await getConfig(EMAIL_CONFIG_KEYS.TEMPLATE_SUBJECT) || DEFAULT_EMAIL_TEMPLATE.subject,
        body: await getConfig(EMAIL_CONFIG_KEYS.TEMPLATE_BODY) || DEFAULT_EMAIL_TEMPLATE.body,
      };
    }),

    // Admin: Save email template
    setEmailTemplate: adminProcedure
      .input(z.object({
        subject: z.string().min(1),
        body: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const { setConfig } = await import('./db');
        const { EMAIL_CONFIG_KEYS } = await import('./email-service');
        await setConfig(EMAIL_CONFIG_KEYS.TEMPLATE_SUBJECT, input.subject, 'Email Template Subject');
        await setConfig(EMAIL_CONFIG_KEYS.TEMPLATE_BODY, input.body, 'Email Template Body (HTML)');
        return { success: true };
      }),

    // Admin: Send test email
    sendTestEmail: adminProcedure
      .input(z.object({
        toEmail: z.string().email(),
      }))
      .mutation(async ({ input }) => {
        const { sendTestEmail } = await import('./email-service');
        const result = await sendTestEmail(input.toEmail);
        if (!result.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.message,
          });
        }
        return result;
      }),

    // Admin: Get invoice configuration
    getInvoiceConfig: adminProcedure.query(async () => {
      const { loadInvoiceConfig, DEFAULT_INVOICE_CONFIG } = await import('./invoice-config');
      const config = await loadInvoiceConfig();
      return config;
    }),

    // Admin: Upload company logo (returns CDN URL)
    uploadInvoiceLogo: adminProcedure
      .input(z.object({
        fileBuffer: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { storagePut } = await import('./storage');
        const buffer = Buffer.from(input.fileBuffer, 'base64');
        const ext = input.fileName.split('.').pop() || 'png';
        const key = `invoice-logos/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const { url } = await storagePut(key, buffer, `image/${ext}`);
        return { url };
      }),

    // Admin: Delete company logo
    deleteInvoiceLogo: adminProcedure
      .mutation(async () => {
        const { setConfig } = await import('./db');
        const { INVOICE_CONFIG_KEYS } = await import('./invoice-config');
        await setConfig(INVOICE_CONFIG_KEYS.COMPANY_LOGO_URL, '', 'Invoice Company Logo URL');
        return { success: true };
      }),

    // Admin: Save invoice configuration
    setInvoiceConfig: adminProcedure
      .input(z.object({
        companyName: z.string().min(1),
        companyAddress: z.string().min(1),
        companyEmail: z.string().email(),
        companyPhone: z.string().optional().default(''),
        companyRepName: z.string().min(1),
        companyRepTitle: z.string().min(1),
        sellerArtistName: z.string().optional().default(''),
        disclaimerText: z.string().min(1),
        companyLogoUrl: z.string().optional().default(''),
      }))
      .mutation(async ({ input }) => {
        const { setConfig } = await import('./db');
        const { INVOICE_CONFIG_KEYS } = await import('./invoice-config');
        await setConfig(INVOICE_CONFIG_KEYS.COMPANY_NAME, input.companyName, 'Invoice Company Name');
        await setConfig(INVOICE_CONFIG_KEYS.COMPANY_ADDRESS, input.companyAddress, 'Invoice Company Address');
        await setConfig(INVOICE_CONFIG_KEYS.COMPANY_EMAIL, input.companyEmail, 'Invoice Company Email');
        await setConfig(INVOICE_CONFIG_KEYS.COMPANY_PHONE, input.companyPhone || '', 'Invoice Company Phone');
        await setConfig(INVOICE_CONFIG_KEYS.COMPANY_REP_NAME, input.companyRepName, 'Invoice Company Rep Name');
        await setConfig(INVOICE_CONFIG_KEYS.COMPANY_REP_TITLE, input.companyRepTitle, 'Invoice Company Rep Title');
        await setConfig(INVOICE_CONFIG_KEYS.SELLER_ARTIST_NAME, input.sellerArtistName || '', 'Invoice Seller/Artist Name');
        await setConfig(INVOICE_CONFIG_KEYS.DISCLAIMER_TEXT, input.disclaimerText, 'Invoice Disclaimer Text');
        await setConfig(INVOICE_CONFIG_KEYS.COMPANY_LOGO_URL, input.companyLogoUrl || '', 'Invoice Company Logo URL');
        return { success: true };
      }),

    // Admin: Get payment methods enabled status
    getPaymentMethods: adminProcedure.query(async () => {
      const { getConfig } = await import('./db');
      const whopEnabled = (await getConfig('PAYMENT_WHOP_ENABLED')) !== 'false'; // Default true
      const stripeEnabled = (await getConfig('PAYMENT_STRIPE_ENABLED')) === 'true'; // Default false
      return {
        whopEnabled,
        stripeEnabled,
      };
    }),

    // Public: Get payment methods enabled status (for checkout page)
    getPaymentMethodsPublic: publicProcedure.query(async () => {
      const { getConfig } = await import('./db');
      const whopEnabled = (await getConfig('PAYMENT_WHOP_ENABLED')) !== 'false'; // Default true
      const stripeEnabled = (await getConfig('PAYMENT_STRIPE_ENABLED')) === 'true'; // Default false
      return {
        whopEnabled,
        stripeEnabled,
      };
    }),

    // Admin: Set payment methods enabled status
    setPaymentMethods: adminProcedure
      .input(z.object({
        whopEnabled: z.boolean(),
        stripeEnabled: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        const { setConfig } = await import('./db');
        try {
          await setConfig('PAYMENT_WHOP_ENABLED', String(input.whopEnabled), 'Whop Payment Enabled');
          await setConfig('PAYMENT_STRIPE_ENABLED', String(input.stripeEnabled), 'Stripe Payment Enabled');
          return { success: true };
        } catch (error: any) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to save payment methods: ${error?.message || 'Unknown error'}`,
          });
        }
      }),

    // Admin: Preview invoice PDF (returns base64-encoded PDF)
    previewInvoicePDF: adminProcedure.mutation(async () => {
      const { getConfig } = await import('./db');
      const { generateInvoicePDF } = await import('./invoice-service');
      const { INVOICE_CONFIG_KEYS, DEFAULT_INVOICE_CONFIG } = await import('./invoice-config');

      // Load config from DB
      const cfg = {
        companyName: (await getConfig(INVOICE_CONFIG_KEYS.COMPANY_NAME)) || DEFAULT_INVOICE_CONFIG.companyName,
        companyAddress: (await getConfig(INVOICE_CONFIG_KEYS.COMPANY_ADDRESS)) || DEFAULT_INVOICE_CONFIG.companyAddress,
        companyEmail: (await getConfig(INVOICE_CONFIG_KEYS.COMPANY_EMAIL)) || DEFAULT_INVOICE_CONFIG.companyEmail,
        companyPhone: (await getConfig(INVOICE_CONFIG_KEYS.COMPANY_PHONE)) || DEFAULT_INVOICE_CONFIG.companyPhone,
        companyRepName: (await getConfig(INVOICE_CONFIG_KEYS.COMPANY_REP_NAME)) || DEFAULT_INVOICE_CONFIG.companyRepName,
        companyRepTitle: (await getConfig(INVOICE_CONFIG_KEYS.COMPANY_REP_TITLE)) || DEFAULT_INVOICE_CONFIG.companyRepTitle,
        sellerArtistName: (await getConfig(INVOICE_CONFIG_KEYS.SELLER_ARTIST_NAME)) || DEFAULT_INVOICE_CONFIG.sellerArtistName,
        disclaimerText: (await getConfig(INVOICE_CONFIG_KEYS.DISCLAIMER_TEXT)) || DEFAULT_INVOICE_CONFIG.disclaimerText,
        companyLogoUrl: (await getConfig(INVOICE_CONFIG_KEYS.COMPANY_LOGO_URL)) || DEFAULT_INVOICE_CONFIG.companyLogoUrl,
      };

      const today = new Date().toISOString().split('T')[0];
      const pdfBuffer = await generateInvoicePDF({
        invoiceNo: 'PREVIEW-001',
        date: today,
        buyer: { name: 'Sample Buyer', email: 'buyer@example.com' },
        items: [
          { nftTitle: 'Sample NFT #1', quantity: 1, unitPrice: 50000, platformFee: 2500, artistRoyaltyPercent: 10 },
          { nftTitle: 'Sample NFT #2', quantity: 2, unitPrice: 25000, platformFee: 1250, artistRoyaltyPercent: 5 },
        ],
        paymentMethod: 'Stripe',
        config: cfg,
      });

      return { pdfBase64: pdfBuffer.toString('base64') };
    }),
  }),
});

export type AppRouter = typeof appRouter;

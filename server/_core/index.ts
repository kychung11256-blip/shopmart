import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleStripeWebhook } from "../stripe-webhook";
import { handleStarPayWebhook } from "../star-pay-webhook";
import { handleNexapayWebhook } from "../nexapay-webhook";
import { handleWhopWebhook, getSuccessPage } from "../whop-webhook";
import { handleTransVoucherWebhook } from "../transvoucher-webhook";
import { handleEcomTrade24Webhook } from "../ecomtrade24-webhook";
import Stripe from "stripe";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // CRITICAL: Add verification file handler as the VERY FIRST middleware
  // This must be before ANY other middleware to intercept requests early
  app.use((req, res, next) => {
    if (req.url && /^\/cryptomus_[a-f0-9]+\.html$/.test(req.url)) {
      const match = req.url.match(/cryptomus_([a-f0-9]+)\.html/);
      if (match) {
        const token = match[1];
        if (token === "20a47093") {
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.send(`cryptomus=${token}`);
          return;
        }
      }
    }
    next();
  });
  
  // Stripe webhook must be registered BEFORE express.json() to verify signatures
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error("[Webhook] STRIPE_WEBHOOK_SECRET not configured");
        return res.status(400).json({ error: "Webhook secret not configured" });
      }

      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
        const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        const result = await handleStripeWebhook(event);
        res.json({ received: true, result });
      } catch (error: any) {
        console.error("[Webhook] Error verifying webhook:", error.message);
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Star Pay webhook
  app.post(
    "/api/star-pay/webhook",
    express.json(),
    async (req, res) => {
      await handleStarPayWebhook(req, res);
    }
  );

  // Nexapay webhook must be registered BEFORE express.json() to verify signatures
  app.post(
    "/api/webhooks/nexapay",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      await handleNexapayWebhook(req, res);
    }
  );

  // Whop webhook - GET for testing/viewing success page
  app.get("/api/webhooks/whop", (req, res) => {
    const orderId = req.query.orderId || 'TEST-001';
    const paymentId = req.query.paymentId || 'whop_test_' + Date.now();
    res.setHeader('Content-Type', 'text/html; charset=utf-8').send(
      getSuccessPage(String(orderId), String(paymentId))
    );
  });

  // Whop webhook - POST for actual webhook events
  // Accept raw payload with flexible Content-Type (application/json, text/plain, etc.)
  app.post(
    "/api/webhooks/whop",
    express.raw({ type: "*/*" }),
    async (req, res) => {
      await handleWhopWebhook(req, res);
    }
  );

  // TransVoucher webhook
  app.post(
    "/api/transvoucher/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      await handleTransVoucherWebhook(req, res);
    }
  );

  // EcomTrade24 webhook
  app.post(
    "/api/ecomtrade24/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      await handleEcomTrade24Webhook(req, res);
    }
  );

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Domain verification files (e.g., Cryptomus verification)
  app.get("/cryptomus_:token.html", (req, res) => {
    const token = req.params.token;
    // Only serve known verification tokens
    if (token === "20a47093") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(`cryptomus=${token}`);
    } else {
      res.status(404).send("Not found");
    }
  });
  
  // Invoice download endpoint
  app.get("/api/invoice/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      const { generateInvoicePDF } = await import("../invoice-service");
      const { loadInvoiceConfig } = await import("../invoice-config");
      const { getDb } = await import("../db");
      const { orders, orderItems } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }

      // Load invoice configuration from database
      const invoiceConfig = await loadInvoiceConfig();

      const orderResult = await db.select().from(orders).where(eq(orders.id, parseInt(orderId))).limit(1);
      if (!orderResult[0]) {
        return res.status(404).json({ error: "Order not found" });
      }
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, parseInt(orderId)));
      const order = { ...orderResult[0], items };
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const invoiceData = {
        invoiceNo: order.orderNumber,
        date: new Date(order.createdAt).toISOString().split('T')[0],
        buyer: {
          name: (order as any).user?.name || 'Guest',
          email: order.shippingAddress || (order as any).user?.email || 'N/A',
        },
        items: (order.items || []).map((item: any) => ({
          nftTitle: item.productName,
          quantity: item.quantity,
          unitPrice: item.price,
          platformFee: Math.round(item.price * 0.05),
          artistRoyaltyPercent: 10,
        })),
        paymentMethod: order.whopPaymentId ? 'Whop' : order.stripePaymentIntentId ? 'Stripe' : 'Other',
        notes: order.notes || undefined,
        companyRep: invoiceConfig.companyRepName,
        companyRepTitle: invoiceConfig.companyRepTitle,
        // Pass config to PDF generator
        config: invoiceConfig,
      };

      const pdfBuffer = await generateInvoicePDF(invoiceData);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('[Invoice] Error generating PDF:', error);
      res.status(500).json({ error: 'Failed to generate invoice' });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

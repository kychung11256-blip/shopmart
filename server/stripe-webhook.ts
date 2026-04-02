import Stripe from "stripe";
import { getDb } from "./db";
import { orders, orderItems, products, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendOrderConfirmationEmail } from "./email-service";
import { generateInvoicePDF } from "./invoice-service";
import { loadInvoiceConfig } from "./invoice-config";

// Stripe instance is created in the webhook handler, not here

export async function handleStripeWebhook(event: Stripe.Event) {
  console.log(`[Webhook] Processing event: ${event.type}`);

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return { verified: true };
  }

  switch (event.type) {
    case "checkout.session.completed":
      return await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
    case "payment_intent.succeeded":
      return await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
    case "charge.failed":
      return await handleChargeFailed(event.data.object as Stripe.Charge);
    case "charge.refunded":
      return await handleChargeRefunded(event.data.object as Stripe.Charge);
    default:
      console.log(`[Webhook] Unhandled event type: ${event.type}`);
      return { processed: false };
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log(`[Webhook] Processing checkout.session.completed: ${session.id}`);

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    throw new Error("Database not available");
  }

  try {
    // Extract order ID from client_reference_id
    const orderId = session.client_reference_id ? parseInt(session.client_reference_id) : null;
    if (!orderId) {
      console.error("[Webhook] No order ID found in session");
      throw new Error("No order ID found in session");
    }

    // Update order status to paid
    await db
      .update(orders)
      .set({
        paymentStatus: "paid",
        stripeSessionId: session.id,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, orderId));

    console.log(`[Webhook] Order ${orderId} marked as paid`);

    // Fetch order details
    const orderResult = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    const order = orderResult[0];

    if (order) {
      // Send confirmation email with invoice PDF and QR codes
      try {
        const customerEmail = session.customer_email || order.shippingAddress || '';
        if (customerEmail) {
          const itemsWithProducts = await db
            .select({ name: products.name, quantity: orderItems.quantity, price: orderItems.price, qrCodeUrl: products.qrCodeUrl })
            .from(orderItems)
            .innerJoin(products, eq(orderItems.productId, products.id))
            .where(eq(orderItems.orderId, orderId));

          const customerName = session.customer_details?.name || order.shippingAddress || 'Customer';
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
              paymentMethod: 'Stripe',
              config: invoiceConfig,
            });
          } catch (pdfErr: any) {
            console.warn('[Webhook] Failed to generate invoice PDF:', pdfErr.message);
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
          console.log(`[Webhook] Confirmation email sent to ${customerEmail}`);
        }
      } catch (emailError) {
        console.error("[Webhook] Failed to send confirmation email:", emailError);
        // Don't fail the webhook if email fails
      }
    }

    return { processed: true, orderId };
  } catch (error) {
    console.error("[Webhook] Error processing checkout session:", error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Webhook] Processing payment_intent.succeeded: ${paymentIntent.id}`);

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    throw new Error("Database not available");
  }

  try {
    // Find order by Stripe Payment Intent ID
    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.stripePaymentIntentId, paymentIntent.id))
      .limit(1);

    if (orderResult.length === 0) {
      console.warn(`[Webhook] Order not found for payment intent: ${paymentIntent.id}`);
      return { processed: false, reason: "Order not found" };
    }

    const order = orderResult[0];
    console.log(`[Webhook] Updating order ${order.id} to paid status`);

    // Update order payment status
    await db
      .update(orders)
      .set({
        paymentStatus: "paid",
        status: "processing",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, order.id));

    console.log(`[Webhook] Order ${order.id} updated to paid status`);

    // Send confirmation email with invoice PDF and QR codes
    try {
      const customerEmail = paymentIntent.receipt_email || order.shippingAddress;
      if (customerEmail) {
        const itemsWithProducts = await db
          .select({ name: products.name, quantity: orderItems.quantity, price: orderItems.price, qrCodeUrl: products.qrCodeUrl })
          .from(orderItems)
          .innerJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));

        // Try to get customer name from users table
        let customerName = 'Customer';
        if (order.userId) {
          const userRows = await db.select().from(users).where(eq(users.id, order.userId)).limit(1);
          if (userRows[0]) customerName = userRows[0].name || customerName;
        }

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
            paymentMethod: 'Stripe',
            config: invoiceConfig,
          });
        } catch (pdfErr: any) {
          console.warn('[Webhook] Failed to generate invoice PDF:', pdfErr.message);
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
        console.log(`[Webhook] Confirmation email sent to ${customerEmail}`);
      }
    } catch (emailError) {
      console.error("[Webhook] Failed to send confirmation email:", emailError);
      // Don't fail the webhook if email fails
    }

    return { processed: true, orderId: order.id };
  } catch (error) {
    console.error("[Webhook] Error processing payment intent:", error);
    throw error;
  }
}

async function handleChargeFailed(charge: Stripe.Charge) {
  console.log(`[Webhook] Processing charge.failed: ${charge.id}`);

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    throw new Error("Database not available");
  }

  try {
    // Find order by Stripe Payment Intent ID
    if (!charge.payment_intent) {
      console.warn(`[Webhook] No payment intent found in failed charge: ${charge.id}`);
      return { processed: false, reason: "No payment intent" };
    }

    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.stripePaymentIntentId, charge.payment_intent as string))
      .limit(1);

    if (orderResult.length === 0) {
      console.warn(`[Webhook] Order not found for failed charge: ${charge.id}`);
      return { processed: false, reason: "Order not found" };
    }

    const order = orderResult[0];
    console.log(`[Webhook] Updating order ${order.id} to failed payment status`);

    // Update order payment status
    await db
      .update(orders)
      .set({
        paymentStatus: "failed",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, order.id));

    console.log(`[Webhook] Order ${order.id} payment failed: ${charge.failure_message}`);

    return { processed: true, orderId: order.id, reason: charge.failure_message };
  } catch (error) {
    console.error("[Webhook] Error processing failed charge:", error);
    throw error;
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log(`[Webhook] Processing charge.refunded: ${charge.id}`);

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    throw new Error("Database not available");
  }

  try {
    // Find order by Stripe Payment Intent ID
    if (!charge.payment_intent) {
      console.warn(`[Webhook] No payment intent found in refunded charge: ${charge.id}`);
      return { processed: false, reason: "No payment intent" };
    }

    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.stripePaymentIntentId, charge.payment_intent as string))
      .limit(1);

    if (orderResult.length === 0) {
      console.warn(`[Webhook] Order not found for refunded charge: ${charge.id}`);
      return { processed: false, reason: "Order not found" };
    }

    const order = orderResult[0];
    console.log(`[Webhook] Updating order ${order.id} to refunded status`);

    // Update order payment status
    await db
      .update(orders)
      .set({
        paymentStatus: "refunded",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, order.id));

    console.log(`[Webhook] Order ${order.id} refunded: ${charge.amount_refunded}`);

    return { processed: true, orderId: order.id, amountRefunded: charge.amount_refunded };
  } catch (error) {
    console.error("[Webhook] Error processing refunded charge:", error);
    throw error;
  }
}

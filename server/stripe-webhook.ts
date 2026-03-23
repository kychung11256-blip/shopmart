import Stripe from "stripe";
import { getDb } from "./db";
import { orders } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendOrderConfirmationEmail } from "./_core/email";

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
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    console.log(`[Webhook] Order ${orderId} marked as paid`);

    // Fetch order details
    const orderResult = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    const order = orderResult[0];

    if (order) {
      // Send confirmation email with virtual product
      try {
        await sendOrderConfirmationEmail(order, session.customer_email || "");
        console.log(`[Webhook] Confirmation email sent to ${session.customer_email}`);
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
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    console.log(`[Webhook] Order ${order.id} updated to paid status`);

    // Send confirmation email
    try {
      const customerEmail = paymentIntent.receipt_email || order.shippingAddress;
      if (customerEmail) {
        await sendOrderConfirmationEmail(order, customerEmail);
        console.log(`[Webhook] Confirmation email sent`);
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
        updatedAt: new Date(),
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
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    console.log(`[Webhook] Order ${order.id} refunded: ${charge.amount_refunded}`);

    return { processed: true, orderId: order.id, amountRefunded: charge.amount_refunded };
  } catch (error) {
    console.error("[Webhook] Error processing refunded charge:", error);
    throw error;
  }
}

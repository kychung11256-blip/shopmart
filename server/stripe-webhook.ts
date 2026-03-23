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

  // This is handled by checkout.session.completed, but we can add additional logic here if needed
  return { processed: true };
}

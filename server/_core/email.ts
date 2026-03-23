import { Order } from "../../drizzle/schema";

/**
 * Send order confirmation email with virtual product
 * In production, this would integrate with an email service like SendGrid, Mailgun, or AWS SES
 */
export async function sendOrderConfirmationEmail(order: Order, customerEmail: string) {
  try {
    console.log(`[Email] Sending order confirmation to ${customerEmail}`);
    console.log(`[Email] Order ID: ${order.id}, Order Number: ${order.orderNumber}`);

    // TODO: Integrate with email service
    // For now, we'll just log the action
    // In production, you would:
    // 1. Generate a virtual product download link
    // 2. Create an email template
    // 3. Send via email service

    const emailContent = generateOrderConfirmationEmail(order, customerEmail);
    console.log(`[Email] Email content:\n${emailContent}`);

    // Placeholder for actual email sending
    // await emailService.send({
    //   to: customerEmail,
    //   subject: `Order Confirmation - ${order.orderNumber}`,
    //   html: emailContent,
    // });

    return { success: true, message: "Email queued for sending" };
  } catch (error) {
    console.error("[Email] Error sending order confirmation:", error);
    throw error;
  }
}

function generateOrderConfirmationEmail(order: Order, customerEmail: string): string {
  const totalPrice = (order.totalPrice / 100).toFixed(2);

  return `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>Order Confirmation</h2>
        <p>Thank you for your purchase!</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <h3>Order Details</h3>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Order Date:</strong> ${order.createdAt?.toLocaleDateString()}</p>
          <p><strong>Total Amount:</strong> $${totalPrice}</p>
          <p><strong>Payment Status:</strong> Paid</p>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <h3>Shipping Address</h3>
          <p>${order.shippingAddress || 'N/A'}</p>
        </div>

        <div style="background-color: #e8f4f8; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #0066cc;">
          <h3>Virtual Product Download</h3>
          <p>Your virtual product is ready to download:</p>
          <p><a href="#" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Download Product</a></p>
          <p style="font-size: 12px; color: #666;">Download link will be available for 30 days</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
          <p>If you have any questions, please contact our support team.</p>
          <p>Thank you for shopping with us!</p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send order status update email
 */
export async function sendOrderStatusUpdateEmail(order: Order, customerEmail: string, newStatus: string) {
  try {
    console.log(`[Email] Sending order status update to ${customerEmail}: ${newStatus}`);

    const emailContent = generateOrderStatusUpdateEmail(order, newStatus);
    console.log(`[Email] Email content:\n${emailContent}`);

    // TODO: Integrate with email service
    return { success: true, message: "Status update email queued for sending" };
  } catch (error) {
    console.error("[Email] Error sending order status update:", error);
    throw error;
  }
}

function generateOrderStatusUpdateEmail(order: Order, newStatus: string): string {
  const statusMessages: Record<string, string> = {
    processing: "Your order is being processed and will be shipped soon.",
    shipped: "Your order has been shipped! Track your package using the tracking number below.",
    delivered: "Your order has been delivered. Thank you for your purchase!",
    cancelled: "Your order has been cancelled. If you have any questions, please contact us.",
  };

  return `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>Order Status Update</h2>
        <p>Your order <strong>${order.orderNumber}</strong> status has been updated.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <h3>New Status: <span style="color: #0066cc; text-transform: capitalize;">${newStatus}</span></h3>
          <p>${statusMessages[newStatus] || 'Your order status has been updated.'}</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
          <p>If you have any questions, please contact our support team.</p>
        </div>
      </body>
    </html>
  `;
}

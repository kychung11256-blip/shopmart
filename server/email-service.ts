/**
 * Email Service - SMTP-based email sending using nodemailer
 * Configuration is loaded from the database (config table) at runtime.
 * Supports configurable SMTP settings and email templates.
 */

import nodemailer from 'nodemailer';
import { getDb } from './db';
import { config } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

// Config keys stored in the database
export const EMAIL_CONFIG_KEYS = {
  SMTP_HOST: 'email_smtp_host',
  SMTP_PORT: 'email_smtp_port',
  SMTP_SECURE: 'email_smtp_secure',
  SMTP_USER: 'email_smtp_user',
  SMTP_PASS: 'email_smtp_pass',
  FROM_NAME: 'email_from_name',
  FROM_ADDRESS: 'email_from_address',
  ENABLED: 'email_enabled',
  // Email template keys
  TEMPLATE_SUBJECT: 'email_template_subject',
  TEMPLATE_BODY: 'email_template_body',
};

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  fromName: string;
  fromAddress: string;
  enabled: boolean;
}

export interface EmailTemplate {
  subject: string;
  body: string;
}

/**
 * Default email template for order confirmation.
 * Supports placeholders: {{orderNumber}}, {{totalPrice}}, {{customerName}}, {{customerEmail}}, {{items}}
 */
export const DEFAULT_EMAIL_TEMPLATE = {
  subject: 'Thank you for your purchase! Order Confirmation - {{orderNumber}}',
  body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px 32px;">
  <p style="font-size: 16px; color: #333; margin: 0 0 20px;">Dear Guest,</p>

  <p style="font-size: 15px; color: #444; line-height: 1.7; margin: 0 0 16px;">
    Thank you so much for choosing our product and placing your order with us. We truly appreciate your trust and support.
  </p>

  <p style="font-size: 15px; color: #444; line-height: 1.7; margin: 0 0 24px;">
    We hope you love your new purchase and that it brings you great satisfaction. If you have any questions or need assistance, please don't hesitate to reach out to us.
  </p>

  <p style="font-size: 15px; color: #444; margin: 0 0 24px;">Thank you again for being a valued customer!</p>

  <div style="background: #f5f5f5; border-left: 4px solid #E93323; padding: 16px 20px; margin: 24px 0; border-radius: 4px;">
    <p style="margin: 0; font-size: 14px; color: #666;">Order Reference:</p>
    <p style="margin: 6px 0 0; font-size: 16px; font-weight: bold; color: #333; letter-spacing: 0.5px;">{{orderNumber}}</p>
  </div>

  <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee;">
    <p style="margin: 0; font-size: 15px; color: #333;">Best regards,</p>
    <p style="margin: 6px 0 0; font-size: 16px; font-weight: bold; color: #333;">Andy Chan</p>
    <p style="margin: 4px 0 0; font-size: 14px; color: #666;">CEO of PaiKoi</p>
  </div>

  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #aaa;">
    <p style="margin: 0;">This is an automated message. Please do not reply to this email.</p>
  </div>
</div>`,
};

/**
 * Load email configuration from database
 */
export async function loadEmailConfig(): Promise<EmailConfig | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const rows = await db.select().from(config).where(
      eq(config.key, EMAIL_CONFIG_KEYS.ENABLED)
    );

    // Check if email is enabled
    const enabledRow = rows.find(r => r.key === EMAIL_CONFIG_KEYS.ENABLED);
    if (!enabledRow || enabledRow.value !== 'true') {
      return null;
    }

    // Load all email config keys
    const allRows = await db.select().from(config);
    const configMap: Record<string, string> = {};
    for (const row of allRows) {
      configMap[row.key] = row.value;
    }

    const smtpHost = configMap[EMAIL_CONFIG_KEYS.SMTP_HOST];
    const smtpUser = configMap[EMAIL_CONFIG_KEYS.SMTP_USER];
    const smtpPass = configMap[EMAIL_CONFIG_KEYS.SMTP_PASS];
    const fromAddress = configMap[EMAIL_CONFIG_KEYS.FROM_ADDRESS];

    if (!smtpHost || !smtpUser || !smtpPass || !fromAddress) {
      console.warn('[Email] Incomplete SMTP configuration, skipping email send');
      return null;
    }

    return {
      smtpHost,
      smtpPort: parseInt(configMap[EMAIL_CONFIG_KEYS.SMTP_PORT] || '465'),
      smtpSecure: configMap[EMAIL_CONFIG_KEYS.SMTP_SECURE] !== 'false',
      smtpUser,
      smtpPass,
      fromName: configMap[EMAIL_CONFIG_KEYS.FROM_NAME] || 'ShopMart',
      fromAddress,
      enabled: true,
    };
  } catch (err: any) {
    console.error('[Email] Failed to load config:', err.message);
    return null;
  }
}

/**
 * Load email template from database (falls back to default if not configured)
 */
export async function loadEmailTemplate(): Promise<EmailTemplate> {
  try {
    const db = await getDb();
    if (!db) return DEFAULT_EMAIL_TEMPLATE;

    const rows = await db.select().from(config);
    const configMap: Record<string, string> = {};
    for (const row of rows) {
      configMap[row.key] = row.value;
    }

    return {
      subject: configMap[EMAIL_CONFIG_KEYS.TEMPLATE_SUBJECT] || DEFAULT_EMAIL_TEMPLATE.subject,
      body: configMap[EMAIL_CONFIG_KEYS.TEMPLATE_BODY] || DEFAULT_EMAIL_TEMPLATE.body,
    };
  } catch (err: any) {
    console.error('[Email] Failed to load template:', err.message);
    return DEFAULT_EMAIL_TEMPLATE;
  }
}

/**
 * Replace template placeholders with actual values
 */
function renderTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

/**
 * Send order confirmation email after successful payment
 */
export async function sendOrderConfirmationEmail(params: {
  toEmail: string;
  customerName: string;
  orderNumber: string;
  totalPrice: string;
  items: string;
}): Promise<{ success: boolean; message: string }> {
  const emailConfig = await loadEmailConfig();
  if (!emailConfig) {
    console.log('[Email] Email not configured or disabled, skipping send');
    return { success: false, message: 'Email not configured or disabled' };
  }

  const template = await loadEmailTemplate();

  const vars = {
    customerName: params.customerName || params.toEmail,
    orderNumber: params.orderNumber,
    totalPrice: params.totalPrice,
    items: params.items,
    customerEmail: params.toEmail,
  };

  const subject = renderTemplate(template.subject, vars);
  const html = renderTemplate(template.body, vars);

  try {
    const transporter = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort,
      secure: emailConfig.smtpSecure,
      auth: {
        user: emailConfig.smtpUser,
        pass: emailConfig.smtpPass,
      },
    });

    await transporter.sendMail({
      from: `"${emailConfig.fromName}" <${emailConfig.fromAddress}>`,
      to: params.toEmail,
      subject,
      html,
    });

    console.log(`[Email] Order confirmation sent to ${params.toEmail} for order ${params.orderNumber}`);
    return { success: true, message: 'Email sent successfully' };
  } catch (err: any) {
    console.error('[Email] Failed to send email:', err.message);
    return { success: false, message: err.message };
  }
}

/**
 * Send a test email to verify SMTP configuration
 */
export async function sendTestEmail(toEmail: string): Promise<{ success: boolean; message: string }> {
  const emailConfig = await loadEmailConfig();
  if (!emailConfig) {
    return { success: false, message: 'Email not configured or disabled. Please save SMTP settings first.' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort,
      secure: emailConfig.smtpSecure,
      auth: {
        user: emailConfig.smtpUser,
        pass: emailConfig.smtpPass,
      },
    });

    await transporter.sendMail({
      from: `"${emailConfig.fromName}" <${emailConfig.fromAddress}>`,
      to: toEmail,
      subject: '✅ 邮件配置测试 - ShopMart',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #E93323;">邮件配置测试成功！</h2>
          <p>您的 SMTP 邮件配置已正确设置。</p>
          <p style="color: #666; font-size: 14px;">此邮件由 ShopMart 后台自动发送，用于验证邮件配置。</p>
        </div>
      `,
    });

    return { success: true, message: 'Test email sent successfully' };
  } catch (err: any) {
    console.error('[Email] Test email failed:', err.message);
    return { success: false, message: err.message };
  }
}

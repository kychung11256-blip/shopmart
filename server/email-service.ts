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
  subject: '感谢您的购买！订单确认 - {{orderNumber}}',
  body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: #E93323; padding: 24px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">订单确认</h1>
  </div>
  <div style="padding: 32px;">
    <p style="font-size: 16px; color: #333;">亲爱的 {{customerName}}，</p>
    <p style="color: #555;">感谢您的购买！您的订单已成功支付。</p>
    
    <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px; color: #333;">订单详情</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #666;">订单编号：</td>
          <td style="padding: 6px 0; font-weight: bold; color: #333;">{{orderNumber}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666;">支付金额：</td>
          <td style="padding: 6px 0; font-weight: bold; color: #E93323;">{{totalPrice}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666;">购买商品：</td>
          <td style="padding: 6px 0; color: #333;">{{items}}</td>
        </tr>
      </table>
    </div>

    <p style="color: #555;">如有任何问题，请联系我们的客服团队。</p>
    <p style="color: #555;">感谢您的支持！</p>
  </div>
  <div style="background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999;">
    <p>此邮件由系统自动发送，请勿回复。</p>
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

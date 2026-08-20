import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface OrderConfirmationItem {
  productName: string;
  size: string;
  quantity: number;
  price: number;
}

export interface OrderConfirmationData {
  orderNumber: string;
  contactEmail: string;
  recipientName?: string;
  items: OrderConfirmationItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  paymentMethod: string;
  address: {
    line1: string;
    city: string;
    postalCode?: string | null;
    country?: string | null;
  };
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private from = 'Meridian <no-reply@meridian.local>';
  // Ethereal fallback only: catches and previews email, never delivers to a
  // real inbox. Used automatically until the client's real SMTP_* env vars
  // are set, so order confirmations still work end-to-end during demo/dev.
  private demoMode = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const host = this.config.get<string>('email.host');
    const from = this.config.get<string>('email.from');
    if (from) this.from = from;

    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('email.port') ?? 587,
        secure: this.config.get<boolean>('email.secure') ?? false,
        auth: {
          user: this.config.get<string>('email.user'),
          pass: this.config.get<string>('email.password'),
        },
      });
      this.logger.log(`Email: using configured SMTP host ${host}`);
      return;
    }

    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      this.demoMode = true;
      this.logger.warn(
        'Email: no SMTP_HOST configured — using a disposable Ethereal test inbox. ' +
          'Order confirmation emails will send but land in a preview link (logged per-send), ' +
          'not a real inbox. Set SMTP_HOST/PORT/USER/PASSWORD/FROM in .env to go live.',
      );
    } catch (err) {
      this.logger.error(
        'Email: failed to set up the Ethereal fallback inbox — order confirmation emails will be skipped.',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  async sendOrderConfirmation(data: OrderConfirmationData): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `Email: no transporter available, skipping confirmation for ${data.orderNumber}`,
      );
      return;
    }

    const { html, text } = this.renderOrderConfirmation(data);

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: data.contactEmail,
        subject: `Order Confirmed — ${data.orderNumber}`,
        html,
        text,
      });

      if (this.demoMode) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        this.logger.log(
          `Email: [DEMO] order confirmation for ${data.orderNumber} sent to Ethereal. Preview: ${previewUrl}`,
        );
      } else {
        this.logger.log(
          `Email: order confirmation for ${data.orderNumber} sent to ${data.contactEmail}`,
        );
      }
    } catch (err) {
      // Never let email failure block or fail order placement.
      this.logger.error(
        `Email: failed to send order confirmation for ${data.orderNumber}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  private renderOrderConfirmation(data: OrderConfirmationData): {
    html: string;
    text: string;
  } {
    const money = (n: number) =>
      `Rs. ${n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const rows = data.items
      .map(
        (item) => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e8e3da;font-size:14px;color:#1a1a1a;">
              ${escapeHtml(item.productName)}<br/>
              <span style="color:#8a8378;font-size:12px;">Size ${escapeHtml(item.size)} &middot; Qty ${item.quantity}</span>
            </td>
            <td style="padding:10px 0;border-bottom:1px solid #e8e3da;font-size:14px;color:#1a1a1a;text-align:right;">
              ${money(item.price * item.quantity)}
            </td>
          </tr>`,
      )
      .join('');

    const html = `
      <div style="font-family:Georgia,'Times New Roman',serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
        <div style="background:#1a1a1a;color:#f5f1e8;padding:28px 32px;text-align:center;">
          <h1 style="margin:0;font-size:22px;letter-spacing:0.08em;text-transform:uppercase;">Meridian</h1>
        </div>
        <div style="padding:32px;border:1px solid #e8e3da;border-top:none;">
          <h2 style="font-size:18px;margin:0 0 4px;">Your order is confirmed${data.recipientName ? `, ${escapeHtml(data.recipientName)}` : ''}</h2>
          <p style="color:#8a8378;font-size:13px;margin:0 0 24px;">Order number: <strong style="color:#1a1a1a;">${escapeHtml(data.orderNumber)}</strong></p>

          <table style="width:100%;border-collapse:collapse;">
            ${rows}
          </table>

          <table style="width:100%;border-collapse:collapse;margin-top:12px;">
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#8a8378;">Subtotal</td>
              <td style="padding:4px 0;font-size:13px;text-align:right;">${money(data.subtotal)}</td>
            </tr>
            ${
              data.discountAmount > 0
                ? `<tr>
                    <td style="padding:4px 0;font-size:13px;color:#8a8378;">Discount</td>
                    <td style="padding:4px 0;font-size:13px;text-align:right;">-${money(data.discountAmount)}</td>
                  </tr>`
                : ''
            }
            <tr>
              <td style="padding:8px 0;font-size:15px;font-weight:bold;border-top:1px solid #e8e3da;">Total</td>
              <td style="padding:8px 0;font-size:15px;font-weight:bold;text-align:right;border-top:1px solid #e8e3da;">${money(data.total)}</td>
            </tr>
          </table>

          <p style="font-size:13px;color:#8a8378;margin:24px 0 4px;">Payment method</p>
          <p style="font-size:14px;margin:0 0 20px;">${escapeHtml(formatPaymentMethod(data.paymentMethod))}</p>

          <p style="font-size:13px;color:#8a8378;margin:0 0 4px;">Shipping to</p>
          <p style="font-size:14px;margin:0;">
            ${escapeHtml(data.address.line1)}<br/>
            ${escapeHtml(data.address.city)}${data.address.postalCode ? `, ${escapeHtml(data.address.postalCode)}` : ''}${data.address.country ? `<br/>${escapeHtml(data.address.country)}` : ''}
          </p>
        </div>
        <p style="text-align:center;font-size:11px;color:#8a8378;letter-spacing:0.05em;margin-top:20px;">
          MERIDIAN &mdash; MODEST WEAR
        </p>
      </div>`;

    const text = [
      `Meridian — your order is confirmed`,
      `Order number: ${data.orderNumber}`,
      '',
      ...data.items.map(
        (i) =>
          `${i.productName} (Size ${i.size} x${i.quantity}) — ${money(i.price * i.quantity)}`,
      ),
      '',
      `Subtotal: ${money(data.subtotal)}`,
      ...(data.discountAmount > 0 ? [`Discount: -${money(data.discountAmount)}`] : []),
      `Total: ${money(data.total)}`,
      '',
      `Payment method: ${formatPaymentMethod(data.paymentMethod)}`,
      '',
      `Shipping to: ${data.address.line1}, ${data.address.city}${data.address.postalCode ? `, ${data.address.postalCode}` : ''}${data.address.country ? `, ${data.address.country}` : ''}`,
    ].join('\n');

    return { html, text };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatPaymentMethod(method: string): string {
  return method
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

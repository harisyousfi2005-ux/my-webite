import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Order, PaymentMethod, PaymentStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { decimalToNumber } from '../../common/utils/decimal.util';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { JazzCashService } from './providers/jazzcash.service';
import { EasypaisaService } from './providers/easypaisa.service';
import { StripeService } from './providers/stripe.service';
import { PaymentSettingsService } from './payment-settings.service';
import { SubmitBankTransferProofDto } from './dto/submit-bank-transfer-proof.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

export interface BankDetails {
  bankName?: string;
  accountTitle?: string;
  accountNumber?: string;
  iban?: string;
  branch?: string;
  instructions?: string;
}

const GATEWAY_METHODS: PaymentMethod[] = ['CARD', 'JAZZCASH', 'EASYPAISA'];

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly jazzcash: JazzCashService,
    private readonly easypaisa: EasypaisaService,
    private readonly stripe: StripeService,
    private readonly settings: PaymentSettingsService,
  ) {}

  async getBankDetails(): Promise<BankDetails | null> {
    const enabled = await this.settings.isEnabled('BANK_TRANSFER');
    if (!enabled) return null;
    const cfg = await this.settings.getProviderConfig('BANK_TRANSFER');
    return (cfg?.publicConfig ?? {}) as BankDetails;
  }

  async initiate(userId: string, orderId: string) {
    const order = await this.getOwnedOrder(userId, orderId);

    if (order.paymentMethod === 'BANK_TRANSFER') {
      const bankDetails = await this.getBankDetails();
      if (!bankDetails) {
        throw new BadRequestException('Bank transfer is not currently available.');
      }
      return {
        type: 'bank_transfer' as const,
        amount: decimalToNumber(order.total),
        bankDetails,
      };
    }

    if (
      order.paymentMethod === 'CASH_ON_DELIVERY' ||
      order.paymentMethod === 'CARD_ON_DELIVERY'
    ) {
      return {
        type: 'none' as const,
        message: 'No online payment is needed for this method.',
      };
    }

    if (!GATEWAY_METHODS.includes(order.paymentMethod)) {
      throw new BadRequestException(`Unsupported payment method: ${order.paymentMethod}`);
    }
    if (!(await this.settings.isEnabled(order.paymentMethod))) {
      throw new BadRequestException(`${order.paymentMethod} is not currently available.`);
    }

    const mode = await this.settings.getMode();
    if (mode === 'DEMO') {
      await this.prisma.payment.update({
        where: { orderId: order.id },
        data: { status: 'PROCESSING', provider: 'demo' },
      });
      return {
        type: 'demo' as const,
        method: order.paymentMethod,
        message:
          'DEMO MODE — no real payment provider is contacted. Simulate a result below.',
      };
    }

    // LIVE mode from here.
    if (order.paymentMethod === 'JAZZCASH') {
      return this.initiateJazzCashLive(order);
    }
    if (order.paymentMethod === 'EASYPAISA') {
      const credentials = await this.settings.getDecryptedSecretConfig('EASYPAISA');
      this.easypaisa.buildCheckoutRequest(credentials ?? {}, {
        orderNumber: order.orderNumber,
        amount: decimalToNumber(order.total) ?? 0,
      });
    }
    if (order.paymentMethod === 'CARD') {
      const cardCfg = await this.settings.getProviderConfig('CARD');
      const cardProvider = (cardCfg?.publicConfig as { provider?: string } | null)
        ?.provider;
      return cardProvider === 'stripe'
        ? this.initiateStripeLive(order)
        : this.initiateJazzCashLive(order);
    }

    throw new BadRequestException(`Unsupported payment method: ${order.paymentMethod}`);
  }

  /** Only usable in DEMO mode — an authenticated stand-in for a real gateway redirect. */
  async simulateDemoPayment(
    userId: string,
    orderId: string,
    outcome: 'success' | 'failure',
  ) {
    const mode = await this.settings.getMode();
    if (mode !== 'DEMO') {
      throw new BadRequestException(
        'Demo payment simulation is only available in DEMO mode.',
      );
    }

    const order = await this.getOwnedOrder(userId, orderId);
    if (!GATEWAY_METHODS.includes(order.paymentMethod)) {
      throw new BadRequestException(
        'Demo simulation only applies to Card, JazzCash, or Easypaisa.',
      );
    }

    const payment = await this.prisma.payment.findUnique({
      where: { orderId: order.id },
    });
    if (!payment) throw new NotFoundException('Payment not found for this order');

    const status: PaymentStatus = outcome === 'success' ? 'PAID' : 'FAILED';
    await this.applyStatus(payment.id, order.id, status, undefined, {
      demo: true,
      outcome,
      simulatedAt: new Date().toISOString(),
    });
    return { orderId: order.id, status };
  }

  private async initiateJazzCashLive(order: Order) {
    const cfg = await this.settings.getProviderConfig('JAZZCASH');
    const secret = await this.settings.getDecryptedSecretConfig<{
      password?: string;
      integritySalt?: string;
    }>('JAZZCASH');
    const pub = (cfg?.publicConfig ?? {}) as {
      merchantId?: string;
      hostedCheckoutUrl?: string;
      returnUrl?: string;
    };

    if (
      !pub.merchantId ||
      !pub.hostedCheckoutUrl ||
      !secret?.password ||
      !secret?.integritySalt
    ) {
      throw new BadRequestException(
        'JazzCash is not fully configured yet — set the merchant ID, hosted checkout URL, ' +
          'password, and integrity salt in Admin -> Payment Settings.',
      );
    }

    const request = this.jazzcash.buildHostedCheckoutRequest(
      {
        merchantId: pub.merchantId,
        password: secret.password,
        integritySalt: secret.integritySalt,
        hostedCheckoutUrl: pub.hostedCheckoutUrl,
        returnUrl: pub.returnUrl || this.settings.callbackUrl('jazzcash'),
      },
      { orderNumber: order.orderNumber, amount: decimalToNumber(order.total) ?? 0 },
    );

    await this.prisma.payment.update({
      where: { orderId: order.id },
      data: {
        status: 'PROCESSING',
        provider: 'jazzcash',
        providerTxnRef: request.txnRefNo,
      },
    });

    return {
      type: 'redirect' as const,
      actionUrl: request.actionUrl,
      fields: request.fields,
    };
  }

  private async initiateStripeLive(order: Order) {
    const secret = await this.settings.getDecryptedSecretConfig<{
      secretKey?: string;
      webhookSecret?: string;
    }>('CARD');

    if (!secret?.secretKey || !secret?.webhookSecret) {
      throw new BadRequestException(
        'Card payment (Stripe) is not fully configured yet — set the secret key and webhook ' +
          'secret in Admin -> Payment Settings.',
      );
    }

    const session = await this.stripe.createCheckoutSession(
      { secretKey: secret.secretKey },
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: decimalToNumber(order.total) ?? 0,
        successUrl: this.settings.frontendResultUrl(order.id),
        cancelUrl: this.settings.frontendCheckoutUrl(),
      },
    );

    await this.prisma.payment.update({
      where: { orderId: order.id },
      data: {
        status: 'PROCESSING',
        provider: 'stripe',
        providerTxnRef: session.sessionId,
      },
    });

    return { type: 'redirect_simple' as const, url: session.url };
  }

  /** Called by our own controller after verifying JazzCash's callback signature. */
  async applyJazzCashResult(params: {
    txnRefNo: string;
    isSuccessful: boolean;
    providerPaymentId?: string;
    rawResponse: Record<string, unknown>;
  }) {
    const payment = await this.prisma.payment.findFirst({
      where: { providerTxnRef: params.txnRefNo },
    });
    if (!payment) return null;

    const status: PaymentStatus = params.isSuccessful ? 'PAID' : 'FAILED';
    await this.applyStatus(
      payment.id,
      payment.orderId,
      status,
      params.providerPaymentId,
      params.rawResponse,
    );
    return { orderId: payment.orderId, status };
  }

  /** Called by our own controller after verifying a Stripe webhook signature. */
  async applyStripeResult(params: {
    orderId: string;
    isSuccessful: boolean;
    providerPaymentId?: string;
    rawResponse: Record<string, unknown>;
  }) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId: params.orderId },
    });
    if (!payment) return null;

    const status: PaymentStatus = params.isSuccessful ? 'PAID' : 'FAILED';
    await this.applyStatus(
      payment.id,
      payment.orderId,
      status,
      params.providerPaymentId,
      params.rawResponse,
    );
    return { orderId: payment.orderId, status };
  }

  private async applyStatus(
    paymentId: string,
    orderId: string,
    status: PaymentStatus,
    providerPaymentId: string | undefined,
    rawResponse: Record<string, unknown>,
  ) {
    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: paymentId },
        data: { status, providerPaymentId, rawResponse: rawResponse as never },
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: status },
      }),
    ]);
  }

  async submitBankTransferProof(
    userId: string,
    orderId: string,
    dto: SubmitBankTransferProofDto,
    file?: Express.Multer.File,
  ) {
    const order = await this.getOwnedOrder(userId, orderId);
    if (order.paymentMethod !== 'BANK_TRANSFER') {
      throw new BadRequestException('This order is not set up for bank transfer payment');
    }

    let proofImageUrl: string | undefined;
    let proofImagePublicId: string | undefined;
    if (file) {
      const uploaded = await this.uploadService.uploadImage(
        file,
        'burkha-by-malika/payment-proofs',
      );
      proofImageUrl = uploaded.url;
      proofImagePublicId = uploaded.publicId;
    }

    // Deliberately left PENDING — a customer-entered reference number is a
    // claim, not verification. Only an admin approving it (verifyPayment)
    // can move this to PAID.
    const payment = await this.prisma.payment.update({
      where: { orderId: order.id },
      data: {
        provider: 'bank_transfer',
        bankReferenceNumber: dto.referenceNumber,
        bankTransferAmount: dto.amount,
        ...(proofImageUrl ? { proofImageUrl, proofImagePublicId } : {}),
      },
    });

    return this.serializePayment(payment);
  }

  async getPaymentForOrder(user: AuthenticatedUser, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== user.id && user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('This order does not belong to you');
    }
    if (!order.payment) throw new NotFoundException('No payment found for this order');
    return this.serializePayment(order.payment);
  }

  async verifyPayment(adminId: string, paymentId: string, dto: VerifyPaymentDto) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');

    const status: PaymentStatus = dto.approve ? 'PAID' : 'FAILED';

    const [updated] = await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: paymentId },
        data: { status, verifiedByAdminId: adminId, verifiedAt: new Date() },
      }),
      this.prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: status },
      }),
    ]);

    return this.serializePayment(updated);
  }

  private async getOwnedOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) {
      throw new ForbiddenException('This order does not belong to you');
    }
    return order;
  }

  private serializePayment(payment: {
    amount: unknown;
    bankTransferAmount: unknown;
    [key: string]: unknown;
  }) {
    return {
      ...payment,
      amount: decimalToNumber(payment.amount as never),
      bankTransferAmount: decimalToNumber(payment.bankTransferAmount as never),
    };
  }
}

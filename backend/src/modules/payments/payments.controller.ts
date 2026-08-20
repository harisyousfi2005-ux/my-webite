import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  RawBodyRequest,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { PaymentsService } from './payments.service';
import { PaymentSettingsService } from './payment-settings.service';
import { JazzCashService } from './providers/jazzcash.service';
import { StripeService } from './providers/stripe.service';
import { SubmitBankTransferProofDto } from './dto/submit-bank-transfer-proof.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { SimulateDemoPaymentDto } from './dto/simulate-demo-payment.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly jazzcash: JazzCashService,
    private readonly stripeService: StripeService,
    private readonly settings: PaymentSettingsService,
  ) {}

  @Get('bank-details')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the configured business bank account for bank transfer' })
  getBankDetails() {
    return this.paymentsService.getBankDetails();
  }

  @Post(':orderId/initiate')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Start payment for an order (redirect info, bank details, demo, or no-op)',
  })
  initiate(@CurrentUser() user: AuthenticatedUser, @Param('orderId') orderId: string) {
    return this.paymentsService.initiate(user.id, orderId);
  }

  @Post(':orderId/demo/simulate')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'DEMO MODE ONLY: simulate a successful or failed gateway payment',
  })
  simulateDemoPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderId') orderId: string,
    @Body() dto: SimulateDemoPaymentDto,
  ) {
    return this.paymentsService.simulateDemoPayment(user.id, orderId, dto.outcome);
  }

  @Post(':orderId/bank-transfer/proof')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Submit a bank transfer reference number and optional proof image',
  })
  @UseInterceptors(FileInterceptor('file'))
  submitBankTransferProof(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderId') orderId: string,
    @Body() dto: SubmitBankTransferProofDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.paymentsService.submitBankTransferProof(user.id, orderId, dto, file);
  }

  @Get(':orderId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment details for an order (owner or admin)' })
  getPayment(@CurrentUser() user: AuthenticatedUser, @Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentForOrder(user, orderId);
  }

  @Patch(':paymentId/verify')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Approve or reject a payment (e.g. a bank transfer)' })
  verifyPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('paymentId') paymentId: string,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.paymentsService.verifyPayment(user.id, paymentId, dto);
  }

  @Public()
  @Post('jazzcash/callback')
  @ApiOperation({
    summary: '[JazzCash] Payment result callback (pp_ReturnURL) — verified server-side',
  })
  async jazzcashCallback(@Req() req: Request, @Res() res: Response) {
    const payload = req.body as Record<string, string>;
    const frontendResultUrl = this.settings.frontendResultUrl();

    const secret = await this.settings.getDecryptedSecretConfig<{
      integritySalt?: string;
    }>('JAZZCASH');
    if (!secret?.integritySalt) {
      this.logger.warn(
        'Received a JazzCash callback but JazzCash has no integrity salt configured.',
      );
      return res.redirect(`${frontendResultUrl}?error=not_configured`);
    }

    const result = this.jazzcash.verifyCallback(payload, secret.integritySalt);

    if (!result.isSignatureValid) {
      this.logger.warn(
        `Rejected JazzCash callback with invalid signature: ${payload.pp_TxnRefNo}`,
      );
      return res.redirect(`${frontendResultUrl}?error=invalid_signature`);
    }

    const applied = await this.paymentsService.applyJazzCashResult({
      txnRefNo: result.txnRefNo ?? '',
      isSuccessful: result.isSuccessful,
      providerPaymentId: result.retrievalReferenceNo,
      rawResponse: payload,
    });

    if (!applied) {
      return res.redirect(`${frontendResultUrl}?error=unknown_transaction`);
    }

    return res.redirect(`${frontendResultUrl}?orderId=${applied.orderId}`);
  }

  @Public()
  @Post('stripe/webhook')
  @ApiOperation({
    summary: '[Stripe] Payment result webhook — signature verified server-side',
  })
  async stripeWebhook(@Req() req: RawBodyRequest<Request>) {
    const signature = req.headers['stripe-signature'];
    if (!req.rawBody || typeof signature !== 'string') {
      throw new BadRequestException('Missing Stripe signature or raw body');
    }

    const secret = await this.settings.getDecryptedSecretConfig<{
      secretKey?: string;
      webhookSecret?: string;
    }>('CARD');
    if (!secret?.secretKey || !secret?.webhookSecret) {
      this.logger.warn('Received a Stripe webhook but Stripe is not configured.');
      throw new BadRequestException('Stripe is not configured');
    }

    let event;
    try {
      event = this.stripeService.constructEvent(req.rawBody, signature, {
        secretKey: secret.secretKey,
        webhookSecret: secret.webhookSecret,
      });
    } catch (err) {
      this.logger.warn(
        `Rejected Stripe webhook with invalid signature: ${(err as Error).message}`,
      );
      throw new BadRequestException('Invalid signature');
    }

    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.expired'
    ) {
      const session = event.data.object as {
        metadata?: { orderId?: string };
        payment_intent?: string;
      };
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await this.paymentsService.applyStripeResult({
          orderId,
          isSuccessful: event.type === 'checkout.session.completed',
          providerPaymentId:
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : undefined,
          rawResponse: event as unknown as Record<string, unknown>,
        });
      }
    }

    // Stripe just needs a 2xx to know the webhook was received — it isn't
    // read by the browser, which gets its own redirect via success_url.
    return { received: true };
  }

  @Public()
  @Post('easypaisa/callback')
  @ApiOperation({ summary: '[Easypaisa] Payment result callback — not yet implemented' })
  easypaisaCallback() {
    this.logger.warn(
      'Received an Easypaisa callback, but the integration is not configured yet.',
    );
    return { received: true, processed: false };
  }
}

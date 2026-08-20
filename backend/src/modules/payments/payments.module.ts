import { Module } from '@nestjs/common';
import { UploadModule } from '../upload/upload.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentSettingsController } from './payment-settings.controller';
import { PaymentSettingsService } from './payment-settings.service';
import { JazzCashService } from './providers/jazzcash.service';
import { EasypaisaService } from './providers/easypaisa.service';
import { StripeService } from './providers/stripe.service';

@Module({
  imports: [UploadModule],
  // PaymentSettingsController must be registered before PaymentsController:
  // PaymentsController has GET /payments/:orderId, which would otherwise
  // shadow PaymentSettingsController's GET /payments/settings (matching
  // "settings" as if it were an orderId) since Nest resolves routes in
  // controller-registration order.
  controllers: [PaymentSettingsController, PaymentsController],
  providers: [
    PaymentsService,
    PaymentSettingsService,
    JazzCashService,
    EasypaisaService,
    StripeService,
  ],
})
export class PaymentsModule {}

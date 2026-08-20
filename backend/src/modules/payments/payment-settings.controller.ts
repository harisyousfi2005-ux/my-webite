import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PaymentMethod, Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { PaymentSettingsService } from './payment-settings.service';
import { SetPaymentModeDto } from './dto/set-payment-mode.dto';
import { UpsertProviderConfigDto } from './dto/upsert-provider-config.dto';

@ApiTags('payment-settings')
@Controller('payments/settings')
export class PaymentSettingsController {
  constructor(private readonly settingsService: PaymentSettingsService) {}

  @Public()
  @Get('public')
  @ApiOperation({
    summary: 'Get payment mode + enabled methods for checkout (no secrets)',
  })
  getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }

  @Get()
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Get full payment settings (secrets never included)' })
  getAdminSettings() {
    return this.settingsService.getAdminSettings();
  }

  @Patch('mode')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Switch between DEMO and LIVE payment mode' })
  setMode(@CurrentUser() user: AuthenticatedUser, @Body() dto: SetPaymentModeDto) {
    return this.settingsService.setMode(user.id, dto.mode);
  }

  @Patch(':provider')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN)
  @ApiParam({
    name: 'provider',
    enum: ['CARD', 'JAZZCASH', 'EASYPAISA', 'BANK_TRANSFER'],
  })
  @ApiOperation({
    summary: '[Admin] Enable/disable a payment method and set its configuration',
  })
  upsertProviderConfig(
    @CurrentUser() user: AuthenticatedUser,
    @Param('provider') provider: PaymentMethod,
    @Body() dto: UpsertProviderConfigDto,
  ) {
    return this.settingsService.upsertProviderConfig(user.id, provider, dto);
  }
}

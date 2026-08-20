import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional } from 'class-validator';

export class UpsertProviderConfigDto {
  @ApiPropertyOptional({
    description: 'Whether customers can select this payment method',
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description:
      'Non-secret fields (e.g. bank account details, merchant/store ID, return URL override)',
    example: {
      bankName: 'HBL',
      accountTitle: 'Burkha by Malika',
      accountNumber: '1234567890',
    },
  })
  @IsOptional()
  @IsObject()
  publicConfig?: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      'Secret credentials (e.g. JazzCash password/integrity salt, Stripe secret key). Encrypted ' +
      'at rest and never returned by any API response. Pass {} to clear a previously-saved secret.',
    example: { password: '...', integritySalt: '...' },
  })
  @IsOptional()
  @IsObject()
  secretConfig?: Record<string, unknown>;
}

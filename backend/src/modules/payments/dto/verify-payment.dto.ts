import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty({ description: 'true to mark the payment PAID, false to mark it FAILED' })
  @IsBoolean()
  approve: boolean;

  @ApiPropertyOptional({ example: 'Confirmed in bank statement dated 2026-08-15' })
  @IsOptional()
  @IsString()
  notes?: string;
}

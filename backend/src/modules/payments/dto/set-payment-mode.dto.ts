import { ApiProperty } from '@nestjs/swagger';
import { PaymentMode } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class SetPaymentModeDto {
  @ApiProperty({ enum: PaymentMode, example: PaymentMode.DEMO })
  @IsEnum(PaymentMode)
  mode: PaymentMode;
}

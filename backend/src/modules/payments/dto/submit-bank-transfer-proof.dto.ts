import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class SubmitBankTransferProofDto {
  @ApiProperty({
    example: 'TXN123456789',
    description: 'Bank transaction/reference number',
  })
  @IsString()
  @IsNotEmpty()
  referenceNumber: string;

  @ApiProperty({ example: 156, description: 'Amount the customer says they transferred' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;
}

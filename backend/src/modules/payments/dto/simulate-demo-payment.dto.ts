import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class SimulateDemoPaymentDto {
  @ApiProperty({ enum: ['success', 'failure'], example: 'success' })
  @IsIn(['success', 'failure'])
  outcome: 'success' | 'failure';
}

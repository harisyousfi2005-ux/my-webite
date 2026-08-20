import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateContactMessageDto {
  @ApiProperty({ example: 'Aisha Khan' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'aisha@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'Sizing question' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  subject?: string;

  @ApiProperty({ example: 'Does the Navy Trim Burqa run true to size?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;
}

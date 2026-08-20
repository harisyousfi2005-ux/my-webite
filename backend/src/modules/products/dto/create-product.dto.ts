import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Embroidered Sleeve Abaya' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Open-front abaya with floral lace embroidery on the sleeves.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 110 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiPropertyOptional({ example: 145 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  compareAtPrice?: number;

  @ApiProperty({ example: ['S', 'M', 'L', 'XL'], type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  sizes: string[];

  @ApiPropertyOptional({ example: ['Black', 'Navy'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];

  @ApiPropertyOptional({ example: 25, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: 'ABY-EMB-001' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Category id (UUID)' })
  @IsUUID()
  categoryId: string;
}

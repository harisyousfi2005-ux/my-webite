import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  // Named prismaSkip/prismaTake, not skip/take: class-transformer's
  // plainToInstance (used by ValidationPipe's transform: true) assigns
  // every key from the raw query object directly onto this instance before
  // validation runs. A getter-only property named the same as an incoming
  // query param (e.g. a request literally sent as `?take=1`) throws a raw
  // TypeError on that assignment — an uncaught 500, not a validation error.
  // Prefixed names can't collide with a real query param by accident.
  get prismaSkip(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 10);
  }

  get prismaTake(): number {
    return this.limit ?? 10;
  }
}

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function paginate<T>(
  items: T[],
  total: number,
  query: PaginationQueryDto,
): PaginatedResult<T> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  return {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

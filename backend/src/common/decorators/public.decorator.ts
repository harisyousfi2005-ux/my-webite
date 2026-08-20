import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as accessible without a JWT — otherwise the global
 * JwtAuthGuard rejects every request.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

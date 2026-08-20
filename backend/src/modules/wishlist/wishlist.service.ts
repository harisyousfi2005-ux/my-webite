import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { decimalToNumber } from '../../common/utils/decimal.util';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';

const WISHLIST_ITEM_INCLUDE = {
  product: {
    include: {
      category: true,
      images: { orderBy: { position: 'asc' as const } },
    },
  },
} satisfies Prisma.WishlistItemInclude;

type WishlistItemWithProduct = Prisma.WishlistItemGetPayload<{
  include: typeof WISHLIST_ITEM_INCLUDE;
}>;

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async getWishlist(userId: string) {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      include: WISHLIST_ITEM_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return items.map((item) => this.serialize(item));
  }

  async addItem(userId: string, dto: AddToWishlistDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId: dto.productId } },
    });
    if (existing) {
      throw new ConflictException('This product is already in your wishlist');
    }

    await this.prisma.wishlistItem.create({
      data: { userId, productId: dto.productId },
    });
    return this.getWishlist(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const item = await this.prisma.wishlistItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Wishlist item not found');
    if (item.userId !== userId) {
      throw new ForbiddenException('This wishlist item does not belong to you');
    }
    await this.prisma.wishlistItem.delete({ where: { id: itemId } });
    return this.getWishlist(userId);
  }

  private serialize(item: WishlistItemWithProduct) {
    return {
      ...item,
      product: {
        ...item.product,
        price: decimalToNumber(item.product.price),
        compareAtPrice: decimalToNumber(item.product.compareAtPrice),
      },
    };
  }
}

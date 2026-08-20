import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { decimalToNumber } from '../../common/utils/decimal.util';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

const CART_ITEM_INCLUDE = {
  product: {
    include: {
      category: true,
      images: { orderBy: { position: 'asc' as const } },
    },
  },
} satisfies Prisma.CartItemInclude;

type CartItemWithProduct = Prisma.CartItemGetPayload<{
  include: typeof CART_ITEM_INCLUDE;
}>;

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      include: CART_ITEM_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return this.serializeCart(items);
  }

  async addItem(userId: string, dto: AddToCartDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found');
    }
    if (!product.sizes.includes(dto.size)) {
      throw new BadRequestException(`Invalid size "${dto.size}" for ${product.name}`);
    }

    const quantity = dto.quantity ?? 1;
    const existing = await this.prisma.cartItem.findUnique({
      where: {
        userId_productId_size: { userId, productId: dto.productId, size: dto.size },
      },
    });

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: { userId, productId: dto.productId, size: dto.size, quantity },
      });
    }

    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    await this.assertOwnership(userId, itemId);
    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });
    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    await this.assertOwnership(userId, itemId);
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    await this.prisma.cartItem.deleteMany({ where: { userId } });
    return { items: [], subtotal: 0, totalItems: 0 };
  }

  private async assertOwnership(userId: string, itemId: string) {
    const item = await this.prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Cart item not found');
    if (item.userId !== userId) {
      throw new ForbiddenException('This cart item does not belong to you');
    }
    return item;
  }

  private serializeCart(items: CartItemWithProduct[]) {
    const serializedItems = items.map((item) => ({
      ...item,
      product: {
        ...item.product,
        price: decimalToNumber(item.product.price),
        compareAtPrice: decimalToNumber(item.product.compareAtPrice),
      },
    }));

    const subtotal = serializedItems.reduce(
      (sum, item) => sum + (item.product.price ?? 0) * item.quantity,
      0,
    );
    const totalItems = serializedItems.reduce((sum, item) => sum + item.quantity, 0);

    return { items: serializedItems, subtotal, totalItems };
  }
}

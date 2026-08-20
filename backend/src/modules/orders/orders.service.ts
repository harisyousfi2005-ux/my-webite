import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination-query.dto';
import { decimalToNumber } from '../../common/utils/decimal.util';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { EmailService } from '../email/email.service';

const ORDER_INCLUDE = {
  items: true,
  address: true,
  discountCode: true,
  payment: true,
  user: {
    select: { id: true, email: true, firstName: true, lastName: true },
  },
} satisfies Prisma.OrderInclude;

type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    const address = await this.prisma.address.findUnique({
      where: { id: dto.addressId },
    });
    if (!address || address.userId !== userId) {
      throw new BadRequestException('Invalid shipping address');
    }

    const resolvedItems: {
      productId: string;
      productName: string;
      price: Prisma.Decimal;
      size: string;
      quantity: number;
    }[] = [];

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product || !product.isActive) {
        throw new NotFoundException(`Product not found: ${item.productId}`);
      }
      if (!product.sizes.includes(item.size)) {
        throw new BadRequestException(`Invalid size "${item.size}" for ${product.name}`);
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${product.name}`);
      }
      resolvedItems.push({
        productId: product.id,
        productName: product.name,
        price: product.price,
        size: item.size,
        quantity: item.quantity,
      });
    }

    const subtotal = resolvedItems.reduce(
      (sum, item) => sum + item.price.toNumber() * item.quantity,
      0,
    );

    let discountAmount = 0;
    let discountCodeId: string | undefined;
    if (dto.discountCode) {
      const discount = await this.prisma.discountCode.findUnique({
        where: { code: dto.discountCode.trim().toUpperCase() },
      });
      if (
        !discount ||
        !discount.isActive ||
        (discount.expiresAt && discount.expiresAt < new Date())
      ) {
        throw new BadRequestException('Invalid or expired discount code');
      }
      discountAmount = Math.round(subtotal * (discount.percentOff / 100) * 100) / 100;
      discountCodeId = discount.id;
    }

    const total = subtotal - discountAmount;
    const orderNumber = this.generateOrderNumber();

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId: dto.addressId,
          paymentMethod: dto.paymentMethod,
          subtotal,
          discountAmount,
          discountCodeId,
          total,
          contactEmail: dto.contactEmail,
          contactPhone: dto.contactPhone,
          notes: dto.notes,
          items: {
            create: resolvedItems.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              price: item.price,
              size: item.size,
              quantity: item.quantity,
            })),
          },
          payment: {
            create: {
              method: dto.paymentMethod,
              amount: total,
              status: 'PENDING',
            },
          },
        },
        include: ORDER_INCLUDE,
      });

      for (const item of resolvedItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
        await tx.cartItem.deleteMany({
          where: { userId, productId: item.productId, size: item.size },
        });
      }

      return created;
    });

    // Fire-and-forget: a failed email must never fail an already-placed order.
    void this.emailService.sendOrderConfirmation({
      orderNumber: order.orderNumber,
      contactEmail: order.contactEmail,
      recipientName: order.user?.firstName,
      items: order.items.map((item) => ({
        productName: item.productName,
        size: item.size,
        quantity: item.quantity,
        price: decimalToNumber(item.price) ?? 0,
      })),
      subtotal: decimalToNumber(order.subtotal) ?? 0,
      discountAmount: decimalToNumber(order.discountAmount) ?? 0,
      total: decimalToNumber(order.total) ?? 0,
      paymentMethod: order.paymentMethod,
      address: {
        line1: address.line1,
        city: address.city,
        postalCode: address.postalCode,
        country: address.country,
      },
    });

    return this.serialize(order);
  }

  async findAll(query: QueryOrderDto) {
    const where: Prisma.OrderWhereInput = query.status ? { status: query.status } : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: query.prismaSkip,
        take: query.prismaTake,
      }),
      this.prisma.order.count({ where }),
    ]);

    return paginate(
      items.map((o) => this.serialize(o)),
      total,
      query,
    );
  }

  async findAllForUser(userId: string, query: QueryOrderDto) {
    const where: Prisma.OrderWhereInput = {
      userId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: query.prismaSkip,
        take: query.prismaTake,
      }),
      this.prisma.order.count({ where }),
    ]);

    return paginate(
      items.map((o) => this.serialize(o)),
      total,
      query,
    );
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.serialize(order);
  }

  async findOneForUser(userId: string, id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) {
      throw new ForbiddenException('This order does not belong to you');
    }
    return this.serialize(order);
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
      include: ORDER_INCLUDE,
    });
    return this.serialize(updated);
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  private serialize(order: OrderWithRelations) {
    return {
      ...order,
      subtotal: decimalToNumber(order.subtotal),
      discountAmount: decimalToNumber(order.discountAmount),
      total: decimalToNumber(order.total),
      items: order.items.map((item) => ({
        ...item,
        price: decimalToNumber(item.price),
      })),
      payment: order.payment
        ? {
            ...order.payment,
            amount: decimalToNumber(order.payment.amount),
            bankTransferAmount: decimalToNumber(order.payment.bankTransferAmount),
          }
        : null,
    };
  }
}

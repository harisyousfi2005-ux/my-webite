import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationQueryDto, paginate } from '../../common/dto/pagination-query.dto';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContactMessageDto) {
    const message = await this.prisma.contactMessage.create({ data: dto });
    return { message: 'Thank you — we will get back to you shortly.', id: message.id };
  }

  async findAll(query: PaginationQueryDto) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.contactMessage.findMany({
        orderBy: { createdAt: 'desc' },
        skip: query.prismaSkip,
        take: query.prismaTake,
      }),
      this.prisma.contactMessage.count(),
    ]);
    return paginate(items, total, query);
  }

  async markAsRead(id: string) {
    const existing = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Message not found');
    return this.prisma.contactMessage.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Message not found');
    await this.prisma.contactMessage.delete({ where: { id } });
    return { message: 'Message deleted' };
  }
}

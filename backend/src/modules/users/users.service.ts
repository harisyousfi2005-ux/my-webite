import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationQueryDto, paginate } from '../../common/dto/pagination-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: SAFE_USER_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(id: string, dto: UpdateUserDto) {
    await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: SAFE_USER_SELECT,
    });
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const matches = await bcrypt.compare(dto.currentPassword, user.password);
    if (!matches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: 'Password updated successfully' };
  }

  async findAll(query: PaginationQueryDto) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        select: SAFE_USER_SELECT,
        skip: query.prismaSkip,
        take: query.prismaTake,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return paginate(items, total, query);
  }

  async setActiveStatus(id: string, isActive: boolean) {
    await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: SAFE_USER_SELECT,
    });
  }

  /**
   * SUPER_ADMIN-only (enforced by the controller's @Roles guard). Two
   * safeguards against locking the store out of admin access:
   *  - a SUPER_ADMIN can never change their own role through this endpoint,
   *    so a single misclick can't demote the account making the request.
   *  - the last remaining SUPER_ADMIN can never be demoted, so the system
   *    can never end up with zero admin accounts.
   */
  async updateRole(actingAdminId: string, targetUserId: string, dto: UpdateUserRoleDto) {
    if (targetUserId === actingAdminId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    const target = await this.findById(targetUserId);

    if (target.role === Role.SUPER_ADMIN && dto.role !== Role.SUPER_ADMIN) {
      const superAdminCount = await this.prisma.user.count({
        where: { role: Role.SUPER_ADMIN },
      });
      if (superAdminCount <= 1) {
        throw new BadRequestException('Cannot remove the last remaining SUPER_ADMIN');
      }
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: dto.role },
      select: SAFE_USER_SELECT,
    });
  }

  // --- Addresses ---

  async listAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.create({
      data: { ...dto, userId },
    });
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    await this.assertAddressOwnership(userId, addressId);

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data: dto,
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    await this.assertAddressOwnership(userId, addressId);
    await this.prisma.address.delete({ where: { id: addressId } });
    return { message: 'Address deleted' };
  }

  private async assertAddressOwnership(userId: string, addressId: string) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });
    if (!address) throw new NotFoundException('Address not found');
    if (address.userId !== userId) {
      throw new ForbiddenException('This address does not belong to you');
    }
    return address;
  }
}

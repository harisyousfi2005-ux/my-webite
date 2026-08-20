import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: "Get the current user's profile" })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: "Update the current user's profile" })
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('me/password')
  @ApiOperation({ summary: "Change the current user's password" })
  changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.id, dto);
  }

  @Get('me/addresses')
  @ApiOperation({ summary: "List the current user's saved addresses" })
  listAddresses(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.listAddresses(user.id);
  }

  @Post('me/addresses')
  @ApiOperation({ summary: 'Add a new address' })
  createAddress(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAddressDto) {
    return this.usersService.createAddress(user.id, dto);
  }

  @Patch('me/addresses/:addressId')
  @ApiOperation({ summary: 'Update a saved address' })
  updateAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(user.id, addressId, dto);
  }

  @Delete('me/addresses/:addressId')
  @ApiOperation({ summary: 'Delete a saved address' })
  deleteAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('addressId') addressId: string,
  ) {
    return this.usersService.deleteAddress(user.id, addressId);
  }

  // --- Admin-only ---

  @Get()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] List all customer accounts' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query);
  }

  @Patch(':id/deactivate')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Deactivate a user account' })
  deactivate(@Param('id') id: string) {
    return this.usersService.setActiveStatus(id, false);
  }

  @Patch(':id/activate')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Reactivate a user account' })
  activate(@Param('id') id: string) {
    return this.usersService.setActiveStatus(id, true);
  }

  @Patch(':id/role')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: "[Admin] Change a user's role" })
  updateRole(
    @CurrentUser() actingAdmin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateRole(actingAdmin.id, id, dto);
  }
}

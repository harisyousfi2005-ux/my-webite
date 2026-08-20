import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';

@ApiTags('wishlist')
@ApiBearerAuth()
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: "Get the current user's wishlist" })
  getWishlist(@CurrentUser() user: AuthenticatedUser) {
    return this.wishlistService.getWishlist(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Add a product to the wishlist' })
  addItem(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddToWishlistDto) {
    return this.wishlistService.addItem(user.id, dto);
  }

  @Delete(':itemId')
  @ApiOperation({ summary: 'Remove a product from the wishlist' })
  removeItem(@CurrentUser() user: AuthenticatedUser, @Param('itemId') itemId: string) {
    return this.wishlistService.removeItem(user.id, itemId);
  }
}

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Wishlists')
@ApiBearerAuth()
@Controller('wishlists')
@UseGuards(FirebaseAuthGuard)
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all wishlists for the authenticated user' })
  async findAll(@Req() req: any) {
    return this.wishlistsService.findAll(req.user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new wishlist' })
  async create(@Req() req: any, @Body('name') name: string) {
    return this.wishlistsService.create(req.user.userId, name);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add a product to a wishlist' })
  async addItem(
    @Req() req: any,
    @Param('id') wishlistId: string,
    @Body('productId') productId: string,
  ) {
    return this.wishlistsService.addItem(
      req.user.userId,
      wishlistId,
      productId,
    );
  }

  @Delete(':id/items/:productId')
  @ApiOperation({ summary: 'Remove a product from a wishlist' })
  async removeItem(
    @Req() req: any,
    @Param('id') wishlistId: string,
    @Param('productId') productId: string,
  ) {
    return this.wishlistsService.removeItem(
      req.user.userId,
      wishlistId,
      productId,
    );
  }

  @Post(':id/to-cart/:productId')
  @ApiOperation({ summary: 'Copy a product from a wishlist to a cart' })
  async toCart(
    @Req() req: any,
    @Param('id') wishlistId: string,
    @Param('productId') productId: string,
    @Body('cartId') cartId: string,
  ) {
    return this.wishlistsService.moveToCart(
      req.user.userId,
      wishlistId,
      productId,
      cartId,
    );
  }

  @Post(':id/move/:toWishlistId/:productId')
  @ApiOperation({ summary: 'Move a product from one wishlist to another' })
  async moveItem(
    @Req() req: any,
    @Param('id') fromId: string,
    @Param('toWishlistId') toId: string,
    @Param('productId') productId: string,
  ) {
    return this.wishlistsService.moveItemBetweenWishlists(
      req.user.userId,
      fromId,
      toId,
      productId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a wishlist' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Req() req: any, @Param('id') wishlistId: string) {
    return this.wishlistsService.deleteWishlist(req.user.userId, wishlistId);
  }
}

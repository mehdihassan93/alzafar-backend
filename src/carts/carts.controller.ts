import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { CartsService } from './carts.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Carts')
@ApiBearerAuth()
@Controller('carts')
@UseGuards(FirebaseAuthGuard)
export class CartsController {
    constructor(private readonly cartsService: CartsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all carts for the authenticated user' })
    async findAll(@Req() req: any) {
        return this.cartsService.findAll(req.user.userId);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new cart' })
    async create(@Req() req: any, @Body('name') name: string) {
        return this.cartsService.create(req.user.userId, name);
    }

    @Post(':id/items')
    @ApiOperation({ summary: 'Add an item to a specific cart' })
    async addItem(
        @Req() req: any,
        @Param('id') cartId: string,
        @Body('productId') productId: string,
        @Body('quantity') quantity: number,
    ) {
        return this.cartsService.addItem(req.user.userId, cartId, productId, quantity);
    }

    @Put(':id/items/:productId')
    @ApiOperation({ summary: 'Update the quantity of an item in a cart' })
    async updateItem(
        @Req() req: any,
        @Param('id') cartId: string,
        @Param('productId') productId: string,
        @Body('quantity') quantity: number,
    ) {
        return this.cartsService.updateItem(req.user.userId, cartId, productId, quantity);
    }

    @Delete(':id/items/:productId')
    @ApiOperation({ summary: 'Remove an item from a cart' })
    async removeItem(
        @Req() req: any,
        @Param('id') cartId: string,
        @Param('productId') productId: string,
    ) {
        return this.cartsService.removeItem(req.user.userId, cartId, productId);
    }

    @Post(':id/move/:toCartId/:productId')
    @ApiOperation({ summary: 'Move an item from one cart to another' })
    async moveItem(
        @Req() req: any,
        @Param('id') fromCartId: string,
        @Param('toCartId') toCartId: string,
        @Param('productId') productId: string,
    ) {
        return this.cartsService.moveItem(req.user.userId, fromCartId, toCartId, productId);
    }

    @Put(':id/rename')
    @ApiOperation({ summary: 'Rename a cart' })
    async rename(@Req() req: any, @Param('id') cartId: string, @Body('name') name: string) {
        return this.cartsService.rename(req.user.userId, cartId, name);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a cart' })
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@Req() req: any, @Param('id') cartId: string) {
        return this.cartsService.deleteCart(req.user.userId, cartId);
    }

    @Get(':id/validate')
    @ApiOperation({ summary: 'Check for issues in a cart (out of stock, discontinued, etc.)' })
    async validate(@Req() req: any, @Param('id') cartId: string) {
        return this.cartsService.validateCart(req.user.userId, cartId);
    }

    @Post(':id/share')
    @ApiOperation({ summary: 'Share a cart with another user via email' })
    async share(@Req() req: any, @Param('id') cartId: string, @Body('email') email: string) {
        return this.cartsService.shareCart(req.user.userId, cartId, email);
    }

    @Post(':id/unshare')
    @ApiOperation({ summary: 'Remove a users access to a shared cart' })
    async unshare(@Req() req: any, @Param('id') cartId: string, @Body('targetUserId') targetUserId: string) {
        return this.cartsService.unshareCart(req.user.userId, cartId, targetUserId);
    }

    @Post('merge')
    @ApiOperation({ summary: 'Merge a local cart into the users account upon login' })
    async merge(@Req() req: any, @Body() localCart: any) {
        return this.cartsService.mergeLocalCart(req.user.userId, localCart);
    }
}

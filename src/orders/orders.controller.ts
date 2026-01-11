import { Controller, Get, Post, Body, Put, Param, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { OrderStatus } from './schemas/order.schema';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(FirebaseAuthGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    @ApiOperation({ summary: 'Place a new order' })
    async create(@Req() req: any, @Body() createOrderDto: CreateOrderDto) {
        return this.ordersService.create(req.user.uid, createOrderDto);
    }

    @Get('my-orders')
    @ApiOperation({ summary: 'Get order history for the authenticated user' })
    async findMyOrders(@Req() req: any) {
        return this.ordersService.findByUser(req.user.uid);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get order details by ID' })
    async findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }

    @Put(':id/cancel')
    @ApiOperation({ summary: 'Cancel an order' })
    async cancelOrder(@Param('id') id: string, @Req() req: any) {
        const isAdmin = req.user.role === UserRole.ADMIN;
        return this.ordersService.cancelOrder(id, req.user.uid, isAdmin);
    }

    @Get()
    @ApiOperation({ summary: 'Get all orders (Admin only)' })
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async findAll() {
        return this.ordersService.findAll();
    }

    @Put(':id/status')
    @ApiOperation({ summary: 'Update order status (Admin only)' })
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async updateStatus(@Param('id') id: string, @Body('status') status: OrderStatus) {
        return this.ordersService.updateStatus(id, status);
    }

    @Put(':id/payment-status')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async updatePaymentStatus(@Param('id') id: string, @Body('paymentStatus') paymentStatus: string) {
        return this.ordersService.updatePaymentStatus(id, paymentStatus);
    }
}

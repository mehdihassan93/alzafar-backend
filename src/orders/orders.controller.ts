import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { OrderStatus } from './schemas/order.schema';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(FirebaseAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Place a new order' })
  @ApiResponse({ status: 201, description: 'Order successfully created' })
  @ApiResponse({
    status: 400,
    description: 'Insufficient stock or invalid coupon',
  })
  async create(@Req() req: any, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(req.user.userId, createOrderDto);
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Get order history for the authenticated user' })
  @ApiResponse({ status: 200, description: 'User order history returned' })
  async findMyOrders(@Req() req: any) {
    return this.ordersService.findByUser(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details by ID' })
  @ApiResponse({ status: 200, description: 'Order details with product info' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  async cancelOrder(@Param('id') id: string, @Req() req: any) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.ordersService.cancelOrder(id, req.user.uid, isAdmin);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders (Admin only)' })
  @ApiResponse({ status: 200, description: 'Full list of orders' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.ordersService.findAll();
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update order status (Admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: Object.values(OrderStatus) },
        note: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Status updated and email sent' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
    @Body('note') note: string,
    @Req() req: any,
  ) {
    return this.ordersService.updateStatus(id, status, note, req.user.uid);
  }

  @Put(':id/payment-status')
  @ApiOperation({ summary: 'Update payment status (Admin only)' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body('paymentStatus') paymentStatus: string,
  ) {
    return this.ordersService.updatePaymentStatus(id, paymentStatus);
  }
}

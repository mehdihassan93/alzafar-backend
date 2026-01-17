import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { Order, OrderStatus, PaymentStatus } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { FraudService } from '../fraud/fraud.service';
import { CouponsService } from '../coupons/coupons.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectConnection() private readonly connection: Connection,
    private productsService: ProductsService,
    private usersService: UsersService,
    private fraudService: FraudService,
    private couponsService: CouponsService,
    private emailService: EmailService,
  ) { }

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const itemCategoryIds: string[] = [];

      // 1. Inventory Management: Atomic deduction
      for (const item of createOrderDto.items) {
        const product = await this.productsService.findOne(item.product);

        // Collect category IDs for coupon validation
        if (product.category) {
          itemCategoryIds.push(product.category.toString());
        }

        // Atomic deduction
        await this.productsService.deductStock(
          item.product,
          item.quantity,
          session,
        );
      }

      // 2. Calculate amounts
      const subtotal = createOrderDto.items.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0,
      );
      const tax = subtotal * 0.05;
      const shippingCost = subtotal > 500 ? 0 : 50;

      // 2. Dynamic Coupon Calculation
      let discount = 0;
      if (createOrderDto.discountCode) {
        const coupon = await this.couponsService.validateCoupon(
          createOrderDto.discountCode,
          subtotal,
          itemCategoryIds,
        );
        discount = await this.couponsService.calculateDiscount(
          coupon,
          subtotal,
        );
        await this.couponsService.incrementUsedCount(
          createOrderDto.discountCode,
        );
      }

      const totalAmount = subtotal + tax + shippingCost - discount;

      // 3. Fraud Detection Check
      const fraudResult = await this.fraudService.checkOrder(userId, {
        ...createOrderDto,
        totalAmount,
      });
      if (fraudResult.score >= 90) {
        throw new Error(
          'Order blocked due to security concerns (Multiple rapid orders). Please contact support.',
        );
      }

      // 4. Create Order
      const createdOrder = new this.orderModel({
        ...createOrderDto,
        user: new Types.ObjectId(userId),
        totalAmount,
        tax,
        shippingCost,
        discount,
        subtotal,
        isFlagged: fraudResult.isFlagged,
        fraudScore: fraudResult.score,
        timeline: [
          {
            status: OrderStatus.PENDING,
            timestamp: new Date(),
            note: 'Order placed successfully',
            updatedBy: 'system',
          },
        ],
      });
      const savedOrder = await createdOrder.save({ session });

      await session.commitTransaction();

      // 5. Send Order Confirmation Email (Outside transaction)
      try {
        const user = await this.usersService.findById(userId);
        if (user) {
          await this.emailService.sendOrderConfirmation(user.email, {
            customerName: `${user.firstName} ${user.lastName}`,
            orderId: savedOrder._id.toString(),
            totalAmount: savedOrder.totalAmount,
            items: createOrderDto.items,
          });
        }
      } catch (error) {
        console.error('Failed to send order confirmation email:', error);
      }

      return savedOrder;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async findAll(): Promise<Order[]> {
    return this.orderModel
      .find()
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name price')
      .lean()
      .exec() as unknown as Order[];
  }

  async findByUser(userId: string): Promise<Order[]> {
    return this.orderModel
      .find({ user: new Types.ObjectId(userId) })
      .populate('items.product', 'name price')
      .lean()
      .exec() as unknown as Order[];
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel
      .findById(id)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name price images')
      .lean()
      .exec();
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order as unknown as Order;
  }

  async cancelOrder(
    id: string,
    userId: string,
    isAdmin: boolean = false,
  ): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // 1. Authorization Check
    if (order.user.toString() !== userId && !isAdmin) {
      throw new Error('Not authorized to cancel this order');
    }

    // 2. Status Check: Cannot cancel if already shipped or delivered
    const forbiddenStatuses = [
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ];
    if (forbiddenStatuses.includes(order.status)) {
      throw new Error(`Cannot cancel order. Current status: ${order.status}`);
    }

    // 3. Inventory Restoration (Enterprise standard)
    // We add the items back to the product stock
    for (const item of order.items) {
      const product = await this.productsService.findOne(
        item.product.toString(),
      );
      await this.productsService.update(item.product.toString(), {
        stock: product.stock + item.quantity,
        isAvailable: true, // If it was unavailable due to zero stock, make it available again
      });
    }

    // 4. Update Order Status & Timeline
    order.status = OrderStatus.CANCELLED;
    order.timeline.push({
      status: OrderStatus.CANCELLED,
      timestamp: new Date(),
      note: isAdmin ? 'Cancelled by Administrator' : 'Cancelled by User',
      updatedBy: userId,
    });
    // Optionally handle payment refund trigger here
    if (order.paymentStatus === PaymentStatus.PAID) {
      // paymentGateway.refund(order.paymentId)
      order.paymentStatus = PaymentStatus.PENDING;
    }

    const savedOrder = await order.save();

    // 5. Send Cancellation Email
    try {
      const user = await this.usersService.findById(order.user.toString());
      if (user) {
        await this.emailService.sendOrderStatusUpdate(
          user.email,
          order._id.toString(),
          OrderStatus.CANCELLED,
          user.firstName,
        );
      }
    } catch (error) {
      console.error('Failed to send cancellation email:', error);
    }

    return savedOrder;
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    note?: string,
    adminId?: string,
  ): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    order.status = status;
    order.timeline.push({
      status,
      timestamp: new Date(),
      note: note || `Order status updated to ${status}`,
      updatedBy: adminId || 'admin',
    });

    const savedOrder = await order.save();

    // Notify user of status update
    try {
      const user = await this.usersService.findById(savedOrder.user.toString());
      if (user) {
        await this.emailService.sendOrderStatusUpdate(
          user.email,
          savedOrder._id.toString(),
          status,
          user.firstName,
        );
      }
    } catch (error) {
      console.error('Failed to send status update email:', error);
    }

    return savedOrder;
  }

  async updatePaymentStatus(id: string, paymentStatus: string): Promise<Order> {
    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(id, { paymentStatus }, { new: true })
      .exec();
    if (!updatedOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return updatedOrder;
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderStatus, PaymentStatus } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProductsService } from '../products/products.service';
import { FraudService } from '../fraud/fraud.service';

@Injectable()
export class OrdersService {
    constructor(
        @InjectModel(Order.name) private orderModel: Model<Order>,
        private productsService: ProductsService,
        private fraudService: FraudService,
    ) { }

    async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
        // 1. Inventory Management: Check stock and deduct
        for (const item of createOrderDto.items) {
            const product = await this.productsService.findOne(item.product);
            if (!product.isAvailable || product.stock < item.quantity) {
                throw new Error(`Insufficient stock for product: ${product.name}`);
            }

            // Deduct stock
            await this.productsService.update(item.product, {
                stock: product.stock - item.quantity
            });
        }

        // 2. Calculate amounts
        const subtotal = createOrderDto.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const tax = subtotal * 0.15;
        const shippingCost = subtotal > 100 ? 0 : 15;
        const discount = createOrderDto.discountCode === 'WELCOME10' ? subtotal * 0.1 : 0;
        const totalAmount = subtotal + tax + shippingCost - discount;

        // 3. Fraud Detection Check
        const fraudResult = await this.fraudService.checkOrder(userId, { ...createOrderDto, totalAmount });
        if (fraudResult.score >= 90) {
            throw new Error('Order blocked due to security concerns (Multiple rapid orders). Please contact support.');
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
        });
        return createdOrder.save();
    }

    async findAll(): Promise<Order[]> {
        return this.orderModel.find()
            .populate('user', 'firstName lastName email')
            .populate('items.product', 'name price')
            .exec();
    }

    async findByUser(userId: string): Promise<Order[]> {
        return this.orderModel.find({ user: new Types.ObjectId(userId) })
            .populate('items.product', 'name price')
            .exec();
    }

    async findOne(id: string): Promise<Order> {
        const order = await this.orderModel.findById(id)
            .populate('user', 'firstName lastName email')
            .populate('items.product', 'name price images')
            .exec();
        if (!order) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }
        return order;
    }

    async cancelOrder(id: string, userId: string, isAdmin: boolean = false): Promise<Order> {
        const order = await this.orderModel.findById(id).exec();

        if (!order) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }

        // 1. Authorization Check
        if (order.user.toString() !== userId && !isAdmin) {
            throw new Error('Not authorized to cancel this order');
        }

        // 2. Status Check: Cannot cancel if already shipped or delivered
        const forbiddenStatuses = [OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.CANCELLED];
        if (forbiddenStatuses.includes(order.status)) {
            throw new Error(`Cannot cancel order. Current status: ${order.status}`);
        }

        // 3. Inventory Restoration (Enterprise standard)
        // We add the items back to the product stock
        for (const item of order.items) {
            const product = await this.productsService.findOne(item.product.toString());
            await this.productsService.update(item.product.toString(), {
                stock: product.stock + item.quantity,
                isAvailable: true // If it was unavailable due to zero stock, make it available again
            });
        }

        // 4. Update Order Status
        order.status = OrderStatus.CANCELLED;
        // Optionally handle payment refund trigger here
        if (order.paymentStatus === PaymentStatus.PAID) {
            // paymentGateway.refund(order.paymentId)
            order.paymentStatus = PaymentStatus.PENDING;
        }

        return order.save();
    }

    async updateStatus(id: string, status: OrderStatus): Promise<Order> {
        const updatedOrder = await this.orderModel
            .findByIdAndUpdate(id, { status }, { new: true })
            .exec();
        if (!updatedOrder) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }
        return updatedOrder;
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

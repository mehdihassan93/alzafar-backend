import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderStatus } from '../orders/schemas/order.schema';
import { Product } from '../products/schemas/product.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalRevenue,
      todayRevenue,
      totalOrders,
      lowStockProducts,
      topProducts,
    ] = await Promise.all([
      // 1. Total Revenue (Delivered only)
      this.orderModel.aggregate([
        { $match: { status: OrderStatus.DELIVERED } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      // 2. Today's Revenue
      this.orderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: today },
            status: { $ne: OrderStatus.CANCELLED },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      // 3. Total Orders Count
      this.orderModel.countDocuments(),
      // 4. Low Stock Alert (< 10)
      this.productModel.countDocuments({ stock: { $lt: 10 } }),
      // 5. Top 5 Selling Products
      this.orderModel.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            totalSold: { $sum: '$items.quantity' },
            revenue: {
              $sum: { $multiply: ['$items.price', '$items.quantity'] },
            },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: '$product' },
      ]),
    ]);

    return {
      totalRevenue: totalRevenue[0]?.total || 0,
      todayRevenue: todayRevenue[0]?.total || 0,
      totalOrders,
      lowStockCount: lowStockProducts,
      topSellingProducts: topProducts.map((tp) => ({
        id: tp._id,
        name: tp.product.name,
        sold: tp.totalSold,
        revenue: tp.revenue,
      })),
    };
  }

  async getRevenueByMonth() {
    return this.orderModel.aggregate([
      { $match: { status: OrderStatus.DELIVERED } },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
          },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
    ]);
  }
}

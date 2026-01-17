import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review } from './schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { Order, OrderStatus } from '../orders/schemas/order.schema';
import { Product } from '../products/schemas/product.schema';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  async create(
    userId: string,
    createReviewDto: CreateReviewDto,
  ): Promise<Review> {
    const { productId, rating, comment } = createReviewDto;

    // 1. Check if user already reviewed this product
    const existingReview = await this.reviewModel.findOne({
      user: new Types.ObjectId(userId),
      product: new Types.ObjectId(productId),
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this product');
    }

    // 2. Check for "Verified Purchase" status
    // A verified purchase is an order containing the product that is DELIVERED.
    const order = await this.orderModel.findOne({
      user: new Types.ObjectId(userId),
      status: OrderStatus.DELIVERED,
      'items.product': new Types.ObjectId(productId),
    });

    const review = new this.reviewModel({
      user: new Types.ObjectId(userId),
      product: new Types.ObjectId(productId),
      rating,
      comment,
      isVerifiedPurchase: !!order,
    });

    const savedReview = await review.save();
    await this.updateProductStats(productId);
    return savedReview;
  }

  private async updateProductStats(productId: string): Promise<void> {
    const stats = await this.reviewModel.aggregate([
      { $match: { product: new Types.ObjectId(productId), isActive: true } },
      {
        $group: {
          _id: '$product',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const { averageRating, reviewCount } = stats[0] || {
      averageRating: 0,
      reviewCount: 0,
    };

    await this.productModel.findByIdAndUpdate(productId, {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      reviewCount,
    });
  }

  async findByProduct(productId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find({ product: new Types.ObjectId(productId), isActive: true })
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reviewModel.countDocuments({
        product: new Types.ObjectId(productId),
        isActive: true,
      }),
    ]);

    return { reviews, total };
  }

  async getProductStats(productId: string) {
    const stats = await this.reviewModel.aggregate([
      { $match: { product: new Types.ObjectId(productId), isActive: true } },
      {
        $group: {
          _id: '$product',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    return stats[0] || { averageRating: 0, reviewCount: 0 };
  }

  async remove(
    id: string,
    userId: string,
    isAdmin: boolean = false,
  ): Promise<void> {
    const review = await this.reviewModel.findById(id);
    if (!review) throw new NotFoundException('Review not found');

    if (review.user.toString() !== userId && !isAdmin) {
      throw new ForbiddenException('Not authorized to delete this review');
    }

    await this.reviewModel.findByIdAndDelete(id);
    await this.updateProductStats(review.product.toString());
  }
}

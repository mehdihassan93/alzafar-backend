import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Coupon, DiscountType } from './schemas/coupon.schema';
import { CreateCouponDto } from './dto/create-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(@InjectModel(Coupon.name) private couponModel: Model<Coupon>) {}

  async create(createCouponDto: CreateCouponDto): Promise<Coupon> {
    const existing = await this.couponModel.findOne({
      code: createCouponDto.code.toUpperCase(),
    });
    if (existing) {
      throw new ConflictException('Coupon code already exists');
    }
    const createdCoupon = new this.couponModel({
      ...createCouponDto,
      code: createCouponDto.code.toUpperCase(),
    });
    return createdCoupon.save();
  }

  async findAll(): Promise<Coupon[]> {
    return this.couponModel.find().exec();
  }

  async findByCode(code: string): Promise<Coupon> {
    const coupon = await this.couponModel
      .findOne({ code: code.toUpperCase() })
      .exec();
    if (!coupon) {
      throw new NotFoundException(`Coupon with code ${code} not found`);
    }
    return coupon;
  }

  async validateCoupon(
    code: string,
    orderAmount: number,
    itemCategoryIds: string[] = [],
  ): Promise<Coupon> {
    const coupon = await this.findByCode(code);

    if (!coupon.isActive) {
      throw new BadRequestException('Coupon is inactive');
    }

    const now = new Date();
    if (now < coupon.startDate) {
      throw new BadRequestException('Coupon is not yet valid');
    }
    if (now > coupon.endDate) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    if (orderAmount < coupon.minOrderAmount) {
      throw new BadRequestException(
        `Minimum order amount of ${coupon.minOrderAmount} required for this coupon`,
      );
    }

    // Category validation
    if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
      const hasApplicableItem = itemCategoryIds.some((catId) =>
        coupon.applicableCategories.map((c) => c.toString()).includes(catId),
      );
      if (!hasApplicableItem) {
        throw new BadRequestException(
          'This coupon is not applicable to any items in your cart',
        );
      }
    }

    return coupon;
  }

  async calculateDiscount(
    coupon: Coupon,
    orderAmount: number,
  ): Promise<number> {
    let discount = 0;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discount = (orderAmount * coupon.discountValue) / 100;
      if (
        coupon.maxDiscountAmount !== null &&
        discount > coupon.maxDiscountAmount
      ) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = coupon.discountValue;
    }

    // Ensure discount doesn't exceed order amount
    return Math.min(discount, orderAmount);
  }

  async incrementUsedCount(code: string): Promise<void> {
    await this.couponModel
      .updateOne({ code: code.toUpperCase() }, { $inc: { usedCount: 1 } })
      .exec();
  }

  async remove(id: string): Promise<any> {
    const result = await this.couponModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }
    return result;
  }
}

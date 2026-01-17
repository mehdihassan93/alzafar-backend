import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CouponsService } from './coupons.service';
import { Coupon, DiscountType } from './schemas/coupon.schema';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CouponsService', () => {
  let service: CouponsService;
  let model: any;

  const mockCoupon = {
    code: 'SAVE10',
    isActive: true,
    startDate: new Date(Date.now() - 10000),
    endDate: new Date(Date.now() + 10000),
    usageLimit: 100,
    usedCount: 0,
    minOrderAmount: 100,
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
    maxDiscountAmount: 50,
    applicableCategories: [],
  };

  const mockCouponModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    updateOne: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        {
          provide: getModelToken(Coupon.name),
          useValue: mockCouponModel,
        },
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
    model = module.get(getModelToken(Coupon.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateCoupon', () => {
    it('should validate a correct coupon', async () => {
      model.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCoupon),
      });

      const result = await service.validateCoupon('SAVE10', 200);
      expect(result).toEqual(mockCoupon);
    });

    it('should throw if amount is too low', async () => {
      model.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCoupon),
      });

      await expect(service.validateCoupon('SAVE10', 50)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if expired', async () => {
      const expiredCoupon = {
        ...mockCoupon,
        endDate: new Date(Date.now() - 1000),
      };
      model.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(expiredCoupon),
      });

      await expect(service.validateCoupon('SAVE10', 200)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('calculateDiscount', () => {
    it('should calculate percentage discount', async () => {
      const discount = await service.calculateDiscount(mockCoupon as any, 200);
      expect(discount).toBe(20);
    });

    it('should respect max discount amount', async () => {
      const discount = await service.calculateDiscount(mockCoupon as any, 1000);
      expect(discount).toBe(50);
    });

    it('should calculate fixed discount', async () => {
      const fixedCoupon = {
        ...mockCoupon,
        discountType: DiscountType.FIXED,
        discountValue: 30,
      };
      const discount = await service.calculateDiscount(fixedCoupon as any, 200);
      expect(discount).toBe(30);
    });
  });
});

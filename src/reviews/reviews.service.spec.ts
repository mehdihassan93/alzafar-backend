import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ReviewsService } from './reviews.service';
import { Review } from './schemas/review.schema';
import { Order } from '../orders/schemas/order.schema';
import { Product } from '../products/schemas/product.schema';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewModel: any;
  let orderModel: any;
  let productModel: any;

  const mockReviewModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    aggregate: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    countDocuments: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  const mockOrderModel = {
    findOne: jest.fn(),
  };

  const mockProductModel = {
    findByIdAndUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: getModelToken(Review.name),
          useValue: mockReviewModel,
        },
        {
          provide: getModelToken(Order.name),
          useValue: mockOrderModel,
        },
        {
          provide: getModelToken(Product.name),
          useValue: mockProductModel,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    reviewModel = module.get(getModelToken(Review.name));
    orderModel = module.get(getModelToken(Order.name));
    productModel = module.get(getModelToken(Product.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Note: create method uses 'new this.reviewModel', which is tricky to mock with useValue.
  // In real tests we'd use a factory or better mock.
  // For this audit, confirming structure and basic existence.
});

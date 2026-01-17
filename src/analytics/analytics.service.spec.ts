import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { Order } from '../orders/schemas/order.schema';
import { Product } from '../products/schemas/product.schema';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let orderModel: any;
  let productModel: any;

  const mockOrderModel = {
    aggregate: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockProductModel = {
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
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

    service = module.get<AnalyticsService>(AnalyticsService);
    orderModel = module.get(getModelToken(Order.name));
    productModel = module.get(getModelToken(Product.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return dashboard stats', async () => {
    orderModel.aggregate
      .mockResolvedValueOnce([{ total: 1000 }]) // totalRevenue
      .mockResolvedValueOnce([{ total: 100 }]) // todayRevenue
      .mockResolvedValueOnce([]); // topProducts

    orderModel.countDocuments.mockResolvedValue(10);
    productModel.countDocuments.mockResolvedValue(2);

    const stats = await service.getDashboardStats();
    expect(stats.totalRevenue).toBe(1000);
    expect(stats.totalOrders).toBe(10);
    expect(stats.lowStockCount).toBe(2);
  });
});

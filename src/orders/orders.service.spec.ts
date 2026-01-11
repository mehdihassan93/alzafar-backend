import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getModelToken } from '@nestjs/mongoose';
import { Order } from './schemas/order.schema';
import { ProductsService } from '../products/products.service';
import { FraudService } from '../fraud/fraud.service';

describe('OrdersService', () => {
  let service: OrdersService;

  const mockOrderModel = {};
  const mockProductsService = {
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const mockFraudService = {
    checkOrder: jest.fn().mockResolvedValue({ isFlagged: false, score: 0 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getModelToken(Order.name),
          useValue: mockOrderModel,
        },
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
        {
          provide: FraudService,
          useValue: mockFraudService,
        }
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('cancelOrder', () => {
    it('should successfully cancel an order and restore stock', async () => {
      const orderId = 'order123';
      const userId = 'user123';
      const productId = 'prod123';

      const mockOrder = {
        _id: orderId,
        user: userId,
        status: 'pending',
        items: [{ product: productId, quantity: 2 }],
        save: jest.fn().mockResolvedValue({ status: 'cancelled' }),
      };

      const mockProduct = {
        _id: productId,
        name: 'Test Product',
        stock: 10,
      };

      (service as any).orderModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrder),
      });
      mockProductsService.findOne.mockResolvedValue(mockProduct);

      const result = await service.cancelOrder(orderId, userId);

      expect(mockOrder.status).toBe('cancelled');
      expect(mockProductsService.update).toHaveBeenCalledWith(productId, {
        stock: 12, // 10 + 2
        isAvailable: true,
      });
      expect(mockOrder.save).toHaveBeenCalled();
    });
  });
});

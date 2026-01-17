import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { FraudService } from './fraud.service';
import { FraudLog } from './schemas/fraud-log.schema';
import { Order } from '../orders/schemas/order.schema';
import { Types } from 'mongoose';

describe('FraudService', () => {
  let service: FraudService;
  let fraudLogModel: any;
  let orderModel: any;

  const mockFraudLogModel = {
    constructor: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockOrderModel = {
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FraudService,
        {
          provide: getModelToken(FraudLog.name),
          useValue: mockFraudLogModel,
        },
        {
          provide: getModelToken(Order.name),
          useValue: mockOrderModel,
        },
      ],
    }).compile();

    service = module.get<FraudService>(FraudService);
    fraudLogModel = module.get(getModelToken(FraudLog.name));
    orderModel = module.get(getModelToken(Order.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should flag high value orders', async () => {
    orderModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(0),
    });

    const result = await service.checkOrder(new Types.ObjectId().toString(), {
      totalAmount: 2000,
    });
    expect(result.isFlagged).toBe(false); // Score 40 < 50
    expect(result.score).toBe(40);
  });

  it('should flag velocity limit', async () => {
    orderModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(5),
    });

    // Mocking the constructor and save for the flagged log
    const saveMock = jest.fn().mockResolvedValue({});
    (service as any).fraudLogModel = jest.fn().mockImplementation(() => ({
      save: saveMock,
    }));

    const result = await service.checkOrder(new Types.ObjectId().toString(), {
      totalAmount: 100,
    });
    expect(result.isFlagged).toBe(true);
    expect(result.score).toBe(60);
  });
});

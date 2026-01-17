import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getModelToken } from '@nestjs/mongoose';
import { Product } from './schemas/product.schema';
import { CartsService } from '../carts/carts.service';
import { WishlistsService } from '../wishlists/wishlists.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';

describe('ProductsService', () => {
  let service: ProductsService;

  const mockProductModel = {};
  const mockCartsService = {};
  const mockWishlistsService = {};
  const mockUsersService = {};
  const mockEmailService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getModelToken(Product.name),
          useValue: mockProductModel,
        },
        { provide: CartsService, useValue: mockCartsService },
        { provide: WishlistsService, useValue: mockWishlistsService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    it('should return paginated products based on search query', async () => {
      const mockProducts = [{ name: 'Test Product', price: 100 }];
      const mockTotal = 1;
      const searchDto = { q: 'test', page: 1, limit: 10 };

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProducts),
      };

      (service as any).productModel.find = jest.fn().mockReturnValue(mockQuery);
      (service as any).productModel.countDocuments = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTotal),
      });

      const result = await service.search(searchDto as any);

      expect(result.products).toEqual(mockProducts);
      expect(result.total).toBe(mockTotal);
      expect((service as any).productModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $text: { $search: 'test' },
          isAvailable: true,
        }),
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { FIREBASE_ADMIN } from '../firebase/firebase.module';
import { UsersService } from '../users/users.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

describe('ProductsController', () => {
  let controller: ProductsController;

  const mockProductsService: any = {};
  const mockUsersService: any = {};
  const mockFirebaseAdmin: any = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: ProductsService, useValue: mockProductsService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: FIREBASE_ADMIN, useValue: mockFirebaseAdmin },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('search', () => {
    it('should call productsService.search with correct params', async () => {
      const searchDto = { q: 'test' };
      const mockResult = { products: [], total: 0 };
      mockProductsService['search'] = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.search(searchDto as any);

      expect(mockProductsService['search']).toHaveBeenCalledWith(searchDto);
      expect(result).toBe(mockResult);
    });
  });
});

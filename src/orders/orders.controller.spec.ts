import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { FIREBASE_ADMIN } from '../firebase/firebase.module';
import { UsersService } from '../users/users.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

describe('OrdersController', () => {
  let controller: OrdersController;

  const mockOrdersService = {};
  const mockUsersService = {};
  const mockFirebaseAdmin = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: FIREBASE_ADMIN, useValue: mockFirebaseAdmin },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

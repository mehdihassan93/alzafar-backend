import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { FIREBASE_ADMIN } from '../firebase/firebase.module';
import { mockFirebaseAdmin } from '../common/test/mocks';
import { UsersService } from '../users/users.service';

describe('CategoriesController', () => {
  let controller: CategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: { findAll: jest.fn(), findOne: jest.fn() },
        },
        {
          provide: UsersService,
          useValue: { findByFirebaseUid: jest.fn() },
        },
        {
          provide: FIREBASE_ADMIN,
          useValue: mockFirebaseAdmin,
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

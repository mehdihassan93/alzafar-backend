import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { FIREBASE_ADMIN } from '../firebase/firebase.module';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { MediaService } from '../media/media.service';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {};
  const mockFirebaseAdmin = {};
  const mockMediaService = {
    uploadFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: FIREBASE_ADMIN, useValue: mockFirebaseAdmin },
        { provide: MediaService, useValue: mockMediaService },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

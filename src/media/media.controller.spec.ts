import { Test, TestingModule } from '@nestjs/testing';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

describe('MediaController', () => {
    let controller: MediaController;

    const mockMediaService = {
        uploadFile: jest.fn(),
        deleteFile: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [MediaController],
            providers: [
                { provide: MediaService, useValue: mockMediaService },
            ],
        })
            .overrideGuard(FirebaseAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(RolesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<MediaController>(MediaController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});

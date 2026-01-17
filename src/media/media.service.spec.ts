import { Test, TestingModule } from '@nestjs/testing';
import { MediaService } from './media.service';
import { ConfigService } from '@nestjs/config';

// Mock sharp
jest.mock('sharp', () => {
  const mSharp = {
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('optimized')),
  };
  return jest.fn(() => mSharp);
});

describe('MediaService', () => {
  let service: MediaService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'AWS_S3_BUCKET') return 'test-bucket';
      if (key === 'AWS_REGION') return 'us-east-1';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

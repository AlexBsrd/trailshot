import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              const config = {
                's3.endpoint': 'http://localhost:9000',
                's3.region': 'us-east-1',
                's3.bucket': 'test-bucket',
                's3.accessKeyId': 'test-key',
                's3.secretAccessKey': 'test-secret',
              };
              return config[key];
            },
          },
        },
      ],
    }).compile();

    service = module.get(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate an upload key with correct prefix', () => {
    const key = service.generateKey('originals', 'event-123', 'photo-456', 'jpg');
    expect(key).toBe('originals/event-123/photo-456.jpg');
  });
});

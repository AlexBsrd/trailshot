import { Test } from '@nestjs/testing';
import { ImageProcessingService } from './image-processing.service';
import sharp = require('sharp');

describe('ImageProcessingService', () => {
  let service: ImageProcessingService;

  const createTestImage = () =>
    sharp({ create: { width: 2000, height: 1500, channels: 3, background: '#ff0000' } })
      .jpeg()
      .toBuffer();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ImageProcessingService],
    }).compile();

    service = module.get(ImageProcessingService);
  });

  it('should generate a thumbnail with max width 400px', async () => {
    const input = await createTestImage();
    const result = await service.generateThumbnail(input);
    const metadata = await sharp(result).metadata();
    expect(metadata.width).toBe(400);
    expect(metadata.height).toBe(300);
  });

  it('should generate a preview with max width 1200px', async () => {
    const input = await createTestImage();
    const result = await service.generatePreview(input, false);
    const metadata = await sharp(result).metadata();
    expect(metadata.width).toBe(1200);
  });

  it('should generate a watermarked preview when watermark=true', async () => {
    const input = await createTestImage();
    const result = await service.generatePreview(input, true);
    const metadata = await sharp(result).metadata();
    expect(metadata.width).toBe(1200);
    const noWatermark = await service.generatePreview(input, false);
    expect(result.equals(noWatermark)).toBe(false);
  });

  it('should return original image metadata', async () => {
    const input = await createTestImage();
    const meta = await service.getMetadata(input);
    expect(meta.width).toBe(2000);
    expect(meta.height).toBe(1500);
  });
});

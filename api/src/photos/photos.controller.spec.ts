import { Test } from '@nestjs/testing';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';
import { AdminGuard } from '../auth/auth.guard';

const mockPhotosService = {
  findByEvent: jest.fn().mockResolvedValue([
    { id: '1', eventId: 'e1', thumbnailKey: 'thumb/1.jpg' },
  ]),
  findByBib: jest.fn().mockResolvedValue([
    { id: '1', eventId: 'e1', thumbnailKey: 'thumb/1.jpg' },
  ]),
  updateBibs: jest.fn().mockResolvedValue({ id: '1', bibs: [{ bibNumber: '123' }] }),
  findByEventForAdmin: jest.fn().mockResolvedValue([]),
};

describe('PhotosController', () => {
  let controller: PhotosController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [PhotosController],
      providers: [
        { provide: PhotosService, useValue: mockPhotosService },
      ],
    })
      .overrideGuard(AdminGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get(PhotosController);
  });

  it('should find photos by event slug', async () => {
    const result = await controller.findByEvent('trail-x');
    expect(result).toHaveLength(1);
  });

  it('should find photos by bib number', async () => {
    const result = await controller.findByBib('trail-x', '123');
    expect(result).toHaveLength(1);
  });

  it('should update bibs for a photo (admin)', async () => {
    const result = await controller.updateBibs('1', { bibs: ['123', '456'] });
    expect(mockPhotosService.updateBibs).toHaveBeenCalledWith('1', ['123', '456']);
  });
});

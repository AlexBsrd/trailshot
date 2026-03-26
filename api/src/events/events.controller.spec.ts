import { Test } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { AdminGuard } from '../auth/auth.guard';

const mockEventsService = {
  findPublished: jest.fn().mockResolvedValue([
    { id: '1', name: 'Trail X', slug: 'trail-x', isPublished: true },
  ]),
  findBySlug: jest.fn().mockResolvedValue({
    id: '1', name: 'Trail X', slug: 'trail-x',
  }),
  create: jest.fn().mockResolvedValue({
    id: '1', name: 'Trail X', slug: 'trail-x',
  }),
  findAll: jest.fn().mockResolvedValue([]),
};

describe('EventsController', () => {
  let controller: EventsController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        { provide: EventsService, useValue: mockEventsService },
      ],
    })
      .overrideGuard(AdminGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get(EventsController);
  });

  it('should return published events', async () => {
    const result = await controller.findPublished();
    expect(result).toHaveLength(1);
    expect(mockEventsService.findPublished).toHaveBeenCalled();
  });

  it('should find an event by slug', async () => {
    const result = await controller.findBySlug('trail-x');
    expect(result.slug).toBe('trail-x');
  });

  it('should create an event (admin)', async () => {
    const dto = { name: 'Trail X', date: '2026-03-15', location: 'Grenoble', priceSingle: 300, pricePack: 1500 };
    const result = await controller.create(dto as any);
    expect(result.name).toBe('Trail X');
  });
});

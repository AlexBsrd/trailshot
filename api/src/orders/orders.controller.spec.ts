import { Test } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { AdminGuard } from '../auth/auth.guard';

const mockOrder = {
  id: 'order-1',
  email: 'runner@test.com',
  totalCents: 600,
  isPack: false,
  downloadToken: 'tok-123',
  status: 'delivered',
};

const mockOrdersService = {
  create: jest.fn().mockResolvedValue(mockOrder),
  findAll: jest.fn().mockResolvedValue([mockOrder]),
  getDownloadUrls: jest.fn().mockResolvedValue({
    photos: [{ id: '1', url: 'https://s3/presigned' }],
  }),
};

describe('OrdersController', () => {
  let controller: OrdersController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: mockOrdersService },
      ],
    })
      .overrideGuard(AdminGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get(OrdersController);
  });

  it('should create an order', async () => {
    const dto = { eventId: 'e1', email: 'runner@test.com', photoIds: ['p1', 'p2'], isPack: false };
    const result = await controller.create(dto);
    expect(result.downloadToken).toBeDefined();
  });

  it('should return download URLs for valid token', async () => {
    const result = await controller.download('order-1', 'tok-123');
    expect(result.photos).toHaveLength(1);
  });

  it('should list all orders (admin)', async () => {
    const result = await controller.findAll();
    expect(result).toHaveLength(1);
  });
});

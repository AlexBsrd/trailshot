import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Order } from './order.entity';
import { OrderPhoto } from './order-photo.entity';
import { Event } from '../events/event.entity';
import { Photo } from '../photos/photo.entity';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderPhoto) private orderPhotoRepo: Repository<OrderPhoto>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(Photo) private photoRepo: Repository<Photo>,
    private storage: StorageService,
  ) {}

  async create(dto: {
    eventId: string;
    email: string;
    photoIds: string[];
    isPack: boolean;
  }): Promise<Order> {
    const event = await this.eventRepo.findOne({ where: { id: dto.eventId } });
    if (!event) throw new NotFoundException('Event not found');

    let totalCents: number;
    if (event.isFree) {
      totalCents = 0;
    } else if (dto.isPack) {
      totalCents = event.pricePack;
    } else {
      totalCents = dto.photoIds.length * event.priceSingle;
    }

    const status = event.isFree ? 'delivered' : 'pending';

    const downloadToken = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const order = this.orderRepo.create({
      eventId: dto.eventId,
      email: dto.email,
      status,
      totalCents,
      isPack: dto.isPack,
      downloadToken,
      downloadExpiresAt: expiresAt,
    });
    const savedOrder = await this.orderRepo.save(order);

    const orderPhotos = dto.photoIds.map((photoId) =>
      this.orderPhotoRepo.create({ orderId: savedOrder.id, photoId }),
    );
    await this.orderPhotoRepo.save(orderPhotos);

    return savedOrder;
  }

  async getDownloadUrls(
    orderId: string,
    token: string,
  ): Promise<{ photos: { id: string; url: string; filename: string }[] }> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['orderPhotos'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.downloadToken !== token) throw new ForbiddenException('Invalid token');
    if (order.status !== 'delivered' && order.status !== 'paid') {
      throw new ForbiddenException('Order not yet paid');
    }
    if (new Date() > order.downloadExpiresAt) {
      throw new ForbiddenException('Download link expired');
    }

    const photos = await Promise.all(
      order.orderPhotos.map(async (op) => {
        const photo = await this.photoRepo.findOneOrFail({ where: { id: op.photoId } });
        const url = await this.storage.getPresignedUrl(photo.originalKey, 300);
        return { id: photo.id, url, filename: `trailshot-${photo.id}.jpg` };
      }),
    );

    return { photos };
  }

  async streamZip(orderId: string, token: string, res: any): Promise<void> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['orderPhotos'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.downloadToken !== token) throw new ForbiddenException('Invalid token');
    if (order.status !== 'delivered' && order.status !== 'paid') {
      throw new ForbiddenException('Order not yet paid');
    }
    if (new Date() > order.downloadExpiresAt) {
      throw new ForbiddenException('Download link expired');
    }

    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 5 } });

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="trailshot-${orderId}.zip"`,
    });
    archive.pipe(res);

    for (const op of order.orderPhotos) {
      const photo = await this.photoRepo.findOneOrFail({ where: { id: op.photoId } });
      const url = await this.storage.getPresignedUrl(photo.originalKey, 300);
      const response = await fetch(url);
      archive.append(Buffer.from(await response.arrayBuffer()), {
        name: `trailshot-${photo.id}.jpg`,
      });
    }

    await archive.finalize();
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepo.find({
      order: { createdAt: 'DESC' },
      relations: ['event'],
    });
  }

  async findByEvent(eventId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { eventId },
      order: { createdAt: 'DESC' },
    });
  }
}

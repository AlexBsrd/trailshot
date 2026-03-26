import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import PDFDocument = require('pdfkit');
import { Order } from './order.entity';
import { OrderPhoto } from './order-photo.entity';
import { Event } from '../events/event.entity';
import { Photo } from '../photos/photo.entity';
import { StorageService } from '../storage/storage.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderPhoto) private orderPhotoRepo: Repository<OrderPhoto>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(Photo) private photoRepo: Repository<Photo>,
    private storage: StorageService,
    private mail: MailService,
    private config: ConfigService,
  ) {}

  formatOrderNumber(num: number): string {
    return `TS-${String(num).padStart(5, '0')}`;
  }

  private buildDownloadUrl(order: Order, photoCount: number): string {
    const baseUrl = this.config.get<string>('s3.endpoint', 'http://localhost:3000').replace(':9000', ':3000');
    const apiBase = process.env.API_URL || 'http://localhost:3000/api';
    if (photoCount > 1) {
      return `${apiBase}/orders/${order.id}/download-zip?token=${order.downloadToken}`;
    }
    return `${apiBase}/orders/${order.id}/download?token=${order.downloadToken}`;
  }

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

    // Reload to get the generated orderNumber from the sequence
    return this.orderRepo.findOneOrFail({ where: { id: savedOrder.id } });
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

  async getReceipt(orderId: string, token: string): Promise<Buffer> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['event', 'orderPhotos'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.downloadToken !== token) throw new ForbiddenException('Invalid token');

    const photos = await Promise.all(
      order.orderPhotos.map(async (op) => {
        const photo = await this.photoRepo.findOne({ where: { id: op.photoId } });
        return photo ? `trailshot-${photo.id}.jpg` : null;
      }),
    );
    const photoNames = photos.filter(Boolean) as string[];

    const orderNum = this.formatOrderNumber(order.orderNumber);
    const date = new Date(order.createdAt).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
    const total = order.totalCents === 0
      ? 'Gratuit'
      : `${(order.totalCents / 100).toFixed(2)} \u20AC`;
    const photoCount = order.orderPhotos.length;
    const type = order.isPack
      ? `Pack (${photoCount} photos)`
      : `${photoCount} photo${photoCount > 1 ? 's' : ''}`;
    const eventName = order.event?.name ?? '-';

    return new Promise<Buffer>((resolve, reject) => {
      const fontRegular = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
      const fontBold = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
      const doc = new PDFDocument({ size: 'A4', margin: 50, ligatures: false } as any);
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.registerFont('regular', fontRegular);
      doc.registerFont('bold', fontBold);

      const forest = '#1b3a2d';
      const muted = '#8c8272';
      const lineColor = '#e8e4dc';
      const pageW = doc.page.width - 100;

      // Header
      doc.font('bold').fontSize(24).fillColor(forest).text('Trailshot', 50, 50);
      doc.font('regular').fontSize(10).fillColor(muted).text('Photos de course', 50, 78);

      doc.font('regular').fontSize(9).fillColor(muted).text('RE\u00C7U', 50 + pageW - 120, 50, { width: 120, align: 'right' });
      doc.font('bold').fontSize(16).fillColor(forest).text(orderNum, 50 + pageW - 120, 64, { width: 120, align: 'right' });

      // Header line
      doc.moveTo(50, 100).lineTo(50 + pageW, 100).strokeColor(forest).lineWidth(1.5).stroke();

      // Order details section
      let y = 120;
      doc.font('regular').fontSize(8).fillColor(muted).text('D\u00C9TAILS DE LA COMMANDE', 50, y);
      y += 20;

      const drawRow = (label: string, value: string) => {
        doc.font('regular').fontSize(10).fillColor(muted).text(label, 50, y);
        doc.font('regular').fontSize(10).fillColor(forest).text(value, 200, y);
        y += 20;
        doc.moveTo(50, y - 4).lineTo(50 + pageW, y - 4).strokeColor(lineColor).lineWidth(0.5).stroke();
      };

      drawRow('Date', date);
      drawRow('Email', order.email);
      drawRow('Course', eventName);
      drawRow('Contenu', type);

      // Photos section
      y += 16;
      doc.font('regular').fontSize(8).fillColor(muted).text('PHOTOS', 50, y);
      y += 20;

      for (const name of photoNames) {
        doc.font('regular').fontSize(9).fillColor(forest).text(name, 50, y);
        y += 16;
      }

      // Total section
      y += 12;
      doc.moveTo(50, y).lineTo(50 + pageW, y).strokeColor(forest).lineWidth(1.5).stroke();
      y += 12;
      doc.font('regular').fontSize(10).fillColor(muted).text('Total', 50, y);
      doc.font('bold').fontSize(14).fillColor(forest).text(total, 200, y - 2);

      // Footer
      y += 40;
      doc.moveTo(50, y).lineTo(50 + pageW, y).strokeColor(lineColor).lineWidth(0.5).stroke();
      doc.font('regular').fontSize(9).fillColor(muted).text(
        'Trailshot \u2014 trailshot.fr\nCe document tient lieu de re\u00E7u pour votre commande.',
        50, y + 10, { width: pageW, align: 'center' },
      );

      doc.end();
    });
  }

  async resendDownloadEmail(orderId: string): Promise<void> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['event', 'orderPhotos'],
    });
    if (!order) throw new NotFoundException('Order not found');

    const orderNum = this.formatOrderNumber(order.orderNumber);
    const downloadUrl = this.buildDownloadUrl(order, order.orderPhotos.length);
    const eventName = order.event?.name ?? 'Course';

    await this.mail.sendDownloadLink(order.email, orderNum, downloadUrl, eventName);
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

  async findOneAdmin(id: string) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['event', 'orderPhotos'],
    });
    if (!order) throw new NotFoundException('Order not found');

    const photos = await Promise.all(
      order.orderPhotos.map(async (op) => {
        const photo = await this.photoRepo.findOne({
          where: { id: op.photoId },
          relations: ['bibs'],
        });
        return photo
          ? {
              id: photo.id,
              thumbnailKey: photo.thumbnailKey,
              bibs: photo.bibs?.map((b) => b.bibNumber) ?? [],
            }
          : null;
      }),
    );

    return {
      id: order.id,
      orderNumber: this.formatOrderNumber(order.orderNumber),
      email: order.email,
      status: order.status,
      totalCents: order.totalCents,
      isPack: order.isPack,
      createdAt: order.createdAt,
      downloadExpiresAt: order.downloadExpiresAt,
      event: order.event
        ? { id: order.event.id, name: order.event.name, slug: order.event.slug }
        : null,
      photos: photos.filter(Boolean),
    };
  }
}

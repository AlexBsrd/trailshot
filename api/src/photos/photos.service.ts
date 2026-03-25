import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Photo } from './photo.entity';
import { PhotoBib } from './photo-bib.entity';
import { Event } from '../events/event.entity';
import { StorageService } from '../storage/storage.service';
import { ImageProcessingService } from '../image-processing/image-processing.service';
import { randomUUID } from 'crypto';

@Injectable()
export class PhotosService {
  constructor(
    @InjectRepository(Photo) private photoRepo: Repository<Photo>,
    @InjectRepository(PhotoBib) private bibRepo: Repository<PhotoBib>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    private storage: StorageService,
    private imageProcessing: ImageProcessingService,
  ) {}

  async findByEvent(slug: string): Promise<Photo[]> {
    const event = await this.eventRepo.findOne({ where: { slug, isPublished: true } });
    if (!event) throw new NotFoundException('Event not found');
    return this.photoRepo.find({
      where: { eventId: event.id },
      order: { sortOrder: 'ASC' },
    });
  }

  async findByBib(slug: string, bibNumber: string): Promise<Photo[]> {
    const event = await this.eventRepo.findOne({ where: { slug, isPublished: true } });
    if (!event) throw new NotFoundException('Event not found');

    const bibs = await this.bibRepo.find({
      where: { eventId: event.id, bibNumber },
      relations: ['photo'],
    });
    return bibs.map((b) => b.photo);
  }

  async findByEventForAdmin(eventId: string): Promise<Photo[]> {
    return this.photoRepo.find({
      where: { eventId },
      relations: ['bibs'],
      order: { sortOrder: 'ASC' },
    });
  }

  async findById(id: string): Promise<Photo> {
    const photo = await this.photoRepo.findOne({ where: { id }, relations: ['bibs'] });
    if (!photo) throw new NotFoundException('Photo not found');
    return photo;
  }

  async uploadBatch(eventId: string, files: Express.Multer.File[]): Promise<Photo[]> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const existingCount = await this.photoRepo.count({ where: { eventId } });
    const photos: Photo[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const photoId = randomUUID();
      const ext = 'jpg';

      const originalKey = this.storage.generateKey('originals', eventId, photoId, ext);
      const thumbnailKey = this.storage.generateKey('thumbnails', eventId, photoId, ext);
      const previewKey = this.storage.generateKey('previews', eventId, photoId, ext);

      const meta = await this.imageProcessing.getMetadata(file.buffer);
      const thumbnail = await this.imageProcessing.generateThumbnail(file.buffer);
      const preview = await this.imageProcessing.generatePreview(file.buffer, !event.isFree);

      await Promise.all([
        this.storage.upload(originalKey, file.buffer, 'image/jpeg'),
        this.storage.upload(thumbnailKey, thumbnail, 'image/jpeg'),
        this.storage.upload(previewKey, preview, 'image/jpeg'),
      ]);

      const photo = this.photoRepo.create({
        id: photoId,
        eventId,
        originalKey,
        previewKey,
        thumbnailKey,
        width: meta.width,
        height: meta.height,
        sortOrder: existingCount + i,
      });
      photos.push(await this.photoRepo.save(photo));
    }

    return photos;
  }

  async updateBibs(photoId: string, bibs: string[]): Promise<Photo> {
    const photo = await this.findById(photoId);

    await this.bibRepo.delete({ photoId });

    const bibEntities = bibs.map((bib) =>
      this.bibRepo.create({
        photoId,
        bibNumber: bib.trim(),
        eventId: photo.eventId,
      }),
    );
    await this.bibRepo.save(bibEntities);

    return this.findById(photoId);
  }

  async getPreviewUrl(id: string): Promise<string> {
    const photo = await this.findById(id);
    return this.storage.getPublicUrl(photo.previewKey);
  }

  async getThumbnailUrl(id: string): Promise<string> {
    const photo = await this.findById(id);
    return this.storage.getPublicUrl(photo.thumbnailKey);
  }
}

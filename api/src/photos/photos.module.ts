import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Photo } from './photo.entity';
import { PhotoBib } from './photo-bib.entity';
import { Event } from '../events/event.entity';
import { PhotosService } from './photos.service';
import { PhotosController } from './photos.controller';
import { StorageModule } from '../storage/storage.module';
import { ImageProcessingModule } from '../image-processing/image-processing.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Photo, PhotoBib, Event]),
    StorageModule,
    ImageProcessingModule,
    AuthModule,
  ],
  controllers: [PhotosController],
  providers: [PhotosService],
  exports: [PhotosService],
})
export class PhotosModule {}

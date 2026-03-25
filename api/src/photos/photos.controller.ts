import {
  Controller, Get, Post, Patch, Param, Query, Body,
  UseGuards, UseInterceptors, UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PhotosService } from './photos.service';
import { UpdateBibsDto } from './dto/update-bibs.dto';
import { AdminGuard } from '../auth/auth.guard';

@Controller('api')
export class PhotosController {
  constructor(private photosService: PhotosService) {}

  // Public
  @Get('events/:slug/photos')
  findByEvent(@Param('slug') slug: string) {
    return this.photosService.findByEvent(slug);
  }

  @Get('events/:slug/photos/bib')
  findByBib(@Param('slug') slug: string, @Query('number') bibNumber: string) {
    return this.photosService.findByBib(slug, bibNumber);
  }

  @Get('photos/:id')
  findOne(@Param('id') id: string) {
    return this.photosService.findById(id);
  }

  // Admin
  @UseGuards(AdminGuard)
  @Get('admin/events/:eventId/photos')
  findByEventForAdmin(@Param('eventId') eventId: string) {
    return this.photosService.findByEventForAdmin(eventId);
  }

  @UseGuards(AdminGuard)
  @Post('admin/events/:eventId/photos/upload')
  @UseInterceptors(FilesInterceptor('photos', 50, { limits: { fileSize: 30_000_000 } }))
  upload(
    @Param('eventId') eventId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.photosService.uploadBatch(eventId, files);
  }

  @UseGuards(AdminGuard)
  @Patch('admin/photos/:id/bibs')
  updateBibs(@Param('id') id: string, @Body() dto: UpdateBibsDto) {
    return this.photosService.updateBibs(id, dto.bibs);
  }
}

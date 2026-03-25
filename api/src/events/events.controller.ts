import {
  Controller, Get, Post, Put, Delete, Param, Body, UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { AdminGuard } from '../auth/auth.guard';

@Controller('api')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  // Public
  @Get('events')
  findPublished() {
    return this.eventsService.findPublished();
  }

  @Get('events/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.eventsService.findBySlug(slug);
  }

  // Admin
  @UseGuards(AdminGuard)
  @Get('admin/events')
  findAll() {
    return this.eventsService.findAll();
  }

  @UseGuards(AdminGuard)
  @Post('admin/events')
  create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  @UseGuards(AdminGuard)
  @Put('admin/events/:id')
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  @UseGuards(AdminGuard)
  @Delete('admin/events/:id')
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }
}

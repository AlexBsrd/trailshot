import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private repo: Repository<Event>,
  ) {}

  async findAll(): Promise<Event[]> {
    return this.repo.find({ order: { date: 'DESC' } });
  }

  async findPublished(): Promise<Event[]> {
    return this.repo.find({
      where: { isPublished: true },
      order: { date: 'DESC' },
    });
  }

  async findBySlug(slug: string): Promise<Event> {
    const event = await this.repo.findOne({ where: { slug } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async findById(id: string): Promise<Event> {
    const event = await this.repo.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async create(dto: CreateEventDto): Promise<Event> {
    const slug = this.generateSlug(dto.name);
    const event = this.repo.create({ ...dto, slug });
    return this.repo.save(event);
  }

  async update(id: string, dto: UpdateEventDto): Promise<Event> {
    const event = await this.findById(id);
    // Only apply defined fields to avoid overwriting with undefined
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        (event as any)[key] = value;
      }
    }
    if (dto.name) {
      event.slug = this.generateSlug(dto.name);
    }
    return this.repo.save(event);
  }

  async remove(id: string): Promise<void> {
    const event = await this.findById(id);
    await this.repo.remove(event);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

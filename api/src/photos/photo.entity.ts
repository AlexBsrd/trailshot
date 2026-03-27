import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Event } from '../events/event.entity';
import { PhotoBib } from './photo-bib.entity';

@Entity('photos')
export class Photo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => Event, (event) => event.photos)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ name: 'original_key' })
  originalKey: string;

  @Column({ name: 'preview_key' })
  previewKey: string;

  @Column({ name: 'thumbnail_key' })
  thumbnailKey: string;

  @Column({ type: 'integer' })
  width: number;

  @Column({ type: 'integer' })
  height: number;

  @Column({ name: 'original_filename', nullable: true })
  originalFilename: string;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;

  @OneToMany(() => PhotoBib, (bib) => bib.photo)
  bibs: PhotoBib[];
}

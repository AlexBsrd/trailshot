import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, Index } from 'typeorm';
import { Photo } from './photo.entity';

@Entity('photo_bibs')
@Index('IDX_photo_bibs_event_bib', ['eventId', 'bibNumber'])
export class PhotoBib {
  @PrimaryColumn({ name: 'photo_id' })
  photoId: string;

  @PrimaryColumn({ name: 'bib_number' })
  bibNumber: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => Photo, (photo) => photo.bibs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'photo_id' })
  photo: Photo;
}

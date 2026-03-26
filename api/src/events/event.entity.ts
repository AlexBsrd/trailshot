import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Photo } from '../photos/photo.entity';
import { Order } from '../orders/order.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'date' })
  date: string;

  @Column()
  location: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'cover_photo_id', nullable: true })
  coverPhotoId: string;

  @Column({ name: 'price_single', type: 'integer', default: 0 })
  priceSingle: number;

  @Column({ name: 'price_pack', type: 'integer', default: 0 })
  pricePack: number;

  @Column({ name: 'is_free', default: false })
  isFree: boolean;

  @Column({ name: 'is_published', default: false })
  isPublished: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Photo, (photo) => photo.event)
  photos: Photo[];

  @OneToMany(() => Order, (order) => order.event)
  orders: Order[];
}

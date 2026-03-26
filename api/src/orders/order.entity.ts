import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Generated,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Event } from '../events/event.entity';
import { OrderPhoto } from './order-photo.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_number', type: 'integer', unique: true })
  @Generated('increment')
  orderNumber: number;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => Event, (event) => event.orders)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column()
  email: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ name: 'total_cents', type: 'integer' })
  totalCents: number;

  @Column({ name: 'is_pack', default: false })
  isPack: boolean;

  @Column({ name: 'download_token', unique: true })
  downloadToken: string;

  @Column({ name: 'download_expires_at', type: 'timestamptz' })
  downloadExpiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => OrderPhoto, (op) => op.order)
  orderPhotos: OrderPhoto[];
}

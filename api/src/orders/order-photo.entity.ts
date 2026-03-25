import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Order } from './order.entity';
import { Photo } from '../photos/photo.entity';

@Entity('order_photos')
export class OrderPhoto {
  @PrimaryColumn({ name: 'order_id' })
  orderId: string;

  @PrimaryColumn({ name: 'photo_id' })
  photoId: string;

  @ManyToOne(() => Order, (order) => order.orderPhotos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Photo)
  @JoinColumn({ name: 'photo_id' })
  photo: Photo;
}

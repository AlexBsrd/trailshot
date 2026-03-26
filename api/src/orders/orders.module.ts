import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { OrderPhoto } from './order-photo.entity';
import { Event } from '../events/event.entity';
import { Photo } from '../photos/photo.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { StorageModule } from '../storage/storage.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderPhoto, Event, Photo]),
    StorageModule,
    AuthModule,
    MailModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}

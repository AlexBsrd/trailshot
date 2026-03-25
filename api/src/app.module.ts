import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { Event } from './events/event.entity';
import { Photo } from './photos/photo.entity';
import { PhotoBib } from './photos/photo-bib.entity';
import { Order } from './orders/order.entity';
import { OrderPhoto } from './orders/order-photo.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host'),
        port: config.get('database.port'),
        username: config.get('database.username'),
        password: config.get('database.password'),
        database: config.get('database.database'),
        entities: [Event, Photo, PhotoBib, Order, OrderPhoto],
        synchronize: true, // Dev only — use migrations in prod
      }),
    }),
  ],
})
export class AppModule {}

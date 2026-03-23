# TrailShot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a trail running photography platform where runners find and download their race photos by bib number.

**Architecture:** NestJS REST API with modular architecture (auth, events, photos, bibs, orders, storage, image-processing). Angular 17+ frontend with SSR on public pages and CSR on admin. PostgreSQL for data, S3-compatible storage (MinIO for dev) for photos.

**Tech Stack:** Angular 17+, NestJS 10+, TypeORM, PostgreSQL 16, Sharp, @aws-sdk/client-s3, MinIO (dev), Docker Compose

**Spec:** `docs/superpowers/specs/2026-03-23-trailshot-design.md`

---

## File Structure

```
trailshot/
├── docker-compose.yml              # PostgreSQL + MinIO for dev
├── api/                             # NestJS backend
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── config/
│   │   │   └── configuration.ts     # Typed config (DB, S3, JWT, app)
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.guard.ts
│   │   │   ├── dto/
│   │   │   │   └── login.dto.ts
│   │   │   └── auth.controller.spec.ts
│   │   ├── storage/
│   │   │   ├── storage.module.ts
│   │   │   ├── storage.service.ts
│   │   │   └── storage.service.spec.ts
│   │   ├── image-processing/
│   │   │   ├── image-processing.module.ts
│   │   │   ├── image-processing.service.ts
│   │   │   └── image-processing.service.spec.ts
│   │   ├── events/
│   │   │   ├── events.module.ts
│   │   │   ├── events.controller.ts
│   │   │   ├── events.service.ts
│   │   │   ├── event.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-event.dto.ts
│   │   │   │   └── update-event.dto.ts
│   │   │   └── events.controller.spec.ts
│   │   ├── photos/
│   │   │   ├── photos.module.ts
│   │   │   ├── photos.controller.ts
│   │   │   ├── photos.service.ts
│   │   │   ├── photo.entity.ts
│   │   │   ├── photo-bib.entity.ts
│   │   │   ├── dto/
│   │   │   │   └── update-bibs.dto.ts
│   │   │   └── photos.controller.spec.ts
│   │   ├── orders/
│   │   │   ├── orders.module.ts
│   │   │   ├── orders.controller.ts
│   │   │   ├── orders.service.ts
│   │   │   ├── order.entity.ts
│   │   │   ├── order-photo.entity.ts
│   │   │   ├── dto/
│   │   │   │   └── create-order.dto.ts
│   │   │   └── orders.controller.spec.ts
│   │   └── common/
│   │       └── pipes/
│   │           └── parse-uuid.pipe.ts
│   ├── test/
│   │   └── app.e2e-spec.ts
│   ├── assets/
│   │   └── watermark.png            # Watermark tile (generated once)
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── package.json
├── web/                              # Angular frontend
│   ├── src/
│   │   ├── main.ts
│   │   ├── main.server.ts
│   │   ├── app/
│   │   │   ├── app.component.ts
│   │   │   ├── app.config.ts
│   │   │   ├── app.config.server.ts
│   │   │   ├── app.routes.ts
│   │   │   ├── core/
│   │   │   │   ├── services/
│   │   │   │   │   ├── api.service.ts
│   │   │   │   │   └── cart.service.ts
│   │   │   │   ├── interceptors/
│   │   │   │   │   └── auth.interceptor.ts
│   │   │   │   └── guards/
│   │   │   │       └── admin.guard.ts
│   │   │   ├── layout/
│   │   │   │   ├── navbar/
│   │   │   │   │   └── navbar.component.ts
│   │   │   │   └── footer/
│   │   │   │       └── footer.component.ts
│   │   │   ├── public/
│   │   │   │   ├── home/
│   │   │   │   │   └── home.component.ts
│   │   │   │   ├── events/
│   │   │   │   │   └── events.component.ts
│   │   │   │   ├── event-detail/
│   │   │   │   │   └── event-detail.component.ts
│   │   │   │   ├── photo-detail/
│   │   │   │   │   └── photo-detail.component.ts
│   │   │   │   ├── order/
│   │   │   │   │   └── order.component.ts
│   │   │   │   └── about/
│   │   │   │       └── about.component.ts
│   │   │   └── admin/
│   │   │       ├── login/
│   │   │       │   └── login.component.ts
│   │   │       ├── events/
│   │   │       │   ├── event-list/
│   │   │       │   │   └── event-list.component.ts
│   │   │       │   └── event-form/
│   │   │       │       └── event-form.component.ts
│   │   │       ├── photos/
│   │   │       │   ├── photo-upload/
│   │   │       │   │   └── photo-upload.component.ts
│   │   │       │   └── speed-tagger/
│   │   │       │       └── speed-tagger.component.ts
│   │   │       └── orders/
│   │   │           └── order-list/
│   │   │               └── order-list.component.ts
│   │   ├── environments/
│   │   │   ├── environment.ts
│   │   │   └── environment.development.ts
│   │   └── styles.scss
│   ├── angular.json
│   ├── tsconfig.json
│   └── package.json
└── docs/
```

---

## Task 1: Project Scaffolding & Dev Environment

**Files:**
- Create: `docker-compose.yml`
- Create: `api/` (NestJS scaffold)
- Create: `web/` (Angular scaffold)
- Create: `.gitignore`

- [ ] **Step 1: Create docker-compose.yml for PostgreSQL + MinIO**

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: trailshot
      POSTGRES_USER: trailshot
      POSTGRES_PASSWORD: trailshot_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - miniodata:/data

volumes:
  pgdata:
  miniodata:
```

- [ ] **Step 2: Start dev services**

Run: `docker compose up -d`
Expected: Both containers running. Verify with `docker compose ps`.

- [ ] **Step 3: Create MinIO bucket**

Run: `docker compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin && docker compose exec minio mc mb local/trailshot`
If `mc` is not available inside container, use the MinIO console at http://localhost:9001 to create a bucket named `trailshot`.

- [ ] **Step 4: Scaffold NestJS backend**

Run:
```bash
cd /home/alex/dev/trailshot
npx @nestjs/cli new api --package-manager npm --skip-git
```

- [ ] **Step 5: Install backend dependencies**

Run:
```bash
cd /home/alex/dev/trailshot/api
npm install @nestjs/typeorm typeorm pg @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt @aws-sdk/client-s3 @aws-sdk/s3-request-presigner sharp multer @nestjs/platform-express class-validator class-transformer archiver uuid
npm install -D @types/multer @types/sharp @types/archiver @types/uuid @types/passport-jwt
```

- [ ] **Step 6: Scaffold Angular frontend with SSR**

Run:
```bash
cd /home/alex/dev/trailshot
npx @angular/cli new web --style=scss --ssr --skip-git --routing
```

- [ ] **Step 7: Create .gitignore**

```gitignore
# .gitignore
node_modules/
dist/
.angular/
.env
*.local
.superpowers/
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold NestJS API + Angular SSR frontend + Docker dev env"
```

---

## Task 2: Backend Configuration & Database Entities

**Files:**
- Create: `api/src/config/configuration.ts`
- Create: `api/src/events/event.entity.ts`
- Create: `api/src/photos/photo.entity.ts`
- Create: `api/src/photos/photo-bib.entity.ts`
- Create: `api/src/orders/order.entity.ts`
- Create: `api/src/orders/order-photo.entity.ts`
- Modify: `api/src/app.module.ts`

- [ ] **Step 1: Create typed configuration**

```typescript
// api/src/config/configuration.ts
export default () => ({
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'trailshot',
    password: process.env.DB_PASSWORD || 'trailshot_dev',
    database: process.env.DB_DATABASE || 'trailshot',
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    region: process.env.S3_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET || 'trailshot',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin',
  },
});
```

- [ ] **Step 2: Create Event entity**

```typescript
// api/src/events/event.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  OneToMany, JoinColumn, OneToOne,
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
```

- [ ] **Step 3: Create Photo and PhotoBib entities**

```typescript
// api/src/photos/photo.entity.ts
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

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;

  @OneToMany(() => PhotoBib, (bib) => bib.photo)
  bibs: PhotoBib[];
}
```

```typescript
// api/src/photos/photo-bib.entity.ts
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
```

- [ ] **Step 4: Create Order and OrderPhoto entities**

```typescript
// api/src/orders/order.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Event } from '../events/event.entity';
import { OrderPhoto } from './order-photo.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
```

```typescript
// api/src/orders/order-photo.entity.ts
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
```

- [ ] **Step 5: Wire up AppModule with TypeORM + ConfigModule**

```typescript
// api/src/app.module.ts
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
```

- [ ] **Step 6: Verify the API starts and creates tables**

Run: `cd /home/alex/dev/trailshot/api && npm run start:dev`
Expected: App starts, logs "Nest application successfully started". Check PostgreSQL with `docker compose exec postgres psql -U trailshot -c "\dt"` — should show 5 tables.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add database entities and configuration (Event, Photo, PhotoBib, Order, OrderPhoto)"
```

---

## Task 3: Storage Module (S3 Abstraction)

**Files:**
- Create: `api/src/storage/storage.module.ts`
- Create: `api/src/storage/storage.service.ts`
- Create: `api/src/storage/storage.service.spec.ts`

- [ ] **Step 1: Write failing test for StorageService**

```typescript
// api/src/storage/storage.service.spec.ts
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              const config = {
                's3.endpoint': 'http://localhost:9000',
                's3.region': 'us-east-1',
                's3.bucket': 'test-bucket',
                's3.accessKeyId': 'test-key',
                's3.secretAccessKey': 'test-secret',
              };
              return config[key];
            },
          },
        },
      ],
    }).compile();

    service = module.get(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate an upload key with correct prefix', () => {
    const key = service.generateKey('originals', 'event-123', 'photo-456', 'jpg');
    expect(key).toBe('originals/event-123/photo-456.jpg');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/alex/dev/trailshot/api && npx jest src/storage/storage.service.spec.ts --no-cache`
Expected: FAIL — cannot find module `./storage.service`

- [ ] **Step 3: Implement StorageService**

```typescript
// api/src/storage/storage.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private config: ConfigService) {
    this.bucket = this.config.get('s3.bucket');
    this.client = new S3Client({
      endpoint: this.config.get('s3.endpoint'),
      region: this.config.get('s3.region'),
      credentials: {
        accessKeyId: this.config.get('s3.accessKeyId'),
        secretAccessKey: this.config.get('s3.secretAccessKey'),
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  generateKey(prefix: string, eventId: string, photoId: string, ext: string): string {
    return `${prefix}/${eventId}/${photoId}.${ext}`;
  }

  async upload(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async getPresignedUrl(key: string, expiresIn = 300): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn },
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  getPublicUrl(key: string): string {
    return `${this.config.get('s3.endpoint')}/${this.bucket}/${key}`;
  }
}
```

```typescript
// api/src/storage/storage.module.ts
import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';

@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/alex/dev/trailshot/api && npx jest src/storage/storage.service.spec.ts --no-cache`
Expected: 2 tests PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add S3-compatible storage module with upload, presigned URLs, and delete"
```

---

## Task 4: Image Processing Module

**Files:**
- Create: `api/src/image-processing/image-processing.module.ts`
- Create: `api/src/image-processing/image-processing.service.ts`
- Create: `api/src/image-processing/image-processing.service.spec.ts`
- Create: `api/assets/watermark.png` (generated in test setup)

- [ ] **Step 1: Write failing test for ImageProcessingService**

```typescript
// api/src/image-processing/image-processing.service.spec.ts
import { Test } from '@nestjs/testing';
import { ImageProcessingService } from './image-processing.service';
import * as sharp from 'sharp';

describe('ImageProcessingService', () => {
  let service: ImageProcessingService;

  // Create a test image (100x100 red square)
  const createTestImage = () =>
    sharp({ create: { width: 2000, height: 1500, channels: 3, background: '#ff0000' } })
      .jpeg()
      .toBuffer();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ImageProcessingService],
    }).compile();

    service = module.get(ImageProcessingService);
  });

  it('should generate a thumbnail with max width 400px', async () => {
    const input = await createTestImage();
    const result = await service.generateThumbnail(input);
    const metadata = await sharp(result).metadata();
    expect(metadata.width).toBe(400);
    expect(metadata.height).toBe(300); // maintains aspect ratio
  });

  it('should generate a preview with max width 1200px', async () => {
    const input = await createTestImage();
    const result = await service.generatePreview(input, false);
    const metadata = await sharp(result).metadata();
    expect(metadata.width).toBe(1200);
  });

  it('should generate a watermarked preview when watermark=true', async () => {
    const input = await createTestImage();
    const result = await service.generatePreview(input, true);
    const metadata = await sharp(result).metadata();
    expect(metadata.width).toBe(1200);
    // Watermarked image should be different from non-watermarked
    const noWatermark = await service.generatePreview(input, false);
    expect(result.equals(noWatermark)).toBe(false);
  });

  it('should return original image metadata', async () => {
    const input = await createTestImage();
    const meta = await service.getMetadata(input);
    expect(meta.width).toBe(2000);
    expect(meta.height).toBe(1500);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/alex/dev/trailshot/api && npx jest src/image-processing/image-processing.service.spec.ts --no-cache`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement ImageProcessingService**

```typescript
// api/src/image-processing/image-processing.service.ts
import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';

@Injectable()
export class ImageProcessingService {
  private readonly THUMBNAIL_WIDTH = 400;
  private readonly PREVIEW_WIDTH = 1200;
  private readonly THUMBNAIL_QUALITY = 80;
  private readonly PREVIEW_QUALITY = 85;
  private readonly WATERMARK_TEXT = 'TRAILSHOT';
  private readonly WATERMARK_OPACITY = 0.18;

  async generateThumbnail(input: Buffer): Promise<Buffer> {
    return sharp(input)
      .resize(this.THUMBNAIL_WIDTH, null, { withoutEnlargement: true })
      .jpeg({ quality: this.THUMBNAIL_QUALITY })
      .toBuffer();
  }

  async generatePreview(input: Buffer, watermark: boolean): Promise<Buffer> {
    let pipeline = sharp(input)
      .resize(this.PREVIEW_WIDTH, null, { withoutEnlargement: true });

    if (watermark) {
      const resizedMeta = await sharp(input)
        .resize(this.PREVIEW_WIDTH, null, { withoutEnlargement: true })
        .metadata();

      const width = resizedMeta.width;
      const height = resizedMeta.height;
      const watermarkSvg = this.createTiledWatermarkSvg(width, height);

      pipeline = pipeline.composite([
        { input: Buffer.from(watermarkSvg), top: 0, left: 0 },
      ]);
    }

    return pipeline.jpeg({ quality: this.PREVIEW_QUALITY }).toBuffer();
  }

  async getMetadata(input: Buffer): Promise<{ width: number; height: number }> {
    const meta = await sharp(input).metadata();
    return { width: meta.width, height: meta.height };
  }

  private createTiledWatermarkSvg(width: number, height: number): string {
    // Generate "TRAILSHOT" text repeated across the entire surface, rotated -25°
    const fontSize = Math.max(20, Math.floor(width / 20));
    const stepX = fontSize * 7;
    const stepY = fontSize * 3;
    const opacity = this.WATERMARK_OPACITY;

    // Expand bounds to cover corners after rotation
    const diagonal = Math.sqrt(width * width + height * height);
    const offsetX = (diagonal - width) / 2;
    const offsetY = (diagonal - height) / 2;

    let texts = '';
    for (let y = -offsetY; y < height + offsetY; y += stepY) {
      for (let x = -offsetX; x < width + offsetX; x += stepX) {
        texts += `<text x="${x}" y="${y}" font-size="${fontSize}" fill="white" opacity="${opacity}" font-family="Arial, sans-serif" font-weight="bold">${this.WATERMARK_TEXT}</text>`;
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <g transform="rotate(-25, ${width / 2}, ${height / 2})">
        ${texts}
      </g>
    </svg>`;
  }
}
```

```typescript
// api/src/image-processing/image-processing.module.ts
import { Module } from '@nestjs/common';
import { ImageProcessingService } from './image-processing.service';

@Module({
  providers: [ImageProcessingService],
  exports: [ImageProcessingService],
})
export class ImageProcessingModule {}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /home/alex/dev/trailshot/api && npx jest src/image-processing/image-processing.service.spec.ts --no-cache`
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add image processing module with thumbnail, preview, and tiled watermark generation"
```

---

## Task 5: Auth Module

**Files:**
- Create: `api/src/auth/auth.module.ts`
- Create: `api/src/auth/auth.service.ts`
- Create: `api/src/auth/auth.controller.ts`
- Create: `api/src/auth/auth.guard.ts`
- Create: `api/src/auth/dto/login.dto.ts`
- Create: `api/src/auth/auth.controller.spec.ts`

- [ ] **Step 1: Write failing test**

```typescript
// api/src/auth/auth.controller.spec.ts
import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: { sign: () => 'test-token' },
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              const config = { 'admin.username': 'admin', 'admin.password': 'secret' };
              return config[key];
            },
          },
        },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  it('should return a JWT token on valid credentials', async () => {
    const result = await controller.login({ username: 'admin', password: 'secret' });
    expect(result).toEqual({ access_token: 'test-token' });
  });

  it('should throw UnauthorizedException on invalid credentials', async () => {
    await expect(controller.login({ username: 'admin', password: 'wrong' }))
      .rejects.toThrow(UnauthorizedException);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/alex/dev/trailshot/api && npx jest src/auth/auth.controller.spec.ts --no-cache`
Expected: FAIL

- [ ] **Step 3: Implement Auth module**

```typescript
// api/src/auth/dto/login.dto.ts
import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}
```

```typescript
// api/src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private config: ConfigService,
    private jwt: JwtService,
  ) {}

  async login(username: string, password: string): Promise<{ access_token: string }> {
    const validUser = this.config.get('admin.username');
    const validPass = this.config.get('admin.password');

    if (username !== validUser || password !== validPass) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwt.sign({ sub: 'admin', role: 'admin' });
    return { access_token: token };
  }
}
```

```typescript
// api/src/auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }
}
```

```typescript
// api/src/auth/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    try {
      const token = authHeader.split(' ')[1];
      const payload = this.jwt.verify(token, {
        secret: this.config.get('jwt.secret'),
      });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
```

```typescript
// api/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminGuard } from './auth.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.expiresIn') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AdminGuard],
  exports: [AdminGuard, JwtModule],
})
export class AuthModule {}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /home/alex/dev/trailshot/api && npx jest src/auth/auth.controller.spec.ts --no-cache`
Expected: 2 tests PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add JWT auth module with single admin account and guard"
```

---

## Task 6: Events Module (CRUD + Public API)

**Files:**
- Create: `api/src/events/events.module.ts`
- Create: `api/src/events/events.service.ts`
- Create: `api/src/events/events.controller.ts`
- Create: `api/src/events/dto/create-event.dto.ts`
- Create: `api/src/events/dto/update-event.dto.ts`
- Create: `api/src/events/events.controller.spec.ts`
- Modify: `api/src/app.module.ts`

- [ ] **Step 1: Write failing test for EventsController**

```typescript
// api/src/events/events.controller.spec.ts
import { Test } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { AdminGuard } from '../auth/auth.guard';

const mockEventsService = {
  findPublished: jest.fn().mockResolvedValue([
    { id: '1', name: 'Trail X', slug: 'trail-x', isPublished: true },
  ]),
  findBySlug: jest.fn().mockResolvedValue({
    id: '1', name: 'Trail X', slug: 'trail-x',
  }),
  create: jest.fn().mockResolvedValue({
    id: '1', name: 'Trail X', slug: 'trail-x',
  }),
  findAll: jest.fn().mockResolvedValue([]),
};

describe('EventsController', () => {
  let controller: EventsController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        { provide: EventsService, useValue: mockEventsService },
      ],
    })
      .overrideGuard(AdminGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get(EventsController);
  });

  it('should return published events', async () => {
    const result = await controller.findPublished();
    expect(result).toHaveLength(1);
    expect(mockEventsService.findPublished).toHaveBeenCalled();
  });

  it('should find an event by slug', async () => {
    const result = await controller.findBySlug('trail-x');
    expect(result.slug).toBe('trail-x');
  });

  it('should create an event (admin)', async () => {
    const dto = { name: 'Trail X', date: '2026-03-15', location: 'Grenoble', priceSingle: 300, pricePack: 1500 };
    const result = await controller.create(dto as any);
    expect(result.name).toBe('Trail X');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/alex/dev/trailshot/api && npx jest src/events/events.controller.spec.ts --no-cache`
Expected: FAIL

- [ ] **Step 3: Implement DTOs**

```typescript
// api/src/events/dto/create-event.dto.ts
import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class CreateEventDto {
  @IsString()
  name: string;

  @IsString()
  date: string;

  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(0)
  priceSingle: number;

  @IsInt()
  @Min(0)
  pricePack: number;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;
}
```

```typescript
// api/src/events/dto/update-event.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './create-event.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  coverPhotoId?: string;
}
```

- [ ] **Step 4: Implement EventsService**

```typescript
// api/src/events/events.service.ts
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
    Object.assign(event, dto);
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
```

- [ ] **Step 5: Implement EventsController**

```typescript
// api/src/events/events.controller.ts
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
```

```typescript
// api/src/events/events.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './event.entity';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Event]), AuthModule],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
```

- [ ] **Step 6: Add AuthModule, StorageModule, ImageProcessingModule, and EventsModule to AppModule**

Add all four modules to the imports array in `api/src/app.module.ts`. StorageModule and ImageProcessingModule are needed transitively by later modules, and importing them at root level now ensures the app starts correctly at each stage.

```typescript
// api/src/app.module.ts — imports section
imports: [
  ConfigModule.forRoot({ load: [configuration], isGlobal: true }),
  TypeOrmModule.forRootAsync({ /* ... same as Task 2 */ }),
  AuthModule,
  StorageModule,
  ImageProcessingModule,
  EventsModule,
],
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd /home/alex/dev/trailshot/api && npx jest src/events/events.controller.spec.ts --no-cache`
Expected: 3 tests PASS

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add events module with CRUD, slug generation, and public/admin endpoints"
```

---

## Task 7: Photos Module (Upload + Processing + Bib Tagging)

**Files:**
- Create: `api/src/photos/photos.module.ts`
- Create: `api/src/photos/photos.service.ts`
- Create: `api/src/photos/photos.controller.ts`
- Create: `api/src/photos/dto/update-bibs.dto.ts`
- Create: `api/src/photos/photos.controller.spec.ts`
- Modify: `api/src/app.module.ts`

- [ ] **Step 1: Write failing test**

```typescript
// api/src/photos/photos.controller.spec.ts
import { Test } from '@nestjs/testing';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';
import { AdminGuard } from '../auth/auth.guard';

const mockPhotosService = {
  findByEvent: jest.fn().mockResolvedValue([
    { id: '1', eventId: 'e1', thumbnailKey: 'thumb/1.jpg' },
  ]),
  findByBib: jest.fn().mockResolvedValue([
    { id: '1', eventId: 'e1', thumbnailKey: 'thumb/1.jpg' },
  ]),
  updateBibs: jest.fn().mockResolvedValue({ id: '1', bibs: [{ bibNumber: '123' }] }),
  findByEventForAdmin: jest.fn().mockResolvedValue([]),
};

describe('PhotosController', () => {
  let controller: PhotosController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [PhotosController],
      providers: [
        { provide: PhotosService, useValue: mockPhotosService },
      ],
    })
      .overrideGuard(AdminGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get(PhotosController);
  });

  it('should find photos by event slug', async () => {
    const result = await controller.findByEvent('trail-x');
    expect(result).toHaveLength(1);
  });

  it('should find photos by bib number', async () => {
    const result = await controller.findByBib('trail-x', '123');
    expect(result).toHaveLength(1);
  });

  it('should update bibs for a photo (admin)', async () => {
    const result = await controller.updateBibs('1', { bibs: ['123', '456'] });
    expect(mockPhotosService.updateBibs).toHaveBeenCalledWith('1', ['123', '456']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/alex/dev/trailshot/api && npx jest src/photos/photos.controller.spec.ts --no-cache`
Expected: FAIL

- [ ] **Step 3: Create DTO**

```typescript
// api/src/photos/dto/update-bibs.dto.ts
import { IsArray, IsString } from 'class-validator';

export class UpdateBibsDto {
  @IsArray()
  @IsString({ each: true })
  bibs: string[];
}
```

- [ ] **Step 4: Implement PhotosService**

```typescript
// api/src/photos/photos.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Photo } from './photo.entity';
import { PhotoBib } from './photo-bib.entity';
import { Event } from '../events/event.entity';
import { StorageService } from '../storage/storage.service';
import { ImageProcessingService } from '../image-processing/image-processing.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class PhotosService {
  constructor(
    @InjectRepository(Photo) private photoRepo: Repository<Photo>,
    @InjectRepository(PhotoBib) private bibRepo: Repository<PhotoBib>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    private storage: StorageService,
    private imageProcessing: ImageProcessingService,
  ) {}

  async findByEvent(slug: string): Promise<Photo[]> {
    const event = await this.eventRepo.findOne({ where: { slug, isPublished: true } });
    if (!event) throw new NotFoundException('Event not found');
    return this.photoRepo.find({
      where: { eventId: event.id },
      order: { sortOrder: 'ASC' },
    });
  }

  async findByBib(slug: string, bibNumber: string): Promise<Photo[]> {
    const event = await this.eventRepo.findOne({ where: { slug, isPublished: true } });
    if (!event) throw new NotFoundException('Event not found');

    const bibs = await this.bibRepo.find({
      where: { eventId: event.id, bibNumber },
      relations: ['photo'],
    });
    return bibs.map((b) => b.photo);
  }

  async findByEventForAdmin(eventId: string): Promise<Photo[]> {
    return this.photoRepo.find({
      where: { eventId },
      relations: ['bibs'],
      order: { sortOrder: 'ASC' },
    });
  }

  async findById(id: string): Promise<Photo> {
    const photo = await this.photoRepo.findOne({ where: { id }, relations: ['bibs'] });
    if (!photo) throw new NotFoundException('Photo not found');
    return photo;
  }

  async uploadBatch(eventId: string, files: Express.Multer.File[]): Promise<Photo[]> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const existingCount = await this.photoRepo.count({ where: { eventId } });
    const photos: Photo[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const photoId = uuid();
      const ext = 'jpg';

      const originalKey = this.storage.generateKey('originals', eventId, photoId, ext);
      const thumbnailKey = this.storage.generateKey('thumbnails', eventId, photoId, ext);
      const previewKey = this.storage.generateKey('previews', eventId, photoId, ext);

      // Get metadata
      const meta = await this.imageProcessing.getMetadata(file.buffer);

      // Generate variants
      const thumbnail = await this.imageProcessing.generateThumbnail(file.buffer);
      const preview = await this.imageProcessing.generatePreview(file.buffer, !event.isFree);

      // Upload all variants to S3
      await Promise.all([
        this.storage.upload(originalKey, file.buffer, 'image/jpeg'),
        this.storage.upload(thumbnailKey, thumbnail, 'image/jpeg'),
        this.storage.upload(previewKey, preview, 'image/jpeg'),
      ]);

      // Save to DB
      const photo = this.photoRepo.create({
        id: photoId,
        eventId,
        originalKey,
        previewKey,
        thumbnailKey,
        width: meta.width,
        height: meta.height,
        sortOrder: existingCount + i,
      });
      photos.push(await this.photoRepo.save(photo));
    }

    return photos;
  }

  async updateBibs(photoId: string, bibs: string[]): Promise<Photo> {
    const photo = await this.findById(photoId);

    // Delete existing bibs
    await this.bibRepo.delete({ photoId });

    // Insert new bibs
    const bibEntities = bibs.map((bib) =>
      this.bibRepo.create({
        photoId,
        bibNumber: bib.trim(),
        eventId: photo.eventId,
      }),
    );
    await this.bibRepo.save(bibEntities);

    return this.findById(photoId);
  }

  async getPreviewUrl(id: string): Promise<string> {
    const photo = await this.findById(id);
    return this.storage.getPublicUrl(photo.previewKey);
  }

  async getThumbnailUrl(id: string): Promise<string> {
    const photo = await this.findById(id);
    return this.storage.getPublicUrl(photo.thumbnailKey);
  }
}
```

- [ ] **Step 5: Implement PhotosController**

```typescript
// api/src/photos/photos.controller.ts
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
```

```typescript
// api/src/photos/photos.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Photo } from './photo.entity';
import { PhotoBib } from './photo-bib.entity';
import { Event } from '../events/event.entity';
import { PhotosService } from './photos.service';
import { PhotosController } from './photos.controller';
import { StorageModule } from '../storage/storage.module';
import { ImageProcessingModule } from '../image-processing/image-processing.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Photo, PhotoBib, Event]),
    StorageModule,
    ImageProcessingModule,
    AuthModule,
  ],
  controllers: [PhotosController],
  providers: [PhotosService],
  exports: [PhotosService],
})
export class PhotosModule {}
```

- [ ] **Step 6: Add PhotosModule to AppModule imports**

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd /home/alex/dev/trailshot/api && npx jest src/photos/photos.controller.spec.ts --no-cache`
Expected: 3 tests PASS

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add photos module with batch upload, image processing pipeline, and bib tagging"
```

---

## Task 8: Orders Module (Create + Download)

**Files:**
- Create: `api/src/orders/orders.module.ts`
- Create: `api/src/orders/orders.service.ts`
- Create: `api/src/orders/orders.controller.ts`
- Create: `api/src/orders/dto/create-order.dto.ts`
- Create: `api/src/orders/orders.controller.spec.ts`
- Modify: `api/src/app.module.ts`

- [ ] **Step 1: Write failing test**

```typescript
// api/src/orders/orders.controller.spec.ts
import { Test } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { AdminGuard } from '../auth/auth.guard';

const mockOrder = {
  id: 'order-1',
  email: 'runner@test.com',
  totalCents: 600,
  isPack: false,
  downloadToken: 'tok-123',
  status: 'delivered',
};

const mockOrdersService = {
  create: jest.fn().mockResolvedValue(mockOrder),
  findAll: jest.fn().mockResolvedValue([mockOrder]),
  getDownloadUrls: jest.fn().mockResolvedValue({
    photos: [{ id: '1', url: 'https://s3/presigned' }],
  }),
};

describe('OrdersController', () => {
  let controller: OrdersController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: mockOrdersService },
      ],
    })
      .overrideGuard(AdminGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get(OrdersController);
  });

  it('should create an order', async () => {
    const dto = { eventId: 'e1', email: 'runner@test.com', photoIds: ['p1', 'p2'], isPack: false };
    const result = await controller.create(dto);
    expect(result.downloadToken).toBeDefined();
  });

  it('should return download URLs for valid token', async () => {
    const result = await controller.download('order-1', 'tok-123');
    expect(result.photos).toHaveLength(1);
  });

  it('should list all orders (admin)', async () => {
    const result = await controller.findAll();
    expect(result).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/alex/dev/trailshot/api && npx jest src/orders/orders.controller.spec.ts --no-cache`
Expected: FAIL

- [ ] **Step 3: Create DTO**

```typescript
// api/src/orders/dto/create-order.dto.ts
import { IsString, IsArray, IsBoolean, IsEmail, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  eventId: string;

  @IsEmail()
  email: string;

  @IsArray()
  @IsUUID('4', { each: true })
  photoIds: string[];

  @IsBoolean()
  isPack: boolean;
}
```

- [ ] **Step 4: Implement OrdersService**

```typescript
// api/src/orders/orders.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { OrderPhoto } from './order-photo.entity';
import { Event } from '../events/event.entity';
import { Photo } from '../photos/photo.entity';
import { StorageService } from '../storage/storage.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderPhoto) private orderPhotoRepo: Repository<OrderPhoto>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(Photo) private photoRepo: Repository<Photo>,
    private storage: StorageService,
  ) {}

  async create(dto: {
    eventId: string;
    email: string;
    photoIds: string[];
    isPack: boolean;
  }): Promise<Order> {
    const event = await this.eventRepo.findOne({ where: { id: dto.eventId } });
    if (!event) throw new NotFoundException('Event not found');

    // Calculate total
    let totalCents: number;
    if (event.isFree) {
      totalCents = 0;
    } else if (dto.isPack) {
      totalCents = event.pricePack;
    } else {
      totalCents = dto.photoIds.length * event.priceSingle;
    }

    // Determine status
    const status = event.isFree ? 'delivered' : 'pending';

    const downloadToken = uuid();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const order = this.orderRepo.create({
      eventId: dto.eventId,
      email: dto.email,
      status,
      totalCents,
      isPack: dto.isPack,
      downloadToken,
      downloadExpiresAt: expiresAt,
    });
    const savedOrder = await this.orderRepo.save(order);

    // Create order_photos
    const orderPhotos = dto.photoIds.map((photoId) =>
      this.orderPhotoRepo.create({ orderId: savedOrder.id, photoId }),
    );
    await this.orderPhotoRepo.save(orderPhotos);

    return savedOrder;
  }

  async getDownloadUrls(
    orderId: string,
    token: string,
  ): Promise<{ photos: { id: string; url: string; filename: string }[] }> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['orderPhotos'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.downloadToken !== token) throw new ForbiddenException('Invalid token');
    if (order.status !== 'delivered' && order.status !== 'paid') {
      throw new ForbiddenException('Order not yet paid');
    }
    if (new Date() > order.downloadExpiresAt) {
      throw new ForbiddenException('Download link expired');
    }

    const photos = await Promise.all(
      order.orderPhotos.map(async (op) => {
        const photo = await this.photoRepo.findOne({ where: { id: op.photoId } });
        const url = await this.storage.getPresignedUrl(photo.originalKey, 300);
        return { id: photo.id, url, filename: `trailshot-${photo.id}.jpg` };
      }),
    );

    return { photos };
  }

  async streamZip(orderId: string, token: string, res: any): Promise<void> {
    // Validate order + token (same checks as getDownloadUrls)
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['orderPhotos'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.downloadToken !== token) throw new ForbiddenException('Invalid token');
    if (order.status !== 'delivered' && order.status !== 'paid') {
      throw new ForbiddenException('Order not yet paid');
    }
    if (new Date() > order.downloadExpiresAt) {
      throw new ForbiddenException('Download link expired');
    }

    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 5 } });

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="trailshot-${orderId}.zip"`,
    });
    archive.pipe(res);

    for (const op of order.orderPhotos) {
      const photo = await this.photoRepo.findOne({ where: { id: op.photoId } });
      const url = await this.storage.getPresignedUrl(photo.originalKey, 300);
      // Stream from S3 presigned URL into the archive
      const response = await fetch(url);
      archive.append(Buffer.from(await response.arrayBuffer()), {
        name: `trailshot-${photo.id}.jpg`,
      });
    }

    await archive.finalize();
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepo.find({
      order: { createdAt: 'DESC' },
      relations: ['event'],
    });
  }

  async findByEvent(eventId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { eventId },
      order: { createdAt: 'DESC' },
    });
  }
}
```

- [ ] **Step 5: Implement OrdersController**

```typescript
// api/src/orders/orders.controller.ts
import {
  Controller, Get, Post, Param, Query, Body, Res, UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AdminGuard } from '../auth/auth.guard';

@Controller('api')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // Public
  @Post('orders')
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get('orders/:id/download')
  download(@Param('id') id: string, @Query('token') token: string) {
    return this.ordersService.getDownloadUrls(id, token);
  }

  @Get('orders/:id/download-zip')
  async downloadZip(
    @Param('id') id: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    return this.ordersService.streamZip(id, token, res);
  }

  // Admin
  @UseGuards(AdminGuard)
  @Get('admin/orders')
  findAll() {
    return this.ordersService.findAll();
  }

  @UseGuards(AdminGuard)
  @Get('admin/events/:eventId/orders')
  findByEvent(@Param('eventId') eventId: string) {
    return this.ordersService.findByEvent(eventId);
  }
}
```

```typescript
// api/src/orders/orders.module.ts
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

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderPhoto, Event, Photo]),
    StorageModule,
    AuthModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
```

- [ ] **Step 6: Add OrdersModule to AppModule imports**

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd /home/alex/dev/trailshot/api && npx jest src/orders/orders.controller.spec.ts --no-cache`
Expected: 3 tests PASS

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add orders module with creation, download token validation, and admin listing"
```

---

## Task 9: Angular Frontend Setup + Routing + Core Services

**Files:**
- Modify: `web/src/app/app.routes.ts`
- Modify: `web/src/app/app.config.ts`
- Create: `web/src/app/core/services/api.service.ts`
- Create: `web/src/app/core/services/cart.service.ts`
- Create: `web/src/app/core/interceptors/auth.interceptor.ts`
- Create: `web/src/app/core/guards/admin.guard.ts`
- Create: `web/src/environments/environment.ts`
- Create: `web/src/environments/environment.development.ts`

- [ ] **Step 1: Create environment files**

```typescript
// web/src/environments/environment.ts
export const environment = {
  production: true,
  apiUrl: '/api',
};
```

```typescript
// web/src/environments/environment.development.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
};
```

- [ ] **Step 2: Create ApiService**

```typescript
// web/src/app/core/services/api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface EventSummary {
  id: string;
  name: string;
  slug: string;
  date: string;
  location: string;
  isFree: boolean;
  isPublished: boolean;
  priceSingle: number;
  pricePack: number;
  coverPhotoId: string | null;
}

export interface PhotoSummary {
  id: string;
  eventId: string;
  previewKey: string;
  thumbnailKey: string;
  width: number;
  height: number;
  bibs?: { bibNumber: string }[];
}

export interface OrderResult {
  id: string;
  downloadToken: string;
  totalCents: number;
  status: string;
  downloadExpiresAt: string;
}

export interface DownloadResult {
  photos: { id: string; url: string; filename: string }[];
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // Public - Events
  getEvents(): Observable<EventSummary[]> {
    return this.http.get<EventSummary[]>(`${this.base}/events`);
  }

  getEvent(slug: string): Observable<EventSummary> {
    return this.http.get<EventSummary>(`${this.base}/events/${slug}`);
  }

  // Public - Photos
  getPhotos(slug: string): Observable<PhotoSummary[]> {
    return this.http.get<PhotoSummary[]>(`${this.base}/events/${slug}/photos`);
  }

  getPhotosByBib(slug: string, bib: string): Observable<PhotoSummary[]> {
    return this.http.get<PhotoSummary[]>(`${this.base}/events/${slug}/photos/bib`, {
      params: { number: bib },
    });
  }

  // Public - Orders
  createOrder(data: {
    eventId: string; email: string; photoIds: string[]; isPack: boolean;
  }): Observable<OrderResult> {
    return this.http.post<OrderResult>(`${this.base}/orders`, data);
  }

  getDownload(orderId: string, token: string): Observable<DownloadResult> {
    return this.http.get<DownloadResult>(`${this.base}/orders/${orderId}/download`, {
      params: { token },
    });
  }

  // Admin - Auth
  login(username: string, password: string): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${this.base}/auth/login`, {
      username, password,
    });
  }

  // Admin - Events
  getAdminEvents(): Observable<EventSummary[]> {
    return this.http.get<EventSummary[]>(`${this.base}/admin/events`);
  }

  createEvent(data: any): Observable<EventSummary> {
    return this.http.post<EventSummary>(`${this.base}/admin/events`, data);
  }

  updateEvent(id: string, data: any): Observable<EventSummary> {
    return this.http.put<EventSummary>(`${this.base}/admin/events/${id}`, data);
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/events/${id}`);
  }

  // Admin - Photos
  getAdminPhotos(eventId: string): Observable<PhotoSummary[]> {
    return this.http.get<PhotoSummary[]>(`${this.base}/admin/events/${eventId}/photos`);
  }

  uploadPhotos(eventId: string, files: File[]): Observable<PhotoSummary[]> {
    const formData = new FormData();
    files.forEach((f) => formData.append('photos', f));
    return this.http.post<PhotoSummary[]>(
      `${this.base}/admin/events/${eventId}/photos/upload`, formData,
    );
  }

  updateBibs(photoId: string, bibs: string[]): Observable<PhotoSummary> {
    return this.http.patch<PhotoSummary>(`${this.base}/admin/photos/${photoId}/bibs`, { bibs });
  }

  // Admin - Orders
  getAdminOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/admin/orders`);
  }
}
```

- [ ] **Step 3: Create CartService (in-memory session state)**

```typescript
// web/src/app/core/services/cart.service.ts
import { Injectable, signal, computed } from '@angular/core';

export interface CartItem {
  photoId: string;
  eventId: string;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private items = signal<CartItem[]>([]);
  private packMode = signal(false);

  readonly cartItems = this.items.asReadonly();
  readonly isPackMode = this.packMode.asReadonly();
  readonly count = computed(() => this.items().length);

  toggle(photoId: string, eventId: string): void {
    const current = this.items();
    const exists = current.find((i) => i.photoId === photoId);
    if (exists) {
      this.items.set(current.filter((i) => i.photoId !== photoId));
    } else {
      this.items.set([...current, { photoId, eventId }]);
    }
  }

  isSelected(photoId: string): boolean {
    return this.items().some((i) => i.photoId === photoId);
  }

  selectPack(photoIds: string[], eventId: string): void {
    this.items.set(photoIds.map((photoId) => ({ photoId, eventId })));
    this.packMode.set(true);
  }

  clear(): void {
    this.items.set([]);
    this.packMode.set(false);
  }

  getPhotoIds(): string[] {
    return this.items().map((i) => i.photoId);
  }
}
```

- [ ] **Step 4: Create AuthInterceptor and AdminGuard**

```typescript
// web/src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/admin/')) {
    const token = typeof localStorage !== 'undefined'
      ? localStorage.getItem('trailshot_token')
      : null;
    if (token) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }
  }
  return next(req);
};
```

```typescript
// web/src/app/core/guards/admin.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  if (typeof localStorage !== 'undefined' && localStorage.getItem('trailshot_token')) {
    return true;
  }
  return router.createUrlTree(['/admin/login']);
};
```

- [ ] **Step 5: Set up routing with lazy loading**

```typescript
// web/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Public
  { path: '', loadComponent: () => import('./public/home/home.component').then(m => m.HomeComponent) },
  { path: 'events', loadComponent: () => import('./public/events/events.component').then(m => m.EventsComponent) },
  { path: 'events/:slug', loadComponent: () => import('./public/event-detail/event-detail.component').then(m => m.EventDetailComponent) },
  { path: 'events/:slug/photos/:id', loadComponent: () => import('./public/photo-detail/photo-detail.component').then(m => m.PhotoDetailComponent) },
  { path: 'order', loadComponent: () => import('./public/order/order.component').then(m => m.OrderComponent) },
  { path: 'about', loadComponent: () => import('./public/about/about.component').then(m => m.AboutComponent) },

  // Admin
  { path: 'admin/login', loadComponent: () => import('./admin/login/login.component').then(m => m.LoginComponent) },
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      { path: 'events', loadComponent: () => import('./admin/events/event-list/event-list.component').then(m => m.EventListComponent) },
      { path: 'events/new', loadComponent: () => import('./admin/events/event-form/event-form.component').then(m => m.EventFormComponent) },
      { path: 'events/:id/edit', loadComponent: () => import('./admin/events/event-form/event-form.component').then(m => m.EventFormComponent) },
      { path: 'events/:id/upload', loadComponent: () => import('./admin/photos/photo-upload/photo-upload.component').then(m => m.PhotoUploadComponent) },
      { path: 'events/:id/tagger', loadComponent: () => import('./admin/photos/speed-tagger/speed-tagger.component').then(m => m.SpeedTaggerComponent) },
      { path: 'orders', loadComponent: () => import('./admin/orders/order-list/order-list.component').then(m => m.OrderListComponent) },
      { path: '', redirectTo: 'events', pathMatch: 'full' },
    ],
  },
];
```

- [ ] **Step 6: Configure app with HttpClient and interceptor**

Update `web/src/app/app.config.ts`:

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideClientHydration(),
  ],
};
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: set up Angular routing, API service, cart service, auth interceptor, and admin guard"
```

---

## Task 10: Public Pages — Home + Events + Event Detail

**Files:**
- Create: `web/src/app/layout/navbar/navbar.component.ts`
- Create: `web/src/app/public/home/home.component.ts`
- Create: `web/src/app/public/events/events.component.ts`
- Create: `web/src/app/public/event-detail/event-detail.component.ts`
- Create: `web/src/app/public/about/about.component.ts`
- Modify: `web/src/app/app.component.ts`
- Modify: `web/src/styles.scss`

This is the largest frontend task. Implement each component following the wireframes from the spec. Each component is a standalone Angular component using signals and the ApiService.

- [ ] **Step 1: Create Navbar component**

Shared navigation bar with TrailShot logo (Trail in white, Shot in accent blue), links to Events and About. On admin pages, show admin nav instead.

- [ ] **Step 2: Create Home component**

Hero section with search bar (bib number input + event selector dropdown). Recent events grid below with "Gratuit" badge. Search form navigates to `/events/:slug?bib=xxx`.

- [ ] **Step 3: Create Events component**

Full events list with search-by-name filter (client-side filtering). Each event card shows cover photo, name, date, location, photo count, and "Gratuit" badge if `isFree`.

- [ ] **Step 4: Create EventDetail component**

Event banner + bib search. Photo grid showing thumbnails. When `?bib=xxx` is present, filter by bib and show pack CTA. Individual photo selection with toggle (blue border + checkmark). Sticky bottom bar showing selection count, total price, and "Commander" button that navigates to `/order`.

Key behaviors:
- Thumbnail URLs: `{apiUrl}/photos/{id}/thumbnail` or directly from S3 public URL
- Preview on click: show larger preview in modal/overlay
- Pack button: calls `cartService.selectPack()`
- Individual toggle: calls `cartService.toggle()`

- [ ] **Step 5: Create PhotoDetail component**

Route: `/events/:slug/photos/:id`. Displays the preview image large (watermarked if paid). Shows event name, bib numbers tagged. Buttons: "Acheter cette photo" (adds to cart and navigates to `/order`) or "Télécharger" (if free event). "Retour à la galerie" link.

- [ ] **Step 6: Create About component**

Static page with photographer bio. Content managed via the component template (no CMS needed for v1).

- [ ] **Step 7: Update AppComponent with Navbar and router-outlet**

- [ ] **Step 8: Add base styles in styles.scss**

Global styles: dark theme, typography, grid system, utility classes matching the wireframe aesthetic (dark background, white text, accent blue #4a9eff, green #22c55e for free badges).

- [ ] **Step 9: Verify the public pages render**

Run: `cd /home/alex/dev/trailshot/web && npm start`
Expected: App starts on http://localhost:4200, homepage renders with hero and empty events grid.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add public pages (home, events, event detail, about) with dark theme"
```

---

## Task 11: Public Pages — Order + Download

**Files:**
- Create: `web/src/app/public/order/order.component.ts`

- [ ] **Step 1: Implement Order component**

Reads cart state from CartService. Displays:
- Photo thumbnails recap
- Price breakdown (unit × count or pack price)
- Pack suggestion if total exceeds pack price
- Email input field
- "Télécharger" button with total
- "Vos photos sont téléchargeables pendant 30 jours" notice

On submit:
1. Calls `apiService.createOrder()` with email, photoIds, eventId, isPack
2. Receives `orderId` + `downloadToken`
3. If single photo: calls `apiService.getDownload(orderId, token)` and triggers browser download via temporary `<a>` element
4. If multiple photos: redirects to `/api/orders/:id/download-zip?token=xxx` which streams a ZIP directly to the browser
5. Shows success message with download link for future access (valid 30 days, expiration date displayed)
6. Clears cart

- [ ] **Step 2: Verify order flow end-to-end**

Manual test: create event via API, upload photo, search by bib, add to cart, complete order, verify download link works.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add order page with download flow and cart integration"
```

---

## Task 12: Admin — Login + Event CRUD

**Files:**
- Create: `web/src/app/admin/login/login.component.ts`
- Create: `web/src/app/admin/events/event-list/event-list.component.ts`
- Create: `web/src/app/admin/events/event-form/event-form.component.ts`

- [ ] **Step 1: Implement Login component**

Simple form: username + password. On submit, calls `apiService.login()`, stores token in `localStorage`, navigates to `/admin/events`.

- [ ] **Step 2: Implement EventList component**

Table/grid of all events (published and unpublished). For each: name, date, location, photo count, published status toggle, links to edit/upload/tagger. Button to create new event.

- [ ] **Step 3: Implement EventForm component**

Reactive form with fields: name, date, location, description, priceSingle (in euros, converted to cents), pricePack (in euros), isFree checkbox (disables price fields when checked). On save: calls create or update endpoint based on route param.

- [ ] **Step 4: Verify admin CRUD flow**

Manual test: login → create event → edit event → toggle publish → verify on public events page.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add admin login, event list, and event form components"
```

---

## Task 13: Admin — Photo Upload

**Files:**
- Create: `web/src/app/admin/photos/photo-upload/photo-upload.component.ts`

- [ ] **Step 1: Implement PhotoUpload component**

Drag-and-drop zone + file input for batch selection. Shows upload progress. Calls `apiService.uploadPhotos()`. After upload completes, shows thumbnail grid of uploaded photos with link to Speed Tagger.

Accept only `.jpg` / `.jpeg` files. Show file count and total size before upload.

- [ ] **Step 2: Verify upload works with MinIO**

Manual test: upload 3-5 test photos, verify thumbnails and previews are generated in MinIO bucket (check via MinIO console at http://localhost:9001).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add admin photo batch upload with drag-and-drop"
```

---

## Task 14: Admin — Speed Tagger

**Files:**
- Create: `web/src/app/admin/photos/speed-tagger/speed-tagger.component.ts`

This is the most UX-critical admin component. Follow the wireframe precisely.

- [ ] **Step 1: Implement SpeedTagger component**

Layout:
- Header: event name, progress counter ("Photo 47/248 — 19% taggées"), keyboard hints
- Main area: current photo preview displayed large
- Below photo: bib input field with "Valider" button
- Bottom: horizontal thumbnail strip with color coding (green=tagged, blue=current, gray=untagged)

Key behaviors:

```typescript
// Core keyboard handling
@HostListener('keydown', ['$event'])
onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    this.validateAndAdvance();
  } else if (e.key === 'ArrowRight') {
    this.next();
  } else if (e.key === 'ArrowLeft') {
    this.previous();
  }
}

validateAndAdvance() {
  const input = this.bibInput().trim();
  // If empty, reuse last bibs
  const bibs = input
    ? input.split(',').map(b => b.trim()).filter(Boolean)
    : this.lastBibs();

  if (bibs.length > 0) {
    this.apiService.updateBibs(this.currentPhoto().id, bibs).subscribe(() => {
      this.lastBibs.set(bibs);
      this.markCurrentAsTagged();
      this.next();
    });
  }
}
```

- Auto-focus bib input on load and after each navigation
- Bib input pre-populated with last bibs for visual reference (grayed out placeholder)
- Progress updates in real-time as photos are tagged
- Thumbnail strip scrolls to keep current photo centered

- [ ] **Step 2: Verify speed tagger workflow**

Manual test: upload photos → open tagger → tag with bib numbers → verify bibs saved → navigate with arrows → verify Enter-to-repeat works.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add speed tagger with keyboard navigation and bib carry-forward"
```

---

## Task 15: Admin — Orders List

**Files:**
- Create: `web/src/app/admin/orders/order-list/order-list.component.ts`

- [ ] **Step 1: Implement OrderList component**

Table showing all orders: date, event name, email, number of photos, total (formatted in euros), status badge, is_pack badge. Sorted by most recent first. Basic stats at the top: total orders, total revenue, orders this month.

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add admin orders list with stats summary"
```

---

## Task 16: CORS, Final Wiring & End-to-End Verification

**Files:**
- Modify: `api/src/main.ts` (enable CORS)
- Modify: `api/src/app.module.ts` (import all modules)
- Verify: full flow works

- [ ] **Step 1: Enable CORS in NestJS main.ts**

```typescript
// api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: 'http://localhost:4200' });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  await app.listen(3000);
}
bootstrap();
```

- [ ] **Step 2: Verify AppModule imports all modules**

```typescript
// api/src/app.module.ts — final imports
imports: [
  ConfigModule.forRoot({ load: [configuration], isGlobal: true }),
  TypeOrmModule.forRootAsync({ ... }),
  AuthModule,
  StorageModule,
  ImageProcessingModule,
  EventsModule,
  PhotosModule,
  OrdersModule,
],
```

- [ ] **Step 3: Full end-to-end verification**

1. `docker compose up -d` (PostgreSQL + MinIO)
2. `cd api && npm run start:dev`
3. `cd web && npm start`
4. Admin flow: login → create event → upload photos → speed tag → publish
5. Public flow: homepage → find event → search by bib → select photos → order → download
6. Verify MinIO has all 3 variants per photo (originals, previews, thumbnails)

- [ ] **Step 4: Run all backend tests**

Run: `cd /home/alex/dev/trailshot/api && npm test`
Expected: All tests PASS

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: enable CORS, wire all modules, complete end-to-end flow"
```

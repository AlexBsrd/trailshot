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

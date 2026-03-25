import { Injectable } from '@nestjs/common';
import sharp = require('sharp');

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
    const resized = await sharp(input)
      .resize(this.PREVIEW_WIDTH, null, { withoutEnlargement: true })
      .toBuffer({ resolveWithObject: true });

    if (!watermark) {
      return sharp(resized.data)
        .jpeg({ quality: this.PREVIEW_QUALITY })
        .toBuffer();
    }

    const { width, height } = resized.info;
    const watermarkSvg = this.createTiledWatermarkSvg(width, height);

    return sharp(resized.data)
      .composite([{ input: Buffer.from(watermarkSvg), top: 0, left: 0 }])
      .jpeg({ quality: this.PREVIEW_QUALITY })
      .toBuffer();
  }

  async getMetadata(input: Buffer): Promise<{ width: number; height: number }> {
    const meta = await sharp(input).metadata();
    return { width: meta.width, height: meta.height };
  }

  private createTiledWatermarkSvg(width: number, height: number): string {
    const fontSize = Math.max(20, Math.floor(width / 20));
    const stepX = fontSize * 7;
    const stepY = fontSize * 3;
    const opacity = this.WATERMARK_OPACITY;

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

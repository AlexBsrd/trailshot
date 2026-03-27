import { Injectable, signal, computed } from '@angular/core';

export interface CartItem {
  photoId: string;
  eventId: string;
  thumbnailKey?: string;
}

export interface CartEventInfo {
  name: string;
  slug: string;
  isFree: boolean;
  priceSingle: number;
  pricePack: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private items = signal<CartItem[]>([]);
  private packMode = signal(false);
  private packBib = signal('');
  private eventInfo = signal<CartEventInfo | null>(null);

  readonly cartItems = this.items.asReadonly();
  readonly isPackMode = this.packMode.asReadonly();
  readonly packBibNumber = this.packBib.asReadonly();
  readonly count = computed(() => this.items().length);
  readonly event = this.eventInfo.asReadonly();

  setEvent(info: CartEventInfo): void {
    const current = this.eventInfo();
    if (current && current.slug !== info.slug) {
      this.items.set([]);
      this.packMode.set(false);
      this.packBib.set('');
    }
    this.eventInfo.set(info);
  }

  toggle(photoId: string, eventId: string, thumbnailKey?: string): void {
    const current = this.items();
    const exists = current.find((i) => i.photoId === photoId);
    if (exists) {
      this.items.set(current.filter((i) => i.photoId !== photoId));
    } else {
      this.items.set([...current, { photoId, eventId, thumbnailKey }]);
    }
  }

  remove(photoId: string): void {
    this.items.set(this.items().filter((i) => i.photoId !== photoId));
  }

  isSelected(photoId: string): boolean {
    return this.items().some((i) => i.photoId === photoId);
  }

  selectPack(photoIds: string[], eventId: string, thumbnailKeys?: string[], bib?: string): void {
    this.items.set(photoIds.map((photoId, i) => ({
      photoId,
      eventId,
      thumbnailKey: thumbnailKeys?.[i],
    })));
    this.packMode.set(true);
    this.packBib.set(bib || '');
  }

  clear(): void {
    this.items.set([]);
    this.packMode.set(false);
    this.packBib.set('');
    this.eventInfo.set(null);
  }

  getPhotoIds(): string[] {
    return this.items().map((i) => i.photoId);
  }
}

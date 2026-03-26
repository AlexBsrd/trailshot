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

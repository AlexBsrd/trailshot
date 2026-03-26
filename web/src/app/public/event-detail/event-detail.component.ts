import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, EventSummary, PhotoSummary } from '../../core/services/api.service';
import { CartService } from '../../core/services/cart.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="event-detail">
      @if (event()) {
        <div class="event-header">
          <h1>{{ event()!.name }}</h1>
          <p class="event-meta">{{ event()!.date }} · {{ event()!.location }}</p>
          @if (event()!.isFree) {
            <span class="badge badge-free">Gratuit</span>
          }
          @if (event()!.description) {
            <p class="event-desc">{{ event()!.description }}</p>
          }
        </div>

        <div class="bib-search">
          <form (ngSubmit)="searchBib()" class="search-form">
            <input
              type="text"
              [(ngModel)]="bibInput"
              name="bib"
              placeholder="Numéro de dossard"
              class="input"
            />
            <button type="submit" class="btn btn-primary">Rechercher</button>
            @if (activeBib()) {
              <button type="button" class="btn btn-secondary" (click)="clearBib()">
                Voir toutes les photos
              </button>
            }
          </form>
        </div>

        @if (activeBib() && photos().length > 0 && !event()!.isFree) {
          <div class="pack-cta">
            <button class="btn btn-primary" (click)="selectPack()">
              Pack complet ({{ photos().length }} photos) — {{ formatPrice(event()!.pricePack) }}
            </button>
            <span class="pack-savings">
              au lieu de {{ formatPrice(photos().length * event()!.priceSingle) }}
            </span>
          </div>
        }

        <div class="photo-grid">
          @for (photo of photos(); track photo.id) {
            <div
              class="photo-card"
              [class.selected]="cart.isSelected(photo.id)"
              (click)="togglePhoto(photo)"
            >
              <img [src]="getThumbnailUrl(photo)" [alt]="'Photo'" loading="lazy" />
              <button class="preview-btn" (click)="openPreview(photo, $event)" title="Prévisualiser">
                &#128269;
              </button>
              @if (cart.isSelected(photo.id)) {
                <div class="selected-overlay">&#10003;</div>
              }
              @if (!event()!.isFree) {
                <div class="photo-price">{{ formatPrice(event()!.priceSingle) }}</div>
              }
            </div>
          }
        </div>

        @if (previewPhoto()) {
          <div class="lightbox" (click)="closePreview()">
            <div class="lightbox-content" (click)="$event.stopPropagation()">
              <button class="lightbox-close" (click)="closePreview()">&times;</button>
              <img [src]="getPreviewUrl(previewPhoto()!)" alt="Prévisualisation" />
            </div>
          </div>
        }

        @if (photos().length === 0 && !loading()) {
          <p class="empty">
            @if (activeBib()) {
              Aucune photo trouvée pour le dossard {{ activeBib() }}.
            } @else {
              Aucune photo disponible.
            }
          </p>
        }

        @if (cart.count() > 0) {
          <div class="sticky-bar">
            <span>{{ cart.count() }} photo(s) sélectionnée(s)</span>
            @if (!event()!.isFree) {
              <span class="total">
                {{ cart.isPackMode() ? formatPrice(event()!.pricePack) : formatPrice(cart.count() * event()!.priceSingle) }}
              </span>
            }
            <a routerLink="/order" class="btn btn-primary">Commander</a>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .event-detail { padding: 2rem; }
    .event-header { margin-bottom: 1.5rem; }
    .event-header h1 { margin-bottom: 0.25rem; }
    .event-meta { color: #6b7280; margin-bottom: 0.5rem; }
    .event-desc { color: #4b5563; margin-top: 0.5rem; }
    .bib-search { margin-bottom: 1.5rem; }
    .search-form { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .pack-cta {
      background: #eef2ff;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .pack-savings { color: #6b7280; text-decoration: line-through; }
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.75rem;
    }
    .photo-card {
      position: relative;
      cursor: pointer;
      border-radius: 6px;
      overflow: hidden;
      border: 2px solid transparent;
      transition: border-color 0.2s;
    }
    .photo-card.selected { border-color: #2563eb; }
    .photo-card img { width: 100%; display: block; aspect-ratio: 4/3; object-fit: cover; }
    .selected-overlay {
      position: absolute;
      top: 8px;
      right: 8px;
      background: #2563eb;
      color: #fff;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }
    .photo-price {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(0,0,0,0.6);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      color: #fff;
    }
    .sticky-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: #fff;
      border-top: 1px solid #d1d5db;
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      justify-content: flex-end;
      z-index: 100;
    }
    .total { font-weight: bold; color: #2563eb; }
    .preview-btn {
      position: absolute;
      top: 8px;
      left: 8px;
      background: rgba(255,255,255,0.85);
      color: #1a1a1a;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 4px rgba(0,0,0,0.15);
      transition: background 0.2s;
    }
    .preview-btn:hover { background: #fff; }
    .lightbox {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.8);
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .lightbox-content {
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
    }
    .lightbox-content img {
      max-width: 100%;
      max-height: 85vh;
      border-radius: 8px;
      display: block;
    }
    .lightbox-close {
      position: absolute;
      top: -12px;
      right: -12px;
      background: #fff;
      color: #1a1a1a;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      font-size: 1.5rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    .empty { color: #9ca3af; text-align: center; padding: 3rem; }
  `],
})
export class EventDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  cart = inject(CartService);

  event = signal<EventSummary | null>(null);
  photos = signal<PhotoSummary[]>([]);
  loading = signal(true);
  activeBib = signal('');
  previewPhoto = signal<PhotoSummary | null>(null);
  bibInput = '';

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    const bib = this.route.snapshot.queryParamMap.get('bib');

    this.api.getEvent(slug).subscribe((event) => {
      this.event.set(event);
      if (bib) {
        this.bibInput = bib;
        this.activeBib.set(bib);
        this.api.getPhotosByBib(slug, bib).subscribe((photos) => {
          this.photos.set(photos);
          this.loading.set(false);
        });
      } else {
        this.api.getPhotos(slug).subscribe((photos) => {
          this.photos.set(photos);
          this.loading.set(false);
        });
      }
    });
  }

  searchBib() {
    if (this.bibInput.trim()) {
      const slug = this.route.snapshot.paramMap.get('slug')!;
      this.activeBib.set(this.bibInput.trim());
      this.loading.set(true);
      this.router.navigate([], { queryParams: { bib: this.bibInput.trim() } });
      this.api.getPhotosByBib(slug, this.bibInput.trim()).subscribe((photos) => {
        this.photos.set(photos);
        this.loading.set(false);
      });
    }
  }

  clearBib() {
    this.activeBib.set('');
    this.bibInput = '';
    this.loading.set(true);
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.router.navigate([], { queryParams: {} });
    this.api.getPhotos(slug).subscribe((photos) => {
      this.photos.set(photos);
      this.loading.set(false);
    });
  }

  togglePhoto(photo: PhotoSummary) {
    if (this.event()?.isFree) {
      this.router.navigate(['/events', this.route.snapshot.paramMap.get('slug'), 'photos', photo.id]);
    } else {
      this.cart.toggle(photo.id, photo.eventId);
    }
  }

  selectPack() {
    const ids = this.photos().map((p) => p.id);
    const eventId = this.event()?.id;
    if (eventId) {
      this.cart.selectPack(ids, eventId);
      this.router.navigate(['/order']);
    }
  }

  openPreview(photo: PhotoSummary, event: MouseEvent) {
    event.stopPropagation();
    this.previewPhoto.set(photo);
  }

  closePreview() {
    this.previewPhoto.set(null);
  }

  getPreviewUrl(photo: PhotoSummary): string {
    return `${environment.storageUrl}/${photo.previewKey}`;
  }

  getThumbnailUrl(photo: PhotoSummary): string {
    return `${environment.storageUrl}/${photo.thumbnailKey}`;
  }

  formatPrice(cents: number): string {
    return (cents / 100).toFixed(2) + ' \u20AC';
  }
}

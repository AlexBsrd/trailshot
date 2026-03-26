import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, EventSummary, PhotoSummary } from '../../core/services/api.service';
import { CartService } from '../../core/services/cart.service';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, ScrollRevealDirective],
  template: `
    <div class="event-detail">
      @if (event()) {
        <div class="event-header">
          <h1>{{ event()!.name }}</h1>
          <p class="event-meta">{{ event()!.date }} &middot; {{ event()!.location }}</p>
          @if (event()!.isFree) {
            <span class="badge-free">Gratuit</span>
          }
          @if (event()!.description) {
            <p class="event-desc">{{ event()!.description }}</p>
          }
        </div>

        <div class="filter-zone" [style.background-image]="event()!.coverPhotoId ? 'url(' + getCoverUrl(event()!) + ')' : ''">
          <div class="filter-zone-overlay">
            <form (ngSubmit)="searchBib()" class="search-form">
              <input
                type="text"
                [(ngModel)]="bibInput"
                name="bib"
                placeholder="Numéro de dossard"
                class="bib-input"
              />
              <button type="submit" class="btn-search">Rechercher</button>
              @if (activeBib()) {
                <button type="button" class="btn-search btn-secondary" (click)="clearBib()">
                  Voir toutes les photos
                </button>
              }
            </form>
          </div>
        </div>

        @if (activeBib() && photos().length > 0 && !event()!.isFree) {
          <div class="pack-cta" scrollReveal>
            <div class="pack-cta-text">
              <span class="pack-label">Pack complet</span>
              <span class="pack-count">{{ photos().length }} photos</span>
            </div>
            <div class="pack-cta-pricing">
              <span class="pack-old-price">{{ formatPrice(photos().length * event()!.priceSingle) }}</span>
              <button class="btn-pack" (click)="selectPack()">
                {{ formatPrice(event()!.pricePack) }} &mdash; Commander le pack
              </button>
            </div>
          </div>
        }

        <div class="photo-grid" scrollReveal>
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
            <span class="sticky-count">{{ cart.count() }} photo(s) sélectionnée(s)</span>
            @if (!event()!.isFree) {
              <span class="sticky-total">
                {{ cart.isPackMode() ? formatPrice(event()!.pricePack) : formatPrice(cart.count() * event()!.priceSingle) }}
              </span>
            }
            <a routerLink="/order" class="btn-order">Commander</a>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    @use 'tokens' as *;
    @use 'animations' as *;

    .event-detail {
      padding: 0;
      padding-bottom: 80px;
    }

    /* ── Event Header ── */
    .event-header {
      padding: 2rem 2rem 1rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .event-header h1 {
      color: $color-forest;
      font-family: $font-family;
      font-weight: $font-heading-weight;
      font-size: $font-size-hero;
      margin: 0 0 0.25rem;
      line-height: 1.15;
    }
    .event-meta {
      color: $color-sand;
      font-size: $font-size-body;
      font-weight: 500;
      margin: 0 0 0.5rem;
    }
    .badge-free {
      display: inline-block;
      background: $color-sand-light;
      color: $color-forest;
      font-size: $font-size-xs;
      font-weight: $font-subheading-weight;
      padding: 3px 10px;
      border-radius: $radius-sm;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .event-desc {
      color: $color-text;
      font-size: $font-size-body;
      margin-top: 0.75rem;
      line-height: 1.5;
    }

    /* ── Filter Zone (bib search) ── */
    .filter-zone {
      position: relative;
      background-color: $color-forest;
      background-size: cover;
      background-position: center;
      filter: none;
      margin-bottom: 1.5rem;

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        filter: blur(8px);
        background: inherit;
        background-size: cover;
        background-position: center;
        transform: scale(1.05);
        z-index: 0;
      }
    }
    .filter-zone-overlay {
      position: relative;
      z-index: 1;
      background: rgba(27, 58, 45, 0.65);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      padding: 2rem;
    }
    .search-form {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      max-width: 1200px;
      margin: 0 auto;
      align-items: center;
    }
    .bib-input {
      flex: 1;
      min-width: 180px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: $color-cream;
      border-radius: 8px;
      padding: 0.65rem 1rem;
      font-size: $font-size-body;
      font-family: $font-family;
      outline: none;
      transition: border-color 0.2s;

      &::placeholder {
        color: rgba(250, 247, 242, 0.5);
      }
      &:focus {
        border-color: rgba(255, 255, 255, 0.35);
      }
    }
    .btn-search {
      background: $color-sand-light;
      color: $color-forest;
      border: none;
      border-radius: 8px;
      padding: 0.65rem 1.5rem;
      font-size: $font-size-body;
      font-weight: $font-subheading-weight;
      font-family: $font-family;
      cursor: pointer;
      transition: opacity 0.2s;
      white-space: nowrap;

      &:hover { opacity: 0.9; }
      &.btn-secondary {
        background: rgba(255, 255, 255, 0.12);
        color: $color-cream;
        &:hover { background: rgba(255, 255, 255, 0.2); }
      }
    }

    /* ── Pack CTA Banner ── */
    .pack-cta {
      background: $color-forest;
      color: $color-cream;
      padding: 1.25rem 2rem;
      margin: 0 0 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .pack-label {
      font-weight: $font-subheading-weight;
      font-size: $font-size-h2;
    }
    .pack-count {
      font-size: $font-size-body;
      opacity: 0.8;
      margin-left: 0.75rem;
    }
    .pack-cta-pricing {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .pack-old-price {
      color: $color-text-muted;
      text-decoration: line-through;
      font-size: $font-size-body;
    }
    .btn-pack {
      background: $color-sand-light;
      color: $color-forest;
      border: none;
      border-radius: 8px;
      padding: 0.65rem 1.5rem;
      font-size: $font-size-body;
      font-weight: $font-subheading-weight;
      font-family: $font-family;
      cursor: pointer;
      transition: opacity 0.2s;

      &:hover { opacity: 0.9; }
    }

    /* ── Photo Grid ── */
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 12px;
      padding: 0 2rem;
      max-width: 1200px;
      margin: 0 auto;

      @media (max-width: $breakpoint-sm) {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        padding: 0 1rem;
      }
    }
    .photo-card {
      position: relative;
      cursor: pointer;
      border-radius: $radius-sm;
      overflow: hidden;
      border: 3px solid transparent;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

      &:hover {
        transform: scale(1.02);
        box-shadow: $shadow-elevated;
      }
      &.selected {
        border-color: $color-sand-light;
      }
    }
    .photo-card img {
      width: 100%;
      display: block;
      aspect-ratio: 4 / 3;
      object-fit: cover;
    }
    .selected-overlay {
      position: absolute;
      top: 8px;
      right: 8px;
      background: $color-sand-light;
      color: $color-forest;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 0.85rem;
    }
    .photo-price {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(27, 58, 45, 0.65);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      padding: 3px 8px;
      border-radius: $radius-sm;
      font-size: $font-size-xs;
      color: $color-cream;
    }

    /* ── Preview Button ── */
    .preview-btn {
      position: absolute;
      top: 8px;
      left: 8px;
      background: rgba(255, 255, 255, 0.8);
      color: $color-forest;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
      transition: background 0.2s;
      opacity: 0;

      .photo-card:hover & { opacity: 1; }
      &:hover { background: white; }
    }

    /* ── Lightbox ── */
    .lightbox {
      position: fixed;
      inset: 0;
      background: rgba(27, 58, 45, 0.85);
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      animation: lightboxFadeIn 0.2s ease-out;
    }
    @keyframes lightboxFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .lightbox-content {
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
      animation: lightboxZoomIn 0.2s ease-out;
    }
    @keyframes lightboxZoomIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .lightbox-content img {
      max-width: 100%;
      max-height: 85vh;
      border-radius: $radius-sm;
      display: block;
    }
    .lightbox-close {
      position: absolute;
      top: -12px;
      right: -12px;
      background: rgba(255, 255, 255, 0.1);
      color: $color-cream;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      font-size: 1.5rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s;

      &:hover { opacity: 0.7; }
    }

    /* ── Sticky Cart Bar ── */
    .sticky-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(27, 58, 45, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      color: $color-cream;
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      justify-content: flex-end;
      z-index: 100;

      @media (max-width: $breakpoint-sm) {
        flex-direction: column;
        align-items: stretch;
        text-align: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
      }
    }
    .sticky-count {
      font-size: $font-size-body;
    }
    .sticky-total {
      font-weight: $font-subheading-weight;
      color: $color-sand-light;
      font-size: $font-size-h2;
    }
    .btn-order {
      display: inline-block;
      background: $color-sand-light;
      color: $color-forest;
      border: none;
      border-radius: 8px;
      padding: 0.65rem 1.75rem;
      font-size: $font-size-body;
      font-weight: $font-subheading-weight;
      font-family: $font-family;
      text-decoration: none;
      cursor: pointer;
      transition: opacity 0.2s;
      text-align: center;

      &:hover { opacity: 0.9; }
    }

    /* ── Empty State ── */
    .empty {
      color: $color-text-muted;
      text-align: center;
      padding: 3rem;
      font-size: $font-size-body;
    }
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

  getCoverUrl(event: EventSummary): string {
    return `${environment.storageUrl}/thumbnails/${event.id}/${event.coverPhotoId}.jpg`;
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

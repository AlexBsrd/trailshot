import { Component, inject, signal, computed, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService, PhotoSummary, EventSummary } from '../../core/services/api.service';
import { CartService } from '../../core/services/cart.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-photo-detail',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="photo-detail">
      @if (photo() && event()) {
        <a [routerLink]="['/events', slug]" [queryParams]="bib ? { bib: bib } : {}" class="back-link">&larr; Retour à la galerie</a>

        <div class="photo-viewer">
          @if (prevPhotoId()) {
            <button class="nav-arrow nav-arrow--prev" (click)="goTo(prevPhotoId()!)" title="Photo précédente">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          }

          <div class="photo-container">
            <img [src]="getPreviewUrl(photo()!)" [alt]="'Photo'" />
          </div>

          @if (nextPhotoId()) {
            <button class="nav-arrow nav-arrow--next" (click)="goTo(nextPhotoId()!)" title="Photo suivante">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          }
        </div>

        @if (photoIds().length > 1) {
          <div class="photo-counter">{{ currentIndex() + 1 }} / {{ photoIds().length }}</div>
        }

        <div class="photo-info">
          <h2>{{ event()!.name }}</h2>
          @if (photo()!.bibs && photo()!.bibs!.length > 0) {
            <p class="bibs">
              Dossard(s) :
              @for (bib of photo()!.bibs!; track bib.bibNumber) {
                <span class="bib-tag">{{ bib.bibNumber }}</span>
              }
            </p>
          }

          <div class="actions">
            @if (event()!.isFree) {
              <button class="btn btn-primary" (click)="downloadFree()">Télécharger</button>
            } @else {
              <button class="btn btn-primary" (click)="buyPhoto()">
                Acheter cette photo — {{ formatPrice(event()!.priceSingle) }}
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @use 'tokens' as *;
    @use 'animations' as *;

    .photo-detail {
      padding: 2rem;
      max-width: 900px;
      margin: 0 auto;
      background: $color-cream;
      min-height: 100vh;
    }
    .back-link {
      color: $color-forest-light;
      text-decoration: none;
      display: inline-block;
      margin-bottom: 1rem;
      font-weight: 500;
      transition: color 0.2s;

      &:hover {
        color: $color-forest;
      }
    }

    /* Photo viewer with arrows */
    .photo-viewer {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      max-width: 800px;
      margin: 0 auto 0.75rem;
    }
    .photo-container {
      border-radius: $radius-md;
      overflow: hidden;
      box-shadow: $shadow-elevated;
      flex: 1;
      min-width: 0;
    }
    .photo-container img {
      width: 100%;
      display: block;
    }
    .nav-arrow {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      background: $color-white;
      color: $color-forest;
      box-shadow: $shadow-card;
      transition: background 0.15s, box-shadow 0.15s, transform 0.15s;

      &:hover {
        box-shadow: $shadow-elevated;
        transform: scale(1.08);
      }
    }
    .photo-counter {
      text-align: center;
      color: $color-text-muted;
      font-size: $font-size-small;
      margin-bottom: 1rem;
    }

    .photo-info h2 {
      margin-bottom: 0.5rem;
      color: $color-forest;
      font-weight: $font-subheading-weight;
    }
    .bibs {
      color: $color-text;
      margin-bottom: 1rem;
    }
    .bib-tag {
      background: $color-sand-light;
      color: $color-forest;
      padding: 4px 10px;
      border-radius: $radius-sm;
      margin-left: 4px;
      font-size: $font-size-small;
      font-weight: 600;
    }
    .actions {
      margin-top: 1rem;
    }
    .actions .btn-primary {
      background: $color-sand-light;
      color: $color-forest;
      font-weight: $font-subheading-weight;
      border-radius: 8px;
      padding: 0.75rem 1.5rem;
    }

    @media (max-width: $breakpoint-sm) {
      .photo-detail { padding: 1rem; }
      .nav-arrow { width: 36px; height: 36px; }
      .nav-arrow svg { width: 20px; height: 20px; }
      .actions .btn-primary { width: 100%; }
    }
  `],
})
export class PhotoDetailComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cart = inject(CartService);

  photo = signal<PhotoSummary | null>(null);
  event = signal<EventSummary | null>(null);
  photoIds = signal<string[]>([]);
  slug = '';
  bib = '';

  currentIndex = computed(() => {
    const p = this.photo();
    const ids = this.photoIds();
    return p ? ids.indexOf(p.id) : -1;
  });

  prevPhotoId = computed(() => {
    const idx = this.currentIndex();
    const ids = this.photoIds();
    return idx > 0 ? ids[idx - 1] : null;
  });

  nextPhotoId = computed(() => {
    const idx = this.currentIndex();
    const ids = this.photoIds();
    return idx >= 0 && idx < ids.length - 1 ? ids[idx + 1] : null;
  });

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug')!;
    const photoId = this.route.snapshot.paramMap.get('id')!;
    this.bib = this.route.snapshot.queryParamMap.get('bib') || '';

    this.api.getEvent(this.slug).subscribe((event) => this.event.set(event));
    this.api.getPhoto(photoId).subscribe((photo) => this.photo.set(photo));

    const photos$ = this.bib
      ? this.api.getPhotosByBib(this.slug, this.bib)
      : this.api.getPhotos(this.slug);
    photos$.subscribe((photos) => {
      this.photoIds.set(photos.map(p => p.id));
    });
  }

  ngOnDestroy() {}

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft' && this.prevPhotoId()) {
      this.goTo(this.prevPhotoId()!);
    } else if (e.key === 'ArrowRight' && this.nextPhotoId()) {
      this.goTo(this.nextPhotoId()!);
    }
  }

  goTo(photoId: string) {
    this.router.navigate(
      ['/events', this.slug, 'photos', photoId],
      this.bib ? { queryParams: { bib: this.bib } } : {},
    ).then(() => {
      this.api.getPhoto(photoId).subscribe((photo) => this.photo.set(photo));
    });
  }

  getPreviewUrl(photo: PhotoSummary): string {
    return `${environment.storageUrl}/${photo.previewKey}`;
  }

  formatPrice(cents: number): string {
    return (cents / 100).toFixed(2) + ' \u20AC';
  }

  buyPhoto() {
    const photo = this.photo();
    if (photo) {
      this.cart.toggle(photo.id, photo.eventId);
      this.router.navigate(['/order']);
    }
  }

  downloadFree() {
    const photo = this.photo();
    const event = this.event();
    if (photo && event) {
      this.api.createOrder({
        eventId: event.id,
        email: 'free@download.com',
        photoIds: [photo.id],
        isPack: false,
      }).subscribe((order) => {
        this.api.getDownload(order.id, order.downloadToken).subscribe((dl) => {
          if (dl.photos.length > 0) {
            const a = document.createElement('a');
            a.href = dl.photos[0].url;
            a.download = dl.photos[0].filename;
            a.click();
          }
        });
      });
    }
  }
}

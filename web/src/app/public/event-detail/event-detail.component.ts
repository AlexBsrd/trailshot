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
              placeholder="Numero de dossard"
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
              @if (cart.isSelected(photo.id)) {
                <div class="selected-overlay">&#10003;</div>
              }
              @if (!event()!.isFree) {
                <div class="photo-price">{{ formatPrice(event()!.priceSingle) }}</div>
              }
            </div>
          }
        </div>

        @if (photos().length === 0 && !loading()) {
          <p class="empty">
            @if (activeBib()) {
              Aucune photo trouvee pour le dossard {{ activeBib() }}.
            } @else {
              Aucune photo disponible.
            }
          </p>
        }

        @if (cart.count() > 0) {
          <div class="sticky-bar">
            <span>{{ cart.count() }} photo(s) selectionnee(s)</span>
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
    .event-meta { color: #999; margin-bottom: 0.5rem; }
    .event-desc { color: #ccc; margin-top: 0.5rem; }
    .bib-search { margin-bottom: 1.5rem; }
    .search-form { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .pack-cta {
      background: #1a2a3e;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .pack-savings { color: #999; text-decoration: line-through; }
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
    .photo-card.selected { border-color: #4a9eff; }
    .photo-card img { width: 100%; display: block; aspect-ratio: 4/3; object-fit: cover; }
    .selected-overlay {
      position: absolute;
      top: 8px;
      right: 8px;
      background: #4a9eff;
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
      background: rgba(0,0,0,0.7);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
    }
    .sticky-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: #1a1a1a;
      border-top: 1px solid #333;
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      justify-content: flex-end;
      z-index: 100;
    }
    .total { font-weight: bold; color: #4a9eff; }
    .empty { color: #666; text-align: center; padding: 3rem; }
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

  getThumbnailUrl(photo: PhotoSummary): string {
    return `${environment.apiUrl.replace('/api', '')}:9000/trailshot/${photo.thumbnailKey}`;
  }

  formatPrice(cents: number): string {
    return (cents / 100).toFixed(2) + ' \u20AC';
  }
}

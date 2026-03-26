import { Component, inject, signal, OnInit } from '@angular/core';
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
        <a [routerLink]="['/events', slug]" class="back-link">&larr; Retour à la galerie</a>

        <div class="photo-container">
          <img [src]="getPreviewUrl(photo()!)" [alt]="'Photo'" />
        </div>

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
    .photo-container {
      border-radius: $radius-md;
      overflow: hidden;
      margin-bottom: 1.5rem;
      box-shadow: $shadow-elevated;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }
    .photo-container img {
      width: 100%;
      display: block;
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
      .actions .btn-primary {
        width: 100%;
      }
    }
  `],
})
export class PhotoDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cart = inject(CartService);

  photo = signal<PhotoSummary | null>(null);
  event = signal<EventSummary | null>(null);
  slug = '';

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug')!;
    const photoId = this.route.snapshot.paramMap.get('id')!;

    this.api.getEvent(this.slug).subscribe((event) => this.event.set(event));
    this.api.getPhoto(photoId).subscribe((photo) => this.photo.set(photo));
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

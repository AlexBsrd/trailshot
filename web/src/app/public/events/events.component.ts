import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, EventSummary } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [RouterLink, FormsModule, ScrollRevealDirective],
  template: `
    <div class="events-page">
      <h1>Toutes les courses</h1>
      <input
        type="text"
        [(ngModel)]="searchQuery"
        placeholder="Rechercher une course..."
        class="input search-input"
      />
      <div class="events-grid">
        @for (event of filteredEvents(); track event.id) {
          <a [routerLink]="['/events', event.slug]" class="event-card" scrollReveal>
            <div class="event-card-img" [style.background-image]="event.coverPhotoId ? 'url(' + getCoverUrl(event) + ')' : ''"></div>
            <div class="event-card-body">
              <h3>{{ event.name }}</h3>
              <p class="event-meta">{{ event.date }} · {{ event.location }}</p>
              @if (event.isFree) {
                <span class="badge badge-free">Gratuit</span>
              }
            </div>
          </a>
        }
        @if (filteredEvents().length === 0) {
          <p class="empty">Aucune course trouvée.</p>
        }
      </div>
    </div>
  `,
  styles: [`
    @use 'tokens' as *;
    @use 'animations' as *;

    .events-page {
      padding: 2rem;
      background: $color-cream;
      min-height: 100vh;
    }
    .events-page h1 {
      margin-bottom: 1rem;
      font-family: $font-family;
      font-weight: $font-heading-weight;
      color: $color-forest;
      font-size: $font-size-h1;
    }
    .search-input {
      margin-bottom: 1.5rem;
      max-width: 400px;
      background: $color-white;
      border: 1px solid #d1d5db;
      border-radius: $radius-sm;
      padding: 0.6rem 1rem;
      font-size: $font-size-body;
      font-family: $font-family;
      color: $color-text;
      width: 100%;
      transition: border-color 0.2s, box-shadow 0.2s;

      &:focus {
        outline: none;
        border-color: $color-forest-light;
        box-shadow: 0 0 0 3px rgba(74, 123, 90, 0.15);
      }
    }
    .events-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .event-card {
      background: $color-white;
      border-radius: $radius-lg;
      overflow: hidden;
      text-decoration: none;
      color: $color-text;
      box-shadow: $shadow-card;
      @include hover-lift;
    }
    .event-card-img {
      aspect-ratio: 16 / 9;
      background: linear-gradient(135deg, $color-forest, $color-forest-light);
      background-size: cover;
      background-position: center;
    }
    .event-card-body {
      padding: 1rem;
    }
    .event-card-body h3 {
      margin-bottom: 0.25rem;
      font-family: $font-family;
      font-weight: $font-subheading-weight;
      color: $color-forest;
    }
    .event-meta {
      color: $color-sand;
      font-size: $font-size-small;
    }
    .empty {
      color: $color-text-muted;
      text-align: center;
      grid-column: 1 / -1;
      padding: 3rem 1rem;
    }
  `],
})
export class EventsComponent implements OnInit {
  private api = inject(ApiService);

  events = signal<EventSummary[]>([]);
  searchQuery = '';

  filteredEvents = computed(() => {
    const q = this.searchQuery.toLowerCase();
    if (!q) return this.events();
    return this.events().filter((e) =>
      e.name.toLowerCase().includes(q) || e.location.toLowerCase().includes(q),
    );
  });

  ngOnInit() {
    this.api.getEvents().subscribe((events) => this.events.set(events));
  }

  getCoverUrl(event: EventSummary): string {
    return `${environment.storageUrl}/thumbnails/${event.id}/${event.coverPhotoId}.jpg`;
  }
}

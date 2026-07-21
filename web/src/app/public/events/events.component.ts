import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, EventSummary } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [RouterLink, FormsModule, ScrollRevealDirective, DatePipe],
  template: `
    <div class="events-page">
      <div class="events-header">
        <h1>Toutes les courses</h1>
        <div class="search-wrapper">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Rechercher une course..."
            class="search-input"
          />
        </div>
      </div>
      <div class="events-grid">
        @for (event of filteredEvents(); track event.id) {
          <a [routerLink]="['/events', event.slug]" class="event-card" scrollReveal>
            <div class="event-card-img" [style.background-image]="event.coverPhotoId ? 'url(' + getCoverUrl(event) + ')' : ''"></div>
            <div class="event-card-overlay">
              <h3>{{ event.name }}</h3>
              <p class="event-meta">{{ event.date | date:'longDate' }} · {{ event.location }}</p>
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
      background: $color-cream;
      min-height: 100vh;
    }

    /* ===== Page Header ===== */
    .events-header {
      background: $color-forest;
      color: $color-cream;
      padding: 3rem 2rem;

      h1 {
        font-family: $font-display;
        font-weight: $font-heading-weight;
        font-size: $font-size-h1;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 1.25rem;
      }
    }

    .search-wrapper {
      position: relative;
      max-width: 500px;
    }

    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      width: 18px;
      height: 18px;
      color: $color-text-muted;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      background: $color-white;
      color: $color-text;
      border: none;
      border-radius: $radius-md;
      padding: 0.7rem 1rem 0.7rem 2.75rem;
      font-size: $font-size-body;
      font-family: $font-family;
      transition: box-shadow 0.2s;

      &::placeholder {
        color: $color-text-muted;
      }

      &:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba($color-accent, 0.25);
      }
    }

    /* ===== Events Grid ===== */
    .events-grid {
      padding: 2.5rem 2rem;
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    /* ===== Event Card (full-image overlay) ===== */
    .event-card {
      position: relative;
      min-height: 220px;
      border-radius: $radius-lg;
      overflow: hidden;
      text-decoration: none;
      color: $color-white;
      display: block;
      box-shadow: $shadow-card;
      @include hover-lift;

      &:hover .event-card-img {
        transform: scale(1.05);
      }
    }

    .event-card-img {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, $color-forest, $color-forest-light);
      background-size: cover;
      background-position: center;
      transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .event-card-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 1.25rem;
      background: linear-gradient(to top, rgba(27, 58, 45, 0.75) 0%, transparent 60%);
      z-index: 1;

      h3 {
        font-family: $font-display;
        font-weight: $font-subheading-weight;
        font-size: 1.1rem;
        margin-bottom: 0.2rem;
        color: $color-white;
      }
    }

    .event-meta {
      font-size: $font-size-small;
      color: rgba(255, 255, 255, 0.8);
    }

    .badge-free {
      display: inline-block;
      margin-top: 0.5rem;
      padding: 0.2rem 0.6rem;
      border-radius: $radius-sm;
      font-size: $font-size-xs;
      font-weight: 600;
      background: rgba(58, 125, 74, 0.2);
      color: #6FCF7C;
    }

    /* ===== Stagger Animation ===== */
    .event-card:nth-child(1) { transition-delay: 0s; }
    .event-card:nth-child(2) { transition-delay: 0.05s; }
    .event-card:nth-child(3) { transition-delay: 0.1s; }
    .event-card:nth-child(4) { transition-delay: 0.15s; }
    .event-card:nth-child(5) { transition-delay: 0.2s; }
    .event-card:nth-child(6) { transition-delay: 0.25s; }
    .event-card:nth-child(7) { transition-delay: 0.3s; }
    .event-card:nth-child(8) { transition-delay: 0.35s; }
    .event-card:nth-child(9) { transition-delay: 0.4s; }

    .empty {
      color: $color-text-muted;
      text-align: center;
      grid-column: 1 / -1;
      padding: 3rem 1rem;
      font-family: $font-family;
    }

    /* ===== Responsive ===== */
    @media (max-width: $breakpoint-sm) {
      .events-grid {
        grid-template-columns: 1fr;
      }
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

import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, EventSummary } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule, ScrollRevealDirective],
  template: `
    <section class="hero">
      <div class="hero-content">
        <h1>Trouvez vos photos de course</h1>
        <p>Recherchez par numéro de dossard et téléchargez vos photos de trail</p>
        <form class="search-form" (ngSubmit)="search()">
          <select [(ngModel)]="selectedSlug" name="event">
            <option value="">Choisir une course...</option>
            @for (event of events(); track event.id) {
              <option [value]="event.slug">{{ event.name }}</option>
            }
          </select>
          <input
            type="text"
            [(ngModel)]="bibNumber"
            name="bib"
            placeholder="Numéro de dossard"
          />
          <button type="submit" [disabled]="!selectedSlug">
            Rechercher
          </button>
        </form>
      </div>
    </section>

    <section class="recent-events">
      <h2>Courses récentes</h2>
      <div class="events-grid">
        @for (event of events(); track event.id) {
          <a [routerLink]="['/events', event.slug]" class="event-card" scrollReveal>
            <div
              class="event-card-img"
              [style.background-image]="event.coverPhotoId ? 'url(' + getCoverUrl(event) + ')' : ''"
              [class.no-cover]="!event.coverPhotoId"
            ></div>
            <div class="event-card-body">
              <h3>{{ event.name }}</h3>
              <p class="event-meta">{{ event.date }} · {{ event.location }}</p>
              @if (event.isFree) {
                <span class="badge badge-free">Gratuit</span>
              }
            </div>
          </a>
        }
        @if (events().length === 0) {
          <p class="empty">Aucune course publiée pour le moment.</p>
        }
      </div>
    </section>
  `,
  styles: [`
    @use 'tokens' as *;
    @use 'animations' as *;

    /* ===== Hero Section ===== */
    .hero {
      position: relative;
      height: 70vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: url('/images/hero-default.jpg') center / cover fixed;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(27, 58, 45, 0.3), rgba(27, 58, 45, 0.7));
      }
    }

    .hero-content {
      position: relative;
      text-align: center;
      color: $color-cream;
      padding: 64px 1.5rem 0;
      max-width: 720px;
      width: 100%;
      @include fade-in-up;

      h1 {
        font-family: $font-family;
        font-weight: $font-heading-weight;
        font-size: $font-size-hero;
        margin-bottom: 0.5rem;
      }

      p {
        font-family: $font-family;
        font-weight: $font-body-weight;
        opacity: 0.7;
        margin-bottom: 2rem;
      }
    }

    /* Search form glass container */
    .search-form {
      display: flex;
      gap: 6px;
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: $radius-md;
      padding: 6px;
      flex-wrap: wrap;

      select,
      input {
        flex: 1;
        min-width: 160px;
        appearance: none;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: $color-cream;
        border-radius: 8px;
        padding: 10px 14px;
        font-family: $font-family;
        font-size: $font-size-body;
        outline: none;
        transition: border-color 0.2s;

        &::placeholder {
          color: rgba(250, 247, 242, 0.5);
        }

        &:focus {
          border-color: rgba(255, 255, 255, 0.4);
        }
      }

      select {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1.5l5 5 5-5' stroke='%23FAF7F2' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 12px center;
        padding-right: 32px;

        option {
          background: $color-forest;
          color: $color-cream;
        }
      }

      button {
        background: $color-sand-light;
        color: $color-forest;
        border-radius: 8px;
        padding: 10px 20px;
        font-weight: $font-subheading-weight;
        font-family: $font-family;
        font-size: $font-size-body;
        border: none;
        cursor: pointer;
        transition: opacity 0.2s;
        white-space: nowrap;

        &:hover {
          opacity: 0.9;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    /* ===== Event Cards Section ===== */
    .recent-events {
      padding: 3rem 2rem;
      max-width: 1200px;
      margin: 0 auto;

      h2 {
        font-family: $font-family;
        font-weight: $font-heading-weight;
        color: $color-forest;
        margin-bottom: 1.5rem;
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
      color: inherit;
      box-shadow: $shadow-card;
      transition: transform 0.2s ease, box-shadow 0.2s ease;

      &:hover {
        transform: translateY(-3px);
        box-shadow: $shadow-elevated;
      }
    }

    .event-card-img {
      aspect-ratio: 16 / 9;
      background-size: cover;
      background-position: center;
      position: relative;

      /* Gradient overlay for text readability */
      &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(27, 58, 45, 0.25), transparent 50%);
      }

      /* Fallback when no cover photo */
      &.no-cover {
        background: linear-gradient(135deg, $color-forest, $color-forest-light);
      }
    }

    .event-card-body {
      padding: 1rem;

      h3 {
        font-family: $font-family;
        font-weight: $font-subheading-weight;
        color: $color-forest;
        margin-bottom: 0.25rem;
      }
    }

    .event-meta {
      color: $color-sand;
      font-size: $font-size-small;
    }

    .empty {
      color: $color-text-muted;
      text-align: center;
      grid-column: 1 / -1;
      padding: 2rem 0;
    }

    /* ===== Responsive ===== */
    @media (max-width: $breakpoint-md) {
      .hero {
        height: 50vh;
        background-attachment: scroll;
      }

      .hero-content h1 {
        font-size: 1.75rem;
      }
    }

    @media (max-width: $breakpoint-sm) {
      .events-grid {
        grid-template-columns: 1fr;
      }

      .search-form {
        flex-direction: column;

        select,
        input {
          min-width: unset;
        }
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .hero {
        background-attachment: scroll;
      }
    }
  `],
})
export class HomeComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  events = signal<EventSummary[]>([]);
  selectedSlug = '';
  bibNumber = '';

  ngOnInit() {
    this.api.getEvents().subscribe((events) => this.events.set(events));
  }

  getCoverUrl(event: EventSummary): string {
    return `${environment.storageUrl}/thumbnails/${event.id}/${event.coverPhotoId}.jpg`;
  }

  search() {
    if (this.selectedSlug) {
      const params = this.bibNumber ? `?bib=${this.bibNumber}` : '';
      this.router.navigateByUrl(`/events/${this.selectedSlug}${params}`);
    }
  }
}

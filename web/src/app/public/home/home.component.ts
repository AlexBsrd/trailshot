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
        <h1>Trouvez vos <span class="hero-accent">photos</span> de course</h1>
        <p class="hero-subtitle">Recherchez par numéro de dossard et téléchargez vos photos de trail</p>
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
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
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
            <div class="event-card-img" [style.background-image]="event.coverPhotoId ? 'url(' + getCoverUrl(event) + ')' : ''" [class.no-cover]="!event.coverPhotoId"></div>
            <div class="event-card-overlay">
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
      height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: url('/images/hero-default.jpg') center / cover fixed;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(170deg, rgba(27, 58, 45, 0.2) 0%, rgba(27, 58, 45, 0.75) 100%);
      }

      @include grain-overlay(0.03);
    }

    .hero-content {
      position: relative;
      z-index: 1;
      text-align: center;
      color: $color-cream;
      padding: 64px 1.5rem 0;
      max-width: 720px;
      width: 100%;
      @include fade-in-up;

      h1 {
        font-family: $font-display;
        font-weight: 800;
        font-size: $font-size-hero;
        text-transform: uppercase;
        letter-spacing: 2px;
        line-height: 1.1;
        margin-bottom: 0.75rem;
        text-shadow: 0 2px 16px rgba(0, 0, 0, 0.25);
      }
    }

    .hero-accent {
      color: $color-accent-light;
    }

    .hero-subtitle {
      font-family: $font-family;
      font-weight: $font-body-weight;
      font-size: 1.1rem;
      opacity: 0.75;
      margin-bottom: 2rem;
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
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: $color-accent;
        color: $color-white;
        border-radius: 8px;
        padding: 10px 20px;
        font-weight: $font-subheading-weight;
        font-family: $font-family;
        font-size: $font-size-body;
        border: none;
        cursor: pointer;
        transition: background 0.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s;
        white-space: nowrap;

        svg {
          flex-shrink: 0;
        }

        &:hover {
          background: $color-accent-light;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    /* ===== Event Cards Section ===== */
    .recent-events {
      padding: 3.5rem 2rem;
      max-width: 1200px;
      margin: 0 auto;

      h2 {
        font-family: $font-display;
        font-weight: $font-heading-weight;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: $color-forest;
        margin-bottom: 2rem;
        position: relative;
        display: inline-block;

        &::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 0;
          width: 40px;
          height: 3px;
          background: $color-accent;
          border-radius: 2px;
        }
      }
    }

    .events-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .event-card {
      position: relative;
      border-radius: $radius-lg;
      overflow: hidden;
      text-decoration: none;
      color: $color-cream;
      min-height: 240px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      box-shadow: $shadow-card;
      transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s cubic-bezier(0.22, 1, 0.36, 1);

      &:hover {
        transform: translateY(-4px);
        box-shadow: $shadow-elevated;

        .event-card-img {
          transform: scale(1.05);
        }
      }

      &:nth-child(1) { animation-delay: 0s; }
      &:nth-child(2) { animation-delay: 0.1s; }
      &:nth-child(3) { animation-delay: 0.2s; }
      &:nth-child(4) { animation-delay: 0.3s; }
      &:nth-child(5) { animation-delay: 0.4s; }
      &:nth-child(6) { animation-delay: 0.5s; }
    }

    .event-card-img {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);

      &.no-cover {
        background: linear-gradient(135deg, $color-forest, $color-forest-light);
      }
    }

    .event-card-overlay {
      position: relative;
      z-index: 1;
      padding: 1.25rem;
      background: linear-gradient(to top, rgba(27, 58, 45, 0.85) 0%, transparent 100%);
      margin-top: auto;

      h3 {
        font-family: $font-family;
        font-weight: $font-subheading-weight;
        color: $color-cream;
        margin-bottom: 0.25rem;
        font-size: 1.05rem;
      }
    }

    .event-meta {
      color: rgba(250, 247, 242, 0.7);
      font-size: $font-size-small;
    }

    .badge-free {
      display: inline-block;
      margin-top: 0.5rem;
      padding: 2px 10px;
      font-size: $font-size-xs;
      font-weight: $font-subheading-weight;
      background: $color-accent;
      color: $color-white;
      border-radius: $radius-sm;
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
        height: 60vh;
        background-attachment: scroll;
      }

      .hero-content h1 {
        font-size: 2rem;
        letter-spacing: 1px;
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

      .hero-content h1 {
        font-size: 1.75rem;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .hero {
        background-attachment: scroll;
      }

      .event-card {
        animation-delay: 0s !important;
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

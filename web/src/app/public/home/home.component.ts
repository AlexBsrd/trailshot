import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, EventSummary } from '../../core/services/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <section class="hero">
      <h1>Retrouvez vos photos de course</h1>
      <p>Recherchez par numero de dossard et telechargez vos photos de trail</p>
      <form class="search-form" (ngSubmit)="search()">
        <select [(ngModel)]="selectedSlug" name="event" class="input">
          <option value="">Choisir une course...</option>
          @for (event of events(); track event.id) {
            <option [value]="event.slug">{{ event.name }}</option>
          }
        </select>
        <input
          type="text"
          [(ngModel)]="bibNumber"
          name="bib"
          placeholder="Numero de dossard"
          class="input"
        />
        <button type="submit" class="btn btn-primary" [disabled]="!selectedSlug">
          Rechercher
        </button>
      </form>
    </section>

    <section class="recent-events">
      <h2>Courses recentes</h2>
      <div class="events-grid">
        @for (event of events(); track event.id) {
          <a [routerLink]="['/events', event.slug]" class="event-card">
            <div class="event-card-img"></div>
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
          <p class="empty">Aucune course publiee pour le moment.</p>
        }
      </div>
    </section>
  `,
  styles: [`
    .hero {
      text-align: center;
      padding: 4rem 2rem;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    }
    .hero h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .hero p { color: #999; margin-bottom: 2rem; }
    .search-form {
      display: flex;
      gap: 0.75rem;
      max-width: 700px;
      margin: 0 auto;
      flex-wrap: wrap;
      justify-content: center;
    }
    .recent-events { padding: 2rem; }
    .recent-events h2 { margin-bottom: 1.5rem; }
    .events-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .event-card {
      background: #1a1a1a;
      border-radius: 8px;
      overflow: hidden;
      text-decoration: none;
      color: #fff;
      transition: transform 0.2s;
    }
    .event-card:hover { transform: translateY(-2px); }
    .event-card-img {
      height: 160px;
      background: linear-gradient(135deg, #2a2a3e, #1a1a2e);
    }
    .event-card-body { padding: 1rem; }
    .event-card-body h3 { margin-bottom: 0.25rem; }
    .event-meta { color: #999; font-size: 0.875rem; }
    .empty { color: #666; text-align: center; grid-column: 1 / -1; }
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

  search() {
    if (this.selectedSlug) {
      const params = this.bibNumber ? `?bib=${this.bibNumber}` : '';
      this.router.navigateByUrl(`/events/${this.selectedSlug}${params}`);
    }
  }
}

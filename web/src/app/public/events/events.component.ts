import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, EventSummary } from '../../core/services/api.service';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [RouterLink, FormsModule],
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
        @if (filteredEvents().length === 0) {
          <p class="empty">Aucune course trouvee.</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .events-page { padding: 2rem; }
    .events-page h1 { margin-bottom: 1rem; }
    .search-input { margin-bottom: 1.5rem; max-width: 400px; }
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
}

import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, EventSummary } from '../../../core/services/api.service';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="event-list">
      <div class="header">
        <h1>Courses</h1>
        <a routerLink="/admin/events/new" class="btn btn-primary">Nouvelle course</a>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Date</th>
            <th>Lieu</th>
            <th>Prix</th>
            <th>Publiée</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (event of events(); track event.id) {
            <tr>
              <td>{{ event.name }}</td>
              <td>{{ event.date }}</td>
              <td>{{ event.location }}</td>
              <td>
                @if (event.isFree) {
                  <span class="badge badge-free">Gratuit</span>
                } @else {
                  {{ (event.priceSingle / 100).toFixed(2) }} / {{ (event.pricePack / 100).toFixed(2) }}
                }
              </td>
              <td>
                <button
                  class="badge-toggle badge"
                  [class.badge-published]="event.isPublished"
                  [class.badge-draft]="!event.isPublished"
                  (click)="togglePublish(event)"
                >
                  {{ event.isPublished ? 'Publiée' : 'Brouillon' }}
                </button>
              </td>
              <td class="actions">
                <a [routerLink]="['/admin/events', event.id]" class="action-btn action-btn--primary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Gérer
                </a>
                <a [routerLink]="['/admin/events', event.id, 'tagger']" class="action-btn action-btn--secondary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                  Tagger
                </a>
                <button class="action-btn action-btn--danger" (click)="deleteEvent(event)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    @use 'tokens' as *;
    @use 'animations' as *;

    .event-list { padding: 2rem; }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .header h1 {
      font-family: $font-family;
      font-weight: $font-heading-weight;
      color: $color-forest;
    }

    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid $color-sand-light;
    }
    .table thead tr {
      background: rgba(27, 58, 45, 0.05);
    }
    .table th {
      color: $color-text-muted;
      font-weight: 600;
      font-size: $font-size-small;
    }
    .table tbody tr:nth-child(even) {
      background: $color-cream;
    }
    .table tbody tr:nth-child(odd) {
      background: $color-white;
    }
    .table tbody tr:hover {
      background: rgba(166, 139, 91, 0.08);
    }

    .actions { display: flex; gap: 0.4rem; align-items: center; }
    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.3rem 0.6rem;
      border-radius: $radius-sm;
      border: none;
      font-size: $font-size-xs;
      font-family: $font-family;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.15s, color 0.15s;
      white-space: nowrap;
    }
    .action-btn svg { flex-shrink: 0; }
    .action-btn--primary {
      background: rgba(74, 123, 90, 0.1);
      color: $color-forest-light;
    }
    .action-btn--primary:hover {
      background: $color-forest-light;
      color: $color-white;
    }
    .action-btn--secondary {
      background: rgba(166, 139, 91, 0.1);
      color: $color-sand;
    }
    .action-btn--secondary:hover {
      background: $color-sand;
      color: $color-white;
    }
    .action-btn--danger {
      background: rgba(184, 64, 64, 0.08);
      color: $color-danger;
      padding: 0.3rem;
    }
    .action-btn--danger:hover {
      background: $color-danger;
      color: $color-white;
    }

    :host .btn-primary {
      background: $color-forest;
      color: $color-cream;
    }

    .badge-toggle {
      border: none;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .badge-toggle:hover { opacity: 0.8; }
  `],
})
export class EventListComponent implements OnInit {
  private api = inject(ApiService);
  events = signal<EventSummary[]>([]);

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.api.getAdminEvents().subscribe((events) => this.events.set(events));
  }

  togglePublish(event: EventSummary) {
    this.api.updateEvent(event.id, { isPublished: !event.isPublished }).subscribe(() => {
      this.loadEvents();
    });
  }

  deleteEvent(event: EventSummary) {
    if (confirm(`Supprimer "${event.name}" ?`)) {
      this.api.deleteEvent(event.id).subscribe(() => this.loadEvents());
    }
  }
}

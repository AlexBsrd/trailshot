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
                <a [routerLink]="['/admin/events', event.id]">Gérer</a>
                <a [routerLink]="['/admin/events', event.id, 'tagger']">Tagger</a>
                <button class="action-delete" (click)="deleteEvent(event)">Supprimer</button>
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

    .actions { display: flex; gap: 0.75rem; }
    .actions a {
      color: $color-forest-light;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.15s;
    }
    .actions a:hover {
      color: $color-forest;
    }

    .action-delete {
      background: none;
      border: none;
      color: $color-danger;
      cursor: pointer;
      font-size: inherit;
      padding: 0;
      font-weight: 500;
      transition: color 0.15s;
    }
    .action-delete:hover {
      text-decoration: underline;
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

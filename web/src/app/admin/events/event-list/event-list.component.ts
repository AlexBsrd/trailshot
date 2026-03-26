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
                <button class="btn-toggle" [class.active]="event.isPublished" (click)="togglePublish(event)">
                  {{ event.isPublished ? 'Oui' : 'Non' }}
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
    .event-list { padding: 2rem; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    .table th { color: #6b7280; font-weight: 600; }
    .actions { display: flex; gap: 0.75rem; }
    .actions a { color: #2563eb; text-decoration: none; }
    .action-delete {
      background: none;
      border: none;
      color: #ef4444;
      cursor: pointer;
      font-size: inherit;
      padding: 0;
    }
    .action-delete:hover { text-decoration: underline; }
    .btn-toggle {
      background: #d1d5db;
      color: #6b7280;
      border: none;
      padding: 4px 12px;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-toggle.active { background: #22c55e; color: #fff; }
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

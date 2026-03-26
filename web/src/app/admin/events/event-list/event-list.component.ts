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
            <th>Publiee</th>
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
                <a [routerLink]="['/admin/events', event.id, 'edit']">Modifier</a>
                <a [routerLink]="['/admin/events', event.id, 'upload']">Photos</a>
                <a [routerLink]="['/admin/events', event.id, 'tagger']">Tagger</a>
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
      border-bottom: 1px solid #222;
    }
    .table th { color: #999; font-weight: 600; }
    .actions { display: flex; gap: 0.75rem; }
    .actions a { color: #4a9eff; text-decoration: none; }
    .btn-toggle {
      background: #333;
      color: #999;
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
}

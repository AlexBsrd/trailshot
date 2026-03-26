import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, EventSummary } from '../../../core/services/api.service';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="event-form-page">
      <h1>{{ isEdit() ? 'Modifier la course' : 'Nouvelle course' }}</h1>

      <form (ngSubmit)="save()">
        <label>Nom</label>
        <input type="text" [(ngModel)]="form.name" name="name" class="input" required />

        <label>Date</label>
        <input type="date" [(ngModel)]="form.date" name="date" class="input" required />

        <label>Lieu</label>
        <input type="text" [(ngModel)]="form.location" name="location" class="input" required />

        <label>Description</label>
        <textarea [(ngModel)]="form.description" name="description" class="input" rows="3"></textarea>

        <label class="checkbox-label">
          <input type="checkbox" [(ngModel)]="form.isFree" name="isFree" />
          Événement gratuit
        </label>

        @if (!form.isFree) {
          <div class="price-row">
            <div>
              <label>Prix unitaire (EUR)</label>
              <input type="number" [(ngModel)]="priceEuros" name="priceSingle" class="input" step="0.01" min="0" />
            </div>
            <div>
              <label>Prix pack (EUR)</label>
              <input type="number" [(ngModel)]="packEuros" name="pricePack" class="input" step="0.01" min="0" />
            </div>
          </div>
        }

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="saving()">
            {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
          <button type="button" class="btn btn-secondary" (click)="cancel()">Annuler</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    @use 'tokens' as *;
    @use 'animations' as *;

    .event-form-page { padding: 2rem; max-width: 600px; }

    h1 {
      font-family: $font-family;
      font-weight: $font-heading-weight;
      color: $color-forest;
      margin-bottom: 1.25rem;
    }

    form { display: flex; flex-direction: column; gap: 0.75rem; }

    label {
      color: $color-text;
      font-size: $font-size-small;
    }

    .checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }

    .price-row { display: flex; gap: 1rem; }
    .price-row > div { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }

    .form-actions { display: flex; gap: 0.75rem; margin-top: 1rem; }

    :host .btn-primary {
      background: $color-forest;
      color: $color-cream;
    }

    :host .btn-secondary {
      background: transparent;
      color: $color-text-muted;
      border: none;
      font-weight: 500;
      transition: color 0.15s;
    }
    :host .btn-secondary:hover {
      color: $color-text;
    }
  `],
})
export class EventFormComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEdit = signal(false);
  saving = signal(false);
  eventId = '';

  form = {
    name: '',
    date: '',
    location: '',
    description: '',
    isFree: false,
  };
  priceEuros = 3;
  packEuros = 15;

  ngOnInit() {
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    if (this.eventId) {
      this.isEdit.set(true);
      this.api.getAdminEvents().subscribe((events) => {
        const event = events.find((e) => e.id === this.eventId);
        if (event) {
          this.form.name = event.name;
          this.form.date = event.date;
          this.form.location = event.location;
          this.form.isFree = event.isFree;
          this.priceEuros = event.priceSingle / 100;
          this.packEuros = event.pricePack / 100;
        }
      });
    }
  }

  save() {
    this.saving.set(true);
    const data = {
      ...this.form,
      priceSingle: Math.round(this.priceEuros * 100),
      pricePack: Math.round(this.packEuros * 100),
    };

    const obs = this.isEdit()
      ? this.api.updateEvent(this.eventId, data)
      : this.api.createEvent(data);

    obs.subscribe({
      next: () => this.router.navigate(['/admin/events']),
      error: () => this.saving.set(false),
    });
  }

  cancel() {
    this.router.navigate(['/admin/events']);
  }
}

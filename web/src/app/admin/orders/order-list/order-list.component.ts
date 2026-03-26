import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-order-list',
  standalone: true,
  template: `
    <div class="orders-page">
      <h1>Commandes</h1>

      <div class="stats">
        <div class="stat">
          <span class="stat-value">{{ totalOrders() }}</span>
          <span class="stat-label">Commandes</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ formatPrice(totalRevenue()) }}</span>
          <span class="stat-label">Revenus</span>
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Course</th>
            <th>Email</th>
            <th>Type</th>
            <th>Total</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          @for (order of orders(); track order.id) {
            <tr>
              <td>{{ formatDate(order.createdAt) }}</td>
              <td>{{ order.event?.name || '-' }}</td>
              <td>{{ order.email }}</td>
              <td>
                @if (order.isPack) {
                  <span class="badge badge-pack">Pack</span>
                } @else {
                  Individual
                }
              </td>
              <td>{{ formatPrice(order.totalCents) }}</td>
              <td>
                <span class="badge" [class]="'badge-' + order.status">
                  {{ order.status }}
                </span>
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

    .orders-page { padding: 2rem; }
    .orders-page h1 {
      font-family: $font-family;
      font-weight: $font-heading-weight;
      color: $color-forest;
      font-size: $font-size-h1;
    }
    .stats {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .stat {
      background: $color-white;
      padding: 1rem 1.5rem;
      border-radius: $radius-md;
      display: flex;
      flex-direction: column;
      box-shadow: $shadow-card;
    }
    .stat-value {
      font-size: 1.5rem;
      font-family: $font-family;
      font-weight: $font-heading-weight;
      color: $color-forest;
    }
    .stat-label {
      color: $color-sand;
      font-size: $font-size-small;
    }
    .table { width: 100%; border-collapse: collapse; }
    .table thead th {
      background: rgba(27, 58, 45, 0.05);
    }
    .table th, .table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid rgba(27, 58, 45, 0.08);
    }
    .table th {
      color: $color-text-muted;
      font-weight: 600;
    }
    .table tbody tr:nth-child(odd) { background: $color-white; }
    .table tbody tr:nth-child(even) { background: $color-cream; }
    .table tbody tr:hover { background: rgba(166, 139, 91, 0.08); }
    .badge-pack { background: $color-forest-light; }
    .badge-delivered { background: $color-success; }
    .badge-pending { background: $color-warning; }
    .badge-paid { background: $color-success; }
    .badge {
      padding: 2px 8px;
      border-radius: $radius-sm;
      font-size: $font-size-xs;
      color: $color-white;
    }
  `],
})
export class OrderListComponent implements OnInit {
  private api = inject(ApiService);
  orders = signal<any[]>([]);

  totalOrders = computed(() => this.orders().length);
  totalRevenue = computed(() => this.orders().reduce((sum: number, o: any) => sum + o.totalCents, 0));

  ngOnInit() {
    this.api.getAdminOrders().subscribe((orders) => this.orders.set(orders));
  }

  formatPrice(cents: number): string {
    return (cents / 100).toFixed(2) + ' \u20AC';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }
}

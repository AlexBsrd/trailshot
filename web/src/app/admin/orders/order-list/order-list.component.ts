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
    .orders-page { padding: 2rem; }
    .stats {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .stat {
      background: #fff;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
    }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #2563eb; }
    .stat-label { color: #6b7280; font-size: 0.875rem; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    .table th { color: #6b7280; font-weight: 600; }
    .badge-pack { background: #2563eb; }
    .badge-delivered { background: #22c55e; }
    .badge-pending { background: #f59e0b; }
    .badge-paid { background: #22c55e; }
    .badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      color: #fff;
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

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { environment } from '../../../../environments/environment';

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
        <div class="stat">
          <span class="stat-value">{{ uniqueEmails() }}</span>
          <span class="stat-label">Clients</span>
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th></th>
            <th>N\u00B0</th>
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
            <tr class="order-row" (click)="toggleDetail(order.id)" [class.expanded]="expandedId() === order.id">
              <td class="chevron-cell">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  [style.transform]="expandedId() === order.id ? 'rotate(90deg)' : ''"
                  style="transition: transform 0.2s">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </td>
              <td class="order-num-cell">{{ formatOrderNum(order.orderNumber) }}</td>
              <td>{{ formatDateTime(order.createdAt) }}</td>
              <td>{{ order.event?.name || '-' }}</td>
              <td class="email-cell">{{ order.email }}</td>
              <td>
                @if (order.isPack) {
                  <span class="badge badge-pack">Pack</span>
                } @else {
                  <span class="type-individual">Individuel</span>
                }
              </td>
              <td class="price-cell">
                @if (order.totalCents === 0) {
                  <span class="free-label">Gratuit</span>
                } @else {
                  {{ formatPrice(order.totalCents) }}
                }
              </td>
              <td>
                <span class="badge" [class]="'badge-' + order.status">
                  {{ statusLabel(order.status) }}
                </span>
              </td>
            </tr>
            @if (expandedId() === order.id) {
              <tr class="detail-row">
                <td colspan="8">
                  <div class="detail-panel">
                    @if (orderDetail()) {
                      <div class="detail-grid">
                        <div class="detail-section">
                          <h3>Informations</h3>
                          <div class="detail-field">
                            <span class="field-label">Commande</span>
                            <span class="field-value field-mono">{{ orderDetail()!.orderNumber }}</span>
                          </div>
                          <div class="detail-field">
                            <span class="field-label">Date</span>
                            <span class="field-value">{{ formatFull(orderDetail()!.createdAt) }}</span>
                          </div>
                          <div class="detail-field">
                            <span class="field-label">Email</span>
                            <span class="field-value">{{ orderDetail()!.email }}</span>
                          </div>
                          <div class="detail-field">
                            <span class="field-label">Expiration lien</span>
                            <span class="field-value">{{ formatFull(orderDetail()!.downloadExpiresAt) }}</span>
                          </div>
                          @if (allBibs().length > 0) {
                            <div class="detail-field">
                              <span class="field-label">Dossard(s)</span>
                              <span class="field-value">
                                @for (bib of allBibs(); track bib) {
                                  <span class="bib-tag">{{ bib }}</span>
                                }
                              </span>
                            </div>
                          }
                          <div class="detail-actions">
                            <button class="btn-resend" (click)="resendEmail(orderDetail()!.id, $event)" [disabled]="resending()">
                              @if (resending()) {
                                <span class="spinner"></span>
                              } @else if (resendSuccess()) {
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                                Envoy\u00E9 !
                              } @else {
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                Renvoyer le lien par email
                              }
                            </button>
                          </div>
                        </div>
                        <div class="detail-section">
                          <h3>Photos ({{ orderDetail()!.photos.length }})</h3>
                          <div class="detail-photos">
                            @for (photo of orderDetail()!.photos; track photo.id) {
                              <div class="detail-photo">
                                <img [src]="getThumbnailUrl(photo.thumbnailKey)" alt="" />
                                @if (photo.bibs.length > 0) {
                                  <span class="photo-bib">{{ photo.bibs.join(', ') }}</span>
                                }
                              </div>
                            }
                          </div>
                        </div>
                      </div>
                    } @else {
                      <div class="detail-loading">Chargement...</div>
                    }
                  </div>
                </td>
              </tr>
            }
          }
        </tbody>
      </table>

      @if (orders().length === 0) {
        <p class="empty">Aucune commande pour le moment.</p>
      }
    </div>
  `,
  styles: [`
    @use 'tokens' as *;

    .orders-page { padding: 2rem; }
    .orders-page h1 {
      font-family: $font-family;
      font-weight: $font-heading-weight;
      color: $color-forest;
      font-size: $font-size-h1;
    }

    /* Stats */
    .stats {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    .stat {
      background: $color-white;
      padding: 1rem 1.5rem;
      border-radius: $radius-md;
      display: flex;
      flex-direction: column;
      box-shadow: $shadow-card;
      min-width: 120px;
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

    /* Table */
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
      font-size: $font-size-small;
    }
    .table tbody tr:nth-child(odd) { background: $color-white; }
    .table tbody tr:nth-child(even) { background: $color-cream; }

    .order-row {
      cursor: pointer;
      transition: background 0.15s;

      &:hover { background: rgba(166, 139, 91, 0.08) !important; }
      &.expanded { background: rgba(74, 123, 90, 0.06) !important; }
    }
    .chevron-cell {
      width: 32px;
      color: $color-text-muted;
    }
    .order-num-cell {
      font-family: monospace;
      font-size: $font-size-xs;
      color: $color-forest;
      font-weight: 600;
      white-space: nowrap;
    }
    .email-cell {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .price-cell { font-weight: 600; }
    .free-label {
      color: $color-forest-light;
      font-weight: 600;
      font-size: $font-size-small;
    }
    .type-individual {
      color: $color-text-muted;
      font-size: $font-size-small;
    }

    /* Badges */
    .badge {
      padding: 2px 8px;
      border-radius: $radius-sm;
      font-size: $font-size-xs;
      color: $color-white;
      font-weight: 600;
    }
    .badge-pack { background: $color-forest-light; }
    .badge-delivered { background: $color-success; }
    .badge-pending { background: $color-warning; }
    .badge-paid { background: $color-success; }

    /* Detail row */
    .detail-row td {
      padding: 0 !important;
      border-bottom: 2px solid $color-forest-light;
      background: rgba(74, 123, 90, 0.03) !important;
    }
    .detail-panel {
      padding: 1.25rem 1.5rem;
    }
    .detail-loading {
      color: $color-text-muted;
      padding: 1rem;
      text-align: center;
    }

    /* Detail grid */
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;

      @media (max-width: $breakpoint-md) {
        grid-template-columns: 1fr;
      }
    }
    .detail-section h3 {
      font-family: $font-family;
      font-weight: $font-subheading-weight;
      color: $color-forest;
      font-size: $font-size-body;
      margin: 0 0 0.75rem;
    }
    .detail-field {
      display: flex;
      gap: 0.75rem;
      padding: 0.35rem 0;
      font-size: $font-size-small;
    }
    .field-label {
      color: $color-text-muted;
      min-width: 110px;
      flex-shrink: 0;
    }
    .field-value {
      color: $color-text;
      word-break: break-all;
    }
    .field-mono {
      font-family: monospace;
      font-size: $font-size-xs;
    }
    .bib-tag {
      display: inline-block;
      background: $color-sand-light;
      color: $color-forest;
      padding: 2px 8px;
      border-radius: $radius-sm;
      font-size: $font-size-xs;
      font-weight: 600;
      margin-right: 4px;
    }

    /* Detail actions */
    .detail-actions {
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid rgba(27, 58, 45, 0.08);
    }
    .btn-resend {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: $color-forest;
      color: $color-cream;
      border: none;
      border-radius: $radius-sm;
      padding: 0.5rem 1rem;
      font-size: $font-size-xs;
      font-weight: 600;
      font-family: $font-family;
      cursor: pointer;
      transition: background 0.15s;

      &:hover { background: $color-forest-light; }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: $color-cream;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Detail photos */
    .detail-photos {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 8px;
    }
    .detail-photo {
      position: relative;
    }
    .detail-photo img {
      width: 100%;
      aspect-ratio: 4 / 3;
      object-fit: cover;
      border-radius: $radius-sm;
      display: block;
    }
    .photo-bib {
      position: absolute;
      bottom: 3px;
      left: 3px;
      background: rgba(27, 58, 45, 0.7);
      color: $color-cream;
      font-size: 10px;
      padding: 1px 5px;
      border-radius: 3px;
    }

    .empty {
      color: $color-text-muted;
      text-align: center;
      padding: 3rem;
    }
  `],
})
export class OrderListComponent implements OnInit {
  private api = inject(ApiService);

  orders = signal<any[]>([]);
  expandedId = signal<string | null>(null);
  orderDetail = signal<any>(null);
  resending = signal(false);
  resendSuccess = signal(false);

  totalOrders = computed(() => this.orders().length);
  totalRevenue = computed(() => this.orders().reduce((sum: number, o: any) => sum + o.totalCents, 0));
  uniqueEmails = computed(() => new Set(this.orders().map((o: any) => o.email)).size);
  allBibs = computed(() => {
    const detail = this.orderDetail();
    if (!detail) return [];
    const bibs = new Set<string>();
    detail.photos.forEach((p: any) => p.bibs.forEach((b: string) => bibs.add(b)));
    return [...bibs];
  });

  ngOnInit() {
    this.api.getAdminOrders().subscribe((orders) => this.orders.set(orders));
  }

  toggleDetail(orderId: string) {
    if (this.expandedId() === orderId) {
      this.expandedId.set(null);
      this.orderDetail.set(null);
    } else {
      this.expandedId.set(orderId);
      this.orderDetail.set(null);
      this.resendSuccess.set(false);
      this.api.getAdminOrder(orderId).subscribe((detail) => this.orderDetail.set(detail));
    }
  }

  resendEmail(orderId: string, event: Event) {
    event.stopPropagation();
    this.resending.set(true);
    this.resendSuccess.set(false);
    this.api.resendOrderEmail(orderId).subscribe({
      next: () => {
        this.resending.set(false);
        this.resendSuccess.set(true);
        setTimeout(() => this.resendSuccess.set(false), 3000);
      },
      error: () => this.resending.set(false),
    });
  }

  formatOrderNum(num: number): string {
    if (!num) return '-';
    return `TS-${String(num).padStart(5, '0')}`;
  }

  getThumbnailUrl(key: string): string {
    return `${environment.storageUrl}/${key}`;
  }

  formatPrice(cents: number): string {
    return (cents / 100).toFixed(2) + ' \u20AC';
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatFull(date: string): string {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      paid: 'Payé',
      delivered: 'Livré',
    };
    return labels[status] ?? status;
  }
}

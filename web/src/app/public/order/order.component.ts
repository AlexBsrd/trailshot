import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { CartService } from '../../core/services/cart.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="order-page">
      @if (cart.count() === 0 && !orderComplete()) {
        <div class="empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <h2>Votre panier est vide</h2>
          <p>Parcourez les courses pour sélectionner vos photos.</p>
          <a routerLink="/events" class="btn-action">Voir les courses</a>
        </div>
      } @else if (!orderComplete()) {
        <div class="order-layout">
          <div class="cart-section">
            <div class="section-header">
              <h1>Votre panier</h1>
              <span class="item-count">{{ cart.count() }} photo{{ cart.count() > 1 ? 's' : '' }}</span>
            </div>

            @if (cart.event()) {
              <p class="event-label">{{ cart.event()!.name }}</p>
            }

            @if (cart.isPackMode()) {
              <div class="pack-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                Pack complet{{ cart.packBibNumber() ? ' — Dossard ' + cart.packBibNumber() : '' }}
              </div>
            }

            <div class="photo-list">
              @for (item of cart.cartItems(); track item.photoId) {
                <div class="photo-item">
                  @if (item.thumbnailKey) {
                    <img [src]="getThumbnailUrl(item.thumbnailKey)" alt="Photo" class="photo-thumb" />
                  } @else {
                    <div class="photo-thumb photo-thumb--placeholder">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                    </div>
                  }
                  <div class="photo-item-info">
                    <span class="photo-item-id">Photo</span>
                    @if (!cart.isPackMode() && cart.event()) {
                      <span class="photo-item-price">{{ cart.event()!.isFree ? 'Gratuit' : formatPrice(cart.event()!.priceSingle) }}</span>
                    }
                  </div>
                  <button class="remove-btn" (click)="removeItem(item.photoId)" title="Retirer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              }
            </div>
          </div>

          <div class="checkout-section">
            @if (cart.event()) {
              @if (!cart.event()!.isFree) {
                <div class="price-breakdown">
                  @if (cart.isPackMode()) {
                    <div class="price-row">
                      <span>Pack {{ cart.count() }} photos</span>
                      <span class="price">{{ formatPrice(cart.event()!.pricePack) }}</span>
                    </div>
                  } @else {
                    <div class="price-row">
                      <span>{{ cart.count() }} &times; {{ formatPrice(cart.event()!.priceSingle) }}</span>
                      <span class="price">{{ formatPrice(cart.count() * cart.event()!.priceSingle) }}</span>
                    </div>
                  }
                  <div class="price-row price-row--total">
                    <span>Total</span>
                    <span class="price">{{ formatPrice(totalPrice()) }}</span>
                  </div>
                </div>
              } @else {
                <div class="free-badge">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                  Course gratuite — {{ cart.count() }} photo{{ cart.count() > 1 ? 's' : '' }}
                </div>
              }
            }

            <form (ngSubmit)="submit()" class="checkout-form">
              <label for="email">Email pour recevoir vos photos</label>
              <input
                type="email"
                id="email"
                [(ngModel)]="email"
                name="email"
                placeholder="nom&#64;exemple.com"
                required
              />
              <p class="notice">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                Lien de téléchargement valide 30 jours
              </p>
              <button type="submit" class="btn-submit" [class.btn-submit--free]="cart.event()?.isFree" [disabled]="!emailValid || submitting()">
                @if (submitting()) {
                  <span class="spinner"></span> Traitement...
                } @else if (cart.event()?.isFree) {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Télécharger
                } @else {
                  Commander — {{ formatPrice(totalPrice()) }}
                }
              </button>
            </form>
          </div>
        </div>
      } @else {
        <div class="success">
          <div class="success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h2>Commande confirmée</h2>
          <p class="order-num">{{ orderNumber() }}</p>
          <p>Vos photos sont prêtes au téléchargement.</p>
          <p class="notice">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Lien valide jusqu'au {{ expiresAt() }}
          </p>
          <div class="success-actions">
            <a [href]="downloadUrl()" class="btn-submit" target="_blank">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Télécharger
            </a>
            <a [href]="receiptUrl()" class="btn-receipt" target="_blank">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              Télécharger le reçu
            </a>
          </div>

          <div class="link-box">
            <span class="link-label">Lien de téléchargement</span>
            <div class="link-row">
              <input type="text" [value]="downloadUrl()" readonly class="link-input" #linkInput />
              <button class="link-copy" (click)="copyLink(linkInput)" [class.copied]="copied()">
                @if (copied()) {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                } @else {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                }
              </button>
            </div>
          </div>

          <a routerLink="/events" class="btn-secondary">Retour aux courses</a>
        </div>
      }
    </div>
  `,
  styles: [`
    @use 'tokens' as *;
    @use 'animations' as *;

    .order-page {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      min-height: 100vh;
    }

    /* ── Empty state ── */
    .empty {
      text-align: center;
      padding: 4rem 2rem;
      color: $color-text-muted;

      svg { margin-bottom: 1rem; opacity: 0.4; }
      h2 {
        color: $color-forest;
        font-weight: $font-heading-weight;
        margin-bottom: 0.5rem;
      }
      p { margin-bottom: 1.5rem; }
    }

    /* ── Order layout ── */
    .order-layout {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 2rem;
      align-items: start;

      @media (max-width: $breakpoint-md) {
        grid-template-columns: 1fr;
      }
    }

    /* ── Cart section ── */
    .cart-section {
      background: $color-white;
      border-radius: $radius-lg;
      padding: 1.5rem;
      box-shadow: $shadow-card;
    }
    .section-header {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
      margin-bottom: 0.25rem;

      h1 {
        color: $color-forest;
        font-weight: $font-heading-weight;
        font-size: $font-size-h1;
        margin: 0;
      }
    }
    .item-count {
      color: $color-text-muted;
      font-size: $font-size-small;
    }
    .event-label {
      color: $color-sand;
      font-size: $font-size-small;
      font-weight: 500;
      margin: 0 0 1rem;
    }
    .pack-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: $color-forest;
      color: $color-cream;
      font-size: $font-size-xs;
      font-weight: $font-subheading-weight;
      padding: 4px 12px;
      border-radius: $radius-sm;
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* ── Photo list ── */
    .photo-list {
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .photo-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);

      &:last-child { border-bottom: none; }
    }
    .photo-thumb {
      width: 64px;
      height: 48px;
      object-fit: cover;
      border-radius: $radius-sm;
      flex-shrink: 0;
    }
    .photo-thumb--placeholder {
      background: rgba(27, 58, 45, 0.06);
      display: flex;
      align-items: center;
      justify-content: center;
      color: $color-text-muted;
    }
    .photo-item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .photo-item-id {
      color: $color-text;
      font-size: $font-size-small;
    }
    .photo-item-price {
      color: $color-text-muted;
      font-size: $font-size-xs;
    }
    .remove-btn {
      flex-shrink: 0;
      background: none;
      border: none;
      cursor: pointer;
      color: $color-text-muted;
      padding: 4px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s, background 0.15s;

      &:hover {
        color: $color-danger;
        background: rgba($color-danger, 0.08);
      }
    }

    /* ── Checkout section ── */
    .checkout-section {
      position: sticky;
      top: 80px;
      background: $color-white;
      border-radius: $radius-lg;
      padding: 1.5rem;
      box-shadow: $shadow-card;
    }
    .price-breakdown {
      margin-bottom: 1.5rem;
    }
    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      color: $color-text;
      font-size: $font-size-body;
    }
    .price-row--total {
      border-top: 2px solid $color-forest;
      margin-top: 0.5rem;
      padding-top: 0.75rem;
      font-weight: $font-heading-weight;
      color: $color-forest;
      font-size: $font-size-h2;
    }
    .price {
      font-weight: $font-subheading-weight;
    }

    .checkout-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .checkout-form label {
      color: $color-text;
      font-weight: 500;
      font-size: $font-size-small;
    }
    .checkout-form input {
      border: 1.5px solid rgba(27, 58, 45, 0.15);
      border-radius: 8px;
      padding: 0.7rem 0.75rem;
      font-size: $font-size-body;
      font-family: $font-family;
      color: $color-text;
      outline: none;
      transition: border-color 0.2s;
      background: $color-cream;

      &::placeholder { color: $color-text-muted; }
      &:focus { border-color: $color-forest-light; }
    }
    .notice {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: $color-text-muted;
      font-size: $font-size-xs;
    }
    .btn-submit {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: $color-forest;
      color: $color-cream;
      border: none;
      border-radius: 8px;
      padding: 0.8rem 1.5rem;
      font-size: $font-size-body;
      font-weight: $font-subheading-weight;
      font-family: $font-family;
      cursor: pointer;
      transition: background 0.2s;
      text-decoration: none;
      margin-top: 0.5rem;

      &:hover { background: $color-forest-light; }
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: $color-cream;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ── Success state ── */
    .success {
      text-align: center;
      padding: 3rem 2rem;
      @include fade-in-up;
    }
    .success-icon {
      color: $color-success;
      margin-bottom: 1rem;
    }
    .success h2 {
      color: $color-forest;
      font-weight: $font-heading-weight;
      margin-bottom: 0.5rem;
    }
    .success p {
      color: $color-text;
      margin-bottom: 0.25rem;
    }
    .success .notice {
      justify-content: center;
      margin-bottom: 1.5rem;
    }
    .order-num {
      font-family: monospace;
      font-size: $font-size-h2;
      font-weight: $font-heading-weight;
      color: $color-forest;
      margin-bottom: 0.5rem;
    }
    .success-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: center;
    }
    .btn-receipt {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: none;
      color: $color-forest-light;
      border: 1.5px solid $color-forest-light;
      border-radius: 8px;
      padding: 0.6rem 1.2rem;
      font-size: $font-size-small;
      font-weight: 500;
      font-family: $font-family;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.2s, color 0.2s;

      &:hover { background: rgba(74, 123, 90, 0.08); }
    }
    .btn-secondary {
      background: none;
      color: $color-forest-light;
      border: none;
      font-size: $font-size-body;
      font-weight: 500;
      font-family: $font-family;
      cursor: pointer;
      text-decoration: none;
      transition: opacity 0.2s;

      &:hover { opacity: 0.7; }
    }

    .link-box {
      margin-top: 1.5rem;
      text-align: left;
    }
    .link-label {
      display: block;
      color: $color-text-muted;
      font-size: $font-size-xs;
      margin-bottom: 0.4rem;
    }
    .link-row {
      display: flex;
      gap: 0;
      border: 1.5px solid rgba(27, 58, 45, 0.15);
      border-radius: 8px;
      overflow: hidden;
    }
    .link-input {
      flex: 1;
      border: none;
      background: $color-cream;
      padding: 0.6rem 0.75rem;
      font-size: $font-size-xs;
      font-family: monospace;
      color: $color-text-muted;
      outline: none;
      min-width: 0;
    }
    .link-copy {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      background: $color-cream;
      border: none;
      border-left: 1.5px solid rgba(27, 58, 45, 0.15);
      color: $color-forest;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;

      &:hover { background: rgba(27, 58, 45, 0.06); }
      &.copied { color: $color-success; }
    }

    .free-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: $color-forest;
      font-weight: $font-subheading-weight;
      font-size: $font-size-h2;
      margin-bottom: 0.5rem;
    }
    .free-note {
      color: $color-text-muted;
      font-size: $font-size-small;
      margin: 0 0 1.25rem;
    }
    .btn-submit--free {
      background: $color-forest-light;
      width: 100%;
    }

    .btn-action {
      display: inline-block;
      background: $color-sand-light;
      color: $color-forest;
      font-weight: $font-subheading-weight;
      border-radius: 8px;
      padding: 0.75rem 1.5rem;
      text-decoration: none;
      transition: opacity 0.2s;

      &:hover { opacity: 0.9; }
    }
  `],
})
export class OrderComponent {
  cart = inject(CartService);
  private api = inject(ApiService);

  email = '';
  submitting = signal(false);
  orderComplete = signal(false);
  downloadUrl = signal('');
  receiptUrl = signal('');
  orderNumber = signal('');
  expiresAt = signal('');
  copied = signal(false);

  totalPrice(): number {
    const ev = this.cart.event();
    if (!ev) return 0;
    if (this.cart.isPackMode()) return ev.pricePack;
    return this.cart.count() * ev.priceSingle;
  }

  removeItem(photoId: string) {
    this.cart.remove(photoId);
  }

  getThumbnailUrl(thumbnailKey: string): string {
    return `${environment.storageUrl}/${thumbnailKey}`;
  }

  formatPrice(cents: number): string {
    return (cents / 100).toFixed(2) + ' \u20AC';
  }

  copyLink(input: HTMLInputElement) {
    navigator.clipboard.writeText(input.value).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  get emailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  submit() {
    if (!this.emailValid) return;
    this.submitting.set(true);
    this.createOrder(this.email);
  }

  private createOrder(email: string) {
    const items = this.cart.cartItems();
    if (items.length === 0) return;

    const eventId = items[0].eventId;
    const photoIds = this.cart.getPhotoIds();
    const isPack = this.cart.isPackMode();

    this.api.createOrder({ eventId, email, photoIds, isPack }).subscribe({
      next: (order) => {
        const baseUrl = environment.apiUrl;
        if (photoIds.length > 1) {
          this.downloadUrl.set(`${baseUrl}/orders/${order.id}/download-zip?token=${order.downloadToken}`);
        } else {
          this.downloadUrl.set(`${baseUrl}/orders/${order.id}/download?token=${order.downloadToken}`);
        }
        this.receiptUrl.set(`${baseUrl}/orders/${order.id}/receipt?token=${order.downloadToken}`);
        this.orderNumber.set(`TS-${String(order.orderNumber).padStart(5, '0')}`);
        this.expiresAt.set(new Date(order.downloadExpiresAt).toLocaleDateString('fr-FR'));
        this.orderComplete.set(true);
        this.submitting.set(false);
        this.cart.clear();
      },
      error: () => this.submitting.set(false),
    });
  }
}

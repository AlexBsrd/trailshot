import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, EventSummary } from '../../core/services/api.service';
import { CartService } from '../../core/services/cart.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="order-page">
      <h1>Votre commande</h1>

      @if (cart.count() === 0 && !orderComplete()) {
        <div class="empty">
          <p>Votre panier est vide.</p>
          <a routerLink="/events" class="btn btn-primary">Voir les courses</a>
        </div>
      } @else if (!orderComplete()) {
        <div class="order-summary">
          <p>{{ cart.count() }} photo(s) sélectionnée(s)
            @if (cart.isPackMode()) {
              <span class="badge badge-pack">Pack</span>
            }
          </p>
        </div>

        <form (ngSubmit)="submit()" class="order-form">
          <label for="email">Votre adresse email</label>
          <input
            type="email"
            id="email"
            [(ngModel)]="email"
            name="email"
            placeholder="nom&#64;exemple.com"
            class="input"
            required
          />
          <p class="notice">Vos photos sont téléchargeables pendant 30 jours.</p>
          <button type="submit" class="btn btn-primary" [disabled]="!email || submitting()">
            @if (submitting()) {
              Traitement en cours...
            } @else {
              Télécharger
            }
          </button>
        </form>
      } @else {
        <div class="success">
          <h2>Commande confirmée !</h2>
          <p>Vos photos sont prêtes au téléchargement.</p>
          <p class="notice">Lien valide jusqu'au {{ expiresAt() }}</p>
          <a [href]="downloadUrl()" class="btn btn-primary" target="_blank">
            Télécharger
          </a>
          <a routerLink="/events" class="btn btn-secondary">Retour aux courses</a>
        </div>
      }
    </div>
  `,
  styles: [`
    @use 'tokens' as *;
    @use 'animations' as *;

    .order-page {
      padding: 2rem;
      max-width: 600px;
      margin: 0 auto;
      background: $color-cream;
      min-height: 100vh;
    }
    .order-page h1 {
      color: $color-forest;
      font-weight: $font-heading-weight;
      margin-bottom: 1.5rem;
    }
    .order-summary {
      background: $color-white;
      padding: 1rem;
      border-radius: $radius-md;
      margin-bottom: 1.5rem;
      box-shadow: $shadow-card;
      color: $color-text;
      font-weight: $font-subheading-weight;
    }
    .order-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .order-form label {
      color: $color-text;
      font-weight: 500;
    }
    .order-form .btn-primary {
      background: $color-sand-light;
      color: $color-forest;
      font-weight: $font-subheading-weight;
      border-radius: 8px;
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      margin-top: 0.5rem;
    }
    .notice {
      color: $color-text-muted;
      font-size: $font-size-small;
    }

    /* Empty cart */
    .empty {
      text-align: center;
      padding: 3rem;
    }
    .empty p {
      color: $color-text-muted;
      margin-bottom: 1rem;
    }
    .empty .btn-primary {
      background: $color-sand-light;
      color: $color-forest;
      font-weight: $font-subheading-weight;
      border-radius: 8px;
    }

    /* Success state */
    .success {
      text-align: center;
      padding: 2rem;
      @include fade-in-up;
    }
    .success h2 {
      color: $color-success;
      margin-bottom: 0.5rem;
      font-weight: $font-heading-weight;
    }
    .success p {
      color: $color-text;
    }
    .success .notice {
      color: $color-text-muted;
      font-size: $font-size-small;
    }
    .success .btn {
      margin: 0.5rem;
    }
    .success .btn-primary {
      background: $color-forest-light;
      color: $color-white;
      font-weight: $font-subheading-weight;
      border-radius: 8px;
    }
    .success .btn-secondary {
      background: $color-sand-light;
      color: $color-forest;
      border-radius: 8px;
    }

    .badge-pack {
      background: $color-sand;
      color: $color-white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: $font-size-xs;
      font-weight: 600;
      margin-left: 0.5rem;
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
  expiresAt = signal('');

  submit() {
    if (!this.email) return;
    this.submitting.set(true);

    const items = this.cart.cartItems();
    if (items.length === 0) return;

    const eventId = items[0].eventId;
    const photoIds = this.cart.getPhotoIds();
    const isPack = this.cart.isPackMode();

    this.api.createOrder({ eventId, email: this.email, photoIds, isPack }).subscribe({
      next: (order) => {
        const baseUrl = environment.apiUrl;
        if (photoIds.length > 1) {
          this.downloadUrl.set(`${baseUrl}/orders/${order.id}/download-zip?token=${order.downloadToken}`);
        } else {
          this.downloadUrl.set(`${baseUrl}/orders/${order.id}/download?token=${order.downloadToken}`);
        }
        this.expiresAt.set(new Date(order.downloadExpiresAt).toLocaleDateString('fr-FR'));
        this.orderComplete.set(true);
        this.submitting.set(false);
        this.cart.clear();
      },
      error: () => this.submitting.set(false),
    });
  }
}

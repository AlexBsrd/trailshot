import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <a routerLink="/" class="logo">
        <span class="logo-trail">Trail</span><span class="logo-shot">Shot</span>
      </a>
      <div class="nav-links">
        <a routerLink="/events" routerLinkActive="active">Courses</a>
        <a routerLink="/about" routerLinkActive="active">À propos</a>
        @if (cart.count() > 0) {
          <a routerLink="/order" class="cart-link">
            Panier ({{ cart.count() }})
          </a>
        }
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: #fff;
      border-bottom: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .logo { text-decoration: none; font-size: 1.5rem; font-weight: 700; }
    .logo-trail { color: #1a1a1a; }
    .logo-shot { color: #2563eb; }
    .nav-links { display: flex; gap: 1.5rem; align-items: center; }
    .nav-links a {
      color: #6b7280;
      text-decoration: none;
      transition: color 0.2s;
    }
    .nav-links a:hover, .nav-links a.active { color: #1a1a1a; }
    .cart-link {
      background: #2563eb;
      color: #fff !important;
      padding: 0.4rem 1rem;
      border-radius: 6px;
    }
  `],
})
export class NavbarComponent {
  cart = inject(CartService);
}

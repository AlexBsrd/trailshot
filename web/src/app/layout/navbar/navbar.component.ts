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
        <a routerLink="/about" routerLinkActive="active">A propos</a>
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
      background: #111;
      border-bottom: 1px solid #222;
    }
    .logo { text-decoration: none; font-size: 1.5rem; font-weight: 700; }
    .logo-trail { color: #fff; }
    .logo-shot { color: #4a9eff; }
    .nav-links { display: flex; gap: 1.5rem; align-items: center; }
    .nav-links a {
      color: #999;
      text-decoration: none;
      transition: color 0.2s;
    }
    .nav-links a:hover, .nav-links a.active { color: #fff; }
    .cart-link {
      background: #4a9eff;
      color: #fff !important;
      padding: 0.4rem 1rem;
      border-radius: 6px;
    }
  `],
})
export class NavbarComponent {
  cart = inject(CartService);
}

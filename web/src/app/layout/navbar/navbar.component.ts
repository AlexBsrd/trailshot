import { Component, inject, OnInit, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar" [class.navbar--scrolled]="isScrolled()" [class.navbar--solid]="!isHeroPage()">
      <a routerLink="/" class="logo">
        <span class="logo-trail">TRAIL</span><span class="logo-shot">SHOT</span>
      </a>

      <!-- Desktop nav links -->
      <div class="nav-links">
        <a routerLink="/events" routerLinkActive="active">Courses</a>
        <a routerLink="/about" routerLinkActive="active">À propos</a>
        @if (cart.count() > 0) {
          <a routerLink="/order" class="cart-link">
            Panier ({{ cart.count() }})
          </a>
        }
      </div>

      <!-- Mobile hamburger button -->
      <button
        class="hamburger"
        (click)="toggleMobileMenu()"
        [attr.aria-expanded]="mobileMenuOpen()"
        aria-label="Menu de navigation"
      >
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>
    </nav>

    <!-- Mobile menu backdrop -->
    @if (mobileMenuOpen()) {
      <div class="mobile-backdrop" (click)="closeMobileMenu()"></div>
    }

    <!-- Mobile off-canvas menu -->
    <div class="mobile-menu" [class.mobile-menu--open]="mobileMenuOpen()">
      <button class="mobile-close" (click)="closeMobileMenu()" aria-label="Fermer le menu">
        &times;
      </button>
      <nav class="mobile-nav">
        <a routerLink="/events" routerLinkActive="active" (click)="closeMobileMenu()">Courses</a>
        <a routerLink="/about" routerLinkActive="active" (click)="closeMobileMenu()">À propos</a>
        @if (cart.count() > 0) {
          <a routerLink="/order" class="cart-link" (click)="closeMobileMenu()">
            Panier ({{ cart.count() }})
          </a>
        }
      </nav>
    </div>
  `,
  styles: [`
    @use 'tokens' as *;

    .navbar {
      position: fixed;
      top: 0;
      width: 100%;
      z-index: 200;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: transparent;
      transition: background 0.3s, box-shadow 0.3s;
    }

    .navbar--scrolled,
    .navbar--solid {
      background: $glass-nav-bg;
      backdrop-filter: $glass-nav-blur;
      -webkit-backdrop-filter: $glass-nav-blur;
      box-shadow: $shadow-card;
    }

    .logo {
      text-decoration: none;
      font-size: 1.5rem;
      font-weight: $font-heading-weight;
      letter-spacing: 1.5px;
    }

    .logo-trail,
    .logo-shot {
      color: $color-cream;
    }

    .nav-links {
      display: flex;
      gap: 1.5rem;
      align-items: center;
    }

    .nav-links a {
      color: $color-cream;
      opacity: 0.8;
      text-decoration: none;
      transition: opacity 0.2s;
      font-weight: 500;
    }

    .nav-links a:hover,
    .nav-links a.active {
      opacity: 1;
    }

    .cart-link {
      background: $color-sand-light !important;
      color: $color-forest !important;
      opacity: 1 !important;
      padding: 0.4rem 1rem;
      border-radius: $radius-sm;
      font-weight: $font-subheading-weight;
    }

    // Hamburger button - hidden on desktop
    .hamburger {
      display: none;
      flex-direction: column;
      gap: 5px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
    }

    .hamburger-line {
      display: block;
      width: 24px;
      height: 2px;
      background: $color-cream;
      border-radius: 2px;
      transition: transform 0.2s;
    }

    // Mobile backdrop
    .mobile-backdrop {
      position: fixed;
      inset: 0;
      z-index: 250;
      background: rgba(0, 0, 0, 0.4);
    }

    // Mobile off-canvas menu
    .mobile-menu {
      position: fixed;
      top: 0;
      right: 0;
      width: 280px;
      height: 100%;
      z-index: 300;
      background: $color-forest;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      padding: 2rem 1.5rem;
      display: flex;
      flex-direction: column;
    }

    .mobile-menu--open {
      transform: translateX(0);
    }

    .mobile-close {
      align-self: flex-end;
      background: none;
      border: none;
      color: $color-cream;
      font-size: 2rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
      margin-bottom: 2rem;
    }

    .mobile-nav {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .mobile-nav a {
      color: $color-cream;
      opacity: 0.8;
      text-decoration: none;
      font-size: 1.1rem;
      font-weight: 500;
      transition: opacity 0.2s;
    }

    .mobile-nav a:hover,
    .mobile-nav a.active {
      opacity: 1;
    }

    .mobile-nav .cart-link {
      display: inline-block;
      width: fit-content;
    }

    @media (max-width: $breakpoint-md) {
      .nav-links {
        display: none;
      }

      .hamburger {
        display: flex;
      }
    }

    @media (min-width: $breakpoint-md) {
      .mobile-menu,
      .mobile-backdrop {
        display: none !important;
      }
    }
  `],
})
export class NavbarComponent implements OnInit, OnDestroy {
  cart = inject(CartService);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  isScrolled = signal(false);
  mobileMenuOpen = signal(false);

  private scrollHandler: (() => void) | null = null;

  isHeroPage(): boolean {
    const url = this.router.url.split('?')[0];
    return url === '/' || url === '/about';
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.scrollHandler = () => {
      this.isScrolled.set(window.scrollY > 50);
    };

    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    this.scrollHandler();
  }

  ngOnDestroy(): void {
    if (this.scrollHandler && isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}

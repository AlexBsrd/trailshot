import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './layout/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NavbarComponent],
  template: `
    @if (!isAdmin()) {
      <app-navbar />
    }
    <main [class.admin-page]="isAdmin()" [class.has-hero]="isHeroPage()">
      <router-outlet />
    </main>
    @if (!isAdmin()) {
      <footer class="footer">
        <div class="footer-content">
          <div class="footer-brand">
            <span class="footer-logo">TRAILSHOT</span>
            <p class="footer-tagline">Vos moments de trail, capturés.</p>
          </div>
          <nav class="footer-nav">
            <a routerLink="/events">Courses</a>
            <a routerLink="/about">À propos</a>
            @if (isHome()) {
              <a routerLink="/admin">Administration</a>
            }
          </nav>
        </div>
        <div class="footer-bottom">
          <span>&copy; {{ year }} TrailShot</span>
        </div>
      </footer>
    }
  `,
  styles: [`
    @use 'tokens' as *;

    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    main {
      flex: 1;
      padding-top: 64px;
    }
    main.has-hero {
      padding-top: 0;
    }
    main.admin-page {
      padding-top: 0;
    }
    .footer {
      background: $color-forest;
      color: $color-cream;
      padding: 0;
      position: relative;
    }
    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: start;
      padding: 3rem 2rem 2rem;
      max-width: 1200px;
      margin: 0 auto;
      flex-wrap: wrap;
      gap: 2rem;
    }
    .footer-brand {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .footer-logo {
      font-family: $font-display;
      font-weight: 800;
      font-size: 1.25rem;
      letter-spacing: 3px;
      color: $color-cream;
      text-transform: uppercase;
    }
    .footer-tagline {
      font-size: $font-size-small;
      color: rgba($color-cream, 0.5);
      font-style: italic;
    }
    .footer-nav {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .footer-nav a {
      color: rgba($color-cream, 0.6);
      text-decoration: none;
      font-size: $font-size-small;
      transition: color 0.2s;
    }
    .footer-nav a:hover {
      color: $color-cream;
    }
    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding: 1.25rem 2rem;
      text-align: center;
      font-size: $font-size-xs;
      color: rgba($color-cream, 0.4);
    }
  `],
})
export class App {
  private router = inject(Router);
  year = new Date().getFullYear();

  isAdmin(): boolean {
    return this.router.url.startsWith('/admin');
  }

  isHome(): boolean {
    return this.router.url === '/' || this.router.url === '';
  }

  isHeroPage(): boolean {
    const url = this.router.url.split('?')[0];
    return url === '/' || url === '/about';
  }
}

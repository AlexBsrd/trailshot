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
        <span>&copy; {{ year }} TrailShot</span>
        @if (isHome()) {
          <a routerLink="/admin">Administration</a>
        }
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
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      background: $color-forest;
      color: rgba($color-cream, 0.7);
      font-size: $font-size-small;
    }
    .footer a {
      color: rgba($color-cream, 0.7);
      text-decoration: none;
      transition: opacity 0.2s;
    }
    .footer a:hover {
      opacity: 1;
      color: $color-cream;
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

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
    <main [class.admin-page]="isAdmin()">
      <router-outlet />
    </main>
    @if (!isAdmin()) {
      <footer class="footer">
        <span>&copy; {{ year }} TrailShot</span>
        <a routerLink="/admin">Administration</a>
      </footer>
    }
  `,
  styles: [`
    main { min-height: calc(100vh - 120px); }
    main.admin-page { min-height: 100vh; }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      border-top: 1px solid #e5e7eb;
      color: #9ca3af;
      font-size: 0.85rem;
    }
    .footer a {
      color: #9ca3af;
      text-decoration: none;
    }
    .footer a:hover { color: #6b7280; }
  `],
})
export class App {
  private router = inject(Router);
  year = new Date().getFullYear();

  isAdmin(): boolean {
    return this.router.url.startsWith('/admin');
  }
}

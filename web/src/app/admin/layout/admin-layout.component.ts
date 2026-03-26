import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-layout">
      <aside class="sidebar">
        <a routerLink="/" class="sidebar-logo">
          <span class="logo-trail">TRAIL</span><span class="logo-shot">SHOT</span>
          <span class="logo-admin">Admin</span>
        </a>
        <nav class="sidebar-nav">
          <a routerLink="/admin/events" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: false }">
            <span class="nav-icon">📋</span> Courses
          </a>
          <a routerLink="/admin/orders" routerLinkActive="active">
            <span class="nav-icon">🛒</span> Commandes
          </a>
        </nav>
        <div class="sidebar-footer">
          <a routerLink="/" class="sidebar-link">← Voir le site</a>
          <button class="sidebar-link" (click)="logout()">Déconnexion</button>
        </div>
      </aside>
      <main class="admin-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    @use 'tokens' as *;
    @use 'animations' as *;

    .admin-layout { display: flex; min-height: 100vh; }
    .sidebar {
      width: 240px;
      background: $color-forest;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    .sidebar-logo {
      display: flex;
      align-items: baseline;
      gap: 0;
      padding: 1.25rem 1.5rem;
      text-decoration: none;
      font-size: 1.25rem;
      font-weight: $font-heading-weight;
      font-family: $font-family;
      letter-spacing: 1.5px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .logo-trail { color: $color-cream; }
    .logo-shot { color: $color-cream; }
    .logo-admin {
      color: $color-sand-light;
      font-size: $font-size-xs;
      font-weight: 500;
      margin-left: 6px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .sidebar-nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 0.75rem 0;
    }
    .sidebar-nav a {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1.5rem;
      color: rgba(250, 247, 242, 0.75);
      text-decoration: none;
      font-size: $font-size-body;
      font-family: $font-family;
      transition: background 0.15s, color 0.15s, border-left 0.15s;
      border-left: 3px solid transparent;
    }
    .sidebar-nav a:hover {
      background: rgba(255, 255, 255, 0.06);
      color: $color-cream;
    }
    .sidebar-nav a.active {
      background: rgba(255, 255, 255, 0.1);
      color: $color-cream;
      font-weight: 600;
      border-left: 3px solid $color-sand-light;
    }
    .nav-icon { font-size: 1.1rem; }
    .sidebar-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .sidebar-link {
      background: none;
      border: none;
      color: $color-cream;
      text-decoration: none;
      font-size: $font-size-small;
      font-family: $font-family;
      cursor: pointer;
      padding: 0.25rem 0;
      text-align: left;
      opacity: 0.65;
      transition: opacity 0.15s;
    }
    .sidebar-link:hover { opacity: 1; }
    .admin-main { flex: 1; overflow-y: auto; background: $color-cream; }
  `],
})
export class AdminLayoutComponent {
  constructor(private router: Router) {}

  logout() {
    localStorage.removeItem('trailshot_token');
    this.router.navigate(['/admin/login']);
  }
}

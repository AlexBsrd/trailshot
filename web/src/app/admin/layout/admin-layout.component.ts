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
          <span class="logo-text">TRAIL<span class="logo-sep">/</span>SHOT</span>
          <span class="logo-admin">Admin</span>
        </a>
        <nav class="sidebar-nav">
          <a routerLink="/admin/events" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: false }">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            Courses
          </a>
          <a routerLink="/admin/orders" routerLinkActive="active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            Commandes
          </a>
        </nav>
        <div class="sidebar-footer">
          <a routerLink="/" class="sidebar-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Voir le site
          </a>
          <button class="sidebar-link" (click)="logout()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Déconnexion
          </button>
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

    $cubic-smooth: cubic-bezier(0.22, 1, 0.36, 1);

    .admin-layout { display: flex; min-height: 100vh; }

    .sidebar {
      width: 260px;
      background: linear-gradient(180deg, #1B3A2D 0%, #162F25 100%);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      padding-top: 0;
    }

    .sidebar-logo {
      display: flex;
      align-items: baseline;
      gap: 0;
      padding: 1.5rem;
      text-decoration: none;
      font-size: 1.1rem;
      font-weight: $font-heading-weight;
      font-family: $font-display;
      letter-spacing: 3px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .logo-text { color: $color-cream; }
    .logo-sep {
      opacity: 0.3;
      margin: 0 2px;
      font-weight: 400;
    }
    .logo-admin {
      background: rgba(184, 145, 58, 0.2);
      color: $color-accent-light;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.65rem;
      font-weight: 600;
      margin-left: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-family: $font-family;
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
      gap: 0.75rem;
      padding: 0.75rem 1.5rem;
      color: rgba(250, 247, 242, 0.75);
      text-decoration: none;
      font-size: $font-size-body;
      font-family: $font-family;
      font-weight: 500;
      transition: background 0.25s $cubic-smooth, color 0.25s $cubic-smooth, border-left 0.25s $cubic-smooth;
      border-left: 3px solid transparent;

      svg { opacity: 0.6; transition: opacity 0.25s $cubic-smooth; }
    }
    .sidebar-nav a:hover {
      background: rgba(255, 255, 255, 0.05);
      color: $color-cream;
      svg { opacity: 1; }
    }
    .sidebar-nav a.active {
      background: rgba(184, 145, 58, 0.12);
      color: $color-cream;
      font-weight: 600;
      border-left: 3px solid $color-accent;
      svg { opacity: 1; stroke: $color-accent-light; }
    }

    .sidebar-footer {
      padding: 0.75rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
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
      transition: opacity 0.25s $cubic-smooth;
    }
    .sidebar-link:hover { opacity: 1; }

    .admin-main { flex: 1; overflow-y: auto; background: #F5F3EE; min-height: 100vh; }
  `],
})
export class AdminLayoutComponent {
  constructor(private router: Router) {}

  logout() {
    localStorage.removeItem('trailshot_token');
    this.router.navigate(['/admin/login']);
  }
}

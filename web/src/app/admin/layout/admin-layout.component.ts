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
          <span class="logo-trail">Trail</span><span class="logo-shot">Shot</span>
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
    .admin-layout { display: flex; min-height: 100vh; }
    .sidebar {
      width: 240px;
      background: #fff;
      border-right: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    .sidebar-logo {
      display: flex;
      align-items: baseline;
      gap: 4px;
      padding: 1.25rem 1.5rem;
      text-decoration: none;
      font-size: 1.25rem;
      font-weight: 700;
      border-bottom: 1px solid #e5e7eb;
    }
    .logo-trail { color: #1a1a1a; }
    .logo-shot { color: #2563eb; }
    .logo-admin { color: #9ca3af; font-size: 0.75rem; font-weight: 500; margin-left: 4px; }
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
      color: #6b7280;
      text-decoration: none;
      font-size: 0.95rem;
      transition: background 0.15s, color 0.15s;
    }
    .sidebar-nav a:hover { background: #f3f4f6; color: #1a1a1a; }
    .sidebar-nav a.active { background: #eef2ff; color: #2563eb; font-weight: 600; }
    .nav-icon { font-size: 1.1rem; }
    .sidebar-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .sidebar-link {
      background: none;
      border: none;
      color: #9ca3af;
      text-decoration: none;
      font-size: 0.85rem;
      cursor: pointer;
      padding: 0.25rem 0;
      text-align: left;
    }
    .sidebar-link:hover { color: #6b7280; }
    .admin-main { flex: 1; overflow-y: auto; background: #f8f9fa; }
  `],
})
export class AdminLayoutComponent {
  constructor(private router: Router) {}

  logout() {
    localStorage.removeItem('trailshot_token');
    this.router.navigate(['/admin/login']);
  }
}

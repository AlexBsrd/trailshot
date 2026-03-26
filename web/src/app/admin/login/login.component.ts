import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <h1>Administration</h1>
        <form (ngSubmit)="login()">
          <input type="text" [(ngModel)]="username" name="username" placeholder="Identifiant" class="input" />
          <input type="password" [(ngModel)]="password" name="password" placeholder="Mot de passe" class="input" />
          @if (error()) {
            <p class="error">Identifiants incorrects</p>
          }
          <button type="submit" class="btn btn-primary" [disabled]="loading()">
            {{ loading() ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
    }
    .login-card {
      background: #1a1a1a;
      padding: 2rem;
      border-radius: 12px;
      width: 100%;
      max-width: 380px;
    }
    .login-card h1 { text-align: center; margin-bottom: 1.5rem; }
    form { display: flex; flex-direction: column; gap: 0.75rem; }
    .error { color: #ef4444; text-align: center; font-size: 0.875rem; }
  `],
})
export class LoginComponent {
  private api = inject(ApiService);
  private router = inject(Router);

  username = '';
  password = '';
  loading = signal(false);
  error = signal(false);

  login() {
    this.loading.set(true);
    this.error.set(false);
    this.api.login(this.username, this.password).subscribe({
      next: (res) => {
        localStorage.setItem('trailshot_token', res.access_token);
        this.router.navigate(['/admin/events']);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}

import { Component, inject, signal, OnInit } from '@angular/core';
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
        <div class="login-logo">TRAILSHOT</div>
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
    @use 'tokens' as *;
    @use 'animations' as *;

    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 20% 80%, rgba(74, 123, 90, 0.3) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(196, 90, 48, 0.15) 0%, transparent 50%),
                  $color-forest;
    }
    .login-card {
      background: white;
      padding: 2.5rem;
      border-radius: $radius-lg;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      @include fade-in-up;
    }
    .login-logo {
      font-family: $font-display;
      font-weight: 800;
      font-size: 1.5rem;
      color: $color-forest;
      letter-spacing: 3px;
      text-align: center;
      margin-bottom: 0.25rem;
      text-transform: uppercase;
    }
    .login-card h1 {
      font-family: $font-family;
      font-weight: 500;
      color: $color-text-muted;
      font-size: $font-size-body;
      text-align: center;
      margin-bottom: 1.5rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    form { display: flex; flex-direction: column; gap: 0.75rem; }
    .input {
      width: 100%;
      padding: 0.7rem 0.9rem;
      background: $color-white;
      border: 1px solid #d1d5db;
      border-radius: $radius-sm;
      font-family: $font-family;
      font-size: $font-size-body;
      color: $color-text;
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      box-sizing: border-box;

      &::placeholder { color: $color-text-muted; }

      &:focus {
        border-color: $color-forest-light;
        box-shadow: 0 0 0 3px rgba(74, 123, 90, 0.15);
      }
    }
    .error {
      color: $color-danger;
      text-align: center;
      font-size: $font-size-small;
      margin: 0;
    }
    .btn-primary {
      width: 100%;
      padding: 0.7rem;
      background: $color-accent;
      color: white;
      border: none;
      border-radius: $radius-sm;
      font-family: $font-family;
      font-weight: $font-subheading-weight;
      font-size: $font-size-body;
      cursor: pointer;
      transition: background 0.2s ease;

      &:hover:not(:disabled) { background: $color-accent-light; }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
  `],
})
export class LoginComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  username = '';
  password = '';

  ngOnInit() {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('trailshot_token')) {
      this.router.navigate(['/admin']);
    }
  }
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

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
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: $color-cream;
    }
    .login-card {
      background: $color-white;
      padding: 2.5rem;
      border-radius: $radius-lg;
      width: 100%;
      max-width: 400px;
      box-shadow: $shadow-elevated;
      @include fade-in-up;
    }
    .login-card h1 {
      text-align: center;
      margin-bottom: 1.5rem;
      font-family: $font-family;
      font-weight: $font-heading-weight;
      color: $color-forest;
      font-size: $font-size-h1;
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
      background: $color-forest;
      color: $color-cream;
      border: none;
      border-radius: $radius-sm;
      font-family: $font-family;
      font-weight: $font-subheading-weight;
      font-size: $font-size-body;
      cursor: pointer;
      transition: background 0.2s ease;

      &:hover:not(:disabled) { background: $color-forest-light; }
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

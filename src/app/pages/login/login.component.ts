import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-page">
      <div class="login-bg">
        <div class="grid-lines"></div>
      </div>

      <div class="login-box panel">
        <div class="login-header">
          <div class="logo-mark">🔐</div>
          <h1>CCDT<span class="accent">::VAULT</span></h1>
          <p class="muted mono">Secure credential management system</p>
        </div>

        <div class="alert alert-error" *ngIf="error">{{ error }}</div>
        <div class="alert alert-info" *ngIf="lockedMsg">{{ lockedMsg }}</div>

        <div class="fields">
          <div class="field">
            <label>Email address</label>
            <input type="email" [(ngModel)]="email" placeholder="user@example.com" [disabled]="loading" />
          </div>
          <div class="field">
            <label>Password</label>
            <div class="input-row">
              <input [type]="showPw ? 'text' : 'password'" [(ngModel)]="password" placeholder="••••••••" [disabled]="loading" (keydown.enter)="login()" />
              <button class="btn btn-icon" (click)="showPw = !showPw" type="button">{{ showPw ? '🙈' : '👁' }}</button>
            </div>
          </div>
        </div>

        <button class="btn btn-primary w-full" (click)="login()" [disabled]="loading">
          {{ loading ? 'Authenticating...' : 'Login' }}
        </button>

        <p class="register-link">No account? <a routerLink="/register">Register here</a></p>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      align-items: center;
      display: flex;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      position: relative;
    }
    .login-bg {
      inset: 0;
      overflow: hidden;
      position: absolute;
      z-index: 0;
    }
    .grid-lines {
      background-image:
        linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px);
      background-size: 40px 40px;
      height: 100%;
      width: 100%;
    }
    .login-box {
      max-width: 420px;
      position: relative;
      width: 100%;
      z-index: 1;
      border-color: var(--border-bright);
      box-shadow: 0 0 60px rgba(0,212,255,0.06);
    }
    .login-header { margin-bottom: 28px; text-align: center; }
    .logo-mark { font-size: 36px; margin-bottom: 10px; }
    h1 { font-size: 22px; letter-spacing: 0.12em; }
    .accent { color: var(--accent); }
    .login-header p { margin-top: 6px; font-size: 13px; }
    .fields { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }
    .input-row { display: flex; gap: 8px; }
    .input-row input { flex: 1; }
    .w-full { width: 100%; }
    .register-link { color: var(--text-muted); font-size: 13px; margin-top: 16px; text-align: center; }
    .alert { margin-bottom: 16px; }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  showPw = false;
  loading = false;
  error = '';
  lockedMsg = '';

  auth = inject(AuthService);
  router = inject(Router);

  async login() {
    this.error = '';
    this.lockedMsg = '';
    if (!this.email || !this.password) { this.error = 'Email and password are required.'; return; }
    this.loading = true;
    try {
      await this.auth.login(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      if (e.message.includes('locked')) this.lockedMsg = e.message;
      else this.error = e.message;
    } finally {
      this.loading = false;
    }
  }
}

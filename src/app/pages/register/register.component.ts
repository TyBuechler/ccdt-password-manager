import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { PasswordGeneratorService } from '../../services/password-generator.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-page">
      <div class="login-bg"><div class="grid-lines"></div></div>
      <div class="login-box panel">
        <div class="login-header">
          <div class="logo-mark">🔐</div>
          <h1>CCDT<span class="accent">::VAULT</span></h1>
          <p class="muted mono">Create your secure account</p>
        </div>

        <div class="alert alert-error" *ngIf="error">{{ error }}</div>
        <div class="alert alert-success" *ngIf="success">{{ success }}</div>

        <div class="fields">
          <div class="field">
            <label>Email address</label>
            <input type="email" [(ngModel)]="email" placeholder="user@example.com" />
          </div>
          <div class="field">
            <label>Password</label>
            <input [type]="showPw ? 'text' : 'password'" [(ngModel)]="password" placeholder="Min 8 chars, uppercase, digit, symbol" (ngModelChange)="checkStrength()" />
            <div class="strength-bar" *ngIf="password">
              <div class="bar-fill" [style.width.%]="(strength.score / 4) * 100" [style.background]="strength.color"></div>
            </div>
            <span class="strength-label mono" *ngIf="password" [style.color]="strength.color">
              {{ strength.label }}
            </span>
          </div>
          <div class="field">
            <label>Confirm password</label>
            <input [type]="showPw ? 'text' : 'password'" [(ngModel)]="confirmPassword" placeholder="Repeat password" />
          </div>
        </div>

        <button class="btn btn-primary w-full" (click)="register()" [disabled]="loading">
          {{ loading ? 'Creating account...' : 'Create Account' }}
        </button>

        <p class="register-link">Already have an account? <a routerLink="/login">Login</a></p>
      </div>
    </div>
  `,
  styles: [`
    .login-page { align-items: center; display: flex; justify-content: center; min-height: 100vh; padding: 24px; position: relative; }
    .login-bg { inset: 0; overflow: hidden; position: absolute; z-index: 0; }
    .grid-lines { background-image: linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px); background-size: 40px 40px; height: 100%; width: 100%; }
    .login-box { max-width: 420px; position: relative; width: 100%; z-index: 1; border-color: var(--border-bright); box-shadow: 0 0 60px rgba(0,212,255,0.06); }
    .login-header { margin-bottom: 28px; text-align: center; }
    .logo-mark { font-size: 36px; margin-bottom: 10px; }
    h1 { font-size: 22px; letter-spacing: 0.12em; }
    .accent { color: var(--accent); }
    .login-header p { margin-top: 6px; font-size: 13px; }
    .fields { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }
    .w-full { width: 100%; }
    .register-link { color: var(--text-muted); font-size: 13px; margin-top: 16px; text-align: center; }
    .alert { margin-bottom: 16px; }
    .strength-bar { background: var(--border); border-radius: 2px; height: 4px; margin-top: 6px; overflow: hidden; }
    .bar-fill { height: 100%; transition: all 0.3s ease; border-radius: 2px; }
    .strength-label { font-size: 11px; text-transform: uppercase; }
  `]
})
export class RegisterComponent {
  email = '';
  password = '';
  confirmPassword = '';
  showPw = false;
  loading = false;
  error = '';
  success = '';
  strength: any = { score: 0, label: '', color: '' };

  auth = inject(AuthService);
  gen = inject(PasswordGeneratorService);
  router = inject(Router);

  checkStrength() { this.strength = this.gen.checkStrength(this.password); }

  async register() {
    this.error = '';
    if (!this.email || !this.password) { this.error = 'All fields are required.'; return; }
    if (this.password !== this.confirmPassword) { this.error = 'Passwords do not match.'; return; }
    if (this.strength.score < 2) { this.error = 'Password is too weak.'; return; }
    this.loading = true;
    try {
      await this.auth.register(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.error = e.message;
    } finally {
      this.loading = false;
    }
  }
}

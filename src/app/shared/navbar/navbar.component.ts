import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="nav-brand">
        <span class="brand-icon">🔐</span>
        <span class="brand-name">CCDT<span class="brand-accent">::VAULT</span></span>
      </div>

      <div class="nav-links" *ngIf="auth.isAuthenticated">
        <a routerLink="/dashboard"   routerLinkActive="active">Dashboard</a>
        <a routerLink="/passwords"   routerLinkActive="active">Passwords</a>
        <a routerLink="/audit-logs"  routerLinkActive="active">Audit Logs</a>
        <a routerLink="/feedback"    routerLinkActive="active">Feedback</a>
        <a routerLink="/faq"         routerLinkActive="active">FAQ</a>
        <a routerLink="/settings"    routerLinkActive="active">Settings</a>
      </div>

      <div class="nav-actions">
        <span class="user-tag" *ngIf="auth.currentUser()">
          {{ auth.currentUser()?.email }}
        </span>
        <button class="btn btn-ghost btn-sm" *ngIf="auth.isAuthenticated" (click)="logout()">
          Logout
        </button>
        <a routerLink="/login" class="btn btn-primary btn-sm" *ngIf="!auth.isAuthenticated">
          Login
        </a>
      </div>
    </nav>
    <div class="idle-banner" *ngIf="auth.idleWarning()">
      ⚠️ {{ auth.idleWarning() }}
    </div>
  `,
  styles: [`
    .navbar {
      align-items: center;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border);
      display: flex;
      height: 58px;
      justify-content: space-between;
      padding: 0 28px;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav-brand {
      align-items: center;
      display: flex;
      gap: 10px;
    }
    .brand-icon { font-size: 20px; }
    .brand-name {
      font-family: var(--font-mono);
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.1em;
    }
    .brand-accent { color: var(--accent); }
    .nav-links {
      display: flex;
      gap: 4px;
    }
    .nav-links a {
      border-radius: var(--radius);
      color: var(--text-secondary);
      font-family: var(--font-mono);
      font-size: 12px;
      letter-spacing: 0.08em;
      padding: 6px 14px;
      text-transform: uppercase;
      transition: all var(--transition);
    }
    .nav-links a:hover, .nav-links a.active {
      background: var(--accent-glow);
      color: var(--accent);
    }
    .nav-actions { align-items: center; display: flex; gap: 12px; }
    .user-tag {
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: 12px;
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .btn-sm { font-size: 12px; padding: 6px 14px; }
    .idle-banner {
      background: var(--accent-warn, #f59e0b);
      color: #000;
      font-family: var(--font-mono);
      font-size: 13px;
      padding: 8px 28px;
      text-align: center;
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  router = inject(Router);
  private navSub: Subscription | null = null;

  ngOnInit() {
    this.navSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.auth.resetIdleTimer());
  }

  ngOnDestroy() {
    this.navSub?.unsubscribe();
  }

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}

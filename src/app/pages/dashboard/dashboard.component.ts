import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { CredentialService } from '../../services/credential.service';
import { Credential, AuditLog } from '../../models/credential.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <p class="muted mono">Welcome back,</p>
          <h2>{{ auth.currentUser()?.email }}</h2>
        </div>
        <a routerLink="/passwords" class="btn btn-primary">+ Add Password</a>
      </header>

      <div class="stats-grid">
        <div class="stat-card panel" style="display: flex; justify-content: center; align-items: center;">
          <div style="text-align: center">
            <div class="stat-value">{{ credentials().length }}</div>
            <div class="stat-label mono">Stored Passwords</div>
          </div>
        </div>
        <div class="stat-card panel" style="display: flex; justify-content: center; align-items: center;">
          <div style="text-align: center">
            <div class="stat-value accent-danger">{{ weakCount() }}</div>
            <div class="stat-label mono">Weak Passwords</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h3 class="section-title">Recent Activity</h3>
        <div class="panel">
          <div *ngIf="auditLogs().length === 0" class="empty-state muted mono">No activity yet.</div>
          <div class="log-list">
            <div class="log-row" *ngFor="let log of auditLogs().slice(0, 10)">
              <span class="log-action badge" [class]="getBadgeClass(log.action)">{{ log.action }}</span>
              <span class="log-target">{{ log.targetName || '—' }}</span>
              <span class="log-time muted mono">{{ formatTime(log.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 900px; margin: 0 auto; padding: 32px 24px; }
    .page-header { align-items: center; display: flex; justify-content: space-between; margin-bottom: 32px; }
    h2 { font-size: 20px; margin-top: 4px; }
    .stats-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 32px; }
    .stat-card { align-items: center; display: flex; gap: 16px; }
    .stat-icon { font-size: 28px; }
    .stat-value { font-family: var(--font-mono); font-size: 28px; font-weight: 700; }
    .stat-value.accent-danger { color: var(--accent-danger); }
    .stat-label { color: var(--text-muted); font-size: 12px; margin-top: 2px; text-transform: uppercase; }
    .section-title { font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.1em; margin-bottom: 12px; text-transform: uppercase; color: var(--text-secondary); }
    .log-list { display: flex; flex-direction: column; gap: 10px; }
    .log-row { align-items: center; display: flex; gap: 12px; }
    .log-icon { font-size: 16px; }
    .log-target { flex: 1; font-size: 14px; }
    .log-time { font-size: 12px; }
    .empty-state { font-size: 13px; text-align: center; padding: 20px 0; }
  `]
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  credService = inject(CredentialService);

  credentials = signal<Credential[]>([]);
  auditLogs = signal<AuditLog[]>([]);

  weakCount = signal(0);

  async ngOnInit() {
    const [creds, logs] = await Promise.all([
      this.credService.getCredentials(),
      this.credService.getAuditLogs()
    ]);
    this.credentials.set(creds);
    this.auditLogs.set(logs);
    this.weakCount.set(creds.filter(c => c.strength === 'weak').length);
  }

  getBadgeClass(action: string): string {
    const map: Record<string, string> = { create: 'badge-success', delete: 'badge-danger', update: 'badge-warn', login: 'badge-info' };
    return map[action] ?? 'badge-info';
  }

  formatTime(ts: any): string {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString();
  }
}

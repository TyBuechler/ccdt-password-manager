import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CredentialService } from '../../services/credential.service';
import { AuditLog } from '../../models/credential.model';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Audit Logs</h2>
        <div class="filters">
          <select [(ngModel)]="filterAction" (ngModelChange)="applyFilter()">
            <option value="">All Actions</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="copy">Copy</option>
          </select>
        </div>
      </div>

      <div class="panel">
        <div *ngIf="isLoading()" class="empty-state muted mono">Loading…</div>

        <div *ngIf="!isLoading() && filtered().length === 0" class="empty-state muted mono">
          No audit events found.
        </div>

        <table *ngIf="!isLoading() && filtered().length > 0" class="log-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Target</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let log of pageItems()">
              <td><span class="badge" [class]="getBadgeClass(log.action)">{{ log.action }}</span></td>
              <td class="target-cell">{{ log.targetName || '—' }}</td>
              <td class="time-cell mono">{{ formatTime(log.timestamp) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="pagination" *ngIf="totalPages() > 1">
          <button class="btn btn-ghost btn-sm" (click)="prevPage()" [disabled]="page() === 1">← Prev</button>
          <span class="page-info mono">{{ page() }} / {{ totalPages() }}</span>
          <button class="btn btn-ghost btn-sm" (click)="nextPage()" [disabled]="page() === totalPages()">Next →</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 960px; margin: 0 auto; padding: 32px 24px; }
    .page-header { align-items: center; display: flex; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    h2 { font-family: var(--font-mono); font-size: 20px; }
    .filters select { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text-primary); font-family: var(--font-mono); font-size: 12px; padding: 6px 12px; cursor: pointer; }
    .log-table { border-collapse: collapse; width: 100%; }
    .log-table th { border-bottom: 1px solid var(--border); color: var(--text-muted); font-family: var(--font-mono); font-size: 11px; padding: 8px 12px; text-align: left; text-transform: uppercase; letter-spacing: 0.08em; }
    .log-table td { border-bottom: 1px solid var(--border); font-size: 13px; padding: 10px 12px; }
    .log-table tr:last-child td { border-bottom: none; }
    .icon-cell { font-size: 16px; width: 40px; }
    .target-cell { color: var(--text-secondary); }
    .time-cell { color: var(--text-muted); font-size: 12px; white-space: nowrap; }
    .pagination { align-items: center; display: flex; gap: 16px; justify-content: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); }
    .page-info { color: var(--text-muted); font-size: 12px; }
    .empty-state { font-size: 13px; text-align: center; padding: 32px 0; }
    .btn-sm { font-size: 12px; padding: 6px 14px; }
  `]
})
export class AuditLogsComponent implements OnInit {
  credService = inject(CredentialService);

  allLogs = signal<AuditLog[]>([]);
  filtered = signal<AuditLog[]>([]);
  isLoading = signal(true);
  filterAction = '';
  page = signal(1);
  readonly perPage = 20;

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.perPage)));

  pageItems = computed(() => {
    const start = (this.page() - 1) * this.perPage;
    return this.filtered().slice(start, start + this.perPage);
  });

  async ngOnInit() {
    const logs = await this.credService.getAuditLogs();
    this.allLogs.set(logs);
    this.filtered.set(logs);
    this.isLoading.set(false);
  }

  applyFilter() {
    this.page.set(1);
    if (!this.filterAction) {
      this.filtered.set(this.allLogs());
    } else {
      this.filtered.set(this.allLogs().filter(l => (l.action as string) === this.filterAction));
    }
  }

  prevPage() { if (this.page() > 1) this.page.update(p => p - 1); }
  nextPage() { if (this.page() < this.totalPages()) this.page.update(p => p + 1); }

  getBadgeClass(action: string): string {
    const map: Record<string, string> = {
      create: 'badge-success', delete: 'badge-danger', update: 'badge-warn',
      login: 'badge-info', logout: 'badge-info', copy: 'badge-info'
    };
    return map[action] ?? 'badge-info';
  }

  formatTime(ts: any): string {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString();
  }
}

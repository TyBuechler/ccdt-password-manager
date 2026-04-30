import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h2>Settings</h2>

      <div class="section panel">
        <h3>Change Password</h3>
        <div class="fields">
          <div class="field"><label>Current Password</label><input type="password" [(ngModel)]="currentPw" /></div>
          <div class="field"><label>New Password</label><input type="password" [(ngModel)]="newPw" /></div>
          <div class="field"><label>Confirm New Password</label><input type="password" [(ngModel)]="confirmPw" /></div>
        </div>
        <div class="alert alert-error" *ngIf="pwError">{{ pwError }}</div>
        <div class="alert alert-success" *ngIf="pwSuccess">{{ pwSuccess }}</div>
        <button class="btn btn-primary" (click)="changePw()" [disabled]="pwLoading" style="margin-top:16px">
          {{ pwLoading ? 'Updating…' : 'Update Password' }}
        </button>
      </div>

      <div class="section panel">
        <h3>Account Info</h3>
        <p class="muted mono">Email: {{ auth.currentUser()?.email }}</p>
        <p class="muted mono">UID: {{ auth.currentUser()?.uid }}</p>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 600px; margin: 0 auto; padding: 32px 24px; }
    h2 { font-family: var(--font-mono); font-size: 20px; margin-bottom: 24px; }
    h3 { font-family: var(--font-mono); font-size: 15px; margin-bottom: 16px; color: var(--accent); }
    .section { margin-bottom: 24px; }
    .fields { display: flex; flex-direction: column; gap: 14px; }
    .alert { margin-top: 12px; }
    .muted { color: var(--text-muted); font-size: 13px; margin-bottom: 6px; }
  `]
})
export class SettingsComponent {
  auth = inject(AuthService);
  cdr = inject(ChangeDetectorRef);
  currentPw = ''; newPw = ''; confirmPw = '';
  pwError = ''; pwSuccess = ''; pwLoading = false;

  async changePw() {
    this.pwError = ''; this.pwSuccess = '';
    if (!this.currentPw || !this.newPw) { this.pwError = 'All fields required.'; return; }
    if (this.newPw !== this.confirmPw) { this.pwError = 'New passwords do not match.'; return; }
    this.pwLoading = true;
    this.cdr.detectChanges();
    try {
      await this.auth.changePassword(this.currentPw, this.newPw);
      this.pwSuccess = 'Password updated successfully.';
      this.currentPw = this.newPw = this.confirmPw = '';
    } catch (e: any) { this.pwError = e.message; }
    finally { this.pwLoading = false; this.cdr.detectChanges(); }
  }
}

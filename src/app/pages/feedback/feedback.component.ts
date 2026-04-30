import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CredentialService } from '../../services/credential.service';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h2>Feedback</h2>
      <p class="sub muted">Help us improve CCDT::VAULT</p>

      <div class="panel">
        <div class="field">
          <label>Your Message</label>
          <textarea [(ngModel)]="message" rows="5" placeholder="Share your thoughts, bugs, or feature requests…" maxlength="10000"></textarea>
          <span class="char-count muted mono">{{ message.length }}/10000</span>
        </div>

        <div class="alert alert-error" *ngIf="error">{{ error }}</div>
        <div class="alert alert-success" *ngIf="success">{{ success }}</div>

        <button class="btn btn-primary" (click)="submit()" [disabled]="loading" style="margin-top:16px">
          {{ loading ? 'Submitting…' : 'Submit Feedback' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 600px; margin: 0 auto; padding: 32px 24px; }
    h2 { font-family: var(--font-mono); font-size: 20px; margin-bottom: 6px; }
    .sub { margin-bottom: 24px; }
    textarea { resize: vertical; }
    .char-count { font-size: 11px; text-align: right; display: block; margin-top: 4px; }
    .alert { margin-top: 12px; }
  `]
})
export class FeedbackComponent {
  credService = inject(CredentialService);
  message = ''; error = ''; success = ''; loading = false;

  async submit() {
    this.error = ''; this.success = '';
    if (this.message.length < 2) { this.error = 'Message must be at least 2 characters.'; return; }
    this.loading = true;
    try {
      await this.credService.submitFeedback(this.message);
      this.success = 'Feedback submitted. Thank you!';
      this.message = '';
    } catch (e: any) { this.error = e.message; }
    finally { this.loading = false; }
  }
}

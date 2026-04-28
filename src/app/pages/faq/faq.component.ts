import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FAQ { q: string; a: string; open?: boolean; }

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h2>FAQ</h2>
      <p class="sub muted">Common questions about CCDT::VAULT</p>

      <div class="faq-list">
        <div class="faq-item panel" *ngFor="let item of faqs" (click)="item.open = !item.open">
          <div class="faq-q">
            <span>{{ item.q }}</span>
            <span class="chevron">{{ item.open ? '▲' : '▼' }}</span>
          </div>
          <div class="faq-a muted" *ngIf="item.open">{{ item.a }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 700px; margin: 0 auto; padding: 32px 24px; }
    h2 { font-family: var(--font-mono); font-size: 20px; margin-bottom: 6px; }
    .sub { margin-bottom: 24px; }
    .faq-list { display: flex; flex-direction: column; gap: 12px; }
    .faq-item { cursor: pointer; transition: border-color var(--transition); }
    .faq-item:hover { border-color: var(--accent); }
    .faq-q { align-items: center; display: flex; font-family: var(--font-mono); font-size: 14px; justify-content: space-between; }
    .chevron { color: var(--accent); font-size: 11px; }
    .faq-a { font-size: 14px; line-height: 1.7; margin-top: 12px; }
  `]
})
export class FaqComponent {
  faqs: FAQ[] = [
    { q: 'How are my passwords stored?', a: 'All passwords are encrypted before being sent to Firebase. They are never stored or transmitted in plaintext. Only your encrypted data reaches the server.' },
    { q: 'What encryption is used?', a: 'The application uses a published cryptographic library for encryption. BCrypt is used for password hashing with a cost factor of 12, providing strong resistance to brute-force attacks.' },
    { q: 'Who can see my passwords?', a: 'Only you can access your credentials. Firebase security rules enforce strict ownership checks — no other user or administrator can read your private data without your explicit permission.' },
    { q: 'What happens after too many failed logins?', a: 'After 5 failed login attempts your account is locked for 15 minutes. This protects against brute-force attacks.' },
    { q: 'How do I generate a strong password?', a: 'Use the ⚡ generate button in the password entry form. It uses the Web Crypto API to generate a cryptographically random password with your chosen options.' },
    { q: 'Can I share a password with someone?', a: 'Password sharing is available from the vault. You can share by email with view-only or use permissions, and set an expiry date.' },
    { q: 'What is two-factor authentication?', a: '2FA adds a second verification step beyond your password. It is required on login to ensure only you can access your account even if your password is compromised.' },
    { q: 'How do I report a security issue?', a: 'Please contact the development team directly through the Feedback page. Describe the issue in detail and we will respond as soon as possible.' },
  ];
}

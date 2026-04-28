import { Injectable } from '@angular/core';
import { PasswordStrengthResult } from '../models/credential.model';

@Injectable({ providedIn: 'root' })
export class PasswordGeneratorService {

  generate(options: {
    length: number;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    symbols: boolean;
  }): string {
    let charset = '';
    if (options.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (options.numbers)   charset += '0123456789';
    if (options.symbols)   charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (!charset) charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    const arr = new Uint32Array(options.length);
    crypto.getRandomValues(arr);
    return Array.from(arr, (v) => charset[v % charset.length]).join('');
  }

  checkStrength(password: string): PasswordStrengthResult {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8)  score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score++;

    // Deductions
    if (/(.)\1{2,}/.test(password)) { score--; feedback.push('Avoid repeating characters'); }
    if (password.length < 8) feedback.push('Use at least 8 characters');
    if (!/[A-Z]/.test(password)) feedback.push('Add uppercase letters');
    if (!/[a-z]/.test(password)) feedback.push('Add lowercase letters');
    if (!/\d/.test(password)) feedback.push('Add numbers');
    if (!/[!@#$%^&*]/.test(password)) feedback.push('Add special characters');

    score = Math.max(0, Math.min(4, Math.floor(score / 1.5)));

    const labels: PasswordStrengthResult['label'][] = ['weak', 'weak', 'fair', 'strong', 'very-strong'];
    const colors = ['var(--accent-danger)', 'var(--accent-danger)', 'var(--accent-warn)', 'var(--accent-success)', 'var(--accent-success)'];

    return { score, label: labels[score], color: colors[score], feedback };
  }
}

import { Injectable, signal } from '@angular/core';
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged, User, updatePassword,
  EmailAuthProvider, reauthenticateWithCredential
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { environment } from '../../environments/environment';

const app = initializeApp(environment.firebase);
const auth = getAuth(app);

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<User | null>(null);
  isLoading = signal(true);

  private failedAttempts = 0;
  private lockoutUntil: Date | null = null;

  constructor() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser.set(user);
      this.isLoading.set(false);
    });
  }

  get isAuthenticated(): boolean {
    return !!this.currentUser();
  }

  get sessionUid(): string {
    return this.currentUser()?.uid ?? '';
  }

  isLockedOut(): boolean {
    if (!this.lockoutUntil) return false;
    if (new Date() >= this.lockoutUntil) {
      this.lockoutUntil = null;
      this.failedAttempts = 0;
      return false;
    }
    return true;
  }

  lockoutRemaining(): number {
    if (!this.lockoutUntil) return 0;
    return Math.ceil((this.lockoutUntil.getTime() - Date.now()) / 1000);
  }

  async login(email: string, password: string): Promise<void> {
    if (this.isLockedOut()) {
      throw new Error(`Account locked. Try again in ${this.lockoutRemaining()}s.`);
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      this.failedAttempts = 0;
    } catch (err) {
      this.failedAttempts++;
      if (this.failedAttempts >= 5) {
        this.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
        throw new Error('Too many failed attempts. Account locked for 15 minutes.');
      }
      throw new Error('Authentication failed. Check your credentials.');
    }
  }

  async register(email: string, password: string): Promise<void> {
    await createUserWithEmailAndPassword(auth, email, password);
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('Not authenticated.');
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  }
}

import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged, User, updatePassword,
  EmailAuthProvider, reauthenticateWithCredential
} from 'firebase/auth';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { fromEvent, merge, Subscription } from 'rxjs';
import { auth, db } from './firebase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<User | null>(null);
  isLoading = signal(true);
  idleWarning = signal('');

  private failedAttempts = 0;
  private lockoutUntil: Date | null = null;
  private router = inject(Router);

  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private warnTimer: ReturnType<typeof setTimeout> | null = null;
  private activitySub: Subscription | null = null;
  private readonly IDLE_MINUTES = 15;
  private readonly WARN_MINUTES = 13;

  constructor() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser.set(user);
      this.isLoading.set(false);
      if (user) {
        this.startIdleWatcher();
      } else {
        this.stopIdleWatcher();
      }
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
      const result = await signInWithEmailAndPassword(auth, email, password);
      this.currentUser.set(result.user);
      this.failedAttempts = 0;
      await addDoc(collection(db, 'users', result.user.uid, 'auditLogs'), {
        userId: result.user.uid, action: 'login',
        targetId: result.user.uid, targetName: email,
        timestamp: Timestamp.now()
      });
    } catch (err: any) {
      this.failedAttempts++;

      if (err?.code === 'auth/user-not-found') {
        throw new Error('Account does not exist.');
      }

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
    this.stopIdleWatcher();
    const user = auth.currentUser;
    if (user) {
      await addDoc(collection(db, 'users', user.uid, 'auditLogs'), {
        userId: user.uid, action: 'logout',
        targetId: user.uid, targetName: user.email ?? '',
        timestamp: Timestamp.now()
      });
    }
    await signOut(auth);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('Not authenticated.');
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  }

  startIdleWatcher(): void {
    this.stopIdleWatcher();
    const events$ = merge(
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'keypress'),
      fromEvent(document, 'click'),
      fromEvent(document, 'touchstart')
    );
    this.activitySub = events$.subscribe(() => this.resetIdleTimer());
    this.resetIdleTimer();
  }

  stopIdleWatcher(): void {
    if (this.idleTimer) { clearTimeout(this.idleTimer); this.idleTimer = null; }
    if (this.warnTimer) { clearTimeout(this.warnTimer); this.warnTimer = null; }
    if (this.activitySub) { this.activitySub.unsubscribe(); this.activitySub = null; }
    this.idleWarning.set('');
  }

  resetIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.warnTimer) clearTimeout(this.warnTimer);
    this.idleWarning.set('');

    this.warnTimer = setTimeout(() => {
      this.idleWarning.set('You will be logged out in 2 minutes due to inactivity');
    }, this.WARN_MINUTES * 60 * 1000);

    this.idleTimer = setTimeout(async () => {
      this.idleWarning.set('');
      await this.logout();
      this.router.navigate(['/login']);
    }, this.IDLE_MINUTES * 60 * 1000);
  }
}
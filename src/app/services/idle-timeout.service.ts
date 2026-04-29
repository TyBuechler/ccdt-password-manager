import { Injectable, OnDestroy, inject, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { fromEvent, merge, timer, Subscription, NEVER } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class IdleTimeoutService implements OnDestroy {
  private readonly TIMEOUT_MS = 5 * 60 * 1000;
  private readonly WARNING_MS = 60 * 1000;

  private authService = inject(AuthService);
  private router = inject(Router);

  // Combine all activity events into one stream
  private readonly activity$ = merge(
    fromEvent(document, 'mousemove'),
    fromEvent(document, 'mousedown'),
    fromEvent(document, 'keydown'),  // keydown catches more cases than keypress
    fromEvent(document, 'scroll'),
    fromEvent(document, 'touchstart'),
    fromEvent(document, 'click'),
  );

  private subscription?: Subscription;

  constructor() {
    // toObservable is safe here — constructor runs in injection context
    toObservable(this.authService.currentUser).pipe(
      switchMap(user => user ? this.buildIdleChain() : NEVER)
    ).subscribe(() => {
      this.doLogout();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private buildIdleChain() {
    return this.activity$.pipe(
      startWith(null),
      switchMap(() =>
        // Phase 1: wait until warning threshold
        timer(this.TIMEOUT_MS - this.WARNING_MS).pipe(
          switchMap(() => {
            this.notifyUser();
            // Phase 2: wait remaining time, then log out
            return timer(this.WARNING_MS);
          })
        )
      )
    );
  }

  /** Replace with a non-blocking modal in production */
  private notifyUser(): void {
    // Create full-screen overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9998;
      cursor: pointer;
    `;

    // Create the warning content
    const warningContent = document.createElement('div');
    warningContent.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.8);
      background: #ff6b6b;
      color: white;
      padding: 40px 50px;
      border-radius: 15px;
      box-shadow: 0 12px 48px rgba(0,0,0,0.5);
      z-index: 9999;
      font-family: Arial, sans-serif;
      font-size: 22px;
      text-align: center;
      max-width: 600px;
      cursor: pointer;
      border: 4px solid #fff;
      animation: warningPulse 0.5s ease-out forwards;
    `;
    warningContent.innerHTML = `
      ⚠️ <strong>You will be logged out in 60 seconds due to inactivity.</strong><br><br>
      <span style="font-size: 18px;">Click anywhere to stay logged in.</span>
    `;

    // Handle clicks on overlay (outside warning) - reset timer
    overlay.onclick = (event) => {
      if (event.target === overlay) {
        document.body.removeChild(overlay);
        this.resetTimer();
      }
    };

    // Handle clicks on warning content - also reset timer
    warningContent.onclick = () => {
      document.body.removeChild(overlay);
      this.resetTimer();
    };

    // Add styles for animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes warningPulse {
        0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.05); opacity: 0.9; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      }
    `;

    overlay.appendChild(style);
    overlay.appendChild(warningContent);
    document.body.appendChild(overlay);
  }

  private async doLogout(): Promise<void> {
    // Remove any visible warning overlay before logging out
    const overlay = document.querySelector('div[style*="position: fixed"][style*="top: 0"]');
    if (overlay) {
      document.body.removeChild(overlay);
    }

    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  /** Manually reset the idle timer */
  resetTimer(): void {
    this.subscription?.unsubscribe();
    // Rebuild the chain to restart timing
    this.subscription = toObservable(this.authService.currentUser).pipe(
      switchMap(user => user ? this.buildIdleChain() : NEVER)
    ).subscribe(() => {
      this.doLogout();
    });
  }
}
import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { fromEvent, merge, timer, Subscription } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { User } from 'firebase/auth';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class IdleTimeoutService implements OnDestroy {
  private readonly TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly WARNING_TIME = 60 * 1000; // 1 minute before timeout
  private timeoutSubscription?: Subscription;
  private authSubscription?: Subscription;
  private warningShown = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.watchAuthState();
  }

  ngOnDestroy(): void {
    this.stopWatching();
    this.authSubscription?.unsubscribe();
  }

  private watchAuthState(): void {
    this.authSubscription = toObservable(this.authService.currentUser).subscribe((user: User | null) => {
      if (user) {
        this.startWatching();
      } else {
        this.stopWatching();
      }
    });
  }

  private startWatching(): void {
    // Events that indicate user activity
    const events$ = merge(
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'mousedown'),
      fromEvent(document, 'keypress'),
      fromEvent(document, 'scroll'),
      fromEvent(document, 'touchstart'),
      fromEvent(document, 'click')
    );

    this.timeoutSubscription = events$.pipe(
      // Start a new timer on each event
      switchMap(() => {
        this.warningShown = false; // Reset warning flag
        return timer(this.TIMEOUT_DURATION - this.WARNING_TIME).pipe(
          tap(() => this.showWarning()),
          switchMap(() => timer(this.WARNING_TIME))
        );
      })
    ).subscribe(async () => {
      await this.logout();
    });
  }

  private stopWatching(): void {
    this.timeoutSubscription?.unsubscribe();
  }

  private showWarning(): void {
    if (this.warningShown) return;
    this.warningShown = true;
    // You can replace this with a proper modal/dialog
    alert('You will be logged out in 1 minute due to inactivity. Move your mouse or press a key to stay logged in.');
  }

  private async logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Method to manually reset the timer (useful for testing or specific actions)
  resetTimer(): void {
    this.stopWatching();
    this.startWatching();
  }
}
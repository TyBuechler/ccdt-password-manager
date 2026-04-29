import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoading()) {
    if (auth.isAuthenticated) return true;
    router.navigate(['/login']);
    return false;
  }

  return toObservable(auth.isLoading).pipe(
    filter(loading => !loading),
    take(1),
    map(() => {
      if (auth.isAuthenticated) return true;
      router.navigate(['/login']);
      return false;
    })
  );
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoading()) {
    if (!auth.isAuthenticated) return true;
    router.navigate(['/dashboard']);
    return false;
  }

  return toObservable(auth.isLoading).pipe(
    filter(loading => !loading),
    take(1),
    map(() => {
      if (!auth.isAuthenticated) return true;
      router.navigate(['/dashboard']);
      return false;
    })
  );
};

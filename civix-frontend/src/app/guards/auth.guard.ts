import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  if (token) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  if (token) {
    const role = localStorage.getItem('role');
    if (role === 'CITIZEN') {
      return router.createUrlTree(['/citizen-dashboard']);
    } else if (role === 'OFFICIAL') {
      return router.createUrlTree(['/official-dashboard']);
    }
    return router.createUrlTree(['/dashboard']);
  }
  return true;
};

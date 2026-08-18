import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const userRole = localStorage.getItem('role');
  const expectedRole = route.data?.['role'];

  if (userRole === expectedRole || (userRole === 'ADMIN' && expectedRole === 'OFFICIAL')) {
    return true;
  }

  // Mismatch fallback redirections
  if (userRole === 'CITIZEN') {
    return router.createUrlTree(['/citizen-dashboard']);
  } else if (userRole === 'OFFICIAL' || userRole === 'ADMIN') {
    return router.createUrlTree(['/official-dashboard']);
  }

  return router.createUrlTree(['/login']);
};

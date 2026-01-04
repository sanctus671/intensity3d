import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthenticationService } from '../services/authentication/authentication.service';

export const publicGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);

  const session = await authService.getSession();

  if (!session) {
    return true;
  } else {
    router.navigate(['/diary']);
    return false;
  }
};

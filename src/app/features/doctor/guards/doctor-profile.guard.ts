import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { DoctorProfileService } from '../services/doctor-profile.service';

export const doctorProfileGuard: CanActivateChildFn = (route, state) => {
  const profileService = inject(DoctorProfileService);
  const router = inject(Router);

  return profileService.loadProfile().pipe(
    map(profile => {
      const locked = profileService.isProfileLocked(profile);
      if (!locked) {
        return true;
      }

      const targetPath = route.routeConfig?.path ?? '';
      if (targetPath === 'profile') {
        return true;
      }

      return router.createUrlTree(['/doctor/profile'], {
        queryParams: { reason: 'complete-profile', redirect: state.url }
      });
    }),
    catchError(() =>
      of(
        router.createUrlTree(['/auth/login'], {
          queryParams: { reason: 'session-expired' }
        })
      )
    )
  );
};

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { trigger, transition, style, animate } from '@angular/animations';
import { filter, map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { DoctorProfileService } from '../../services/doctor-profile.service';

interface NavLink {
  path: string;
  label: string;
  icon: string;
  badge?: string;
  lockExempt?: boolean;
}

@Component({
  selector: 'app-doctor-layout',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatBadgeModule, MatDividerModule
  ],
  templateUrl: './doctor-layout.html',
  styleUrl: './doctor-layout.scss',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-8px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'none', opacity: 1 }))
      ])
    ])
  ]
})
export class DoctorLayoutComponent {
  private readonly profileService = inject(DoctorProfileService);
  private readonly router = inject(Router);

  logoUrl = 'https://ik.imagekit.io/a2wpi1kd9/imgToUrl/image-to-url_HEow9eLbR';

  locked$ = this.profileService.locked$;
  loading$ = this.profileService.loading$;
  profile$ = this.profileService.profile$;
  onProfileRoute$: Observable<boolean> = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map(event => event.urlAfterRedirects.startsWith('/doctor/profile')),
    startWith(this.router.url.startsWith('/doctor/profile'))
  );

  navLinks: NavLink[] = [
    { path: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: 'schedule', label: 'Schedule', icon: 'calendar_month' },
    { path: 'patients', label: 'Patients', icon: 'group' },
    { path: 'appointments', label: 'Appointments', icon: 'event' },
    { path: 'inbox', label: 'Inbox', icon: 'forum' },
    { path: 'profile', label: 'Profile', icon: 'badge', lockExempt: true },
    { path: 'settings', label: 'Settings', icon: 'settings' },
    { path: 'notifications', label: 'Notifications', icon: 'notifications', badge: '5' },
    { path: 'help', label: 'Help', icon: 'help' },
  ];

  trackByIndex(index: number, _item: unknown) {
    return index;
  }

  onNavClick(event: Event, disabled: boolean) {
    if (disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
}

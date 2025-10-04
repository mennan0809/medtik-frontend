import { Routes } from '@angular/router';
import { doctorProfileGuard } from './guards/doctor-profile.guard';

export const DOCTOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/doctor-layout/doctor-layout').then(m => m.DoctorLayoutComponent),
    canActivateChild: [doctorProfileGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then(m => m.DoctorDashboardComponent),
        title: 'Doctor Dashboard'
      },
      {
        path: 'schedule',
        loadComponent: () =>
          import('./pages/schedule/schedule').then(m => m.ScheduleComponent),
        title: 'Schedule'
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('./pages/patients/patients').then(m => m.DoctorPatientsComponent),
        title: 'Patients'
      },
      {
        path: 'appointments',
        loadComponent: () =>
          import('./pages/appointments/appointments').then(m => m.DoctorAppointmentsComponent),
        title: 'Appointments'
      },
      {
        path: 'inbox',
        loadComponent: () =>
          import('./pages/inbox/inbox').then(m => m.DoctorInboxComponent),
        title: 'Inbox'
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile').then(m => m.DocProfileComponent),
        title: 'Profile'
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings').then(m => m.DoctorSettingsComponent),
        title: 'Settings'
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./pages/notifications/notifications').then(m => m.DoctorNotificationsComponent),
        title: 'Notifications'
      },
      {
        path: 'help',
        loadComponent: () =>
          import('./pages/help/help').then(m => m.DocHelpComponent),
        title: 'Help & Support'
      }
    ]
  }
];

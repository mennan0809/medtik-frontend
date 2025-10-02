import { Routes } from '@angular/router';

// helper to safely pick the component regardless of export name
const pick = (m: any, ...names: string[]) =>
  names.reduce((acc, n) => acc ?? m[n], undefined) ?? (m as any).default;

export const PATIENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/patient-layout/patient-layout').then(m =>
        pick(m, 'PatientLayoutComponent', 'PatientLayout')
      ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then(m =>
            pick(m, 'DashboardComponent', 'Dashboard')
          ),
        title: 'Patient Dashboard'
      },
      {
        path: 'search',
        loadComponent: () =>
          import('./pages/search/search').then(m =>
            pick(m, 'SearchComponent', 'Search')
          ),
        title: 'Find Doctors'
      },
      {
        path: 'doctor/:id',
        loadComponent: () =>
          import('./pages/doctor-profile/doctor-profile').then(m =>
            pick(m, 'DoctorProfileComponent', 'DoctorProfile')
          ),
        title: 'Doctor Profile'
      },
      {
        path: 'booking/:id',
        loadComponent: () =>
          import('./pages/booking/booking').then(m =>
            pick(m, 'BookingComponent', 'Booking')
          ),
        title: 'Booking'
      },
      {
        path: 'chat/:threadId',
        loadComponent: () =>
          import('./pages/chat/chat').then(m =>
            pick(m, 'ChatComponent', 'Chat')
          ),
        title: 'Chat'
      },
       {
          path: 'appointments/:id',
          loadComponent: () =>
            import('./pages/appointments/appointments').then(m =>
              (m as any).AppointmentComponent ?? (m as any).default
            ),
          title: 'Appointment'
      },
      {
        path: 'appointments',
        loadComponent: () =>
          import('./pages/appointments/appointments').then(m =>
            pick(m, 'AppointmentsComponent', 'Appointments')
          ),
        title: 'Appointments'
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./pages/payments/payments').then(m =>
            pick(m, 'PaymentsComponent', 'Payments')
          ),
        title: 'Payments & Invoices'
      },
      {
        path: 'records',
        loadComponent: () =>
          import('./pages/records/records').then(m =>
            pick(m, 'RecordsComponent', 'Records')
          ),
        title: 'Medical Records'
      },
      {
        path: 'reviews',
        loadComponent: () =>
          import('./pages/reviews/reviews').then(m =>
            pick(m, 'ReviewsComponent', 'Reviews')
          ),
        title: 'My Reviews'
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings').then(m =>
            pick(m, 'SettingsComponent', 'Settings')
          ),
        title: 'Settings'
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./pages/notifications/notifications').then(m =>
            pick(m, 'NotificationsComponent', 'Notifications')
          ),
        title: 'Notifications'
      },
      {
        path: 'help',
        loadComponent: () =>
          import('./pages/help/help').then(m =>
            pick(m, 'HelpComponent', 'Help')
          ),
        title: 'Help & Support'
      },
      {
        path: 'booking/:doctorId',
        loadComponent: () =>
        import('./pages/booking/booking').then(m => m.BookingComponent),
        title: 'Book appointment'
     },
    ]
  }
];

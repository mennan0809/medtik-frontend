import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },

  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login').then(m => m.LoginComponent),
        title: 'Login | Medtik'
      },
      {
        path: 'sign-up',
        loadComponent: () =>
          import('./features/auth/signup/signup').then(m => m.SignupComponent),
        title: 'Sign Up | Medtik'
      },
      {
        path: 'otp',
        loadComponent: () =>
          import('./features/auth/otp/otp').then(m => m.OtpComponent),
        title: 'OTP Verification | Medtik'
      },
    ]
  },

  // patient area (already working)
  {
    path: 'patient',
    loadChildren: () =>
      import('./features/patient/patient.routes').then(m => m.PATIENT_ROUTES)
  },

  // 👇 doctor area
  {
    path: 'doctor',
    loadChildren: () =>
      import('./features/doctor/doctor.routes').then(m => m.DOCTOR_ROUTES)
  },

  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
];

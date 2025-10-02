import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/admin-layout/admin-layout').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },

      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/users').then(m => m.AdminUsersComponent),
        title: 'Admin • Users'
      },
      
      {
        path: 'transactions',
        loadComponent: () =>
          import('./pages/transactions/transactions').then(m => m.AdminTransactionsComponent),
        title: 'Admin • Transactions'
      },
      
      {
        path: 'add-doctor',
        loadComponent: () =>
          import('./pages/add-doctor/add-doctor').then(m => m.AdminAddDoctorComponent),
        title: 'Admin • Add Doctor'
      },
      
      {
        path: 'doctor-requests',
        loadComponent: () =>
          import('./pages/doctor-requests/doctor-requests').then(m => m.AdminDoctorRequestsComponent),
        title: 'Admin • Doctor Requests'
      },
      
      {
        path: 'departments',
        loadComponent: () =>
          import('./pages/departments/departments').then(m => m.AdminDepartmentsComponent),
        title: 'Admin • Departments'
      },
      

      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings').then(m => m.AdminSettingsComponent),
        title: 'Admin • Settings'
      }, 
      {
        path: 'help',
        loadComponent: () =>
          import('./pages/help/help').then(m => m.AdminHelpComponent),
        title: 'Admin • Help & Support'
      },
      
       {
        path: 'notifications',
        loadComponent: () =>
          import('./pages/notifications/notifications').then(m => m.AdminNotificationsComponent),
        title: 'Admin • Notifications'
      },
      
    ]
    
  }
];

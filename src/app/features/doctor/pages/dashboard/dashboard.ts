import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  animations: [
    trigger('stagger', [
      transition(':enter', [
        query('.card', [
          style({ opacity: 0, transform: 'translateY(8px)' }),
          stagger(80, animate('300ms ease-out', style({ opacity: 1, transform: 'none' })))
        ])
      ])
    ]),
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(6px)' }),
        animate('280ms ease-out', style({ opacity: 1, transform: 'none' }))
      ])
    ])
  ]
})
export class DoctorDashboardComponent {
  kpis = [
    { icon: 'event_available', label: 'Today’s appts', value: 7 },
    { icon: 'forum', label: 'Unread chats', value: 12 },
    { icon: 'schedule', label: 'Open slots', value: 9 },
    { icon: 'payments', label: 'Week earnings', value: 'EGP 4,250' },
  ];

  today = [
    { time: '09:00', patient: 'Ahmed S.', type: 'Chat',    link: null,    threadId: 't-12' },
    { time: '09:30', patient: 'Mona T.',  type: 'Video',   link: '',      threadId: 't-13' },
    { time: '10:15', patient: 'Youssef K.', type: 'Audio', link: '',      threadId: 't-19' },
    { time: '11:00', patient: 'Laila R.', type: 'Chat',    link: null,    threadId: 't-21' },
  ];
}

// src/app/features/doctor/pages/appointments/appointments.ts
export class DocAppointmentsComponent {}   // instead of AppointmentsComponent

import { Component, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

type Modality = 'chat' | 'voice' | 'video';
type Price = { currency: 'EGP' | 'SAR' | 'AED'; value: number };

type Payment =
  | { status: 'paid' | 'pending' | 'failed' | 'refunded'; method?: 'card'|'wallet'|'cash'; last4?: string; txnId?: string }
  | { status: 'pending' | 'failed' };

type Meeting = { provider: 'internal' | 'google' | 'zoom'; joinUrl?: string; passcode?: string };

type Appointment = {
  id: string;
  doctorId: string;
  patientId: string;
  startUtc: string;     // ISO in UTC
  endUtc: string;       // ISO in UTC
  durationMin: number;
  modality: Modality;
  status: 'scheduled' | 'completed' | 'canceled' | 'no_show';
  price: Price;
  payment: Payment;
  meeting?: Meeting;
  policies: { cancellation?: string; reschedule?: string; refund?: string };
  attachments: Array<{ id: string; name: string; url: string }>;
  notesFromPatient?: string;
  createdAt: string;
  updatedAt: string;
  doctor: { name: string; department: string; avatar: string; country: string };
};

// ---------- utils ----------
const pad = (n: number) => (n < 10 ? '0' : '') + n;
const toLocal = (isoUtc: string) =>
  new Date(isoUtc).toLocaleString(undefined, {
    weekday: 'short', year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
const uid = () => Math.random().toString(36).slice(2, 10);

// ---- mock list (replace with API later) ----
function mockFetchAppointments(): Appointment[] {
  const now = new Date();

  const mk = (
    offsetMin: number,
    duration: number,
    status: Appointment['status'],
    modality: Modality,
    price: Price,
    docIdx = 5
  ): Appointment => {
    const start = new Date(now);
    start.setUTCMinutes(start.getUTCMinutes() + offsetMin);
    start.setUTCSeconds(0, 0);
    const end = new Date(start);
    end.setUTCMinutes(start.getUTCMinutes() + duration);
    return {
      id: uid(),
      doctorId: 'doc-123',
      patientId: 'pat-1',
      startUtc: start.toISOString(),
      endUtc: end.toISOString(),
      durationMin: duration,
      modality,
      status,
      price,
      payment: {
        status: (status === 'scheduled' || status === 'completed') ? 'paid' : 'pending',
        method: 'card',
        last4: '4242',
        txnId: 'pay_' + uid()
      },
      meeting: { provider: 'internal', joinUrl: '/patient/chat/thread-' + uid() },
      policies: {
        cancellation: 'Free cancellation up to 2 hours before visit.',
        reschedule: 'Reschedule up to 30 minutes before visit.',
        refund: 'No-show refunds are not available.'
      },
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      doctor: {
        name: docIdx % 2 ? 'Dr. Sarah Ali' : 'Dr. Omar Khaled',
        department: docIdx % 2 ? 'Pediatrics' : 'Dermatology',
        avatar: `https://i.pravatar.cc/120?img=${docIdx}`,
        country: 'EG'
      }
    };
  };

  return [
    mk(+60,  25, 'scheduled', 'video', { currency: 'EGP', value: 180 }, 5),   // upcoming
    mk(+180, 25, 'scheduled', 'voice', { currency: 'EGP', value: 120 }, 6),   // upcoming
    mk(-180, 25, 'completed', 'chat',  { currency: 'EGP', value: 80  }, 7),   // past
    mk(-1440,25, 'no_show',  'video',  { currency: 'EGP', value: 180 }, 8),   // past
    mk(-2880,25, 'canceled', 'voice',  { currency: 'EGP', value: 120 }, 9),   // past
  ];
}

@Component({
  standalone: true,
  selector: 'app-appointments',
  templateUrl: './appointments.html',
  styleUrls: ['./appointments.scss'],
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatTooltipModule, MatDividerModule, MatSnackBarModule]
})
export class AppointmentsComponent {
  private router = inject(Router);
  private snack  = inject(MatSnackBar);

  // In a real app you’d fetch on init; for now use mock data:
  all = signal<Appointment[]>(mockFetchAppointments());

  // live clock for countdown / join window
  now = signal<number>(Date.now());
  private _timer = setInterval(() => this.now.set(Date.now()), 1000);
  ngOnDestroy() { clearInterval(this._timer); }

  // sections
  upcoming = computed(() =>
    this.all()
      .filter(a => new Date(a.startUtc).getTime() >= this.now())
      .sort((a,b) => new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime())
  );
  past = computed(() =>
    this.all()
      .filter(a => new Date(a.startUtc).getTime() < this.now())
      .sort((a,b) => new Date(b.startUtc).getTime() - new Date(a.startUtc).getTime())
  );

  // helpers used in template
  toLocal = toLocal;

  statusClass(a: Appointment) {
    return {
      scheduled: a.status === 'scheduled',
      completed: a.status === 'completed',
      canceled:  a.status === 'canceled',
      no_show:   a.status === 'no_show'
    };
  }

  canJoin(a: Appointment) {
    if (a.status !== 'scheduled') return false;
    const openFrom = new Date(a.startUtc).getTime() - 10 * 60 * 1000;
    const closeAt  = new Date(a.endUtc).getTime();
    const t = this.now();
    return t >= openFrom && t <= closeAt;
  }

  countdown(a: Appointment) {
    const t = this.now();
    const start = new Date(a.startUtc).getTime();
    const diff = start - t;
    if (diff <= 0) return 'Starts soon';
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${pad(mins)}:${pad(secs)}`;
  }

  paymentDetails(a: Appointment): { method?: 'card'|'wallet'|'cash'; last4?: string; txnId?: string } | null {
    const p = a.payment as any;
    return p && (p.method || p.last4 || p.txnId) ? p : null;
    // keeps template safe from union type errors
  }

  // actions
  join(a: Appointment) {
    if (!this.canJoin(a)) return;
    const url = a.meeting?.joinUrl || '';
    if (url.startsWith('/')) this.router.navigateByUrl(url);
    else window.open(url, '_blank');
  }

  reschedule(a: Appointment) {
    this.router.navigate(['/patient/booking', a.doctorId], { queryParams: { apptId: a.id } });
  }

  cancel(a: Appointment) {
    if (!confirm('Cancel this appointment?')) return;

    // Use update + literal typing to avoid status widening to string
    this.all.update(list =>
      list.map(x =>
        x.id === a.id
          ? { ...x, status: 'canceled' as const, updatedAt: new Date().toISOString() }
          : x
      )
    );

    this.snack.open('Appointment canceled', 'OK', { duration: 1800 });
  }

  addToCalendar(a: Appointment) {
    const toICSDate = (iso: string) => {
      const d = new Date(iso);
      return (
        d.getUTCFullYear().toString() +
        pad(d.getUTCMonth() + 1) +
        pad(d.getUTCDate()) +
        'T' +
        pad(d.getUTCHours()) +
        pad(d.getUTCMinutes()) +
        pad(d.getUTCSeconds()) +
        'Z'
      );
    };

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Medtik//Appointment//EN',
      'BEGIN:VEVENT',
      `UID:${a.id}@medtik`,
      `DTSTAMP:${toICSDate(new Date().toISOString())}`,
      `DTSTART:${toICSDate(a.startUtc)}`,
      `DTEND:${toICSDate(a.endUtc)}`,
      `SUMMARY:${a.modality.toUpperCase()} with ${a.doctor.name}`,
      `DESCRIPTION:Join link: ${a.meeting?.joinUrl ?? ''}\\nNotes: ${a.notesFromPatient ?? ''}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const aTag = document.createElement('a');
    aTag.href = url;
    aTag.download = `appointment-${a.id}.ics`;
    aTag.click();
    URL.revokeObjectURL(url);
  }
}

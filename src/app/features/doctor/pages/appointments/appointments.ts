import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

type Modality = 'chat' | 'voice' | 'video';

type Patient = {
  id: string;
  name: string;
  avatar: string;
  age: number;
  gender: 'male'|'female';
  country?: string;
};

type Meeting = { provider: 'internal' | 'google' | 'zoom'; joinUrl?: string; passcode?: string };

type ApptStatus = 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'canceled' | 'no_show';

type Appointment = {
  id: string;
  patient: Patient;
  doctorId: string;
  startUtc: string;
  endUtc: string;
  durationMin: number;
  modality: Modality;
  status: ApptStatus;
  reason?: string;
  notesForDoctor?: string;
  notesByDoctor?: string;
  attachments: Array<{ id: string; name: string; url: string }>;
  meeting?: Meeting;
  createdAt: string;
  updatedAt: string;
};

const pad = (n: number) => (n < 10 ? '0' : '') + n;
const uid = () => Math.random().toString(36).slice(2, 9);
const toLocal = (isoUtc: string) =>
  new Date(isoUtc).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });

function mkAppt(offsetMin: number, status: ApptStatus, modality: Modality, name: string, avatarIdx: number, reason = 'Follow-up'): Appointment {
  const now = new Date();
  const start = new Date(now);
  start.setUTCMinutes(start.getUTCMinutes() + offsetMin);
  start.setUTCSeconds(0,0);
  const end = new Date(start);
  end.setUTCMinutes(start.getUTCMinutes() + 25);
  return {
    id: uid(),
    doctorId: 'doc-1',
    patient: {
      id: 'p-' + uid(),
      name,
      avatar: `https://i.pravatar.cc/120?img=${avatarIdx}`,
      age: 26 + (avatarIdx % 14),
      gender: avatarIdx % 2 ? 'female' : 'male',
      country: 'EG'
    },
    startUtc: start.toISOString(),
    endUtc: end.toISOString(),
    durationMin: 25,
    modality,
    status,
    reason,
    notesForDoctor: 'Bring previous lab results.',
    notesByDoctor: '',
    attachments: [],
    meeting: { provider: 'internal', joinUrl: '/doctor/chat/thread-' + uid() },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function mockFetch(): Appointment[] {
  return [
    mkAppt(-180, 'completed', 'chat',  'Ola Samir', 15, 'Rash improved'),
    mkAppt(-90,  'no_show',   'voice', 'Mostafa A.', 22, 'Cough'),
    mkAppt(-45,  'canceled',  'video', 'Farah A.',   27, 'Consultation'),
    mkAppt(+10,  'scheduled', 'video', 'Ahmed Z.',   10, 'Follow-up'),
    mkAppt(+60,  'scheduled', 'voice', 'Nour S.',    30, 'Medication review'),
    mkAppt(+120, 'scheduled', 'chat',  'Hady R.',    12, 'Dermatitis'),
  ];
}

@Component({
  standalone: true,
  selector: 'doc-appointments',
  templateUrl: './appointments.html',
  styleUrls: ['./appointments.scss'],
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatIconModule, MatButtonModule, MatTooltipModule, MatDividerModule,
    MatChipsModule, MatSnackBarModule, MatMenuModule, MatExpansionModule,
    MatInputModule
  ]
})
export class DoctorAppointmentsComponent {
  private snack = inject(MatSnackBar);

  // live clock for join window/countdown
  now = signal<number>(Date.now());
  private _t = setInterval(() => this.now.set(Date.now()), 1000);
  ngOnDestroy() { clearInterval(this._t); }

  // data
  all = signal<Appointment[]>(mockFetch());

  // search & filters (client-side for mock)
  q = signal('');
  tab = signal<'today'|'upcoming'|'past'|'all'>('today');
  modality = signal<Modality | 'any'>('any');
  status = signal<ApptStatus | 'any'>('any');

  filtered = computed(() => {
    const t = this.now();
    const query = this.q().trim().toLowerCase();
    const mod  = this.modality();
    const st   = this.status();
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
    return this.all()
      .filter(a => {
        // tabs
        const start = new Date(a.startUtc).getTime();
        let okTab = true;
        if (this.tab()==='today') okTab = start >= todayStart.getTime() && start <= todayEnd.getTime();
        else if (this.tab()==='upcoming') okTab = start > t;
        else if (this.tab()==='past') okTab = start < t;
        // modality & status
        const okMod = mod==='any' ? true : a.modality===mod;
        const okStatus = st==='any' ? true : a.status===st;
        // query
        const okQ = !query || a.patient.name.toLowerCase().includes(query) || (a.reason??'').toLowerCase().includes(query);
        return okTab && okMod && okStatus && okQ;
      })
      .sort((a,b) => new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime());
  });

  // helpers
  toLocal = toLocal;

  statusClass(a: Appointment) {
    return {
      scheduled: a.status==='scheduled',
      checked_in: a.status==='checked_in',
      in_progress: a.status==='in_progress',
      completed: a.status==='completed',
      canceled: a.status==='canceled',
      no_show: a.status==='no_show'
    };
  }

  canJoin(a: Appointment) {
    if (!(a.status==='scheduled' || a.status==='checked_in' || a.status==='in_progress')) return false;
    const open = new Date(a.startUtc).getTime() - 10 * 60 * 1000;
    const close = new Date(a.endUtc).getTime();
    const t = this.now();
    return t >= open && t <= close;
  }

  countdown(a: Appointment) {
    const t = this.now();
    const start = new Date(a.startUtc).getTime();
    const diff = start - t;
    if (diff <= 0) return 'Now';
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${pad(mins)}:${pad(secs)}`;
  }

  // actions
  mark(a: Appointment, status: ApptStatus) {
    this.all.update(list => list.map(x => x.id===a.id ? { ...x, status, updatedAt: new Date().toISOString() } : x));
    this.snack.open(`Marked ${status.replace('_',' ')}`, 'OK', { duration: 1500 });
  }

  join(a: Appointment) {
    if (!this.canJoin(a)) return;
    // move to in_progress if not already
    if (a.status!=='in_progress') this.mark(a, 'in_progress');
    const url = a.meeting?.joinUrl || '';
    if (url.startsWith('/')) (window as any).navigate?.(url) ?? (location.hash = '#' + url);
    else window.open(url, '_blank');
  }

  saveDoctorNote(a: Appointment, note: string) {
    this.all.update(list => list.map(x => x.id===a.id ? { ...x, notesByDoctor: note, updatedAt: new Date().toISOString() } : x));
    this.snack.open('Notes saved', 'OK', { duration: 1200 });
  }

  // UI helpers
  tagColor(mod: Modality) {
    return {
      chat: mod==='chat',
      voice: mod==='voice',
      video: mod==='video'
    };
  }
}

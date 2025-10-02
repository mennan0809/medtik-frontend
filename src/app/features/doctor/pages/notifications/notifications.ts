import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from "@angular/material/input";


type NotiKind = 'appointment' | 'review' | 'mention' | 'system';
type Noti = {
  id: string;
  kind: NotiKind;
  title: string;
  body: string;
  time: string;     // ISO
  read: boolean;
};

const uid = () => Math.random().toString(36).slice(2,10);

function seed(): Noti[] {
  const now = new Date();
  const mk = (k: NotiKind, t: string, b: string, minutesAgo: number, read=false): Noti => {
    const d = new Date(now);
    d.setMinutes(d.getMinutes() - minutesAgo);
    return { id: uid(), kind: k, title: t, body: b, time: d.toISOString(), read };
  };
  return [
    mk('appointment', 'New booking', 'Patient Ahmed booked for 15:30 today.', 9),
    mk('mention', 'You were mentioned', 'Nurse: “@DrOmar results uploaded.”', 22),
    mk('review', 'New review', '“Very helpful and kind.” ★★★★★', 60, true),
    mk('system', 'Schedule sync', 'Calendar is up to date.', 120, true),
  ];
}

@Component({
  standalone: true,
  selector: 'app-doctor-notifications',
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.scss'],
  imports: [
    CommonModule, MatIconModule, MatButtonModule,
    MatMenuModule, MatTooltipModule, MatSnackBarModule,
    MatButtonToggleModule,
    MatInputModule
]
})
export class DoctorNotificationsComponent {
  private snack = new MatSnackBar();

  all = signal<Noti[]>(seed());
  query = signal('');
  filter = signal<'all' | NotiKind>('all');

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const f = this.filter();
    return this.all()
      .filter(n => f === 'all' ? true : n.kind === f)
      .filter(n => !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
      .sort((a, b) => +new Date(b.time) - +new Date(a.time));
  });

  markRead(n: Noti) {
    this.all.update(list => list.map(x => x.id === n.id ? { ...x, read: true } : x));
  }
  toggleRead(n: Noti) {
    this.all.update(list => list.map(x => x.id === n.id ? { ...x, read: !x.read } : x));
  }
  clear(kind?: 'all' | NotiKind) {
    if (!confirm('Clear notifications?')) return;
    if (!kind || kind === 'all') this.all.set([]);
    else this.all.update(list => list.filter(n => n.kind !== kind));
    this.snack.open('Notifications cleared', 'OK', { duration: 1200 });
  }
  time(t: string) { return new Date(t).toLocaleString(); }
  badgeClass(k: NotiKind) { return { appointment: k==='appointment', review: k==='review', mention: k==='mention', system: k==='system' }; }
}

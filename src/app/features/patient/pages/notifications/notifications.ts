import { Component, inject, computed, signal, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';

type NotiKind   = 'appointment' | 'message' | 'payment' | 'record' | 'system';
type NotiStatus = 'unread' | 'read' | 'archived';

type CTA = { label: string; route?: any[]; external?: string };

type NotificationItem = {
  id: string;
  kind: NotiKind;
  status: NotiStatus;
  title: string;
  body?: string;
  ts: string;       // ISO
  pill?: string;    // small type pill, e.g., “Video”, “Invoice”
  cta?: CTA;
  meta?: Record<string, any>;
};

// ---------- utils ----------
const uid = () => Math.random().toString(36).slice(2, 10);
const startOfToday = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const mondayOfWeek = (d = new Date()) => {
  const day = d.getDay() || 7;
  const m = new Date(d);
  m.setDate(d.getDate() - day + 1);
  m.setHours(0,0,0,0);
  return m;
};
const rel = (iso: string) => {
  const now = new Date().getTime();
  const t   = new Date(iso).getTime();
  const diff = Math.max(0, now - t);
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  return `${d}d ago`;
};

// ---------- mock feed (replace with API later) ----------
function mockFeed(): NotificationItem[] {
  const now = new Date();
  const mk = (
    minsAgo: number, kind: NotiKind, status: NotiStatus, title: string,
    body?: string, pill?: string, cta?: CTA, meta?: any
  ): NotificationItem => {
    const t = new Date(now);
    t.setMinutes(t.getMinutes() - minsAgo);
    return { id: uid(), kind, status, title, body, pill, cta, ts: t.toISOString(), meta };
  };

  return [
    mk(5,   'appointment', 'unread', 'Your video visit starts soon', 'Join in 5–10 minutes.', 'Video', { label: 'Join', route: ['/patient/appointments'] }),
    mk(18,  'message',     'unread', 'Dr. Sarah replied', 'Please share the lab result image.', 'Chat', { label: 'Open chat', route: ['/patient/chat', 'thread-987'] }, { threadId: 'thread-987' }),
    mk(65,  'payment',     'read',   'Invoice paid', 'EGP 180 for video visit', 'Paid', { label: 'View payments', route: ['/patient/payments'] }),
    mk(220, 'record',      'read',   'New record uploaded', 'X-ray Chest.png', 'Imaging', { label: 'Open records', route: ['/patient/records'] }),
    mk(1500,'system',      'read',   'Security reminder', 'Enable two-factor authentication for extra protection.'),
    mk(2880,'appointment', 'read',   'Visit completed', 'Thanks for visiting Dr. Sarah.', 'Completed'),
    mk(4320,'payment',     'read',   'Refund processed', 'EGP 80 refund has been issued', 'Refunded', { label: 'View payments', route: ['/patient/payments'] }),
    mk(6000,'record',      'read',   'Record archived', 'Derm Rx.pdf was archived', 'Record'),
  ];
}

// ---------- settings ----------
type Digest = 'off' | 'daily' | 'weekly';
type NotiSettings = {
  categories: Record<NotiKind, boolean>;
  sound: boolean;
  desktop: boolean;
  emailDigest: Digest;
};

const DEFAULT_SETTINGS: NotiSettings = {
  categories: { appointment: true, message: true, payment: true, record: true, system: true },
  sound: true,
  desktop: false,
  emailDigest: 'daily',
};

function loadSettings(): NotiSettings {
  try {
    const raw = localStorage.getItem('notif:settings');
    return raw ? (JSON.parse(raw) as NotiSettings) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

@Component({
  standalone: true,
  selector: 'app-notifications',
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.scss'],
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatButtonToggleModule, MatMenuModule, MatDividerModule,
    MatSnackBarModule, MatDialogModule, MatSlideToggleModule
  ]
})
export class NotificationsComponent {
  private router = inject(Router);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // Data
  all = signal<NotificationItem[]>(mockFeed());

  // Local settings (persist)
  settings = signal<NotiSettings>(loadSettings());

  saveSettings(v: NotiSettings) {
    this.settings.set(v);
    try { localStorage.setItem('notif:settings', JSON.stringify(v)); } catch {}
    this.snack.open('Notification preferences saved', 'OK', { duration: 1200 });
  }

  // Search & filter
  query = signal('');
  filter = signal<'all' | NotiKind>('all');

  // Visible list
  visible = computed(() => {
    const q = this.query().toLowerCase().trim();
    const f = this.filter();
    const allows = this.settings().categories;

    return this.all()
      .filter(n => n.status !== 'archived')
      .filter(n => allows[n.kind])
      .filter(n => (f === 'all' ? true : n.kind === f))
      .filter(n => !q || n.title.toLowerCase().includes(q) || (n.body ?? '').toLowerCase().includes(q))
      .sort((a,b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
  });

  // Group into Today / This week / Earlier
  groups = computed(() => {
    const today = startOfToday().getTime();
    const week0 = mondayOfWeek(new Date()).getTime();
    const g = { today: [] as NotificationItem[], week: [] as NotificationItem[], earlier: [] as NotificationItem[] };
    for (const n of this.visible()) {
      const t = new Date(n.ts).getTime();
      if (t >= today) g.today.push(n);
      else if (t >= week0) g.week.push(n);
      else g.earlier.push(n);
    }
    return g;
  });

  // Unread counts
  counts = computed(() => {
    const byKind: Record<'all' | NotiKind, number> = { all: 0, appointment: 0, message: 0, payment: 0, record: 0, system: 0 };
    for (const n of this.all()) {
      if (n.status === 'unread') { byKind.all++; byKind[n.kind]++; }
    }
    return byKind;
  });

  // Helpers
  icon(kind: NotiKind) {
    switch (kind) {
      case 'appointment': return 'event_available';
      case 'message':     return 'chat';
      case 'payment':     return 'receipt_long';
      case 'record':      return 'folder_shared';
      case 'system':      return 'notifications';
    }
  }
  when(n: NotificationItem) { return rel(n.ts); }

  // Actions
  open(n: NotificationItem) {
    this.markRead(n);
    if (n.cta?.route) this.router.navigate(n.cta.route);
    else if (n.cta?.external) window.open(n.cta.external, '_blank');
  }
  markRead(n: NotificationItem) {
    if (n.status === 'read') return;
    this.all.update(list => list.map(x => x.id === n.id ? { ...x, status: 'read' } : x));
  }
  toggleRead(n: NotificationItem) {
    this.all.update(list => list.map(x => x.id === n.id ? { ...x, status: x.status === 'unread' ? 'read' : 'unread' } : x));
  }
  archive(n: NotificationItem) {
    this.all.update(list => list.map(x => x.id === n.id ? { ...x, status: 'archived' } : x));
    this.snack.open('Archived', 'Undo', { duration: 1500 })
      .onAction().subscribe(() =>
        this.all.update(list => list.map(x => x.id === n.id ? { ...x, status: 'read' } : x))
      );
  }
  markAllRead() {
    this.all.update(list => list.map(x => x.status === 'unread' ? { ...x, status: 'read' } : x));
  }
  clearOlderThan(days = 30) {
    const cutoff = Date.now() - days * 86400000;
    this.all.update(list => list.map(x => new Date(x.ts).getTime() < cutoff ? { ...x, status: 'archived' } : x));
    this.snack.open(`Cleared items older than ${days}d`, 'OK', { duration: 1200 });
  }

  openSettings() {
    const data: NotiSettings = JSON.parse(JSON.stringify(this.settings()));
    const ref = this.dialog.open(NotificationsSettingsDialogComponent, {
      panelClass: 'medtik-dialog',
      width: 'min(92vw, 720px)',
      data
    });
    ref.afterClosed().subscribe((v?: NotiSettings) => { if (v) this.saveSettings(v); });
  }
}

// ---------------- Settings Dialog ----------------
@Component({
  standalone: true,
  selector: 'app-notifications-settings-dialog',
  template: `
  <h2 mat-dialog-title>
    <mat-icon>tune</mat-icon>
    Notifications settings
  </h2>

  <mat-dialog-content class="dlg">
    <div class="section">
      <h4>Categories</h4>
      <div class="toggles">
        <mat-slide-toggle [(ngModel)]="model.categories.appointment">Appointments</mat-slide-toggle>
        <mat-slide-toggle [(ngModel)]="model.categories.message">Messages</mat-slide-toggle>
        <mat-slide-toggle [(ngModel)]="model.categories.payment">Payments</mat-slide-toggle>
        <mat-slide-toggle [(ngModel)]="model.categories.record">Records</mat-slide-toggle>
        <mat-slide-toggle [(ngModel)]="model.categories.system">System</mat-slide-toggle>
      </div>
    </div>

    <mat-divider></mat-divider>

    <div class="section">
      <h4>Delivery</h4>
      <div class="toggles">
        <mat-slide-toggle [(ngModel)]="model.desktop">Desktop push</mat-slide-toggle>
        <mat-slide-toggle [(ngModel)]="model.sound">Sound</mat-slide-toggle>
      </div>
    </div>

    <div class="section">
      <h4>Email digest</h4>
      <mat-button-toggle-group [(ngModel)]="model.emailDigest" aria-label="Digest frequency">
        <mat-button-toggle value="off">Off</mat-button-toggle>
        <mat-button-toggle value="daily">Daily</mat-button-toggle>
        <mat-button-toggle value="weekly">Weekly</mat-button-toggle>
      </mat-button-toggle-group>
    </div>
  </mat-dialog-content>

  <mat-dialog-actions align="end">
    <button mat-button mat-dialog-close>Cancel</button>
    <button mat-flat-button color="primary" (click)="save()">Save</button>
  </mat-dialog-actions>
  `,
  styles: [`
    .dlg { display:grid; gap:1rem; }
    .section h4 { margin:.2rem 0 .5rem; font-weight:700; }
    .toggles { display:grid; gap:.5rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    @media (max-width: 640px) { .toggles { grid-template-columns: 1fr; } }
  `],
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatIconModule, MatButtonModule, MatDividerModule,
    MatSlideToggleModule, MatButtonToggleModule
  ]
})
export class NotificationsSettingsDialogComponent {
  model: NotiSettings;
  constructor(
    private ref: MatDialogRef<NotificationsSettingsDialogComponent, NotiSettings | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: NotiSettings
  ) {
    this.model = data ? JSON.parse(JSON.stringify(data)) : JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  }
  save() { this.ref.close(this.model); }
}

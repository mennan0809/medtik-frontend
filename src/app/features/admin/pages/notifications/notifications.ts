import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';

type NotifType = 'System' | 'Requests' | 'Payments' | 'Users';
type FilterType = 'All' | 'Unread' | NotifType;

type Notif = {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  date: string;     // ISO
  unread: boolean;
};

@Component({
  selector: 'admin-notifications',
  standalone: true,
  providers: [DatePipe],
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatChipsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatPaginatorModule,
    MatTooltipModule, MatSnackBarModule, MatDividerModule, MatMenuModule
  ],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.scss'],
})
export class AdminNotificationsComponent implements OnInit {
  private snack = inject(MatSnackBar);

  // UI state
  search = new FormControl<string>('', { nonNullable: true });

  // 👉 Use a FormControl for the filter chips (avoids selectionChange typing issues)
  filterCtrl = new FormControl<FilterType>('All', { nonNullable: true });
  filter = signal<FilterType>('All');

  pageIndex = signal(0);
  pageSize = signal(8);

  // Seed data — replace with API
  private rows = signal<Notif[]>([
    { id:'N-1016', type:'Requests', title:'Doctor change request', message:'Dr. Omar updated pricing and bio.', date:'2025-01-15T10:20:00Z', unread:true },
    { id:'N-1015', type:'Payments', title:'Refund processed',     message:'TX-1002 refunded to Karim Adel.',   date:'2025-01-14T18:10:00Z', unread:false },
    { id:'N-1014', type:'Users',    title:'New user registered',  message:'Welcome Sara Adel to Medtik.',      date:'2025-01-14T16:40:00Z', unread:true },
    { id:'N-1013', type:'System',   title:'Maintenance window',   message:'Tonight 02:00–03:00 EET.',          date:'2025-01-14T12:00:00Z', unread:false },
    { id:'N-1012', type:'Requests', title:'Pricing change rejected', message:'CR-2010 rejected for Dr. Layla.', date:'2025-01-13T15:00:00Z', unread:false },
    { id:'N-1011', type:'Payments', title:'Payout completed',     message:'Weekly payout sent.',               date:'2025-01-12T09:35:00Z', unread:true },
    { id:'N-1010', type:'Requests', title:'New change request',   message:'Dr. Sara updated department.',      date:'2025-01-12T08:05:00Z', unread:true },
    { id:'N-1009', type:'System',   title:'Security update',      message:'2FA now required for admins.',      date:'2025-01-11T21:15:00Z', unread:false },
    { id:'N-1008', type:'Users',    title:'User banned',          message:'Ahmed Samir was banned by admin.',  date:'2025-01-11T18:05:00Z', unread:false },
    { id:'N-1007', type:'Payments', title:'Payment failed',       message:'TX-1003 failed for Nour Gamal.',    date:'2025-01-10T11:10:00Z', unread:true },
  ]);

  ngOnInit(): void {
    // Keep signal in sync with chip listbox control
    this.filterCtrl.valueChanges.subscribe(v => this.setFilter(v));
  }

  // Derived collections
  filtered = computed(() => {
    const q = (this.search.value || '').trim().toLowerCase();
    const f = this.filter();
    return this.rows().filter(n => {
      const matchesText = (n.title + ' ' + n.message + ' ' + n.type).toLowerCase().includes(q);
      const matchesFilter =
        f === 'All' ? true :
        f === 'Unread' ? n.unread :
        n.type === f;
      return matchesText && matchesFilter;
    });
  });

  // Latest first
  sorted = computed(() => [...this.filtered()].sort((a, b) =>
    (new Date(b.date).getTime() - new Date(a.date).getTime())
  ));

  page = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.sorted().slice(start, start + this.pageSize());
  });

  // Actions (wire to API later)
  markRead(n: Notif)   { if (!n.unread) return; n.unread = false; this.rows.set([...this.rows()]); }
  markUnread(n: Notif) { if (n.unread) return;  n.unread = true;  this.rows.set([...this.rows()]); }
  delete(n: Notif)     { this.rows.set(this.rows().filter(x => x.id !== n.id)); }

  markAllRead() {
    if (!this.rows().some(n => n.unread)) return;
    this.rows.set(this.rows().map(n => ({ ...n, unread: false })));
    this.snack.open('All notifications marked as read', 'OK', { duration: 1800 });
  }

  clearAll() {
    this.rows.set([]);
    this.snack.open('All notifications cleared', 'OK', { duration: 1500 });
  }

  setFilter(v: FilterType) {
    this.filter.set(v);
    if (this.filterCtrl.value !== v) this.filterCtrl.setValue(v, { emitEvent: false });
    this.pageIndex.set(0);
  }

  pageChange(e: PageEvent) {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
<div class="grid" @stagger>
  <mat-card class="card" *ngIf="nextAppt" [@fadeUp]>
    <div class="head">
      <h2>Next appointment</h2>
      <span class="badge">{{ nextAppt.package | titlecase }}</span>
    </div>
    <p>{{ nextAppt.doctor }} · {{ nextAppt.date }} · {{ nextAppt.time }}</p>
    <div class="actions">
      <button mat-flat-button color="primary" [routerLink]="['/patient/chat', nextAppt.threadId]">Open Chat</button>
      <button mat-stroked-button [routerLink]="['/patient/appointments']">Details</button>
    </div>
  </mat-card>

  <mat-card class="card" [@fadeUp]>
    <h2>Quick actions</h2>
    <div class="qa">
      <button mat-stroked-button color="primary" routerLink="/patient/search"><mat-icon>search</mat-icon> Find a doctor</button>
      <button mat-stroked-button routerLink="/patient/appointments"><mat-icon>event</mat-icon> My appointments</button>
      <button mat-stroked-button routerLink="/patient/payments"><mat-icon>receipt_long</mat-icon> Payments</button>
    </div>
  </mat-card>

  <mat-card class="card" [@fadeUp]>
    <h2>Recent chats</h2>
    <div class="empty" *ngIf="recentChats.length===0">No recent chats</div>
    <div class="chats" *ngIf="recentChats.length">
      <div class="chat" *ngFor="let c of recentChats" [routerLink]="['/patient/chat', c.threadId]">
        <mat-icon>forum</mat-icon>
        <div>
          <strong>{{ c.doctor }}</strong>
          <div class="small">Last message · {{ c.last }}</div>
        </div>
      </div>
    </div>
  </mat-card>
</div>
`,
  styles: [`
.grid {
  display:grid; gap: 1rem;
  grid-template-columns: repeat(12, 1fr);
}
.card:nth-child(1){ grid-column: span 6; }
.card:nth-child(2){ grid-column: span 6; }
.card:nth-child(3){ grid-column: span 12; }
@media (max-width: 960px){
  .card{ grid-column: span 12 !important; }
}
.head{ display:flex; align-items:center; gap:.5rem; }
.head h2{ margin:0; }
.badge{
  margin-left:auto; background: rgba(42,118,183,.25);
  border: 1px solid rgba(42,118,183,.45);
  padding: .15rem .5rem; border-radius: 999px; font-size: .85rem;
}
.actions{ display:flex; gap:.5rem; margin-top:.75rem; }
.qa{ display:flex; flex-wrap: wrap; gap:.5rem; margin-top:.5rem; }
.chats .chat{
  display:flex; align-items:center; gap:.75rem; padding:.5rem; border-radius: 12px;
  border:1px solid rgba(255,255,255,.06); cursor:pointer;
}
.small{ color: var(--muted); font-size:.9rem; }
.empty{ color: var(--muted); }
`],
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
export class DashboardComponent {
  nextAppt = {
    doctor: 'Dr. Sarah Ali',
    package: 'video',
    date: 'Tue, Sep 02',
    time: '10:30',
    threadId: 't-123'
  };
  recentChats = [
    { doctor: 'Dr. Omar N.', last: '2h ago', threadId: 't-98' },
    { doctor: 'Dr. Dina K.', last: 'yesterday', threadId: 't-77' }
  ];
}

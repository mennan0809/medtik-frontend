import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

type Sex = 'M' | 'F';
type Patient = {
  id: string;
  name: string;
  avatar: string;
  sex: Sex;
  age: number;
  country?: string;
  conditions: string[];
  meds?: string[];
  tags?: string[];            // VIP, Chronic, New, …
  lastVisit?: string;         // ISO
  nextVisit?: string;         // ISO
  createdAt: string;          // first time seen
};

const uid = () => Math.random().toString(36).slice(2, 10);
const toLocalDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }) : '—';

function daysSince(iso?: string) {
  if (!iso) return Number.POSITIVE_INFINITY;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / 86400000);
}
function daysUntil(iso?: string) {
  if (!iso) return Number.POSITIVE_INFINITY;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}

// ---- mock (replace with API) ----
function mockPatients(): Patient[] {
  const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };
  const daysFrom = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString(); };

  return [
    {
      id: uid(), name: 'Mariam Nassar', avatar: 'https://i.pravatar.cc/120?img=5', sex: 'F', age: 29, country: 'EG',
      conditions: ['Eczema'], meds: ['Hydrocortisone'],
      tags: ['New'], lastVisit: daysAgo(5), nextVisit: daysFrom(3), createdAt: daysAgo(5)
    },
    {
      id: uid(), name: 'Youssef Kamal', avatar: 'https://i.pravatar.cc/120?img=12', sex: 'M', age: 41, country: 'EG',
      conditions: ['Hyperlipidemia'], meds: ['Atorvastatin'],
      tags: ['Chronic'], lastVisit: daysAgo(170), nextVisit: undefined, createdAt: daysAgo(600)
    },
    {
      id: uid(), name: 'Sara Amin', avatar: 'https://i.pravatar.cc/120?img=49', sex: 'F', age: 8, country: 'EG',
      conditions: ['Allergic rhinitis'], meds: ['Cetirizine'],
      tags: ['Follow-up'], lastVisit: daysAgo(32), nextVisit: daysFrom(10), createdAt: daysAgo(200)
    },
    {
      id: uid(), name: 'Omar Khaled', avatar: 'https://i.pravatar.cc/120?img=23', sex: 'M', age: 34, country: 'AE',
      conditions: ['Migraine'], meds: ['Ibuprofen PRN'],
      tags: ['VIP'], lastVisit: daysAgo(8), nextVisit: undefined, createdAt: daysAgo(400)
    },
    {
      id: uid(), name: 'Dalia Fathy', avatar: 'https://i.pravatar.cc/120?img=32', sex: 'F', age: 52, country: 'EG',
      conditions: ['Type 2 Diabetes'], meds: ['Metformin'],
      tags: ['Chronic'], lastVisit: daysAgo(210), nextVisit: undefined, createdAt: daysAgo(1000)
    }
  ];
}

@Component({
  standalone: true,
  selector: 'app-doctor-patients',
  templateUrl: './patients.html',
  styleUrls: ['./patients.scss'],
  imports: [
    CommonModule, RouterModule,
    MatIconModule, MatButtonModule, MatButtonToggleModule,
    MatFormFieldModule, MatInputModule, MatTooltipModule,
    MatMenuModule, MatSnackBarModule, MatDividerModule
  ]
})
export class DoctorPatientsComponent {
  private router = inject(Router);
  private snack  = inject(MatSnackBar);

  all = signal<Patient[]>(mockPatients());
  query = signal('');
  // All | Active(visited within 180d) | Follow-up due(last visit > 180d OR next visit within 7d) | New(first seen ≤ 14d)
  filter = signal<'all' | 'active' | 'followup' | 'new'>('all');
  sortBy = signal<'recent' | 'name' | 'age'>('recent');

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const f = this.filter();
    const sorted = [...this.all()].filter(p => {
      if (q) {
        const hay = [
          p.name, p.country, ...(p.conditions||[]), ...(p.meds||[]), ...(p.tags||[])
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (f === 'active') return daysSince(p.lastVisit) <= 180;
      if (f === 'followup') return daysSince(p.lastVisit) > 180 || daysUntil(p.nextVisit) <= 7;
      if (f === 'new') return daysSince(p.createdAt) <= 14;
      return true;
    });

    const s = this.sortBy();
    if (s === 'name') sorted.sort((a,b) => a.name.localeCompare(b.name));
    if (s === 'age')  sorted.sort((a,b) => a.age - b.age);
    if (s === 'recent') sorted.sort((a,b) => (new Date(b.lastVisit||0).getTime()) - (new Date(a.lastVisit||0).getTime()));
    return sorted;
  });

  trackById = (_: number, p: Patient) => p.id;

  // actions
  openChart(p: Patient) { this.router.navigate(['/doctor/patient', p.id]); }
  startChat(p: Patient) { this.router.navigate(['/patient/chat', 't-' + p.id]); }
  book(p: Patient)      { this.router.navigate(['/patient/booking', 'doc-123'], { queryParams: { patientId: p.id } }); }
  addNote(p: Patient)   { this.snack.open(`Quick note added for ${p.name}`, 'OK', { duration: 1200 }); }

  // helpers
  tagClass(t: string) {
    const k = t.toLowerCase();
    return {
      vip: k.includes('vip'),
      chronic: k.includes('chronic'),
      new: k.includes('new'),
      follow: k.includes('follow'),
    };
  }
  pillStatus(p: Patient) {
    const isNew = daysSince(p.createdAt) <= 14;
    const active = daysSince(p.lastVisit) <= 180;
    const due = daysSince(p.lastVisit) > 180 || daysUntil(p.nextVisit) <= 7;
    return {
      new: isNew,
      active: active && !isNew,
      due: !active || due
    };
  }
  date = toLocalDate;
}

import { Component, signal, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

type Modality = 'chat' | 'voice' | 'video';

interface Doctor {
  id: string;
  name: string;
  title: string;        // specialty (shown under name)
  department: string;   // for accent color + badge
  rating: number;
  ratingCount: number;
  country: string;
  price: { chat: number; voice: number; video: number; currency: string };
  languages: string[];
  nextAvailable?: string; // e.g. "Today 13:00", "Tomorrow 10:00" or ISO later
  avatar?: string;
  verified?: boolean;
  online?: boolean;
}

@Component({
  standalone: true,
  selector: 'med-search',
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatChipsModule, MatSlideToggleModule, MatTooltipModule
  ],
  templateUrl: './search.html',
  styleUrls: ['./search.scss']
})
export class SearchComponent {
  loading = signal(true);
  filtersOpen = signal(false);
  sort = signal<'relevance' | 'rating' | 'price' | 'soonest'>('relevance');

  form!: FormGroup;
  result!: Signal<Doctor[]>;

  // department -> accent color
  private deptColors: Record<string, string> = {
    cardiology:  '#ef4444',
    dermatology: '#f472b6',
    pediatrics:  '#22c55e',
    psychiatry:  '#8b5cf6',
    neurology:   '#06b6d4',
    orthopedics: '#f59e0b',
    oncology:    '#fb7185',
    ent:         '#10b981',
    general:     '#60a5fa'
  };

  doctors = signal<Doctor[]>([
    {
      id: '1', name: 'Dr. Sarah Ali', title: 'Pediatrician', department: 'Pediatrics',
      rating: 4.8, ratingCount: 231, country: 'EG',
      price: { chat: 80, voice: 120, video: 180, currency: 'EGP' },
      languages: ['AR','EN'], nextAvailable: 'Today 13:00',
      avatar: 'https://i.pravatar.cc/96?img=12', verified: true, online: true
    },
    {
      id: '2', name: 'Dr. Ahmed Saad', title: 'Cardiologist', department: 'Cardiology',
      rating: 4.6, ratingCount: 112, country: 'EG',
      price: { chat: 90, voice: 140, video: 200, currency: 'EGP' },
      languages: ['AR'], nextAvailable: 'Today 16:00',
      avatar: 'https://i.pravatar.cc/96?img=15', verified: true, online: false
    },
    {
      id: '3', name: 'Dr. Dina Kamal', title: 'Dermatologist', department: 'Dermatology',
      rating: 4.4, ratingCount: 89, country: 'EG',
      price: { chat: 70, voice: 110, video: 160, currency: 'EGP' },
      languages: ['AR','EN'], nextAvailable: 'Tomorrow 10:00',
      avatar: 'https://i.pravatar.cc/96?img=31', verified: false, online: true
    },
    {
      id: '4', name: 'Dr. Omar N.', title: 'Psychiatrist', department: 'Psychiatry',
      rating: 4.9, ratingCount: 312, country: 'EG',
      price: { chat: 120, voice: 170, video: 240, currency: 'EGP' },
      languages: ['AR','EN'], nextAvailable: 'Today 18:30',
      avatar: 'https://i.pravatar.cc/96?img=7', verified: true, online: true
    }
  ]);

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      q: [''],
      department: [''],
      modality: ['' as '' | Modality],
      maxPrice: [0],
      minRating: [0],
      availableToday: [false],
      onlineNow: [false],
      country: ['EG']
    });

    this.result = computed(() => {
      const v = this.form.value;
      const q = (v.q ?? '').toLowerCase().trim();
      const dept = (v.department ?? '').toLowerCase();
      const modality = v.modality || '';
      const maxPrice = Number(v.maxPrice || 0);
      const minRating = Number(v.minRating || 0);
      const availableToday = !!v.availableToday;
      const onlineNow = !!v.onlineNow;
      const country = (v.country ?? 'EG').toUpperCase();

      let list = this.doctors().filter(d => d.country === country);

      if (q) {
        list = list.filter(d =>
          d.name.toLowerCase().includes(q) ||
          d.title.toLowerCase().includes(q) ||
          d.department.toLowerCase().includes(q)
        );
      }
      if (dept) list = list.filter(d => d.department.toLowerCase() === dept);
      if (minRating) list = list.filter(d => d.rating >= minRating);
      if (onlineNow) list = list.filter(d => d.online);
      if (availableToday) list = list.filter(d => (d.nextAvailable || '').toLowerCase().includes('today'));

      if (modality && maxPrice) {
        list = list.filter(d => (d.price as any)[modality] <= maxPrice);
      } else if (maxPrice) {
        list = list.filter(d =>
          d.price.chat <= maxPrice || d.price.voice <= maxPrice || d.price.video <= maxPrice
        );
      }

      switch (this.sort()) {
        case 'rating': list = [...list].sort((a,b) => b.rating - a.rating); break;
        case 'price':
          list = [...list].sort((a,b) =>
            Math.min(a.price.chat, a.price.voice, a.price.video) -
            Math.min(b.price.chat, b.price.voice, b.price.video)
          );
          break;
        case 'soonest':
          list = [...list].sort((a,b) =>
            (this.nextDate(a.nextAvailable)?.getTime() ?? Infinity) -
            (this.nextDate(b.nextAvailable)?.getTime() ?? Infinity)
          );
          break;
        default: break;
      }
      return list;
    });

    setTimeout(() => this.loading.set(false), 600);
  }

  openFilters()  { this.filtersOpen.set(true); }
  closeFilters() { this.filtersOpen.set(false); }
  clearFilters() { this.form.reset({ q: this.form.value.q ?? '', country: 'EG' }); }
  onSortChange(v: 'relevance'|'rating'|'price'|'soonest') { this.sort.set(v); }

  // ——— Accent helpers ———
  deptSlug(dept?: string) { return (dept || 'general').toLowerCase().replace(/\s+/g, ''); }
  deptAccent(dept?: string) { return this.deptColors[this.deptSlug(dept)] ?? '#2a76b7'; }

  // ——— Availability helpers ———
  nextDate(next?: string): Date | null {
    if (!next) return null;
    const now = new Date();
    const m = next.match(/^(Today|Tomorrow)\s+(\d{1,2}):(\d{2})$/i);
    if (m) {
      const [, when, hh, mm] = m;
      const d = new Date(now);
      if (/tomorrow/i.test(when)) d.setDate(d.getDate() + 1);
      d.setHours(parseInt(hh,10), parseInt(mm,10), 0, 0);
      return d;
    }
    const t = Date.parse(next);
    return Number.isNaN(t) ? null : new Date(t);
  }

  isSoon(d: Doctor): boolean {
    const dt = this.nextDate(d.nextAvailable);
    if (!dt) return false;
    const diffMin = Math.round((dt.getTime() - Date.now()) / 60000);
    return diffMin >= 0 && diffMin <= 60;
  }

  etaLabel(d: Doctor): string {
    const dt = this.nextDate(d.nextAvailable);
    if (!dt) return 'No upcoming slots';
    const ms = dt.getTime() - Date.now();
    const mins = Math.round(ms / 60000);
    if (mins <= 0) return 'Now';
    if (mins < 60) return `In ${mins}m`;
    const h = Math.floor(mins / 60), m = mins % 60;
    if (dt.toDateString() === new Date().toDateString()) {
      return m ? `In ${h}h ${m}m` : `In ${h}h`;
    }
    const hh = String(dt.getHours()).padStart(2,'0');
    const mm = String(dt.getMinutes()).padStart(2,'0');
    const isTomorrow = new Date().getDate() + 1 === dt.getDate();
    return `${isTomorrow ? 'Tomorrow' : dt.toLocaleDateString()} ${hh}:${mm}`;
  }

  // Single helper used by the template (returns class + label)
  availabilityInfo(next?: string): { cls: 'now'|'soon'|'today'|'later'|'none'; label: string } {
    const dt = this.nextDate(next);
    if (!dt) return { cls: 'none', label: 'No upcoming slots' };

    const now = new Date();
    const mins = Math.round((dt.getTime() - now.getTime()) / 60000);

    let label: string;
    if (mins <= 0) label = 'Now';
    else if (mins < 60) label = `In ${mins}m`;
    else if (dt.toDateString() === now.toDateString()) {
      const h = Math.floor(mins / 60), m = mins % 60;
      label = m ? `In ${h}h ${m}m` : `In ${h}h`;
    } else {
      const hh = String(dt.getHours()).padStart(2, '0');
      const mm = String(dt.getMinutes()).padStart(2, '0');
      const isTomorrow =
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toDateString() === dt.toDateString();
      label = `${isTomorrow ? 'Tomorrow' : dt.toLocaleDateString()} ${hh}:${mm}`;
    }

    let cls: 'now'|'soon'|'today'|'later' = 'later';
    if (mins <= 0) cls = 'now';
    else if (mins <= 60) cls = 'soon';
    else if (dt.toDateString() === now.toDateString()) cls = 'today';

    return { cls, label };
  }
}

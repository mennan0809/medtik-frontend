import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

type Modality = 'chat' | 'voice' | 'video';

type PriceSheet = {
  currency: 'EGP' | 'SAR' | 'AED';
  chat: number;
  voice: number;
  video: number;
};

type Review = { id: string; name: string; rating: number; text: string; date: string };

type Doctor = {
  id: string;
  name: string;
  department: string;
  avatar: string;
  country: 'EG' | 'SA' | 'AE';
  yearsExp: number;
  languages: string[];
  subspecialties: string[];
  conditions: string[];
  bio: string;
  prices: Record<'EG' | 'SA' | 'AE', PriceSheet>;
  policies: { cancellation: string; reschedule: string; refund: string };
  rating: { avg: number; count: number };
  reviews: Review[];
};

type Slot = {
  id: string;
  dayIdx: number;    // 0..6 (Mon..Sun)
  start: string;     // 'HH:mm'
  duration: number;  // minutes
  modalities: Modality[];
};

const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const pad = (n: number) => (n < 10 ? '0' : '') + n;
const uid = () => Math.random().toString(36).slice(2, 10);
const hhmmPlus = (hhmm: string, minutes: number) => {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const h2 = Math.floor(total / 60) % 24;
  const m2 = total % 60;
  return `${pad(h2)}:${pad(m2)}`;
};

// --------- Mock fetch (swap with API later) ----------
function mockFetchDoctor(id: string): Doctor {
  return {
    id,
    name: 'Dr. Sarah Ali',
    department: 'Pediatrics',
    avatar: 'https://i.pravatar.cc/160?img=5',
    country: 'EG',
    yearsExp: 12,
    languages: ['Arabic', 'English'],
    subspecialties: ['Neonatology', 'Pediatric Respiratory'],
    conditions: ['Fever', 'Cough', 'Allergies', 'Asthma'],
    bio: 'Board-certified pediatrician focused on preventative care and family-centered treatment. Former fellow at Cairo Children’s Hospital.',
    prices: {
      EG: { currency: 'EGP', chat: 80, voice: 120, video: 180 },
      SA: { currency: 'SAR', chat: 90, voice: 140, video: 200 },
      AE: { currency: 'AED', chat: 60, voice: 95,  video: 150 },
    },
    policies: {
      cancellation: 'Free cancellation up to 2 hours before visit.',
      reschedule: 'Reschedule up to 30 minutes before visit.',
      refund: 'No-show refunds are not available.'
    },
    rating: { avg: 4.8, count: 218 },
    reviews: [
      { id: uid(), name: 'Noura', rating: 5, text: 'Very kind and clear. My kid felt comfortable.', date: new Date(Date.now()-86400000*2).toISOString() },
      { id: uid(), name: 'Hassan', rating: 5, text: 'Quick diagnosis, solid advice.', date: new Date(Date.now()-86400000*6).toISOString() },
      { id: uid(), name: 'Reem', rating: 4, text: 'On time and helpful.', date: new Date(Date.now()-86400000*10).toISOString() },
    ]
  };
}

function makeSlotsForWeek(seedOffset = 0): Slot[] {
  // simple deterministic demo set
  return [
    { id: uid(), dayIdx: (0 + seedOffset) % 7, start: '09:00', duration: 25, modalities: ['chat','voice'] },
    { id: uid(), dayIdx: (0 + seedOffset) % 7, start: '10:30', duration: 25, modalities: ['video'] },
    { id: uid(), dayIdx: (2 + seedOffset) % 7, start: '14:00', duration: 25, modalities: ['voice','video'] },
    { id: uid(), dayIdx: (3 + seedOffset) % 7, start: '16:30', duration: 25, modalities: ['chat'] },
    { id: uid(), dayIdx: (5 + seedOffset) % 7, start: '18:00', duration: 25, modalities: ['chat','video'] },
  ];
}

@Component({
  standalone: true,
  selector: 'app-doctor-profile',
  templateUrl: './doctor-profile.html',
  styleUrls: ['./doctor-profile.scss'],
  imports: [
    CommonModule, RouterModule,
    MatIconModule, MatButtonModule, MatTooltipModule, MatDividerModule, MatSnackBarModule
  ]
})
export class DoctorProfileComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snack  = inject(MatSnackBar);

  // -------- state --------
  doctorId = this.route.snapshot.paramMap.get('id') ?? 'doc-123';
  doctor = signal<Doctor>(mockFetchDoctor(this.doctorId));

  country = signal<'EG'|'SA'|'AE'>(this.doctor().country);
  selectedModality = signal<Modality>('video');

  // week navigation
  weekIndex = signal(0); // 0=this, +1 next, -1 prev
  prevWeek() { this.weekIndex.update(w => w - 1); }
  nextWeek() { this.weekIndex.update(w => w + 1); }
  thisWeek() { this.weekIndex.set(0); }

  // labels
  daysIdx = [0,1,2,3,4,5,6];
  daysLabels = days;

  // compute week label (Mon..Sun)
  private today = new Date();
  private mondayOf(weekIdx: number) {
    const base = new Date(this.today);
    const dow = base.getDay() || 7; // Sun=0 -> 7
    const mon = new Date(base);
    mon.setDate(base.getDate() - dow + 1 + (weekIdx*7));
    mon.setHours(0,0,0,0);
    return mon;
  }
  weekLabel = computed(() => {
    const start = this.mondayOf(this.weekIndex());
    const end = new Date(start); end.setDate(start.getDate()+6);
    return `${start.getFullYear()}-${pad(start.getMonth()+1)}-${pad(start.getDate())} → ${end.getFullYear()}-${pad(end.getMonth()+1)}-${pad(end.getDate())}`;
  });

  // slots for current visible week
  slots = computed<Slot[]>(() => makeSlotsForWeek(Math.abs(this.weekIndex()) % 2));

  slotsForDay = (d: number) => computed(() =>
    this.slots()
      .filter(s => s.dayIdx === d)
      .sort((a,b) => a.start.localeCompare(b.start))
  );

  // next available (search this & next week)
  nextAvailable = computed(() => {
    const lists = [
      makeSlotsForWeek(Math.abs(this.weekIndex()) % 2),
      makeSlotsForWeek((Math.abs(this.weekIndex())+1) % 2)
    ].flat();

    // crude “soonest” by dayIdx then start
    const sorted = lists.sort((a,b) =>
      a.dayIdx - b.dayIdx || a.start.localeCompare(b.start)
    );
    return sorted[0] ?? null;
  });

  // price view for selected modality
  price = computed(() => {
    const p = this.doctor().prices[this.country()];
    const m = this.selectedModality();
    return { currency: p.currency, value: p[m] };
  });

  pickModality(m: Modality) {
    this.selectedModality.set(m);
    this.snack.open(`Selected ${m}`, undefined, { duration: 900 });
  }

  // helpers
  timeRange(s: Slot) { return `${s.start}–${hhmmPlus(s.start, s.duration)}`; }
  classFor(s: Slot) {
    const m = this.selectedModality();
    return {
      chat: s.modalities.length === 1 && s.modalities[0] === 'chat',
      voice: s.modalities.length === 1 && s.modalities[0] === 'voice',
      video: s.modalities.length === 1 && s.modalities[0] === 'video',
      multi: s.modalities.length > 1,
      incompatible: m != null && !s.modalities.includes(m)
    };
  }

  // actions
  bookNow(mod?: Modality) {
    if (mod) this.selectedModality.set(mod);
    this.router.navigate(['/patient/booking', this.doctor().id], { queryParams: { m: this.selectedModality() } });
  }

  seeAllReviews() {
    this.router.navigate(['/patient/reviews'], { queryParams: { doctorId: this.doctor().id } });
  }
}

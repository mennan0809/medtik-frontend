import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

type Modality = 'chat' | 'voice' | 'video';

type Slot = {
  id: string;
  dayIdx: number;          // 0..6 => Mon..Sun (Mon first)
  start: string;           // 'HH:mm'
  duration: number;        // minutes
  modalities: Modality[];  // available for this slot
  notes?: string;
};

function pad(n: number) { return (n < 10 ? '0' : '') + n; }
function hhmmPlus(hhmm: string, minutes: number) {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const h2 = Math.floor(total / 60) % 24;
  const m2 = total % 60;
  return `${pad(h2)}:${pad(m2)}`;
}
const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const uid = () => Math.random().toString(36).slice(2, 10);

// -----------------------------
// Mock doctor + mock slots (replace with API later)
// -----------------------------
const MOCK_DOC = {
  id: 'doc-123',
  name: 'Dr. Sarah Ali',
  department: 'Pediatrics',
  avatar: 'https://i.pravatar.cc/120?img=5',
  prices: {
    EG: { currency: 'EGP', chat: 80, voice: 120, video: 180 },
    SA: { currency: 'SAR', chat: 90, voice: 140, video: 200 },
    AE: { currency: 'AED', chat: 60, voice: 95,  video: 150 },
  },
  policies: {
    cancellation: 'Free cancellation up to 2 hours before visit.',
    refund:       'No-show refunds are not available.',
    reschedule:   'Reschedule up to 30 minutes before visit.',
  }
};

function makeSlotsForWeek(seedOffset = 0): Slot[] {
  // simple demo set; vary a bit with week index
  return [
    { id: uid(), dayIdx: (0 + seedOffset) % 7, start: '09:00', duration: 25, modalities: ['chat','voice'] as Modality[] },
    { id: uid(), dayIdx: (0 + seedOffset) % 7, start: '10:00', duration: 25, modalities: ['video'] as Modality[] },
    { id: uid(), dayIdx: (3 + seedOffset) % 7, start: '13:00', duration: 25, modalities: ['video'] as Modality[] },
    { id: uid(), dayIdx: (4 + seedOffset) % 7, start: '16:00', duration: 25, modalities: ['chat','video'] as Modality[] },
  ];
}

@Component({
  standalone: true,
  selector: 'app-booking',
  templateUrl: './booking.html',
  styleUrls: ['./booking.scss'],
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,

    // Material
    MatIconModule, MatButtonModule, MatButtonToggleModule,
    MatFormFieldModule, MatInputModule, MatTooltipModule,
    MatDividerModule, MatSnackBarModule
  ]
})
export class BookingComponent {
  private route = inject(ActivatedRoute);
  private snack = inject(MatSnackBar);

  // doctor id (wired for API later)
  doctorId = this.route.snapshot.paramMap.get('doctorId') ?? MOCK_DOC.id;

  // doctor signal
  doctor = signal(MOCK_DOC);

  // ------------ Week navigation ------------
  private today = new Date();
  weekIndex = signal(0); // 0 = this week, -1 prev, +1 next

  weekLabel = computed(() => {
    const start = this.mondayOfWeek(this.weekIndex());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())} → ` +
           `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;
  });

  prevWeek() { this.weekIndex.update(n => n - 1); }
  nextWeek() { this.weekIndex.update(n => n + 1); }
  thisWeek() { this.weekIndex.set(0); }

  private mondayOfWeek(weekIdx: number) {
    const base = new Date(this.today);
    const day = base.getDay() || 7; // Sun=0 => 7
    const mon = new Date(base);
    mon.setDate(base.getDate() - day + 1 + (weekIdx * 7));
    mon.setHours(0,0,0,0);
    return mon;
  }

  // ------------ Slots for the visible week ------------
  slots = computed<Slot[]>(() => makeSlotsForWeek(Math.abs(this.weekIndex()) % 2));

  daysIdx = [0,1,2,3,4,5,6];
  daysLabels = days;

  slotsForDay = (d: number) => computed(() =>
    this.slots()
      .filter(s => s.dayIdx === d)
      .sort((a,b) => a.start.localeCompare(b.start))
  );

  // ------------ Wizard state ------------
  step = signal<1 | 2 | 3>(1);
  modality = signal<Modality | null>(null);
  selectedSlot = signal<Slot | null>(null);

  // Intake form
  form: FormGroup;
  constructor() {
    this.form = new FormGroup({
      reason: new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
      attachments: new FormControl<FileList | null>(null)
    });
  }

  setModality(m: Modality) {
    this.modality.set(m);
    const s = this.selectedSlot();
    if (s && !s.modalities.includes(m)) this.selectedSlot.set(null);
  }

  pickSlot(s: Slot) {
    if (!this.modality()) {
      this.snack.open('Choose modality first', 'OK', { duration: 1600 });
      return;
    }
    if (!s.modalities.includes(this.modality()!)) {
      this.snack.open('This slot does not support the selected modality.', 'OK', { duration: 1800 });
      return;
    }
    this.selectedSlot.set(s);
  }

  // price (country can be wired from user later; EG as default demo)
  readonly country = signal<'EG' | 'SA' | 'AE'>('EG');
  price = computed(() => {
    const m = this.modality();
    if (!m) return null;
    const p = this.doctor().prices[this.country()];
    return { currency: p.currency, value: p[m] };
  });

  // ------------- Actions -------------
  next() {
    if (this.step() === 1) {
      if (!this.modality()) { this.snack.open('Select a modality to continue', 'OK', { duration: 1600 }); return; }
      this.step.set(2);
    } else if (this.step() === 2) {
      if (!this.selectedSlot()) { this.snack.open('Pick a time slot to continue', 'OK', { duration: 1600 }); return; }
      this.step.set(3);
    }
  }
  back() {
    if (this.step() === 2) this.step.set(1);
    else if (this.step() === 3) this.step.set(2);
  }

  confirm() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const s = this.selectedSlot()!;
    const m = this.modality()!;
    const pr = this.price();
    console.log('BOOK', {
      doctorId: this.doctorId, slotId: s.id, modality: m,
      reason: this.form.get('reason')!.value, country: this.country(),
      price: pr
    });
    this.snack.open('Appointment confirmed 🎉', 'OK', { duration: 2000 });
    // TODO: navigate to /appointments/:id after backend
  }

  // ------------- Helpers for template -------------
  timeRange(s: Slot) { return `${s.start}–${hhmmPlus(s.start, s.duration)}`; }
  classFor(s: Slot) {
    const m = this.modality();
    return {
      selected: this.selectedSlot()?.id === s.id,
      chat: s.modalities.length === 1 && s.modalities[0] === 'chat',
      voice: s.modalities.length === 1 && s.modalities[0] === 'voice',
      video: s.modalities.length === 1 && s.modalities[0] === 'video',
      multi: s.modalities.length > 1,
      incompatible: m != null && !s.modalities.includes(m)
    };
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SlotDialogComponent, SlotDialogData, SlotDialogResult, Modality } from './slot-dialog';

export interface Slot {
  id: string;
  dayIdx: number;         // 0..6 => Mon..Sun
  start: string;          // 'HH:mm'
  duration: number;       // minutes
  modalities: Modality[]; // 1..3
  notes?: string;
}

const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const pad = (n: number) => (n < 10 ? '0' : '') + n;
const uid = () => Math.random().toString(36).slice(2, 10);

// add minutes to HH:mm
function hhmmPlus(hhmm: string, minutes: number) {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const h2 = Math.floor(total / 60) % 24;
  const m2 = total % 60;
  return `${pad(h2)}:${pad(m2)}`;
}

// Monday of the week for a given date (local)
function mondayOf(d: Date) {
  const res = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = res.getDay();               // 0 Sun .. 6 Sat
  const delta = dow === 0 ? -6 : 1 - dow; // shift back to Mon
  res.setDate(res.getDate() + delta);
  res.setHours(0,0,0,0);
  return res;
}
const iso = (x: Date) => `${x.getFullYear()}-${pad(x.getMonth()+1)}-${pad(x.getDate())}`;

@Component({
  standalone: true,
  selector: 'app-schedule',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './schedule.html',
  styleUrls: ['./schedule.scss']
})
export class ScheduleComponent {
  private dialog = inject(MatDialog);

  daysLabels = days;
  daysIdx = [0,1,2,3,4,5,6];

  // ---- Week navigation ------------------------------------------------------
  private weekOffset = signal(0);                // 0 = this week, -1 prev, +1 next, etc.
  private weekStart = computed(() => {
    const today = new Date();
    today.setDate(today.getDate() + this.weekOffset()*7);
    return mondayOf(today);
  });
  weekLabel = computed(() => {
    const mon = this.weekStart();
    const sun = new Date(mon); sun.setDate(mon.getDate()+6);
    const fmt = (x: Date) => `${x.getFullYear()}-${pad(x.getMonth()+1)}-${pad(x.getDate())}`;
    return `${fmt(mon)} → ${fmt(sun)}`;
  });
  private weekKey = computed(() => iso(this.weekStart()));

  prevWeek(){ this.saveCurrentWeek(); this.weekOffset.update(v => v - 1); this.loadWeek(); }
  nextWeek(){ this.saveCurrentWeek(); this.weekOffset.update(v => v + 1); this.loadWeek(); }
  thisWeek(){ this.saveCurrentWeek(); this.weekOffset.set(0); this.loadWeek(true); }

  // ---- Per-week store -------------------------------------------------------
  // Key = Monday ISO date (YYYY-MM-DD), Value = slots array for that week
  private store: Record<string, Slot[]> = {};

  // working set for the *current* week in view
  private _slots = signal<Slot[]>([]);

  // Initial seed: put your existing sample slots into "this week"
  constructor() {
    const seedKey = this.weekKey();
    this.store[seedKey] = [
      { id: uid(), dayIdx: 0, start: '09:00', duration: 25, modalities: ['chat'] },
      { id: uid(), dayIdx: 0, start: '10:00', duration: 25, modalities: ['voice','video'] },
      { id: uid(), dayIdx: 3, start: '13:00', duration: 25, modalities: ['video'] }
    ];
    this.loadWeek(true);
  }

  private loadWeek(reset = false) {
    const key = this.weekKey();
    const arr = this.store[key] ?? [];
    // set a fresh array to keep signal updates clean
    this._slots.set(reset ? [...arr] : [...arr]);
  }

  private saveCurrentWeek() {
    // persist in-memory when leaving a week
    this.store[this.weekKey()] = [...this._slots()];
  }

  // ---- Filter + per-day view -----------------------------------------------
  activeFilter = signal<'all' | Modality>('all');

  slotsForDay = (d: number) => computed(() => {
    const filter = this.activeFilter();
    return this._slots()
      .filter(s => s.dayIdx === d)
      .filter(s => filter === 'all' ? true : s.modalities.includes(filter))
      .sort((a, b) => a.start.localeCompare(b.start));
  });

  timeRange(s: Slot) { return `${s.start}–${hhmmPlus(s.start, s.duration)}`; }
  classFor(s: Slot) {
    return {
      chat:  s.modalities.length === 1 && s.modalities[0] === 'chat',
      voice: s.modalities.length === 1 && s.modalities[0] === 'voice',
      video: s.modalities.length === 1 && s.modalities[0] === 'video',
      multi: s.modalities.length > 1
    };
  }

  // ---- Create / Edit / Delete ----------------------------------------------
  addSlot(dayIdx: number) {
    const sameDay = this._slots().filter(s => s.dayIdx === dayIdx).map(s => ({ start: s.start, duration: s.duration }));
    const data: SlotDialogData = { dayIdx, allSlots: sameDay };

    this.dialog.open(SlotDialogComponent, { data, panelClass: 'medtik-dialog' })
      .afterClosed()
      .subscribe((res?: SlotDialogResult) => {
        if (!res) return;
        this._slots.update(x => [...x, {
          id: uid(),
          dayIdx,
          start: res.start,
          duration: res.duration,
          modalities: res.modalities,
          notes: res.notes || ''
        }]);
        this.saveCurrentWeek();
      });
  }

  editSlot(s: Slot) {
    const sameDay = this._slots()
      .filter(k => k.dayIdx === s.dayIdx && k.id !== s.id)
      .map(k => ({ start: k.start, duration: k.duration }));

    const data: SlotDialogData = { dayIdx: s.dayIdx, slot: { ...s }, allSlots: sameDay };

    this.dialog.open(SlotDialogComponent, { data, panelClass: 'medtik-dialog' })
      .afterClosed()
      .subscribe((res?: (SlotDialogResult & { delete?: true })) => {
        if (!res) return;
        if (res.delete) {
          this._slots.update(x => x.filter(k => k.id !== s.id));
          this.saveCurrentWeek();
          return;
        }
        this._slots.update(x => x.map(k => k.id === s.id ? {
          ...k,
          start: res.start,
          duration: res.duration,
          modalities: res.modalities,
          notes: res.notes || ''
        } : k));
        this.saveCurrentWeek();
      });
  }

  setFilter(v: 'all' | Modality) { this.activeFilter.set(v); }
}

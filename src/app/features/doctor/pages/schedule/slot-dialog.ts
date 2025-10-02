import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type Modality = 'chat' | 'voice' | 'video';

export interface SlotDialogData {
  dayIdx: number;
  slot?: { start: string; duration: number; modalities: Modality[]; notes?: string };
  /** Only slots on the same day for overlap detection */
  allSlots?: { start: string; duration: number }[];
}

export interface SlotDialogResult {
  start: string;
  duration: number;
  modalities: Modality[];
  notes?: string;
}

/** Union so we can return a delete intent cleanly */
export type SlotDialogClose = SlotDialogResult | { delete: true };

@Component({
  standalone: true,
  selector: 'app-slot-dialog',
  templateUrl: './slot-dialog.html',
  styleUrls: ['./slot-dialog.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class SlotDialogComponent {
  /** keep as any-shaped form so bracket access works in template without strict errors */
  form!: FormGroup;
  /** store injected data here (with a safe fallback) */
  data!: SlotDialogData;

  constructor(
    private dialogRef: MatDialogRef<SlotDialogComponent, SlotDialogClose | undefined>,
    @Inject(MAT_DIALOG_DATA) injected: SlotDialogData | null
  ) {
    // Fallback so we never crash if no data was provided
    this.data = injected ?? { dayIdx: 0, allSlots: [] };

    // Build the form AFTER data is available
    this.form = new FormGroup({
      start: new FormControl<string>(this.data.slot?.start ?? '09:00', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/^\d{2}:\d{2}$/)]
      }),
      duration: new FormControl<number>(this.data.slot?.duration ?? 25, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(5), Validators.max(180)]
      }),
      chat: new FormControl<boolean>(
        this.data.slot ? this.data.slot.modalities.includes('chat') : true,
        { nonNullable: true }
      ),
      voice: new FormControl<boolean>(
        this.data.slot ? this.data.slot.modalities.includes('voice') : false,
        { nonNullable: true }
      ),
      video: new FormControl<boolean>(
        this.data.slot ? this.data.slot.modalities.includes('video') : false,
        { nonNullable: true }
      ),
      notes: new FormControl<string>(this.data.slot?.notes ?? '', { nonNullable: true })
    });
  }

  // --- helpers ---
  get noModSelected(): boolean {
    const v = this.form.value as any;
    return !v.chat && !v.voice && !v.video;
  }

  private toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }

  private overlaps(start: string, duration: number): boolean {
    const list = this.data.allSlots ?? [];
    const s1 = this.toMinutes(start);
    const e1 = s1 + duration;
    return list.some(x => {
      const s2 = this.toMinutes(x.start);
      const e2 = s2 + x.duration;
      return Math.max(s1, s2) < Math.min(e1, e2);
    });
  }

  // --- actions ---
  cancel() { this.dialogRef.close(); }

  remove() { this.dialogRef.close({ delete: true }); }

  save() {
    if (this.form.invalid) return;
    if (this.noModSelected) return;

    const v = this.form.getRawValue() as any;

    if (this.overlaps(v.start, v.duration)) {
      this.form.setErrors({ overlap: true });
      return;
    }

    const modalities: Modality[] = [];
    if (v.chat)  modalities.push('chat');
    if (v.voice) modalities.push('voice');
    if (v.video) modalities.push('video');

    const result: SlotDialogResult = {
      start: v.start,
      duration: v.duration,
      modalities,
      notes: (v.notes || '').trim()
    };
    this.dialogRef.close(result);
  }
}

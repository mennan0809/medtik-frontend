import { Component, Inject, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

type RecordType = 'report' | 'prescription' | 'lab' | 'imaging' | 'other';

type MedRecord = {
  id: string;
  name: string;
  type: RecordType;
  createdAt: string;     // ISO string
  sizeKB: number;
  notes?: string;
  url: string;           // object URL for now
  mime: string;
  thumb?: string | null; // data URL / image URL used only for the card preview
};

const uid = () => Math.random().toString(36).slice(2, 10);
const toLocalDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });

/* ---------------- pdf.js (UMD) lazy loader ---------------- */
async function getPdfJs(): Promise<any> {
  const w = window as any;
  if (w.pdfjsLib) return w.pdfjsLib;

  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    // UMD build exposes window.pdfjsLib (stable 3.x)
    s.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load pdf.js'));
    document.head.appendChild(s);
  });

  const pdfjs = (window as any).pdfjsLib;
  // Set worker (UMD)
  pdfjs.GlobalWorkerOptions.workerSrc =
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  return pdfjs;
}

/* ---- Render first page of a PDF file to a PNG data URL ---- */
async function pdfFirstPageToDataUrl(file: File, maxW = 640, maxH = 420): Promise<string | null> {
  try {
    const pdfjs = await getPdfJs();
    const data = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data }).promise;
    const page = await pdf.getPage(1);

    const viewport1 = page.getViewport({ scale: 1 });
    const scale = Math.min(maxW / viewport1.width, maxH / viewport1.height, 2);
    const viewport = page.getViewport({ scale: scale > 0 ? scale : 1 });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport }).promise;

    return canvas.toDataURL('image/png');
  } catch (e) {
    console.warn('PDF thumbnail generation failed:', e);
    return null;
  }
}

/* ---------------- Mock data ---------------- */
function mockRecords(): MedRecord[] {
  const mk = (
    name: string,
    type: RecordType,
    daysAgo = 0,
    sizeKB = 320,
    mime = 'application/pdf',
    url = '#',
    thumb: string | null = null
  ): MedRecord => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return {
      id: uid(),
      name,
      type,
      createdAt: d.toISOString(),
      sizeKB,
      notes: '',
      url,
      mime,
      thumb
    };
  };

  return [
    mk('CBC Result.pdf', 'lab', 1, 210), // pdf (no thumb yet)
    mk(
      'X-ray Chest.png',
      'imaging',
      3,
      540,
      'image/png',
      // image URL doubles as thumbnail
      'https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?auto=format&fit=crop&w=1400&q=60',
      'https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?auto=format&fit=crop&w=600&q=50'
    ),
    mk('Derm Rx.pdf', 'prescription', 8, 95),
    mk('Discharge Summary.pdf', 'report', 15, 780),
    mk('Allergy Note.txt', 'other', 20, 12, 'text/plain')
  ];
}

function guessTypeByMime(mime: string): RecordType {
  if (mime.startsWith('image/')) return 'imaging';
  if (mime === 'application/pdf') return 'report';
  return 'other';
}

@Component({
  standalone: true,
  selector: 'app-records',
  templateUrl: './records.html',
  styleUrls: ['./records.scss'],
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatIconModule, MatButtonModule, MatButtonToggleModule,
    MatFormFieldModule, MatInputModule, MatTooltipModule,
    MatMenuModule, MatDialogModule, MatSnackBarModule
  ]
})
export class RecordsComponent {
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  all = signal<MedRecord[]>(mockRecords());

  // seed demo imaging cover if empty (kept from your version)
  constructor() {
    const updated = this.all().map(r =>
      r.type === 'imaging' && r.mime.startsWith('image/') && r.url === '#'
        ? {
            ...r,
            url: 'https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?auto=format&fit=crop&w=1400&q=60',
            thumb: 'https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?auto=format&fit=crop&w=600&q=50'
          }
        : r
    );
    this.all.set(updated);
  }

  // filters
  query = signal('');
  filter = signal<RecordType | 'all'>('all');

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const f = this.filter();
    return this.all()
      .filter(r => (f === 'all' ? true : r.type === f))
      .filter(r => {
        if (!q) return true;
        return (
          r.name.toLowerCase().includes(q) ||
          (r.notes ?? '').toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  /* ---------------- Actions ---------------- */

  openAdd() {
    const ref = this.dialog.open(AddEditRecordDialogComponent, {
      panelClass: 'medtik-dialog',
      data: { mode: 'add' } as AddEditData,
      width: 'min(92vw, 700px)'
    });

    ref.afterClosed().subscribe(async (res?: AddEditResult) => {
      if (!res) return;
      if (!res.file) { this.snack.open('File is required.', 'OK', { duration: 1400 }); return; }

      const file = res.file as File;
      const url = URL.createObjectURL(file);
      const now = res.date ? new Date(res.date) : new Date();

      // build thumbnail
      let thumb: string | null = null;
      if (file.type.startsWith('image/')) {
        thumb = url;
      } else if (file.type === 'application/pdf') {
        thumb = await pdfFirstPageToDataUrl(file);
      }

      const rec: MedRecord = {
        id: uid(),
        name: (res.name || file.name).trim(),
        type: res.type || guessTypeByMime(file.type),
        createdAt: now.toISOString(),
        sizeKB: Math.max(1, Math.round(file.size / 1024)),
        notes: (res.notes || '').trim(),
        url,
        mime: file.type || 'application/octet-stream',
        thumb
      };
      this.all.update(list => [rec, ...list]);
      this.snack.open('Record added', 'OK', { duration: 1400 });
    });
  }

  openEdit(r: MedRecord) {
    const ref = this.dialog.open(AddEditRecordDialogComponent, {
      panelClass: 'medtik-dialog',
      data: { mode: 'edit', record: { ...r } } as AddEditData,
      width: 'min(92vw, 700px)'
    });

    ref.afterClosed().subscribe(async (res?: AddEditResult) => {
      if (!res) return;

      const list = this.all().slice();
      const idx = list.findIndex(x => x.id === r.id);
      if (idx < 0) return;

      const x = list[idx];
      let url = x.url;
      let mime = x.mime;
      let sizeKB = x.sizeKB;
      let thumb: string | null | undefined = x.thumb;

      if (res.file) {
        try { if (x.url.startsWith('blob:')) URL.revokeObjectURL(x.url); } catch {}
        url = URL.createObjectURL(res.file);
        mime = res.file.type || x.mime;
        sizeKB = Math.max(1, Math.round(res.file.size / 1024));

        if (mime.startsWith('image/')) thumb = url;
        else if (mime === 'application/pdf') thumb = await pdfFirstPageToDataUrl(res.file);
        else thumb = null;
      }

      list[idx] = {
        ...x,
        name: (res.name || x.name).trim(),
        type: res.type || x.type,
        notes: (res.notes || '').trim(),
        createdAt: res.date ? new Date(res.date).toISOString() : x.createdAt,
        url, mime, sizeKB, thumb
      };
      this.all.set(list);

      this.snack.open('Record updated', 'OK', { duration: 1200 });
    });
  }

  preview(r: MedRecord) {
    this.dialog.open(PreviewDialogComponent, {
      panelClass: 'medtik-dialog',
      data: { record: r } as PreviewData,
      width: 'min(92vw, 900px)',
      maxHeight: '90vh'
    });
  }

  download(r: MedRecord) {
    const a = document.createElement('a');
    a.href = r.url;
    a.download = r.name || 'record';
    a.click();
  }

  delete(r: MedRecord) {
    if (!confirm(`Delete "${r.name}"?`)) return;
    this.all.update(list => list.filter(x => x.id !== r.id));
    try { if (r.url.startsWith('blob:')) URL.revokeObjectURL(r.url); } catch {}
    this.snack.open('Record deleted', 'OK', { duration: 1200 });
  }

  // Helpers
  pillClass(t: RecordType) {
    return {
      report: t === 'report',
      prescription: t === 'prescription',
      lab: t === 'lab',
      imaging: t === 'imaging',
      other: t === 'other'
    };
  }
  dateLabel(iso: string) { return toLocalDate(iso); }
  isPDF(mime: string) { return mime === 'application/pdf'; }
}

/* ---------------- Add / Edit Dialog ---------------- */

type AddEditMode = 'add' | 'edit';
type AddEditData =
  | { mode: 'add' }
  | { mode: 'edit'; record: MedRecord };

type AddEditResult = {
  name: string;
  type: RecordType;
  date: string | null;
  notes?: string;
  file: File | null;   // required when mode = add
};

@Component({
  standalone: true,
  selector: 'app-add-edit-record-dialog',
  template: `
  <h2 mat-dialog-title>
    <mat-icon>{{ data.mode === 'add' ? 'upload_file' : 'edit' }}</mat-icon>
    {{ data.mode === 'add' ? 'Add record' : 'Edit record' }}
  </h2>

  <mat-dialog-content>
    <form [formGroup]="form" class="dlg-form">
      <mat-form-field appearance="outline" class="field">
        <mat-label>Title</mat-label>
        <input matInput formControlName="name" placeholder="e.g., CBC Result" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="field">
        <mat-label>Type</mat-label>
        <select matNativeControl formControlName="type">
          <option value="report">Report</option>
          <option value="prescription">Prescription</option>
          <option value="lab">Lab</option>
          <option value="imaging">Imaging</option>
          <option value="other">Other</option>
        </select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="field">
        <mat-label>Date</mat-label>
        <input matInput type="date" formControlName="date" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="field full">
        <mat-label>Notes</mat-label>
        <textarea matInput rows="3" formControlName="notes"></textarea>
      </mat-form-field>

      <div class="uploader" [class.error]="fileRequired() && !form.controls['file'].value">
        <mat-icon>attach_file</mat-icon>
        <label>
          {{ data.mode === 'add' ? 'Choose a file' : 'Replace file (optional)' }}
          <input type="file" (change)="onFile($event)" />
        </label>
        <div class="file-name" *ngIf="fileName()">{{ fileName() }}</div>
        <div class="hint" *ngIf="fileRequired() && !form.controls['file'].value">File is required.</div>
      </div>
    </form>
  </mat-dialog-content>

  <mat-dialog-actions align="end">
    <button mat-button (click)="close()">Cancel</button>
    <button mat-flat-button color="primary" (click)="save()">Save</button>
  </mat-dialog-actions>
  `,
  styles: [`
  .dlg-form { display:grid; gap:.75rem; grid-template-columns: 1fr 1fr; }
  .field.full { grid-column: 1 / -1; }
  .uploader {
    grid-column: 1 / -1;
    display:flex; align-items:center; gap:.6rem;
    border:1px dashed rgba(255,255,255,.15); padding:.75rem; border-radius: 12px;
  }
  .uploader.error { border-color:#ff7a7a; }
  .uploader input[type=file] { display:block; margin-top:.15rem; }
  .file-name { opacity:.85; font-size:.9rem; }
  .hint { color:#ff7a7a; font-size:.85rem; }
  .mdc-text-field--outlined .mdc-text-field__input { padding-top: 12px !important; padding-bottom: 12px !important; line-height: 1 !important; }
  .mat-mdc-form-field { --mat-form-field-container-vertical-padding: 15px; }
  `],
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule
  ]
})
export class AddEditRecordDialogComponent {
  form: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<AddEditRecordDialogComponent, AddEditResult | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: AddEditData
  ) {
    // initialize form first with safe defaults
    this.form = new FormGroup({
      name: new FormControl<string>('', { nonNullable: true }),
      type: new FormControl<RecordType>('report', { nonNullable: true }),
      date: new FormControl<string | null>(null),
      notes: new FormControl<string>('', { nonNullable: true }),
      file: new FormControl<File | null>(null)
    });

    // if editing, patch values from the incoming record
    const defaults = (data as any).record as MedRecord | undefined;
    if (defaults) {
      this.form.patchValue({
        name: defaults.name,
        type: defaults.type,
        date: defaults.createdAt.slice(0, 10),
        notes: defaults.notes ?? ''
      });
    }
  }

  fileRequired() { return this.data.mode === 'add'; }
  fileName() { return this.form.controls['file'].value?.name ?? ''; }

  onFile(e: Event) {
    const input = e.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    this.form.controls['file'].setValue(file);
    if (file && !this.form.controls['name'].value) {
      this.form.controls['name'].setValue(file.name.replace(/\.[^.]+$/, ''));
    }
  }

  close() { this.dialogRef.close(); }

  save() {
    if (this.fileRequired() && !this.form.controls['file'].value) return;
    const v = this.form.getRawValue();
    const result: AddEditResult = {
      name: v.name,
      type: v.type,
      date: v.date,
      notes: v.notes,
      file: v.file
    };
    this.dialogRef.close(result);
  }
}

/* ---------------- Preview Dialog ---------------- */

type PreviewData = { record: MedRecord };

@Component({
  standalone: true,
  selector: 'app-record-preview-dialog',
  template: `
  <h2 mat-dialog-title>
    <mat-icon>visibility</mat-icon>
    Preview
  </h2>

  <mat-dialog-content class="pv">
    <div class="pv-meta">
      <div class="name">{{ data.record.name }}</div>
      <div class="sub">
        <span class="pill" [ngClass]="data.record.type">{{ data.record.type }}</span>
        <span class="dot">•</span>
        <span>{{ data.record.sizeKB }} KB</span>
        <span class="dot">•</span>
        <span>{{ data.record.createdAt | date: 'mediumDate' }}</span>
      </div>
    </div>

    <div class="pv-view" *ngIf="isImage(); else notImg">
      <img [src]="data.record.url" alt="" />
    </div>

    <ng-template #notImg>
      <div class="pv-view pdf" *ngIf="isPDF(); else generic">
        <!-- Use SafeResourceUrl so PDFs actually render -->
        <iframe [src]="safeUrl" width="100%" height="100%" style="border:0;"></iframe>
      </div>
    </ng-template>

    <ng-template #generic>
      <div class="generic">
        <mat-icon>insert_drive_file</mat-icon>
        <div>No inline preview. Use download.</div>
      </div>
    </ng-template>
  </mat-dialog-content>

  <mat-dialog-actions align="end">
    <a mat-stroked-button [href]="data.record.url" [attr.download]="data.record.name">
      <mat-icon>download</mat-icon> Download
    </a>
    <button mat-button mat-dialog-close>Close</button>
  </mat-dialog-actions>
  `,
  styles: [`
  .pv { display:grid; gap:.75rem; }
  .pv-meta .name { font-weight:800; letter-spacing:.2px; }
  .pv-meta .sub { opacity:.85; display:flex; align-items:center; gap:.5rem; flex-wrap:wrap; }
  .pv-meta .dot { opacity:.5; }
  .pv-view { height: 60vh; border:1px solid rgba(255,255,255,.08); border-radius:12px; overflow:hidden; background:#0f131b; display:grid; place-items:center; }
  .pv-view img { width:100%; height:100%; object-fit:contain; }
  .pv-view.pdf { background:#0f131b; }
  .generic { display:grid; gap:.25rem; place-items:center; opacity:.85; }
  `],
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule]
})
export class PreviewDialogComponent {
  safeUrl: SafeResourceUrl;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PreviewData,
    private sanitizer: DomSanitizer
  ) {
    // Important for blob: and file: URLs
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.data.record.url);
  }

  isImage() { return this.data.record.mime.startsWith('image/'); }
  isPDF()   { return this.data.record.mime === 'application/pdf'; }
}

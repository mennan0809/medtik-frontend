import { Component, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

type ReqStatus = 'Pending' | 'Approved' | 'Rejected';
type FieldType =
  | 'Name'
  | 'Department'
  | 'Bio'
  | 'Photo'
  | 'Pricing'
  | 'Consultation Types'
  | 'Languages'
  | 'Certificates'
  | 'Experience'
  | 'Location'
  | 'Other';

type ChangeItem = {
  field: FieldType;
  from: string | number | null;
  to:   string | number | null;
  // optionally: backend may attach a file or url to verify
  attachmentUrl?: string;
};

type DoctorChangeRequest = {
  id: string;
  doctorId: string;
  doctorName: string;
  email: string;
  phone: string;
  submitted: string; // ISO
  status: ReqStatus;
  changes: ChangeItem[];
  note?: string;
};

@Component({
  selector: 'admin-doctor-requests',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatChipsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatPaginatorModule, MatSnackBarModule, MatTooltipModule
  ],
  templateUrl: './doctor-requests.html',
  styleUrls: ['./doctor-requests.scss'],
})
export class AdminDoctorRequestsComponent {
  private snack = inject(MatSnackBar);

  // Controls
  search = new FormControl<string>('', { nonNullable: true });
  sortBy = new FormControl<'submitted' | 'doctor' | 'status'>('submitted', { nonNullable: true });
  sortDir = new FormControl<'desc' | 'asc'>('desc', { nonNullable: true });

  pageIndex = signal(0);
  pageSize  = signal(8);

  // Seed (replace with API)
  private rows = signal<DoctorChangeRequest[]>([
    {
      id:'CR-2012',
      doctorId:'D-01',
      doctorName:'Dr. Omar Khaled',
      email:'omar.k@example.com',
      phone:'+20 100 234 5678',
      submitted:'2025-01-15T10:12:00Z',
      status:'Pending',
      changes:[
        { field:'Pricing', from: 'EGP 250 (video)', to: 'EGP 300 (video)' },
        { field:'Bio', from: 'Senior Cardiologist', to: 'Consultant Cardiologist' },
      ],
      note:'Updating title + price.'
    },
    {
      id:'CR-2011',
      doctorId:'D-02',
      doctorName:'Dr. Sara Nabil',
      email:'sara.n@example.com',
      phone:'+20 122 888 1111',
      submitted:'2025-01-14T08:05:00Z',
      status:'Pending',
      changes:[
        { field:'Department', from:'Dermatology', to:'Cosmetology' },
        { field:'Consultation Types', from:'Voice + Video', to:'Video' }
      ]
    },
    {
      id:'CR-2010',
      doctorId:'D-03',
      doctorName:'Dr. Layla Adel',
      email:'layla.a@example.com',
      phone:'+20 110 222 3333',
      submitted:'2025-01-13T14:42:00Z',
      status:'Rejected',
      changes:[ { field:'Pricing', from:'EGP 90 (audio)', to:'EGP 200 (audio)' } ],
      note:'Increase too large — please justify.'
    },
    {
      id:'CR-2009',
      doctorId:'D-04',
      doctorName:'Dr. Yara Hassan',
      email:'yara.h@example.com',
      phone:'+20 115 444 7777',
      submitted:'2025-01-12T09:15:00Z',
      status:'Approved',
      changes:[ { field:'Photo', from:null, to:null, attachmentUrl:'https://example.com/photo.jpg' } ]
    },
    {
      id:'CR-2008',
      doctorId:'D-05',
      doctorName:'Dr. Ahmed Sami',
      email:'ahmed.s@example.com',
      phone:'+20 114 000 9090',
      submitted:'2025-01-11T16:20:00Z',
      status:'Pending',
      changes:[ { field:'Languages', from:'Arabic', to:'Arabic, English' } ]
    },
  ]);

  // Derived
  filtered = computed(() => {
    const q = (this.search.value || '').trim().toLowerCase();
    if (!q) return this.rows();
    return this.rows().filter(r =>
      (r.doctorName + ' ' + r.email + ' ' + r.phone + ' ' + r.status + ' ' +
       r.changes.map(c => `${c.field} ${c.from ?? ''} ${c.to ?? ''}`).join(' ')
      ).toLowerCase().includes(q)
    );
  });

  sorted = computed(() => {
    const list = [...this.filtered()];
    const by = this.sortBy.value;
    const dir = this.sortDir.value === 'asc' ? 1 : -1;
    return list.sort((a, b) => {
      let va: any, vb: any;
      if (by === 'submitted') { va = new Date(a.submitted).getTime() || 0; vb = new Date(b.submitted).getTime() || 0; }
      if (by === 'doctor')    { va = a.doctorName.toLowerCase(); vb = b.doctorName.toLowerCase(); }
      if (by === 'status')    { va = a.status; vb = b.status; }
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return cmp * dir;
    });
  });

  page = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.sorted().slice(start, start + this.pageSize());
  });

  // Actions (wire to API)
  accept(r: DoctorChangeRequest) {
    // await adminService.acceptDoctorChange(r.id);
    r.status = 'Approved';
    this.rows.set([...this.rows()]);
    this.snack.open(`Accepted ${r.id} — ${r.doctorName}`, 'OK', { duration: 2200 });
  }
  reject(r: DoctorChangeRequest) {
    // await adminService.rejectDoctorChange(r.id);
    r.status = 'Rejected';
    this.rows.set([...this.rows()]);
    this.snack.open(`Rejected ${r.id} — ${r.doctorName}`, 'OK', { duration: 2200 });
  }
  delete(r: DoctorChangeRequest) {
    // await adminService.deleteDoctorChange(r.id);
    this.rows.set(this.rows().filter(x => x.id !== r.id));
    this.snack.open(`Deleted ${r.id}`, 'OK', { duration: 1800 });
  }

  pageChange(e: PageEvent) {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
  }
}

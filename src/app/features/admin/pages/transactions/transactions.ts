import { Component, ViewChild, AfterViewInit, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';

type SessionType = 'voice' | 'audio' | 'video';

type SessionRow = {
  id: string;
  patient: string;
  doctor: string;
  department: string;
  type: SessionType;
  date: string; // ISO-like: "2025-01-15T09:30:00Z" or "2025-01-09"
};

@Component({
  selector: 'admin-transactions',
  standalone: true,
  providers: [DatePipe],
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule,
    MatChipsModule, MatIconModule, MatTooltipModule, MatButtonModule,
  ],
  templateUrl: './transactions.html',
  styleUrls: ['./transactions.scss'],
})
export class AdminTransactionsComponent implements AfterViewInit {
  cols = ['id','patient','doctor','department','type','date','actions'];
  readonly pageSize = 10;

  filterCtrl = new FormControl<string>('', { nonNullable: true });

  // Mock data — swap with API
  private seed: SessionRow[] = [
    { id:'S-1010', patient:'Alice Mostafa',  doctor:'Dr. Omar',   department:'Cardiology',  type:'video', date:'2025-01-15T09:30:00Z' },
    { id:'S-1009', patient:'Karim Adel',     doctor:'Dr. Sara',   department:'Dermatology', type:'voice', date:'2025-01-13T17:00:00Z' },
    { id:'S-1008', patient:'Nour Gamal',     doctor:'Dr. Layla',  department:'Pediatrics',  type:'audio', date:'2025-01-12T11:15:00Z' },
    { id:'S-1007', patient:'Youssef Said',   doctor:'Dr. Omar',   department:'Cardiology',  type:'video', date:'2025-01-10T14:45:00Z' },
    { id:'S-1006', patient:'Lamia Fathy',    doctor:'Dr. Sara',   department:'Dermatology', type:'voice', date:'2025-01-09' },
    { id:'S-1005', patient:'Hana Tarek',     doctor:'Dr. Layla',  department:'Pediatrics',  type:'audio', date:'2025-01-08' },
    { id:'S-1004', patient:'Ahmed Samir',    doctor:'Dr. Yara',   department:'Neurology',   type:'video', date:'2025-01-07' },
    { id:'S-1003', patient:'Mariam Zaki',    doctor:'Dr. Yara',   department:'Neurology',   type:'voice', date:'2025-01-06' },
    { id:'S-1002', patient:'Omar Ali',       doctor:'Dr. Layla',  department:'Pediatrics',  type:'audio', date:'2025-01-05' },
    { id:'S-1001', patient:'Sara Adel',      doctor:'Dr. Omar',   department:'Cardiology',  type:'video', date:'2025-01-03' },
    { id:'S-1000', patient:'Mahmoud Nasser', doctor:'Dr. Sara',   department:'Dermatology', type:'voice', date:'2024-12-30' },
  ];

  data = new MatTableDataSource<SessionRow>(this.seed);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  rangeLabel = computed(() => {
    if (!this.paginator) return '';
    const length = this.data.filteredData.length;
    const start = this.paginator.pageIndex * this.paginator.pageSize;
    const end = Math.min(start + this.paginator.pageSize, length);
    return length ? `Showing ${start + 1}–${end} of ${length}` : 'No results';
  });

  ngAfterViewInit(): void {
    this.data.paginator = this.paginator;

    // Sorting (normalize strings & dates)
    this.data.sort = this.sort;
    this.data.sortingDataAccessor = (item: SessionRow, prop: string) => {
      switch (prop) {
        case 'id':         return item.id;
        case 'patient':    return (item.patient ?? '').toLowerCase();
        case 'doctor':     return (item.doctor ?? '').toLowerCase();
        case 'department': return (item.department ?? '').toLowerCase();
        case 'type':       return item.type;
        case 'date':       return new Date(item.date).getTime() || 0;
        default:           return (item as any)[prop];
      }
    };

    // Default sort: Date ↓
    setTimeout(() => {
      this.sort.active = 'date';
      this.sort.direction = 'desc';
      this.sort.sortChange.emit({active: 'date', direction: 'desc'});
    });

    // Search across all text fields
    this.data.filterPredicate = (row, term) => {
      const q = term.trim().toLowerCase();
      return (
        row.id.toLowerCase().includes(q) ||
        row.patient.toLowerCase().includes(q) ||
        row.doctor.toLowerCase().includes(q) ||
        row.department.toLowerCase().includes(q) ||
        row.type.toLowerCase().includes(q)
      );
    };
    this.filterCtrl.valueChanges.subscribe(v => {
      this.data.filter = (v ?? '').trim().toLowerCase();
      if (this.data.paginator) this.data.paginator.firstPage();
    });
  }

  view(r: SessionRow) { /* TODO: open details dialog / navigate */ console.log('view session', r); }
}

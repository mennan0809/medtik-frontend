import { Component, ViewChild, AfterViewInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  joined: string; // ISO date string (e.g. 2024-08-21)
  status: 'active' | 'banned';
};

@Component({
  selector: 'admin-users',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatTooltipModule,
  ],
  templateUrl: './users.html',
  styleUrls: ['./users.scss'],
})
export class AdminUsersComponent implements AfterViewInit {
  cols = ['name', 'email', 'phone', 'joined', 'status', 'actions'];

  // Fixed page size
  readonly pageSize = 10;

  // Search
  filterCtrl = new FormControl<string>('', { nonNullable: true });

  // Mock data — replace with API data
  private seed: UserRow[] = [
    { id:'u1',  name:'Alice Mostafa',  email:'alice@example.com', phone:'+20 123 456 789', joined:'2024-08-21', status:'active' },
    { id:'u2',  name:'Karim Adel',     email:'karim@example.com', phone:'+20 111 222 333', joined:'2024-07-02', status:'banned' },
    { id:'u3',  name:'Nour Gamal',     email:'nour@example.com',  phone:'+20 100 999 888', joined:'2024-11-10', status:'active' },
    { id:'u4',  name:'Youssef Said',   email:'you@example.com',   phone:'+20 155 557 777', joined:'2025-01-05', status:'active' },
    { id:'u5',  name:'Lamia Fathy',    email:'lamia@example.com', phone:'+20 120 333 444', joined:'2024-12-02', status:'active' },
    { id:'u6',  name:'Hana Tarek',     email:'hana@example.com',  phone:'+20 122 777 555', joined:'2024-09-18', status:'active' },
    { id:'u7',  name:'Ahmed Samir',    email:'ahmed@example.com', phone:'+20 114 222 888', joined:'2024-05-03', status:'banned' },
    { id:'u8',  name:'Mariam Zaki',    email:'mariam@example.com',phone:'+20 101 333 222', joined:'2024-10-27', status:'active' },
    { id:'u9',  name:'Omar Ali',       email:'omar@example.com',  phone:'+20 109 101 202', joined:'2024-06-14', status:'active' },
    { id:'u10', name:'Sara Adel',      email:'sara@example.com',  phone:'+20 106 707 909', joined:'2024-04-22', status:'active' },
    { id:'u11', name:'Mahmoud Nasser', email:'mah@example.com',   phone:'+20 122 000 321', joined:'2024-03-02', status:'active' },
    { id:'u12', name:'Heba Lotfy',     email:'heba@example.com',  phone:'+20 115 666 444', joined:'2024-02-10', status:'active' },
  ];

  data = new MatTableDataSource<UserRow>(this.seed);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Nice range label in footer
  rangeLabel = computed(() => {
    if (!this.paginator) return '';
    const length = this.data.filteredData.length;
    const start = this.paginator.pageIndex * this.paginator.pageSize;
    const end = Math.min(start + this.paginator.pageSize, length);
    return length ? `Showing ${start + 1}–${end} of ${length}` : 'No results';
  });

  ngAfterViewInit(): void {
    // Hook paginator (Material needs [length] in the template too)
    this.data.paginator = this.paginator;

    // Hook sorter and normalize fields for sorting
    this.data.sort = this.sort;
    this.data.sortingDataAccessor = (item: UserRow, property: string) => {
      switch (property) {
        case 'name':   return (item.name ?? '').toLowerCase();
        case 'joined': return new Date(item.joined).getTime() || 0;
        default:       return (item as any)[property];
      }
    };
    // Optional: default sort to Joined desc
    setTimeout(() => {
      this.sort.active = 'joined';
      this.sort.direction = 'desc';
      this.sort.sortChange.emit({active: 'joined', direction: 'desc'});
    });

    // Filter: name + email + phone + status
    this.data.filterPredicate = (row, term) => {
      const q = term.trim().toLowerCase();
      return (
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.phone.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q)
      );
    };
    this.filterCtrl.valueChanges.subscribe(v => {
      this.data.filter = (v ?? '').trim().toLowerCase();
      if (this.data.paginator) this.data.paginator.firstPage();
    });
  }

  // Actions (wire to API)
  ban(u: UserRow)   { /* TODO: adminService.banUser(u.id) */   u.status = 'banned'; this.refresh(); }
  unban(u: UserRow) { /* TODO: adminService.unbanUser(u.id) */ u.status = 'active'; this.refresh(); }
  private refresh(){ this.data.data = [...this.data.data]; }
}

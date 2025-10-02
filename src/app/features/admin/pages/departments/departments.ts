import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';

type Doctor = {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  sessions?: number;
  rating?: number;
};

type Department = {
  id: string;
  name: string;
  description?: string;
  doctors: Doctor[];
};

@Component({
  selector: 'admin-departments',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatExpansionModule, MatChipsModule,
    MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatBadgeModule, MatTooltipModule, MatSnackBarModule, MatSelectModule
  ],
  templateUrl: './departments.html',
  styleUrls: ['./departments.scss'],
})
export class AdminDepartmentsComponent {
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  // ---- Seed data (swap with API) ----
  private data = signal<Department[]>([
    {
      id: 'cardio',
      name: 'Cardiology',
      description: 'Heart & vascular care.',
      doctors: [
        { id:'d-omar',  name:'Dr. Omar Khaled',  email:'omar.k@example.com',  status:'active',   sessions:212, rating:4.8 },
        { id:'d-ahmed', name:'Dr. Ahmed Sami',   email:'ahmed.s@example.com', status:'active',   sessions:98,  rating:4.5 },
      ]
    },
    {
      id: 'derma',
      name: 'Dermatology',
      description: 'Skin, hair & nails.',
      doctors: [
        { id:'d-sara',  name:'Dr. Sara Nabil',   email:'sara.n@example.com',  status:'active',   sessions:175, rating:4.7 },
        { id:'d-nour',  name:'Dr. Nour Gamal',   email:'nour.g@example.com',  status:'inactive', sessions:45,  rating:4.3 },
      ]
    },
    {
      id: 'pedia',
      name: 'Pediatrics',
      description: 'Children’s health.',
      doctors: [
        { id:'d-layla', name:'Dr. Layla Adel',   email:'layla.a@example.com', status:'active',   sessions:132, rating:4.6 },
      ]
    },
    {
      id: 'neuro',
      name: 'Neurology',
      description: 'Brain & nervous system.',
      doctors: [
        { id:'d-yara',  name:'Dr. Yara Hassan',  email:'yara.h@example.com',  status:'active',   sessions:158, rating:4.7 },
      ]
    },
    {
      id: 'ent',
      name: 'ENT',
      description: 'Ear, nose & throat.',
      doctors: [
        { id:'d-hany',  name:'Dr. Hany Fathy',   email:'hany.f@example.com',  status:'active',   sessions:61,  rating:4.2 },
      ]
    },
  ]);

  // ---- UI State ----
  search = new FormControl<string>('', { nonNullable: true });
  sortDept = new FormControl<'asc' | 'desc'>('asc', { nonNullable: true });

  // which department is being edited (id or null)
  editingId = signal<string | null>(null);

  // inline edit form
  editForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['']
  });

  // ---- Derived collections ----
  departments = computed(() => {
    const q = (this.search.value || '').trim().toLowerCase();
    const dir = this.sortDept.value === 'asc' ? 1 : -1;

    const filtered = this.data().map(dep => ({
      ...dep,
      doctors: dep.doctors
        .filter(d => {
          if (!q) return true;
          const hay = (dep.name + ' ' + dep.description + ' ' + d.name + ' ' + d.email + ' ' + d.status).toLowerCase();
          return hay.includes(q);
        })
        .sort((a, b) => a.name.localeCompare(b.name))
    }))
    .filter(dep => {
      if (!q) return true;
      const depMatch = (dep.name + ' ' + (dep.description || '')).toLowerCase().includes(q);
      return depMatch || dep.doctors.length > 0;
    })
    .sort((a, b) => a.name.localeCompare(b.name) * dir);

    return filtered;
  });

  // ---- Add Department form ----
  addForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['']
  });
  get f() { return this.addForm.controls; }

  addDepartment() {
    if (this.addForm.invalid) { this.addForm.markAllAsTouched(); return; }
    const { name, description } = this.addForm.value;
    const id = (name || '').toLowerCase().replace(/\s+/g, '-');
    const exists = this.data().some(d => d.id === id);
    if (exists) {
      this.snack.open('Department already exists', 'OK', { duration: 2200 });
      return;
    }
    const newDep: Department = { id, name: name!, description: description || '', doctors: [] };
    this.data.set([newDep, ...this.data()]);
    this.addForm.reset({ name: '', description: '' });
    this.snack.open('Department added', 'OK', { duration: 2000 });
  }

  // ---- Edit flow ----
  editDepartment(dep: Department) {
    this.editingId.set(dep.id);
    this.editForm.reset({ name: dep.name, description: dep.description || '' });
  }

  cancelEdit() {
    this.editingId.set(null);
  }

  saveDepartment(dep: Department) {
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    const { name, description } = this.editForm.value;

    // compute new id if name changes
    const newId = (name || '').toLowerCase().replace(/\s+/g, '-');
    const idChanged = newId && newId !== dep.id;
    const exists = idChanged && this.data().some(d => d.id === newId);

    if (exists) {
      this.snack.open('Another department already uses this name', 'OK', { duration: 2200 });
      return;
    }

    const updated: Department = {
      ...dep,
      id: idChanged ? newId : dep.id,
      name: name!,
      description: description || ''
    };

    const replaced = this.data().map(d => d.id === dep.id ? updated : d);
    this.data.set(replaced);
    this.editingId.set(null);
    this.snack.open('Department updated', 'OK', { duration: 1800 });
  }

  // ---- Actions (wire to API) ----
  removeDepartment(dep: Department) {
    this.data.set(this.data().filter(d => d.id !== dep.id));
    this.snack.open(`Removed ${dep.name}`, 'OK', { duration: 1800 });
  }

  deactivateDoctor(dep: Department, doc: Doctor) {
    doc.status = 'inactive';
    this.data.set([...this.data()]);
    this.snack.open(`Deactivated ${doc.name}`, 'OK', { duration: 1800 });
  }

  activateDoctor(dep: Department, doc: Doctor) {
    doc.status = 'active';
    this.data.set([...this.data()]);
    this.snack.open(`Activated ${doc.name}`, 'OK', { duration: 1800 });
  }

  // Stubs for future navigation/dialogs
  viewDoctor(dep: Department, doc: Doctor) {
    console.log('view doctor', dep.id, doc.id);
  }
}

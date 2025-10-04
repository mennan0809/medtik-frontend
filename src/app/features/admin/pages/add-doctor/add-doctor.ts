import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../services/admin.service';

type Department = { id: string; name: string };

const DEPARTMENTS: Department[] = [
  { id: 'cardio', name: 'Cardiology' },
  { id: 'derma',  name: 'Dermatology' },
  { id: 'pedia',  name: 'Pediatrics' },
  { id: 'neuro',  name: 'Neurology' },
  { id: 'ent',    name: 'ENT' },
  { id: 'ortho',  name: 'Orthopedics' },
];

@Component({
  selector: 'admin-add-doctor',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatCheckboxModule
  ],
  templateUrl: './add-doctor.html',
  styleUrls: ['./add-doctor.scss'],
})
export class AdminAddDoctorComponent {
  private readonly fb = inject(FormBuilder);
  private readonly snack = inject(MatSnackBar);
  private readonly adminService = inject(AdminService);

  departments = DEPARTMENTS;
  hidePass = true;
  loading = false;
  apiError: string | null = null;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?\d[\d\s-]{6,}$/)]],
    departmentId: [DEPARTMENTS[0].id, Validators.required],
    tempPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  get f() { return this.form.controls; }

  generatePassword() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const random = Array.from(crypto.getRandomValues(new Uint8Array(10)))
      .map(n => alphabet[n % alphabet.length])
      .join('');

    this.form.patchValue({ tempPassword: random });
    this.hidePass = false;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const department = this.departments.find(d => d.id === this.form.value.departmentId);
    if (!department) {
      this.apiError = 'Please pick a valid department.';
      return;
    }

    const payload = {
      email: this.form.value.email!,
      phoneNumber: this.form.value.phone!,
      password: this.form.value.tempPassword!,
      department: department.name,
    };

    this.loading = true;
    this.apiError = null;

    this.adminService.registerDoctor(payload).subscribe({
      next: res => {
        this.loading = false;
        this.snack.open(res.message ?? 'Doctor credentials created', 'OK', { duration: 2800 });
        this.form.reset({
          email: '',
          phone: '',
          departmentId: this.departments[0].id,
          tempPassword: '',
        });
        this.hidePass = true;
      },
      error: err => {
        this.loading = false;
        this.apiError = err;
      },
    });
  }
}

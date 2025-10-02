import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';

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
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  departments = DEPARTMENTS;
  hidePass = true;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?\d[\d\s-]{6,}$/)]],
    departmentId: [DEPARTMENTS[0].id, Validators.required],
    tempPassword: ['', [Validators.required, Validators.minLength(6)]],
    sendInvite: [true],
  });

  get f() { return this.form.controls; }

  generatePassword() {
    const p = Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map(n => 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'[n % 58])
      .join('');
    this.form.patchValue({ tempPassword: p });
    this.hidePass = false;
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const payload = {
      email: this.form.value.email!,
      phone: this.form.value.phone!,
      tempPassword: this.form.value.tempPassword!,
      departmentId: this.form.value.departmentId!,
      sendInvite: !!this.form.value.sendInvite,
    };

    // TODO: call adminService.createDoctor(payload).then(...)
    console.log('Create doctor payload:', payload);

    this.snack.open('Doctor credentials created', 'OK', { duration: 2600 });
    this.form.reset({
      email: '',
      phone: '',
      departmentId: DEPARTMENTS[0].id,
      tempPassword: '',
      sendInvite: true,
    });
    this.hidePass = true;
  }
}

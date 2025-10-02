import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors
} from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  standalone: true,
  selector: 'app-settings',
  templateUrl: './settings.html',
  styleUrls: ['./settings.scss'],
  imports: [
    CommonModule, ReactiveFormsModule,
    // Material
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSlideToggleModule, MatSnackBarModule
  ]
})
export class AdminSettingsComponent {
  private snack = inject(MatSnackBar);

  // ---------- Profile ----------
  avatarUrl = signal<string>('https://i.pravatar.cc/120?img=13');

  countries = [
    { code: 'EG', name: 'Egypt' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' }
  ];
  languages = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية' },
  ];
  timezones = [
    'Africa/Cairo','Asia/Riyadh','Asia/Dubai','Europe/London','America/New_York'
  ];

  profileForm = new FormGroup({
    fullName: new FormControl<string>('Sarah Ahmed', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    dob:      new FormControl<string>('1992-07-12'),
    phone:    new FormControl<string>('+20 10 1234 5678'),
    country:  new FormControl<string>('EG', { nonNullable: true }),
    language: new FormControl<string>('en', { nonNullable: true }),
    timezone: new FormControl<string>('Africa/Cairo', { nonNullable: true })
  });

  onPickAvatar(ev: Event) {
    const input = ev.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    try { URL.revokeObjectURL(this.avatarUrl()); } catch {}
    this.avatarUrl.set(URL.createObjectURL(file));
    this.snack.open('Photo updated (local preview)', 'OK', { duration: 1500 });
  }

  saveProfile() {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    // TODO: backend call
    this.snack.open('Profile saved', 'OK', { duration: 1200 });
  }

  // ---------- Change Password ----------
  passwordForm = new FormGroup(
    {
      oldPassword: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      newPassword: new FormControl<string>('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(8),
          // at least one letter & one number (light rule for demo)
          Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
        ]
      }),
      confirm: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] })
    },
    { validators: [matchPasswordValidator] } // group-level validator
  );

  changePassword() {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }

    const v = this.passwordForm.getRawValue();
    // TODO: call API with { oldPassword: v.oldPassword, newPassword: v.newPassword }
    // Here we just simulate success:
    this.passwordForm.reset({ oldPassword: '', newPassword: '', confirm: '' });
    this.snack.open('Password changed', 'OK', { duration: 1400 });
  }

  // ---------- Notifications (simplified) ----------
  notiForm = new FormGroup({
    push:      new FormControl<boolean>(true, { nonNullable: true }),
    email:     new FormControl<boolean>(true, { nonNullable: true }),
    appt:      new FormControl<boolean>(true, { nonNullable: true }),   // appointment reminders
    chat:      new FormControl<boolean>(true, { nonNullable: true }),   // chat replies
    marketing: new FormControl<boolean>(false, { nonNullable: true })   // promotions / tips
  });

  saveNotifications() {
    // TODO: backend call
    this.snack.open('Notification preferences saved', 'OK', { duration: 1200 });
  }
}

/** Cross-field validator: newPassword === confirm */
function matchPasswordValidator(group: AbstractControl): ValidationErrors | null {
  const newPass = group.get('newPassword')?.value;
  const conf    = group.get('confirm')?.value;
  if (!newPass || !conf) return null;
  return newPass === conf ? null : { passwordMismatch: true };
}

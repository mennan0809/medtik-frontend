import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService, LoginRequest } from '../services/auth.service';
import { DoctorProfileService } from '../../doctor/services/doctor-profile.service';
import {
  animate,
  query,
  stagger,
  style,
  transition,
  trigger,
} from '@angular/animations';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  animations: [
    trigger('flyIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px) scale(.98)' }),
        animate('500ms cubic-bezier(.2,.8,.2,1)', style({ opacity: 1, transform: 'none' })),
      ]),
    ]),
    trigger('staggerIn', [
      transition(':enter', [
        query('.stagger', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          stagger(60, animate('380ms ease-out', style({ opacity: 1, transform: 'none' }))),
        ]),
      ]),
    ]),
  ],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly doctorProfile = inject(DoctorProfileService, { optional: true });

  hide = true;
  loading = false;
  apiError: string | null = null;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: LoginRequest = {
      email: (this.form.value.email ?? '').trim().toLowerCase(),
      password: this.form.value.password ?? '',
    };

    this.loading = true;
    this.apiError = null;

    this.auth.login(payload).subscribe({
      next: result => {
        this.loading = false;
        const target = this.routeForRole(result.role);

        if (result.role === 'DOCTOR' && this.doctorProfile) {
          this.doctorProfile.refreshProfile().subscribe({
            next: () => this.router.navigateByUrl(target),
            error: () => this.router.navigateByUrl(target),
          });
          return;
        }

        this.router.navigateByUrl(target);
      },
      error: err => {
        this.loading = false;
        this.apiError = err;
      },
    });
  }

  private routeForRole(role: string | null): string {
    switch (role) {
      case 'ADMIN':
        return '/admin';
      case 'DOCTOR':
        return '/doctor';
      default:
        return '/patient';
    }
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService, VerifyOtpRequest } from '../services/auth.service';

function maskPhone(p: string): string {
  const match = p.match(/^(\+\d{1,4})(\d+)(\d{2,3})$/);
  if (!match) return p;
  const maskedMiddle = '*'.repeat(Math.max(3, match[2].length));
  return `${match[1]} ${maskedMiddle}${match[3]}`;
}

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './otp.html',
  styleUrls: ['./otp.scss'],
})
export class OtpComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  private readonly cooldownSeconds = 30;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  private getFromSession(key: string): string | null {
    return typeof window !== 'undefined' ? sessionStorage.getItem(key) : null;
  }

  phone = (history.state?.phone as string | undefined) ?? this.getFromSession('medtik_pending_phone') ?? '';
  email = (history.state?.email as string | undefined) ?? this.getFromSession('medtik_pending_email') ?? '';

  displayPhone = this.phone ? maskPhone(this.phone) : '';

  form = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  seconds = this.cooldownSeconds;
  loading = false;
  apiError: string | null = null;
  infoMessage: string | null = null;

  constructor() {
    if (!this.email) {
      this.router.navigate(['/auth/signup']);
      return;
    }
    this.startCooldown();
  }

  ngOnDestroy() {
    this.clearInterval();
  }

  resend() {
    if (this.seconds > 0) {
      return;
    }

    this.infoMessage = 'If your previous OTP expired we will send a new one automatically when you try again.';
    this.restartCooldown();
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const code = this.form.value.code ?? '';
    const payload: VerifyOtpRequest = { email: this.email, otp: code };

    this.loading = true;
    this.apiError = null;
    this.infoMessage = null;

    this.auth.verifyOtp(payload).subscribe({
      next: () => {
        this.loading = false;
        this.clearPendingContact();
        this.router.navigateByUrl('/auth/login', { state: { verified: true, email: this.email } });
      },
      error: err => {
        this.loading = false;
        this.apiError = err;
        if (typeof err === 'string' && err.toLowerCase().includes('expired')) {
          this.restartCooldown();
        }
      },
    });
  }

  private restartCooldown() {
    this.clearInterval();
    this.seconds = this.cooldownSeconds;
    this.startCooldown();
  }

  private startCooldown() {
    this.clearInterval();
    this.intervalId = setInterval(() => {
      this.seconds = Math.max(0, this.seconds - 1);
      if (this.seconds === 0) {
        this.clearInterval();
      }
    }, 1000);
  }

  private clearInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private clearPendingContact() {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('medtik_pending_email');
      sessionStorage.removeItem('medtik_pending_phone');
    }
  }
}

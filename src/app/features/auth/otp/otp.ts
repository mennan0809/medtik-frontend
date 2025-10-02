import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }      from '@angular/material/input';
import { MatButtonModule }     from '@angular/material/button';

function maskPhone(p: string): string {
  // keep country code and last 2–3 digits, mask the middle
  const m = p.match(/^(\+\d{1,4})(\d+)(\d{2,3})$/);
  if (!m) return p;
  return `${m[1]} ${'•'.repeat(Math.max(3, m[2].length))}${m[3]}`;
}

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './otp.html',
  styleUrls: ['./otp.scss'],
})
export class OtpComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  phone: string = history.state?.phone || '';
  displayPhone = this.phone ? maskPhone(this.phone) : '';

  form = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  // simple resend cooldown
  seconds = 30;
  interval?: any;

  constructor() {
    this.interval = setInterval(() => {
      this.seconds = Math.max(0, this.seconds - 1);
      if (this.seconds === 0) clearInterval(this.interval);
    }, 1000);
  }

  ngOnDestroy() { if (this.interval) clearInterval(this.interval); }

  resend() {
    if (this.seconds > 0) return;
    this.seconds = 30;
    // TODO: call AuthService.resendOtp(this.phone)
    this.interval = setInterval(() => {
      this.seconds = Math.max(0, this.seconds - 1);
      if (this.seconds === 0) clearInterval(this.interval);
    }, 1000);
  }

  submit(){
    if (this.form.invalid){ this.form.markAllAsTouched(); return; }
    const code = this.form.value.code!;
    // TODO: AuthService.verifyOtp({ phone: this.phone, code })
    this.router.navigateByUrl('/auth/login'); // or dashboard after verification
  }
}

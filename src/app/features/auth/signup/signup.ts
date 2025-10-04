import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { AuthService, RegisterPatientPayload } from '../services/auth.service';

type Country = { name: string; iso2: string; dial: string; flag: string };

function flagEmoji(iso2: string): string {
  return iso2.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

const COUNTRIES: Country[] = [
  { name: 'Algeria', iso2: 'DZ', dial: '+213', flag: flagEmoji('DZ') },
  { name: 'Australia', iso2: 'AU', dial: '+61', flag: flagEmoji('AU') },
  { name: 'Austria', iso2: 'AT', dial: '+43', flag: flagEmoji('AT') },
  { name: 'Bahrain', iso2: 'BH', dial: '+973', flag: flagEmoji('BH') },
  { name: 'Belgium', iso2: 'BE', dial: '+32', flag: flagEmoji('BE') },
  { name: 'Brazil', iso2: 'BR', dial: '+55', flag: flagEmoji('BR') },
  { name: 'Canada', iso2: 'CA', dial: '+1', flag: flagEmoji('CA') },
  { name: 'China', iso2: 'CN', dial: '+86', flag: flagEmoji('CN') },
  { name: 'Egypt', iso2: 'EG', dial: '+20', flag: flagEmoji('EG') },
  { name: 'France', iso2: 'FR', dial: '+33', flag: flagEmoji('FR') },
  { name: 'India', iso2: 'IN', dial: '+91', flag: flagEmoji('IN') },
  { name: 'Iraq', iso2: 'IQ', dial: '+964', flag: flagEmoji('IQ') },
  { name: 'Italy', iso2: 'IT', dial: '+39', flag: flagEmoji('IT') },
  { name: 'Japan', iso2: 'JP', dial: '+81', flag: flagEmoji('JP') },
  { name: 'Jordan', iso2: 'JO', dial: '+962', flag: flagEmoji('JO') },
  { name: 'Kenya', iso2: 'KE', dial: '+254', flag: flagEmoji('KE') },
  { name: 'Kuwait', iso2: 'KW', dial: '+965', flag: flagEmoji('KW') },
  { name: 'Lebanon', iso2: 'LB', dial: '+961', flag: flagEmoji('LB') },
  { name: 'Libya', iso2: 'LY', dial: '+218', flag: flagEmoji('LY') },
  { name: 'Mexico', iso2: 'MX', dial: '+52', flag: flagEmoji('MX') },
  { name: 'Morocco', iso2: 'MA', dial: '+212', flag: flagEmoji('MA') },
  { name: 'Netherlands', iso2: 'NL', dial: '+31', flag: flagEmoji('NL') },
  { name: 'Nigeria', iso2: 'NG', dial: '+234', flag: flagEmoji('NG') },
  { name: 'Norway', iso2: 'NO', dial: '+47', flag: flagEmoji('NO') },
  { name: 'Oman', iso2: 'OM', dial: '+968', flag: flagEmoji('OM') },
  { name: 'Pakistan', iso2: 'PK', dial: '+92', flag: flagEmoji('PK') },
  { name: 'Palestine', iso2: 'PS', dial: '+970', flag: flagEmoji('PS') },
  { name: 'Qatar', iso2: 'QA', dial: '+974', flag: flagEmoji('QA') },
  { name: 'Russia', iso2: 'RU', dial: '+7', flag: flagEmoji('RU') },
  { name: 'Saudi Arabia', iso2: 'SA', dial: '+966', flag: flagEmoji('SA') },
  { name: 'South Africa', iso2: 'ZA', dial: '+27', flag: flagEmoji('ZA') },
  { name: 'South Korea', iso2: 'KR', dial: '+82', flag: flagEmoji('KR') },
  { name: 'Spain', iso2: 'ES', dial: '+34', flag: flagEmoji('ES') },
  { name: 'Sudan', iso2: 'SD', dial: '+249', flag: flagEmoji('SD') },
  { name: 'Sweden', iso2: 'SE', dial: '+46', flag: flagEmoji('SE') },
  { name: 'Switzerland', iso2: 'CH', dial: '+41', flag: flagEmoji('CH') },
  { name: 'Syria', iso2: 'SY', dial: '+963', flag: flagEmoji('SY') },
  { name: 'Tunisia', iso2: 'TN', dial: '+216', flag: flagEmoji('TN') },
  { name: 'Turkey', iso2: 'TR', dial: '+90', flag: flagEmoji('TR') },
  { name: 'United Arab Emirates', iso2: 'AE', dial: '+971', flag: flagEmoji('AE') },
  { name: 'United Kingdom', iso2: 'GB', dial: '+44', flag: flagEmoji('GB') },
  { name: 'United States', iso2: 'US', dial: '+1', flag: flagEmoji('US') },
  { name: 'Yemen', iso2: 'YE', dial: '+967', flag: flagEmoji('YE') },
];

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './signup.html',
  styleUrls: ['./signup.scss'],
})
export class SignupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  hide = true;
  loading = false;
  apiError: string | null = null;

  countries = COUNTRIES;
  genders = ['Male', 'Female', 'Other', 'Prefer not to say'];

  today = new Date();
  startAt = new Date(1995, 0, 1);

  selectedDial = this.countries.find(c => c.iso2 === 'EG')?.dial ?? this.countries[0].dial;

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    birthdate: [null as Date | null, [Validators.required]],
    gender: ['', [Validators.required]],
    country: [this.countries.find(c => c.iso2 === 'EG')?.name ?? this.countries[0].name, [Validators.required]],
    phoneLocal: ['', [Validators.required, Validators.pattern(/^\d{6,14}$/)]],
  });

  get f() {
    return this.form.controls;
  }

  get selectedCountry() {
    return this.countries.find(c => c.name === this.form.value.country!);
  }

  onCountryChange(name: string) {
    const c = this.countries.find(x => x.name === name);
    if (c) {
      this.selectedDial = c.dial;
    }
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const country = this.countries.find(x => x.name === this.form.value.country);
    if (!country) {
      this.apiError = 'Please select a valid country.';
      return;
    }

    const fullPhone = `${country.dial}${(this.form.value.phoneLocal ?? '').trim()}`;
    const birthdate = this.form.value.birthdate as Date;

    const payload: RegisterPatientPayload = {
      fullName: (this.form.value.fullName ?? '').trim(),
      email: (this.form.value.email ?? '').trim().toLowerCase(),
      password: this.form.value.password ?? '',
      gender: this.form.value.gender ?? '',
      country: country.name,
      phone: fullPhone,
      birthdate:
        birthdate instanceof Date ? birthdate.toISOString() : new Date(birthdate).toISOString(),
    };

    this.loading = true;
    this.apiError = null;

    this.auth.registerPatient(payload).subscribe({
      next: () => {
        this.loading = false;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('medtik_pending_email', payload.email);
          sessionStorage.setItem('medtik_pending_phone', payload.phone);
        }

        this.router.navigate(['/auth/otp'], { state: { phone: payload.phone, email: payload.email } });
      },
      error: err => {
        this.loading = false;
        this.apiError = err;
      },
    });
  }

  AlreadyExist() {
    if (this.form.dirty) {
      this.form.markAllAsTouched();
    }

    this.router.navigate(['/auth/login']);
  }
}

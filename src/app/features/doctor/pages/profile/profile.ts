import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';
import {
  DoctorAvailability,
  DoctorPricing,
  DoctorProfile,
  DoctorProfileService,
  DoctorUpdatePayload,
  PricingServiceType,
} from '../../services/doctor-profile.service';

type DepartmentOption = { id: number; name: string };

type PricingPreview = {
  service: PricingServiceType;
  currency: string;
  price: number;
};

type PreviewModel = {
  fullName: string;
  title: string;
  department: string;
  yearsOfExperience?: number | null;
  licenseNumber?: string;
  avatarUrl: string;
  bio: string;
  phone?: string;
  languages: string[];
  hospitals: string[];
  education: string[];
  certificates: string[];
  pricing: PricingPreview[];
  availability: DoctorAvailability;
  videoProvider?: string;
};

const REQUIRED_SERVICES: PricingServiceType[] = ['CHAT', 'VOICE', 'VIDEO'];

@Component({
  standalone: true,
  selector: 'app-doc-profile',
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
})
export class DocProfileComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(DoctorProfileService);
  private readonly snackBar = inject(MatSnackBar);

  readonly departments: DepartmentOption[] = [
    { id: 1, name: 'Pediatrics' },
    { id: 2, name: 'Cardiology' },
    { id: 3, name: 'Dermatology' },
    { id: 4, name: 'Neurology' },
    { id: 5, name: 'Psychiatry' },
    { id: 6, name: 'Orthopedics' },
    { id: 7, name: 'ENT' },
    { id: 8, name: 'Dentistry' },
    { id: 9, name: 'General Medicine' },
  ];

  readonly meetingProviders = ['Google Meet', 'Zoom', 'Microsoft Teams', 'Webex'];

  form: FormGroup;
  loadingProfile = true;
  saving = false;
  apiError: string | null = null;

  private profileSub?: Subscription;
  private formChangesSub?: Subscription;
  private currentProfile: DoctorProfile | null = null;
  private previewModel: PreviewModel = this.buildPreview();

  constructor() {
    this.form = this.buildForm();
    this.formChangesSub = this.form.valueChanges.subscribe(() => this.updatePreview());
    this.updatePreview();
  }

  ngOnInit(): void {
    this.profileSub = this.profileService.loadProfile().subscribe({
      next: profile => {
        this.applyProfile(profile);
        this.loadingProfile = false;
      },
      error: err => {
        this.apiError = err;
        this.loadingProfile = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.profileSub?.unsubscribe();
    this.formChangesSub?.unsubscribe();
  }

  get fc() {
    return {
      fullName: this.form.get('fullName') as FormControl<string>,
      title: this.form.get('title') as FormControl<string>,
      departmentId: this.form.get('departmentId') as FormControl<number | null>,
      yearsOfExperience: this.form.get('yearsOfExperience') as FormControl<number | null>,
      licenseNumber: this.form.get('licenseNumber') as FormControl<string>,
      avatarUrl: this.form.get('avatarUrl') as FormControl<string>,
      bio: this.form.get('bio') as FormControl<string>,
      phone: this.form.get('phone') as FormControl<string>,
      videoProvider: this.form.get('videoProvider') as FormControl<string>,
      cancellationPolicy: this.form.get('cancellationPolicy') as FormControl<number | null>,
      refundPolicy: this.form.get('refundPolicy') as FormControl<boolean>,
      reschedulePolicy: this.form.get('reschedulePolicy') as FormControl<number | null>,
    };
  }

  get availabilityGroup() {
    return this.form.get('availability') as FormGroup;
  }
  get availabilityChat() {
    return this.availabilityGroup.get('chat') as FormControl<boolean>;
  }
  get availabilityVoice() {
    return this.availabilityGroup.get('voice') as FormControl<boolean>;
  }
  get availabilityVideo() {
    return this.availabilityGroup.get('video') as FormControl<boolean>;
  }

  get pricingArray() {
    return this.form.get('pricing') as FormArray<FormGroup>;
  }
  pricingControls(): FormGroup[] {
    return this.pricingArray.controls as FormGroup[];
  }

  array(name: 'languages' | 'hospitals' | 'education' | 'certificates') {
    return this.form.get(name) as FormArray<FormControl<string>>;
  }

  trackIndex = (i: number) => i;

  onChipEnter(name: 'languages' | 'hospitals' | 'education' | 'certificates', event: Event) {
    const input = event.target as HTMLInputElement;
    const value = (input?.value ?? '').trim();
    if (!value) {
      return;
    }
    this.array(name).push(this.fb.control(value, { nonNullable: true }));
    input.value = '';
  }

  removeChip(name: 'languages' | 'hospitals' | 'education' | 'certificates', index: number) {
    this.array(name).removeAt(index);
  }

  reset(): void {
    if (this.currentProfile) {
      this.applyProfile(this.currentProfile);
    } else {
      this.form.reset(this.buildForm().getRawValue());
      this.updatePreview();
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const prepared = this.preparePayload();
    if (!prepared) {
      return;
    }

    const { payload, languagesCount, allServicesCovered, hasAvailability } = prepared;

    const missing: string[] = [];
    if (!payload.title) missing.push('professional title');
    if (!payload.bio) missing.push('bio');
    if (!payload.departmentId) missing.push('department');
    if (payload.yearsOfExperience == null || payload.yearsOfExperience <= 0) {
      missing.push('years of experience');
    }
    if (!payload.licenseNumber) missing.push('license number');
    if (!payload.avatarUrl) missing.push('profile image');
    if (!payload.phone) missing.push('phone number');
    if (languagesCount === 0) missing.push('languages');
    if (!payload.pricing || payload.pricing.length === 0 || !allServicesCovered) {
      missing.push('pricing for chat, voice, and video');
    }
    if (!hasAvailability) {
      missing.push('choose at least one availability option');
    }

    if (missing.length) {
      this.apiError = 'Please complete: ' + missing.join(', ');
      return;
    }

    this.saving = true;
    this.apiError = null;

    this.profileService
      .updateProfile(payload)
      .pipe(
        switchMap(() => this.profileService.refreshProfile()),
        finalize(() => (this.saving = false))
      )
      .subscribe({
        next: profile => {
          this.applyProfile(profile);
          this.snackBar.open('Profile updated successfully', 'OK', { duration: 2500 });
        },
        error: err => {
          this.apiError = err;
        },
      });
  }

  preview(): PreviewModel {
    return this.previewModel;
  }

  priceLabel(price: PricingPreview): string {
    return `${price.price} ${price.currency}`;
  }

  private buildForm(): FormGroup {
    return this.fb.group({
      fullName: this.fb.control('Doctor name', { nonNullable: true }),
      title: this.fb.control('', { nonNullable: true }),
      departmentId: this.fb.control<number | null>(null),
      yearsOfExperience: this.fb.control<number | null>(null),
      licenseNumber: this.fb.control('', { nonNullable: true }),
      avatarUrl: this.fb.control('https://i.pravatar.cc/160?img=15', { nonNullable: true }),
      bio: this.fb.control('', { nonNullable: true }),
      phone: this.fb.control('', { nonNullable: true }),
      languages: this.fb.array<FormControl<string>>([], { updateOn: 'change' }),
      hospitals: this.fb.array<FormControl<string>>([], { updateOn: 'change' }),
      education: this.fb.array<FormControl<string>>([], { updateOn: 'change' }),
      certificates: this.fb.array<FormControl<string>>([], { updateOn: 'change' }),
      availability: this.fb.group({
        chat: this.fb.control(true, { nonNullable: true }),
        voice: this.fb.control(false, { nonNullable: true }),
        video: this.fb.control(true, { nonNullable: true }),
      }),
      pricing: this.fb.array<FormGroup>(REQUIRED_SERVICES.map(service => this.createPricingGroup(service))),
      videoProvider: this.fb.control('Google Meet', { nonNullable: true }),
      cancellationPolicy: this.fb.control<number | null>(2, { validators: [Validators.min(0)] }),
      refundPolicy: this.fb.control(true, { nonNullable: true }),
      reschedulePolicy: this.fb.control<number | null>(1, { validators: [Validators.min(0)] }),
    });
  }

  private createPricingGroup(service: PricingServiceType): FormGroup {
    return this.fb.group({
      service: this.fb.control({ value: service, disabled: true }, { nonNullable: true }),
      currency: this.fb.control('USD', { nonNullable: true }),
      price: this.fb.control<number | null>(0, { validators: [Validators.min(0)] }),
    });
  }

  private preparePayload(): {
    payload: DoctorUpdatePayload;
    languagesCount: number;
    allServicesCovered: boolean;
    hasAvailability: boolean;
  } | null {
    const raw = this.form.getRawValue();

    const cleanList = (list: string[] | undefined) =>
      (list ?? []).map(v => (v ?? '').trim()).filter(v => !!v);

    const languages = cleanList(raw.languages);
    const hospitals = cleanList(raw.hospitals);
    const education = cleanList(raw.education);
    const certificates = cleanList(raw.certificates);

    const pricing = this.pricingControls()
      .map(group => group.getRawValue())
      .map(row => ({
        service: row.service as PricingServiceType,
        currency: (row.currency ?? '').trim().toUpperCase(),
        price: row.price !== null && row.price !== undefined ? Number(row.price) : 0,
      }))
      .filter(item => item.currency && item.price > 0);

    const availability = this.availabilityGroup.getRawValue() as DoctorAvailability;
    const hasAvailability = availability.chat || availability.voice || availability.video;

    const toNumber = (value: unknown): number | undefined => {
      const num = Number(value);
      return Number.isFinite(num) ? num : undefined;
    };

    const departmentId = toNumber(raw.departmentId);
    const years = toNumber(raw.yearsOfExperience);
    const cancellation = toNumber(raw.cancellationPolicy);
    const reschedule = toNumber(raw.reschedulePolicy);

    const payload: DoctorUpdatePayload = {
      title: raw.title?.trim() || undefined,
      bio: raw.bio?.trim() || undefined,
      departmentId,
      yearsOfExperience: years,
      licenseNumber: raw.licenseNumber?.trim() || undefined,
      avatarUrl: raw.avatarUrl?.trim() || undefined,
      phone: raw.phone?.trim() || undefined,
      languages,
      hospitals,
      education,
      certificates,
      pricing,
      availability,
      videoProvider: raw.videoProvider?.trim() || undefined,
      cancellationPolicy: cancellation,
      refundPolicy: raw.refundPolicy ?? undefined,
      reschedulePolicy: reschedule,
    };

    if (!payload.languages?.length) delete payload.languages;
    if (!payload.hospitals?.length) delete payload.hospitals;
    if (!payload.education?.length) delete payload.education;
    if (!payload.certificates?.length) delete payload.certificates;
    if (!payload.pricing?.length) delete payload.pricing;

    const allServicesCovered = REQUIRED_SERVICES.every(service =>
      pricing.some(item => item.service === service)
    );

    return {
      payload,
      languagesCount: languages.length,
      allServicesCovered,
      hasAvailability,
    };
  }

  private applyProfile(profile: DoctorProfile): void {
    this.currentProfile = profile;
    this.apiError = null;

    const currentName = this.fc.fullName.value;
    this.fc.fullName.setValue(currentName || 'Doctor name');
    this.fc.title.setValue(profile.title ?? '');
    this.fc.departmentId.setValue(profile.departmentId ?? null);
    this.fc.yearsOfExperience.setValue(profile.yearsOfExperience ?? null);
    this.fc.licenseNumber.setValue(profile.licenseNumber ?? '');
    this.fc.avatarUrl.setValue(profile.avatarUrl ?? '');
    this.fc.bio.setValue(profile.bio ?? '');
    this.fc.phone.setValue(profile.phone ?? '');
    this.fc.videoProvider.setValue(profile.videoProvider ?? 'Google Meet');
    this.fc.cancellationPolicy.setValue(profile.cancellationPolicy ?? 2);
    this.fc.refundPolicy.setValue(profile.refundPolicy ?? true);
    this.fc.reschedulePolicy.setValue(profile.reschedulePolicy ?? 1);

    this.setArray('languages', profile.languages ?? []);
    this.setArray('hospitals', profile.hospitals ?? []);
    this.setArray('education', profile.education ?? []);
    this.setArray('certificates', profile.certificates ?? []);

    const availability = profile.availability ?? { chat: true, voice: false, video: true };
    this.availabilityGroup.patchValue({
      chat: !!availability.chat,
      voice: !!availability.voice,
      video: !!availability.video,
    });

    const pricingMap = new Map<PricingServiceType, DoctorPricing>();
    (profile.pricing ?? []).forEach(item => pricingMap.set(item.service, item));
    this.pricingControls().forEach(group => {
      const raw = group.getRawValue();
      const service = raw.service as PricingServiceType;
      const match = pricingMap.get(service);
      group.patchValue({
        currency: match?.currency ?? raw.currency ?? 'USD',
        price: match?.price ?? 0,
      });
    });

    this.form.markAsPristine();
    this.updatePreview();
  }

  private setArray(name: 'languages' | 'hospitals' | 'education' | 'certificates', values: string[] | null): void {
    const arr = this.array(name);
    while (arr.length) {
      arr.removeAt(0);
    }
    (values ?? [])
      .filter(v => !!v && typeof v === 'string')
      .forEach(value => arr.push(this.fb.control(value, { nonNullable: true })));
  }

  private updatePreview(): void {
    const value = this.form.getRawValue();
    const deptName = this.departments.find(d => d.id === value.departmentId)?.name ?? 'Department pending';

    const pricingPreview: PricingPreview[] = this.pricingControls()
      .map(group => group.getRawValue())
      .filter(row => Number(row.price ?? 0) > 0)
      .map(row => ({
        service: row.service as PricingServiceType,
        currency: (row.currency ?? 'USD').toUpperCase(),
        price: Number(row.price ?? 0),
      }));

    this.previewModel = {
      fullName: value.fullName || 'Doctor name',
      title: value.title || 'Speciality',
      department: deptName,
      yearsOfExperience: value.yearsOfExperience ?? undefined,
      licenseNumber: value.licenseNumber || undefined,
      avatarUrl: value.avatarUrl || 'https://i.pravatar.cc/160?img=15',
      bio: value.bio || '',
      phone: value.phone || undefined,
      languages: value.languages ?? [],
      hospitals: value.hospitals ?? [],
      education: value.education ?? [],
      certificates: value.certificates ?? [],
      pricing: pricingPreview,
      availability: this.availabilityGroup.getRawValue() as DoctorAvailability,
      videoProvider: value.videoProvider ?? undefined,
    };
  }

  private buildPreview(): PreviewModel {
    return {
      fullName: 'Doctor name',
      title: 'Speciality',
      department: 'Department pending',
      yearsOfExperience: undefined,
      licenseNumber: undefined,
      avatarUrl: 'https://i.pravatar.cc/160?img=15',
      bio: '',
      phone: undefined,
      languages: [],
      hospitals: [],
      education: [],
      certificates: [],
      pricing: [],
      availability: { chat: true, voice: false, video: true },
      videoProvider: undefined,
    };
  }
}






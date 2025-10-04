import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';

export type PricingServiceType = 'CHAT' | 'VOICE' | 'VIDEO';

export interface DoctorDepartment {
  id: number;
  name: string;
  description?: string | null;
}

export interface DoctorPricing {
  id: number;
  service: PricingServiceType;
  currency: string;
  price: number;
}

export interface DoctorAvailability {
  chat: boolean;
  voice: boolean;
  video: boolean;
}

export interface DoctorProfile {
  id: number;
  mustChangePassword: boolean;
  title?: string | null;
  bio?: string | null;
  phone?: string | null;
  yearsOfExperience?: number | null;
  licenseNumber?: string | null;
  avatarUrl?: string | null;
  departmentId?: number | null;
  department?: DoctorDepartment | null;
  languages: string[] | null;
  hospitals: string[] | null;
  education: string[] | null;
  certificates: string[] | null;
  pricing: DoctorPricing[] | null;
  availability?: DoctorAvailability | null;
  videoProvider?: string | null;
  cancellationPolicy?: number | null;
  refundPolicy?: boolean | null;
  reschedulePolicy?: number | null;
}

export interface DoctorProfileResponse {
  doctor: DoctorProfile;
}

export interface DoctorUpdatePayload {
  title?: string;
  bio?: string;
  departmentId?: number | null;
  yearsOfExperience?: number | null;
  licenseNumber?: string;
  avatarUrl?: string;
  phone?: string;
  languages?: string[];
  hospitals?: string[];
  education?: string[];
  certificates?: string[];
  pricing?: Array<{ service: PricingServiceType; currency: string; price: number }>;
  availability?: DoctorAvailability;
  videoProvider?: string;
  cancellationPolicy?: number | null;
  refundPolicy?: boolean | null;
  reschedulePolicy?: number | null;
  password?: string;
}

interface UpdateDoctorResponse {
  message: string;
  doctor: DoctorProfile;
}

@Injectable({ providedIn: 'root' })
export class DoctorProfileService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = environment.apiBaseUrl;

  private readonly profileSubject = new BehaviorSubject<DoctorProfile | null>(null);
  private readonly lockedSubject = new BehaviorSubject<boolean>(true);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  readonly profile$ = this.profileSubject.asObservable();
  readonly locked$ = this.lockedSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();

  loadProfile(force = false): Observable<DoctorProfile> {
    const existing = this.profileSubject.value;
    if (existing && !force) {
      return of(existing);
    }

    const token = this.auth.getToken();
    if (!token) {
      return throwError(() => 'Doctor session expired. Please log in again.');
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.loadingSubject.next(true);

    return this.http
      .get<DoctorProfileResponse>(`${this.baseUrl}/doctor/profile`, { headers })
      .pipe(
        map(res => res.doctor),
        tap(profile => {
          this.profileSubject.next(profile);
          this.lockedSubject.next(this.computeLocked(profile));
          this.loadingSubject.next(false);
        }),
        catchError(err => this.handleError(err))
      );
  }

  refreshProfile(): Observable<DoctorProfile> {
    this.profileSubject.next(null);
    this.lockedSubject.next(true);
    return this.loadProfile(true);
  }

  isProfileLocked(profile: DoctorProfile | null = this.profileSubject.value): boolean {
    return this.computeLocked(profile);
  }

  updateProfile(payload: DoctorUpdatePayload): Observable<DoctorProfile> {
    const token = this.auth.getToken();
    if (!token) {
      return throwError(() => 'Doctor session expired. Please log in again.');
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    return this.http
      .put<UpdateDoctorResponse>(`${this.baseUrl}/doctor/update`, payload, { headers })
      .pipe(
        map(res => res.doctor),
        tap(profile => {
          this.profileSubject.next(profile);
          this.lockedSubject.next(this.computeLocked(profile));
        }),
        catchError(err => this.handleError(err))
      );
  }

  markAsUnlocked(): void {
    const profile = this.profileSubject.value;
    this.lockedSubject.next(this.computeLocked(profile));
  }

  private computeLocked(profile: DoctorProfile | null): boolean {
    if (!profile) {
      return true;
    }

    const hasBasics = Boolean(
      profile.title?.trim() &&
      profile.bio?.trim() &&
      profile.phone?.trim() &&
      profile.departmentId &&
      profile.yearsOfExperience != null && Number(profile.yearsOfExperience) > 0 &&
      profile.licenseNumber?.trim() &&
      profile.avatarUrl?.trim()
    );

    const hasLanguages = (profile.languages?.length ?? 0) > 0;

    const hasPricing = Array.isArray(profile.pricing) && profile.pricing.length > 0;
    const allServicesCovered = Array.isArray(profile.pricing)
      ? (['CHAT', 'VOICE', 'VIDEO'] as PricingServiceType[]).every(service =>
          profile.pricing!.some(price =>
            price.service === service &&
            !!price.currency?.trim() &&
            price.price !== null &&
            price.price !== undefined &&
            Number(price.price) > 0
          )
        )
      : false;

    const availability = profile.availability;
    const hasAvailability = !!availability && (availability.chat || availability.voice || availability.video);

    return !(hasBasics && hasLanguages && hasPricing && allServicesCovered && hasAvailability);
  }
  private handleError(error: HttpErrorResponse) {
    this.loadingSubject.next(false);

    let message = 'Unable to load doctor profile. Please try again.';
    const backend = error.error;
    if (backend) {
      if (typeof backend === 'string') {
        message = backend;
      } else if (typeof backend === 'object') {
        message = backend.error ?? backend.message ?? message;
      }
    } else if (error.message) {
        message = error.message;
    }

    return throwError(() => message);
  }
}




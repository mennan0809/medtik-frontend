import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface RegisterPatientPayload {
  fullName: string;
  email: string;
  password: string;
  gender: string;
  country: string;
  phone: string;
  birthdate: string;
}

export interface RegisterPatientResponse {
  message: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  message?: string;
  resend?: boolean;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
}

export interface LoginResult extends LoginResponse {
  role: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly tokenKey = 'medtik_token';

  registerPatient(payload: RegisterPatientPayload): Observable<RegisterPatientResponse> {
    return this.http
      .post<RegisterPatientResponse>(`${this.baseUrl}/auth/register-patient`, payload)
      .pipe(catchError(error => this.handleError(error)));
  }

  verifyOtp(payload: VerifyOtpRequest): Observable<VerifyOtpResponse> {
    return this.http
      .post<VerifyOtpResponse>(`${this.baseUrl}/auth/verify-otp`, payload)
      .pipe(catchError(error => this.handleError(error)));
  }

  login(payload: LoginRequest): Observable<LoginResult> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/auth/login`, payload)
      .pipe(
        tap(response => {
          if (response?.token) {
            this.setToken(response.token);
          }
        }),
        map(response => ({
          ...response,
          role: response?.token ? this.extractRoleFromToken(response.token) : null,
        })),
        catchError(error => this.handleError(error))
      );
  }

  getToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }

    return localStorage.getItem(this.tokenKey);
  }

  getCurrentRole(): string | null {
    if (!this.isBrowser) {
      return null;
    }

    const token = this.getToken();
    return token ? this.extractRoleFromToken(token) : null;
  }

  clearToken(): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.removeItem(this.tokenKey);
  }

  private setToken(token: string): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(this.tokenKey, token);
  }

  private extractRoleFromToken(token: string): string | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const payloadSegment = token.split('.')[1];
      if (!payloadSegment) {
        return null;
      }

      const normalised = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
      const json = atob(normalised);
      const payload = JSON.parse(json);
      return payload?.role ?? null;
    } catch (err) {
      console.warn('Failed to decode JWT role', err);
      return null;
    }
  }

  private handleError(error: HttpErrorResponse) {
    let message = 'Something went wrong. Please try again.';

    if (error.error) {
      if (typeof error.error === 'string') {
        message = error.error;
      } else if (typeof error.error === 'object') {
        message = error.error.error ?? error.error.message ?? message;
      }
    } else if (error.message) {
      message = error.message;
    }

    return throwError(() => message);
  }
}

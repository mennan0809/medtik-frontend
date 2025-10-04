import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';

export interface CreateDoctorPayload {
  email: string;
  password: string;
  phoneNumber: string;
  department: string;
}

export interface CreateDoctorResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = environment.apiBaseUrl;

  registerDoctor(payload: CreateDoctorPayload): Observable<CreateDoctorResponse> {
    const token = this.auth.getToken();
    if (!token) {
      return throwError(() => 'Your admin session has expired. Please log in again.');
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    return this.http
      .post<CreateDoctorResponse>(`${this.baseUrl}/auth/register-doctor`, payload, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  private handleError(error: HttpErrorResponse) {
    let message = 'Unable to create doctor credentials. Please try again.';

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

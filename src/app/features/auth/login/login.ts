import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  trigger, transition, style, animate, query, stagger
} from '@angular/animations';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  animations: [
    trigger('flyIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px) scale(.98)' }),
        animate('500ms cubic-bezier(.2,.8,.2,1)', style({ opacity: 1, transform: 'none' }))
      ])
    ]),
    trigger('staggerIn', [
      transition(':enter', [
        query('.stagger', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          stagger(60, animate('380ms ease-out', style({ opacity: 1, transform: 'none' })))
        ])
      ])
    ])
  ]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  hide = true;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submit() {
    if (this.form.invalid) return;
    // TODO: call backend /auth/login; store token; handle errors
    // Temporary: go to patient dashboard
    this.router.navigateByUrl('/patient');
  }
}

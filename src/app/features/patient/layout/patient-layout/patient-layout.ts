import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-patient-layout',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatBadgeModule, MatDividerModule
  ],
  templateUrl: './patient-layout.html',
  styleUrl: './patient-layout.scss',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-8px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'none', opacity: 1 }))
      ])
    ])
  ]
})
export class PatientLayoutComponent {
  // Using your remote URL explicitly
  logoUrl = 'https://ik.imagekit.io/a2wpi1kd9/imgToUrl/image-to-url_HEow9eLbR';
}

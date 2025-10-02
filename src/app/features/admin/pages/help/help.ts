import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  standalone: true,
  selector: 'app-help',
  templateUrl: './help.html',
  styleUrls: ['./help.scss'],
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule, MatSnackBarModule]
})
export class AdminHelpComponent {
  private snack = inject(MatSnackBar);

  // Edit these in one place
  readonly hotline = '+20 106 555 1212';
  readonly whatsapp = '+20 106 555 1212';
  readonly email = 'support@medtik.app';

  call(num: string) {
    const tel = this.onlyDigits(num);
    window.open(`tel:${tel}`);
  }

  openWhatsApp(num: string) {
    const phone = this.onlyDigits(num);
    const msg = encodeURIComponent('Hi Medtik Support — I need help with...');
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  }

  emailTo(addr: string) {
    window.location.href = `mailto:${addr}`;
  }

  async copy(text: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      this.snack.open('Copied to clipboard', 'OK', { duration: 1400 });
    } catch {
      this.snack.open('Copy failed', 'OK', { duration: 1600 });
    }
  }

  private onlyDigits(v: string) {
    return (v || '').replace(/\D+/g, '');
  }
}

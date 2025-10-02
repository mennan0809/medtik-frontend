import { Component, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

type Modality = 'chat' | 'voice' | 'video';
type Currency = 'EGP' | 'SAR' | 'AED';
type InvoiceStatus = 'unpaid' | 'paid' | 'refunded' | 'failed';

type Invoice = {
  id: string;
  appointmentId: string;
  createdAt: string; // ISO
  modality: Modality;
  amount: { currency: Currency; value: number };
  status: InvoiceStatus;
  // optional payment fields (kept for future use; NOT shown on UI now)
  method?: 'card' | 'wallet' | 'cash';
  last4?: string;
  txnId?: string;
  doctor: { name: string; department: string; avatar: string };
};

const pad = (n: number) => (n < 10 ? '0' : '') + n;
const toLocal = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: 'short', year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });

const uid = () => Math.random().toString(36).slice(2, 10);

// --- mock list (replace with API later) ---
function mockFetchInvoices(): Invoice[] {
  const now = new Date();
  const mk = (offsetMin: number, status: InvoiceStatus, modality: Modality, value: number, img = 5): Invoice => {
    const d = new Date(now);
    d.setUTCMinutes(d.getUTCMinutes() + offsetMin);
    d.setUTCSeconds(0, 0);
    return {
      id: uid(),
      appointmentId: 'appt_' + uid(),
      createdAt: d.toISOString(),
      modality,
      amount: { currency: 'EGP', value },
      status,
      doctor: {
        name: img % 2 ? 'Dr. Sarah Ali' : 'Dr. Omar Khaled',
        department: img % 2 ? 'Pediatrics' : 'Dermatology',
        avatar: `https://i.pravatar.cc/120?img=${img}`
      }
    };
  };

  return [
    mk(+240, 'unpaid',   'voice', 120, 6),
    mk(+60,  'unpaid',   'video', 180, 7),
    mk(-180, 'paid',     'chat',   80, 8),
    mk(-1440,'refunded', 'video', 180, 9),
    mk(-2880,'paid',     'voice', 120, 10),
  ];
}

@Component({
  standalone: true,
  selector: 'app-payments',
  templateUrl: './payments.html',
  styleUrls: ['./payments.scss'],
  imports: [
    CommonModule, RouterModule,
    MatIconModule, MatButtonModule, MatButtonToggleModule,
    MatTooltipModule, MatSnackBarModule
  ]
})
export class PaymentsComponent {
  private router = inject(Router);
  private snack  = inject(MatSnackBar);

  // data
  all = signal<Invoice[]>(mockFetchInvoices());

  // filters
  status = signal<'all' | InvoiceStatus>('all');

  // derived lists
  filtered = computed(() => {
    const s = this.status();
    return this.all()
      .filter(i => s === 'all' ? true : i.status === s)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  // groups (when "All" is active)
  unpaid   = computed(() =>
    this.all()
      .filter(i => i.status === 'unpaid')
      .sort((a,b)=> new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  );
  paid     = computed(() =>
    this.all()
      .filter(i => i.status === 'paid')
      .sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );
  refunded = computed(() =>
    this.all()
      .filter(i => i.status === 'refunded')
      .sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // ← ✅ getTime()
  );

  // header counts
  unpaidCount = computed(() => this.all().filter(i => i.status === 'unpaid').length);

  // helpers
  toLocal = toLocal;
  modalityIcon(m: Modality) { return m === 'chat' ? 'chat' : m === 'voice' ? 'call' : 'videocam'; }

  // actions
  payNow(i: Invoice) {
    if (i.status !== 'unpaid') return;
    // keep array type as Invoice[] by narrowing the literal type
    this.all.update(list =>
      list.map(x =>
        x.id === i.id
          ? ({ ...x, status: 'paid' as InvoiceStatus, txnId: 'pay_' + uid() })
          : x
      )
    );
    this.snack.open('Payment successful', 'OK', { duration: 1800 });
  }

  downloadReceipt(i: Invoice) {
    const html = `
<!doctype html>
<meta charset="utf-8">
<title>Receipt ${i.id}</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial;padding:24px;background:#0c1018;color:#eaf0ff}
  .card{max-width:640px;margin:auto;border:1px solid #1e2633;border-radius:12px;padding:20px;background:#0f1520}
  h1{margin:0 0 10px;font-size:18px}
  .kv{display:grid;grid-template-columns:140px 1fr;row-gap:8px;column-gap:10px}
  .k{opacity:.75}
  .total{margin-top:12px;padding-top:12px;border-top:1px dashed #2a3446;font-weight:700}
  .pill{display:inline-block;padding:2px 8px;border-radius:999px;border:1px solid #2a3446;background:#121a27}
</style>
<div class="card">
  <h1>Receipt</h1>
  <div class="kv">
    <div class="k">Invoice</div><div>${i.id}</div>
    <div class="k">Appointment</div><div>${i.appointmentId}</div>
    <div class="k">Date</div><div>${toLocal(i.createdAt)}</div>
    <div class="k">Doctor</div><div>${i.doctor.name} — ${i.doctor.department}</div>
    <div class="k">Type</div><div><span class="pill">${i.modality}</span></div>
    <div class="k total">Total</div><div class="total">${i.amount.value} ${i.amount.currency}</div>
  </div>
</div>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `receipt-${i.id}.html`; a.click();
    URL.revokeObjectURL(url);
  }

  viewAppointment(i: Invoice) {
    this.router.navigate(['/patient/appointments']); // or `/patient/appointments/${i.appointmentId}`
  }

  setFilter(v: 'all' | InvoiceStatus) { this.status.set(v); }
}

export default PaymentsComponent;

import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

type Star = 1 | 2 | 3 | 4 | 5;

type Review = {
  id: string;
  doctorName: string;
  doctorAvatar: string;
  rating: Star;
  title?: string;
  comment: string;
  createdAt: string; // ISO
};

const uid = () => Math.random().toString(36).slice(2, 10);

// ---- mock data (replace with API later) ----
function mockReviews(): Review[] {
  const now = new Date();
  const mk = (daysAgo: number, rating: Star, name: string, comment: string): Review => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return {
      id: uid(),
      doctorName: name,
      doctorAvatar: `https://i.pravatar.cc/120?img=${Math.floor(Math.random() * 70) + 1}`,
      rating,
      title: undefined,
      comment,
      createdAt: d.toISOString(),
    };
  };

  return [
    mk(1, 5, 'Dr. Sarah Ali', 'Great experience. Listened carefully and gave practical advice.'),
    mk(3, 4, 'Dr. Omar Khaled', 'Helpful visit, slight delay but worth it.'),
    mk(10, 5, 'Dr. Sarah Ali', 'Very attentive and professional.'),
    mk(18, 3, 'Dr. Mai Hassan', 'Okay overall, expected a bit more follow-up.'),
    mk(25, 4, 'Dr. Omar Khaled', 'Clear explanation and good bedside manner.'),
  ];
}

@Component({
  standalone: true,
  selector: 'app-reviews',
  templateUrl: './reviews.html',
  styleUrls: ['./reviews.scss'],
  imports: [
    CommonModule, RouterModule,
    MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule,
  ],
})
export class ReviewsComponent {
  // Data
  all = signal<Review[]>(mockReviews());

  // UI state
  query = signal<string>('');
  stars: Star[] = [1, 2, 3, 4, 5];

  // Filters (extend later as needed)
  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.all()
      .filter((r) => {
        if (!q) return true;
        return (
          r.doctorName.toLowerCase().includes(q) ||
          (r.comment ?? '').toLowerCase().includes(q) ||
          (r.title ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  // Stats (based on *all* reviews; change to this.filtered() if you want filtered stats)
  count = computed(() => this.all().length);

  avg = computed(() => {
    const c = this.count();
    if (!c) return 0;
    const sum = this.all().reduce((acc, r) => acc + r.rating, 0);
    // one decimal average
    return Math.round((sum / c) * 10) / 10;
  });

  // ✅ helper so template doesn’t call Math.round(...)
  roundedAvg = computed(() => Math.round(this.avg()));

  dist = computed(() => {
    const d: Record<Star, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of this.all()) d[r.rating]++;
    return d;
  });

  // ✅ template-friendly wrapper (no "as any" in HTML)
  distPercent(n: number): number {
    const total = this.count();
    if (!total) return 0;
    const d = this.dist();
    return Math.round(((d[n as Star] || 0) / total) * 100);
  }

  // Helpers
  dateLabel(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: '2-digit',
    });
  }
}

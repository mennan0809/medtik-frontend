import { Component, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

type Thread = {
  id: string;
  name: string;
  spec: string;
  avatar: string;
  lastAt?: Date;
  unread?: number;
  online?: boolean;
};

type Message = {
  id: string;
  from: 'me' | 'doc';
  text: string;
  ts: Date;
  seen?: boolean;
  showStamp?: boolean;
};

const uid = () => Math.random().toString(36).slice(2, 10);

@Component({
  standalone: true,
  selector: 'app-chat',
  templateUrl: './chat.html',
  styleUrls: ['./chat.scss'],
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule]
})
export class ChatComponent {
  private route = inject(ActivatedRoute);

  // ── State
  query = signal<string>('');      // search in conversations strip
  chatQuery = signal<string>('');  // search inside the open chat
  draft = signal<string>('');      // composer value

  threads = signal<Thread[]>([
    { id: 't-1', name: 'Dr. Sarah A.', spec: 'Pediatrics',    avatar: 'https://i.pravatar.cc/120?img=12', lastAt: new Date(), online: true },
    { id: 't-2', name: 'Dr. Dina K.',  spec: 'Dermatology',   avatar: 'https://i.pravatar.cc/120?img=5',  lastAt: new Date(Date.now() - 3600_000), unread: 1 },
    { id: 't-3', name: 'Dr. Omar N.',  spec: 'Cardiology',    avatar: 'https://i.pravatar.cc/120?img=52', lastAt: new Date(Date.now() - 7200_000) }
  ]);

  private initialId = this.route.snapshot.paramMap.get('threadId')
                   || this.route.snapshot.paramMap.get('t')
                   || 't-1';
  selectedId = signal<string>(this.initialId);

  activeThread = computed<Thread>(() =>
    this.threads().find(t => t.id === this.selectedId()) || this.threads()[0]
  );

  filteredThreads = computed<Thread[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.threads();
    return this.threads().filter(t =>
      t.name.toLowerCase().includes(q) || t.spec.toLowerCase().includes(q)
    );
  });

  // Mock message store
  private store: Record<string, Message[]> = {
    't-1': [
      { id: uid(), from: 'doc', text: 'Hi! How are you feeling today?', ts: new Date(Date.now() - 1000 * 60 * 30) },
      { id: uid(), from: 'me',  text: 'Hi doctor! Little better, still light cough.', ts: new Date(Date.now() - 1000 * 60 * 28), seen: true },
      { id: uid(), from: 'doc', text: 'Great. Keep the meds and rest. Any fever?', ts: new Date(Date.now() - 1000 * 60 * 26) }
    ],
    't-2': [
      { id: uid(), from: 'doc', text: 'Your results look fine 👍', ts: new Date(Date.now() - 1000 * 60 * 90) }
    ],
    't-3': [
      { id: uid(), from: 'doc', text: 'Please send the latest ECG.', ts: new Date(Date.now() - 1000 * 60 * 120) }
    ]
  };

  // bump to recompute after store mutation
  private version = signal(0);

  messages = computed<Message[]>(() => {
    this.version(); // dependency
    const id = this.activeThread().id;
    const raw = this.store[id] || [];
    const q = this.chatQuery().trim().toLowerCase();

    const list = q ? raw.filter(m => m.text.toLowerCase().includes(q)) : raw;

    // compute "showStamp" relative to previous (in filtered list)
    return list.map((m, i) => {
      const prev = list[i - 1];
      const gap = prev ? m.ts.getTime() - prev.ts.getTime() : Infinity;
      return { ...m, showStamp: gap > 1000 * 60 * 20 };
    });
  });

  // ── Actions
  trackById = (_: number, item: { id: string }) => item.id;

  select(t: Thread) {
    this.selectedId.set(t.id);
    this.threads.set(this.threads().map(x => x.id === t.id ? { ...x, unread: 0 } : x));
  }

  loadEarlier() {
    const id = this.activeThread().id;
    const earlier: Message[] = [
      { id: uid(), from: 'doc', text: 'Previous notes…', ts: new Date(Date.now() - 1000 * 60 * 60 * 5) }
    ];
    this.store[id] = [...earlier, ...(this.store[id] || [])];
    this.version.set(this.version() + 1);
  }

  attach() {
    alert('Attachment picker coming soon');
  }

  send() {
    const text = this.draft().trim();
    if (!text) return;
    const id = this.activeThread().id;
    const list = this.store[id] || [];
    const msg: Message = { id: uid(), from: 'me', text, ts: new Date(), seen: false };
    this.store[id] = [...list, msg];
    this.draft.set('');
    this.version.set(this.version() + 1);

    setTimeout(() => { msg.seen = true; this.version.set(this.version() + 1); }, 900);
  }
}

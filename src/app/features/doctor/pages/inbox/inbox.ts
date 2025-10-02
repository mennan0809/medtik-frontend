import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

type Thread = { id: string; name: string; spec: string; avatar: string; lastAt: string; unread?: number };
type Message = { id: string; threadId: string; me?: boolean; text: string; at: string; seen?: boolean };

const uid = () => Math.random().toString(36).slice(2,10);

function seedThreads(): Thread[] {
  const now = new Date();
  const m = (mins: number) => new Date(now.getTime() - mins*60000).toISOString();
  return [
    { id: 't1', name: 'Patient Ahmed',  spec: 'Follow-up', avatar: 'https://i.pravatar.cc/80?img=12', lastAt: m(2), unread: 1 },
    { id: 't2', name: 'Patient Laila',  spec: 'Dermatology', avatar: 'https://i.pravatar.cc/80?img=5',  lastAt: m(35) },
    { id: 't3', name: 'Patient Youssef',spec: 'Cardiology',  avatar: 'https://i.pravatar.cc/80?img=31', lastAt: m(120) },
  ];
}
function seedMessages(): Message[] {
  const now = new Date();
  const m = (mins: number) => new Date(now.getTime() - mins*60000).toISOString();
  return [
    { id: uid(), threadId: 't1', text: 'Hello doctor 👋', at: m(14) },
    { id: uid(), threadId: 't1', me: true, text: 'Hello! How can I help?', at: m(13), seen: true },
    { id: uid(), threadId: 't1', text: 'Result came back normal.', at: m(2) },
  ];
}

@Component({
  standalone: true,
  selector: 'app-doctor-inbox',
  templateUrl: './inbox.html',
  styleUrls: ['./inbox.scss'],
  imports: [
    CommonModule, MatIconModule, MatButtonModule,
    MatTooltipModule, MatMenuModule, MatFormFieldModule, MatInputModule
  ]
})
export class DoctorInboxComponent {
  threads = signal<Thread[]>(seedThreads());
  activeId = signal<string>('t1');
  draft = signal('');
  stripQuery = signal('');
  chatQuery = signal('');

  messagesAll = signal<Message[]>(seedMessages());

  trackById = (_: number, x: {id: string}) => x.id;

  activeThread = computed(() => this.threads().find(t => t.id === this.activeId())!);
  messages = computed(() =>
    this.messagesAll()
      .filter(m => m.threadId === this.activeId())
      .filter(m => !this.chatQuery() || m.text.toLowerCase().includes(this.chatQuery().toLowerCase()))
  );

  filteredThreads = computed(() => {
    const q = this.stripQuery().toLowerCase().trim();
    return this.threads().filter(t =>
      !q || t.name.toLowerCase().includes(q) || t.spec.toLowerCase().includes(q)
    );
  });

  select(t: Thread) {
    this.activeId.set(t.id);
  }
  send() {
    const text = this.draft().trim();
    if (!text) return;
    this.messagesAll.update(arr => [
      ...arr,
      { id: uid(), threadId: this.activeId(), me: true, text, at: new Date().toISOString(), seen: false }
    ]);
    this.draft.set('');
  }
  time(s: string) { return new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
}

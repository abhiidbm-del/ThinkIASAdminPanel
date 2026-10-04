import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment/environment';

@Component({
  selector: 'app-notifications', standalone: true, imports: [TranslatePipe, CommonModule, FormsModule],
  templateUrl: './notifications.component.html', styleUrl: './notifications.component.css'
})
export class NotificationsComponent {
  private http = inject(HttpClient);
  titleHindi = ''; bodyHindi = '';
  title = ''; body = ''; link = ''; type = 'general'; audience = 'all';
  loading = signal(false); message = signal('');
  send() {
    if (!this.title.trim() || !this.body.trim()) return this.message.set('Title and message are required.');
    this.loading.set(true);
    this.http.post<any>(`${environment.apiUrl}/notifications`, { titleHindi: this.titleHindi, bodyHindi: this.bodyHindi, title: this.title, body: this.body, link: this.link, type: this.type, audience: this.audience }).subscribe({
      next: response => { this.message.set(`Notification saved. Push sent: ${response.push?.sent || 0}`); this.title = ''; this.body = ''; this.titleHindi = ''; this.bodyHindi = ''; this.link = ''; this.loading.set(false); },
      error: ({ error }) => { this.message.set(error?.message || 'Could not send notification.'); this.loading.set(false); }
    });
  }
}

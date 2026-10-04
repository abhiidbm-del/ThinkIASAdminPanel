import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environment/environment';

@Component({
  selector: 'app-support-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `<section class="wrap">
  <header class="page-header">
    <div class="header-left">
      <span class="eyebrow">HELP DESK</span>
      <h1>Support Tickets</h1>
      <p class="subtitle">Review student complaints, attachments and send responses.</p>
    </div>
    <div class="header-stats">
      <div class="stat"><span class="stat-value">{{tickets.length}}</span><span class="stat-label">Total</span></div>
      <div class="stat"><span class="stat-value">{{countByStatus('open')}}</span><span class="stat-label">Open</span></div>
      <div class="stat"><span class="stat-value">{{countByStatus('in_progress')}}</span><span class="stat-label">In progress</span></div>
    </div>
  </header>

  <div class="toolbar">
    <div class="filter-chips">
      <button type="button" class="chip" [class.active]="status===''" (click)="setStatusFilter('')">All</button>
      <button type="button" class="chip" [class.active]="status==='open'" (click)="setStatusFilter('open')">Open</button>
      <button type="button" class="chip" [class.active]="status==='in_progress'" (click)="setStatusFilter('in_progress')">In progress</button>
      <button type="button" class="chip" [class.active]="status==='closed'" (click)="setStatusFilter('closed')">Closed</button>
    </div>
  </div>

  <p *ngIf="error" class="error-banner">{{error}}</p>

  <div class="layout">
    <div class="list-panel">
      <div class="panel-heading">Tickets <span class="count-badge">{{tickets.length}}</span></div>
      <ul class="ticket-list" *ngIf="tickets.length; else emptyList">
        <li *ngFor="let ticket of tickets" (click)="open(ticket._id)" [class.active]="selected?._id===ticket._id">
          <div class="avatar">{{initials(ticket.createdBy?.fullName || ticket.createdBy?.email)}}</div>
          <div class="ticket-info">
            <strong>{{ticket.subject}}</strong>
            <small>{{ticket.createdBy?.fullName || ticket.createdBy?.email}}</small>
          </div>
          <span class="status-badge" [ngClass]="statusClass(ticket.status)">{{statusLabel(ticket.status)}}</span>
        </li>
      </ul>
      <ng-template #emptyList><div class="empty-state small"><span class="empty-icon">🗂️</span><p>No tickets found.</p></div></ng-template>
    </div>

    <article class="detail-panel" *ngIf="selected; else noSelection">
      <div class="detail-header">
        <div class="detail-title">
          <h2>{{selected.subject}}</h2>
          <span class="status-badge" [ngClass]="statusClass(selected.status)">{{statusLabel(selected.status)}}</span>
        </div>
        <div class="status-row">
          <button type="button" [class.active]="selected.status==='open'" (click)="setStatus('open')">Open</button>
          <button type="button" [class.active]="selected.status==='in_progress'" (click)="setStatus('in_progress')">In progress</button>
          <button type="button" class="close-btn" [class.active]="selected.status==='closed'" (click)="setStatus('closed')">Close</button>
        </div>
      </div>

      <div class="messages">
        <div class="message" *ngFor="let message of selected.messages" [class.admin]="message.role==='admin'">
          <div class="message-avatar">{{initials(message.role)}}</div>
          <div class="message-bubble">
            <b>{{message.role === 'admin' ? 'Support Team' : 'Student'}}</b>
            <p>{{message.body}}</p>
            <div class="attachments" *ngIf="message.attachments?.length">
              <a *ngFor="let file of message.attachments" [href]="file.url" target="_blank" rel="noopener">📎 {{file.name}}</a>
            </div>
          </div>
        </div>
      </div>

      <form class="reply-form" (submit)="reply($event)">
        <textarea [(ngModel)]="replyBody" name="reply" placeholder="Write a response..." rows="3"></textarea>
        <div class="form-footer">
          <label class="file-btn">📎 Attach files<input type="file" multiple (change)="onFiles($event)" accept="image/*,.pdf" hidden></label>
          <span class="file-count" *ngIf="files.length">{{files.length}} file(s) selected</span>
          <button type="submit" class="send-btn">Send response</button>
        </div>
      </form>
    </article>
    <ng-template #noSelection>
      <div class="empty-state large">
        <span class="empty-icon">💬</span>
        <h3>Select a ticket</h3>
        <p>Choose a ticket from the list to view details and respond.</p>
      </div>
    </ng-template>
  </div>

  <div class="modal" *ngIf="showCloseConfirm" (click)="cancelClose()">
    <div class="confirm-card" (click)="$event.stopPropagation()">
      <span class="confirm-icon">⚠️</span>
      <h3>Close this ticket?</h3>
      <p>The student won't be able to reply once it's closed. You can reopen it later if needed.</p>
      <div class="modal-actions">
        <button type="button" class="cancel-btn" (click)="cancelClose()">Cancel</button>
        <button type="button" class="confirm-btn" (click)="confirmClose()">Yes, close ticket</button>
      </div>
    </div>
  </div>
</section>`,
  styles: [`
    :host{display:block;background:#f4f6f9;min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
    .wrap{max-width:1200px;margin:0 auto;padding:24px}
    .page-header{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;background:linear-gradient(135deg,#102a43,#1d5374);color:#fff;padding:28px 32px;border-radius:18px;box-shadow:0 8px 24px rgba(16,42,67,.18);flex-wrap:wrap}
    .eyebrow{letter-spacing:.14em;font-size:11px;font-weight:600;opacity:.75}
    .header-left h1{margin:8px 0 4px;font-size:26px}
    .subtitle{margin:0;opacity:.8;font-size:14px}
    .header-stats{display:flex;gap:22px}
    .stat{display:flex;flex-direction:column;align-items:center;background:rgba(255,255,255,.1);padding:10px 18px;border-radius:12px;min-width:76px}
    .stat-value{font-size:20px;font-weight:700}
    .stat-label{font-size:11px;opacity:.8;margin-top:2px}
    .toolbar{margin:18px 0}
    .filter-chips{display:flex;gap:8px;flex-wrap:wrap}
    .chip{border:1px solid #d6e0e8;background:#fff;color:#334155;padding:8px 16px;border-radius:999px;cursor:pointer;font-size:13px;font-weight:500;transition:all .15s ease}
    .chip:hover{border-color:#1d5374}
    .chip.active{background:#1d5374;border-color:#1d5374;color:#fff}
    .error-banner{background:#fde8e8;color:#be123c;padding:12px 16px;border-radius:10px;margin-bottom:12px;font-size:14px}
    .layout{display:grid;grid-template-columns:320px 1fr;gap:18px;align-items:start}
    .list-panel{background:#fff;border-radius:14px;box-shadow:0 2px 10px rgba(16,42,67,.06);overflow:hidden}
    .panel-heading{padding:16px 18px;font-weight:600;color:#102a43;border-bottom:1px solid #eef2f6;display:flex;align-items:center;gap:8px;font-size:14px}
    .count-badge{background:#eef2f6;color:#334155;border-radius:999px;padding:2px 9px;font-size:12px;font-weight:600}
    .ticket-list{list-style:none;margin:0;padding:0;max-height:70vh;overflow-y:auto}
    .ticket-list li{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #f1f5f9;cursor:pointer;transition:background .15s ease}
    .ticket-list li:hover{background:#f8fafc}
    .ticket-list li.active{background:#e8f6ee;border-left:3px solid #198754}
    .avatar{flex:0 0 auto;width:38px;height:38px;border-radius:50%;background:#1d5374;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600}
    .ticket-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
    .ticket-info strong{font-size:14px;color:#102a43;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .ticket-info small{font-size:12px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .status-badge{flex:0 0 auto;font-size:11px;font-weight:600;padding:4px 10px;border-radius:999px;text-transform:capitalize}
    .status-open{background:#fff4e5;color:#b45309}
    .status-in_progress{background:#e6f0ff;color:#1d4ed8}
    .status-closed{background:#e6f6ec;color:#15803d}
    .detail-panel{background:#fff;border-radius:14px;box-shadow:0 2px 10px rgba(16,42,67,.06);padding:22px;display:flex;flex-direction:column;min-height:70vh}
    .detail-header{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;border-bottom:1px solid #eef2f6;padding-bottom:16px;margin-bottom:16px}
    .detail-title{display:flex;flex-direction:column;gap:8px}
    .detail-title h2{margin:0;font-size:20px;color:#102a43}
    .status-row{display:flex;gap:8px}
    .status-row button{background:#eef2f6;color:#334155;border:0;border-radius:8px;padding:9px 14px;cursor:pointer;font-size:13px;font-weight:500;transition:all .15s ease}
    .status-row button:hover{background:#dde5ec}
    .status-row button.active{background:#1d5374;color:#fff}
    .status-row button.close-btn.active{background:#be123c}
    .messages{flex:1;display:flex;flex-direction:column;gap:14px;overflow-y:auto;padding:4px 4px 12px;min-height:200px}
    .message{display:flex;gap:10px;max-width:85%}
    .message.admin{align-self:flex-end;flex-direction:row-reverse}
    .message-avatar{flex:0 0 auto;width:32px;height:32px;border-radius:50%;background:#cbd5e1;color:#1e293b;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;text-transform:uppercase}
    .message.admin .message-avatar{background:#198754;color:#fff}
    .message-bubble{background:#f1f5f9;border-radius:12px;padding:10px 14px}
    .message.admin .message-bubble{background:#e8f6ee}
    .message-bubble b{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#64748b}
    .message-bubble p{margin:4px 0 0;font-size:14px;color:#1e293b;white-space:pre-wrap}
    .attachments{display:flex;flex-direction:column;gap:4px;margin-top:8px}
    .attachments a{font-size:12px;color:#1d5374;text-decoration:none}
    .attachments a:hover{text-decoration:underline}
    .reply-form{border-top:1px solid #eef2f6;padding-top:16px;display:flex;flex-direction:column;gap:10px}
    .reply-form textarea{width:100%;padding:12px 14px;border:1px solid #d6e0e8;border-radius:10px;font-size:14px;font-family:inherit;resize:vertical;box-sizing:border-box}
    .reply-form textarea:focus{outline:none;border-color:#1d5374}
    .form-footer{display:flex;align-items:center;gap:12px}
    .file-btn{font-size:13px;color:#334155;background:#eef2f6;padding:9px 14px;border-radius:8px;cursor:pointer;font-weight:500}
    .file-btn:hover{background:#dde5ec}
    .file-count{font-size:12px;color:#64748b}
    .send-btn{margin-left:auto;background:#198754;color:#fff;border:0;border-radius:8px;padding:10px 20px;cursor:pointer;font-size:14px;font-weight:600;transition:background .15s ease}
    .send-btn:hover{background:#157347}
    .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#64748b;padding:40px 20px}
    .empty-state.large{min-height:70vh;background:#fff;border-radius:14px;box-shadow:0 2px 10px rgba(16,42,67,.06)}
    .empty-state h3{margin:10px 0 4px;color:#102a43}
    .empty-icon{font-size:38px}
    .modal{position:fixed;inset:0;background:rgba(15,23,42,.5);display:grid;place-items:center;z-index:50;padding:16px}
    .confirm-card{background:#fff;padding:26px;border-radius:16px;min-width:320px;max-width:400px;width:100%;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.25)}
    .confirm-icon{font-size:34px}
    .confirm-card h3{margin:12px 0 6px;color:#102a43}
    .confirm-card p{margin:0;color:#64748b;font-size:14px;line-height:1.5}
    .modal-actions{display:flex;justify-content:center;gap:10px;margin-top:20px}
    .cancel-btn{background:#eef2f6;color:#334155;border:0;border-radius:8px;padding:10px 18px;cursor:pointer;font-size:14px;font-weight:500}
    .cancel-btn:hover{background:#dde5ec}
    .confirm-btn{background:#be123c;color:#fff;border:0;border-radius:8px;padding:10px 18px;cursor:pointer;font-size:14px;font-weight:600}
    .confirm-btn:hover{background:#9f0f32}
    @media (max-width:860px){.layout{grid-template-columns:1fr}.header-stats{width:100%;justify-content:flex-start}}
  `]
})
export class SupportTicketsComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  tickets: any[] = []; selected: any = null; status = ''; error = ''; replyBody = ''; files: File[] = [];
  showCloseConfirm = false;
  ngOnInit() { this.load(); }
  load() {
    const params: any = {}; if (this.status) params.status = this.status;
    this.http.get<any>(`${environment.apiUrl}/support-tickets`, { params }).subscribe({ next: r => this.tickets = r.data || [], error: e => this.error = e.error?.message || 'Unable to load tickets.' });
  }
  open(id: string) { this.http.get<any>(`${environment.apiUrl}/support-tickets/${id}`).subscribe({ next: r => this.selected = r.data }); }
  onFiles(event: Event) { this.files = Array.from((event.target as HTMLInputElement).files || []); }
  reply(event: Event) {
    event.preventDefault();
    const data = new FormData(); data.append('body', this.replyBody); this.files.forEach(file => data.append('attachments', file));
    this.http.post<any>(`${environment.apiUrl}/support-tickets/${this.selected._id}/replies`, data).subscribe({ next: r => { this.selected = r.data; this.replyBody = ''; this.files = []; this.load(); }, error: e => this.error = e.error?.message || 'Unable to send reply.' });
  }
  setStatus(status: string) {
    if (status === 'closed') { this.showCloseConfirm = true; return; }
    this.applyStatus(status);
  }
  confirmClose() { this.showCloseConfirm = false; this.applyStatus('closed'); }
  cancelClose() { this.showCloseConfirm = false; }
  private applyStatus(status: string) {
    this.http.patch<any>(`${environment.apiUrl}/support-tickets/${this.selected._id}/status`, { status }).subscribe({ next: r => { this.selected = r.data; this.load(); } });
  }
  setStatusFilter(status: string) { this.status = status; this.load(); }
  countByStatus(status: string) { return this.tickets.filter(t => t.status === status).length; }
  statusLabel(status: string) { return status === 'in_progress' ? 'In progress' : (status || 'open').replace(/^\w/, c => c.toUpperCase()); }
  statusClass(status: string) { return 'status-' + (status || 'open'); }
  initials(name: string) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name[0]?.toUpperCase() || '?';
  }
}

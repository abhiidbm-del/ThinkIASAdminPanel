import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DemoTestService } from '../../../shared/services/demo-test.service';

@Component({
  selector: 'app-demo-test-results',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <main class="results-page">
      <header class="page-header">
        <div>
          <a mat-stroked-button routerLink="/demo-test-admin"><mat-icon>arrow_back</mat-icon> Demo Tests</a>
          <p class="eyebrow">DEMO TEST ATTEMPTS</p>
          <h1>{{ test()?.title || 'Student attempts' }}</h1>
          <p class="subtitle">{{ results().length }} student submission{{ results().length === 1 ? '' : 's' }}</p>
        </div>
        <button mat-icon-button aria-label="Refresh submissions" (click)="loadResults()" [disabled]="loading()">
          <mat-icon>refresh</mat-icon>
        </button>
      </header>

      <div class="loading-state" *ngIf="loading()"><mat-spinner diameter="34"></mat-spinner><span>Loading student attempts...</span></div>
      <p class="error-state" *ngIf="!loading() && error()" role="alert">{{ error() }}</p>
      <div class="empty-state" *ngIf="!loading() && !error() && !results().length">
        <mat-icon>assignment_late</mat-icon>
        <h2>No attempts yet</h2>
        <p>Student submissions for this demo test will appear here.</p>
      </div>

      <div class="table-wrap" *ngIf="!loading() && !error() && results().length">
        <table>
          <thead><tr><th>#</th><th>Student</th><th>Phone</th><th>Attempt</th><th>Score</th><th>Correct</th><th>Time</th><th>Submitted</th></tr></thead>
          <tbody>
            <tr *ngFor="let result of results(); let i = index">
              <td>{{ i + 1 }}</td>
              <td><strong>{{ result.student?.fullName || 'Unknown student' }}</strong><small>{{ result.student?.email || 'No email' }}</small></td>
              <td>{{ result.student?.phone || '—' }}</td>
              <td>{{ result.attemptNumber || 1 }}</td>
              <td>{{ result.score }} / {{ result.totalMarks }}<small>{{ result.percentage | number:'1.0-1' }}%</small></td>
              <td>{{ result.summary?.correctAnswers || 0 }} / {{ result.summary?.totalQuestions || test()?.questionUids?.length || 0 }}</td>
              <td>{{ formatTime(result.timeTaken) }}</td>
              <td>{{ result.submittedAt | date:'medium' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  `,
  styles: [`
    :host{display:block;min-height:100vh;background:#f4f6f9;color:#172b3a}
    .results-page{max-width:1240px;margin:0 auto;padding:28px}
    .page-header{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:22px}
    .page-header a{display:inline-flex;align-items:center;gap:6px}
    .eyebrow{margin:20px 0 5px;color:#27728a;font-size:11px;font-weight:700;letter-spacing:0}
    h1{margin:0;font-size:26px;line-height:1.25}
    .subtitle{margin:6px 0 0;color:#64748b;font-size:14px}
    .loading-state,.empty-state{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;min-height:280px;color:#64748b}
    .empty-state mat-icon{width:38px;height:38px;font-size:38px;color:#94a3b8}
    .empty-state h2,.empty-state p{margin:0}
    .empty-state h2{color:#243b4a;font-size:18px}
    .error-state{padding:14px;border:1px solid #f1b4b4;background:#fff1f1;color:#a11b1b;border-radius:6px}
    .table-wrap{overflow:auto;border:1px solid #dce3e8;border-radius:8px;background:#fff}
    table{width:100%;border-collapse:collapse;text-align:left;font-size:13px}
    th,td{padding:13px 14px;border-bottom:1px solid #e8edf0;white-space:nowrap}
    th{background:#f7f9fa;color:#52616b;font-size:11px;font-weight:700;text-transform:uppercase}
    tbody tr:last-child td{border-bottom:0}
    td strong,td small{display:block}
    td small{margin-top:3px;color:#64748b;font-size:12px}
    @media(max-width:640px){.results-page{padding:18px 12px}.page-header{align-items:flex-start}h1{font-size:21px}}
  `]
})
export class DemoTestResultsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private demoTestService = inject(DemoTestService);
  test = signal<any>(null);
  results = signal<any[]>([]);
  loading = signal(false);
  error = signal('');
  private testId = '';

  ngOnInit() {
    this.testId = this.route.snapshot.paramMap.get('id') || '';
    this.loadResults();
  }

  loadResults() {
    if (!this.testId) return;
    this.loading.set(true);
    this.error.set('');
    this.demoTestService.getDemoTestResults(this.testId).subscribe({
      next: response => {
        this.test.set(response.test);
        this.results.set(response.results || []);
        this.loading.set(false);
      },
      error: error => {
        this.error.set(error.error?.message || 'Unable to load student attempts.');
        this.loading.set(false);
      }
    });
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor((seconds || 0) / 60);
    const remainder = (seconds || 0) % 60;
    return `${minutes}:${String(remainder).padStart(2, '0')}`;
  }
}
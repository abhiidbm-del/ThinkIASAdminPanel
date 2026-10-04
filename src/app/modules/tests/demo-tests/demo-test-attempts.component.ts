import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { DemoTestService } from '../../../shared/services/demo-test.service';
import { QuizService } from '../../../shared/services/quiz.service';

type AttemptType = 'demo' | 'quiz';

@Component({
  selector: 'app-demo-test-attempts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <main class="attempts-page" [class.demo-mode]="attemptType() === 'demo'">
      <header class="attempt-header">
        <div class="header-copy">
          <a class="back-link" routerLink="/dashboard"><mat-icon>arrow_back</mat-icon><span>Dashboard</span></a>
          <div class="page-kicker"><mat-icon>{{ attemptType() === 'demo' ? 'play_lesson' : 'quiz' }}</mat-icon><span>STUDENT ACTIVITY</span></div>
          <h1>{{ attemptType() === 'demo' ? 'Demo Test Attempts' : 'Website Quiz Attempts' }}</h1>
          <p>{{ attemptType() === 'demo' ? 'Review every student submission across your demo exams.' : 'Review every student submission across your website quizzes.' }}</p>
        </div>
        <button mat-stroked-button class="refresh-button" aria-label="Refresh attempts" (click)="loadAttempts()" [disabled]="loading()">
          <mat-icon>refresh</mat-icon><span>Refresh</span>
        </button>
      </header>

      <section class="summary-strip" aria-label="Submission summary">
        <div class="summary-item"><span>Total submissions</span><strong>{{ attempts().length }}</strong></div>
        <div class="summary-item"><span>Students</span><strong>{{ studentCount() }}</strong></div>
        <div class="summary-item"><span>Last 24 hours</span><strong>{{ recentCount() }}</strong></div>
      </section>

      <section class="submission-section">
        <div class="list-toolbar">
          <div><h2>Student submissions</h2><p>Newest submissions appear first.</p></div>
          <label class="search-field">
            <mat-icon>search</mat-icon>
            <input [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)" aria-label="Search student submissions" placeholder="Search student or exam">
          </label>
        </div>

        <div class="loading-state" *ngIf="loading()"><mat-spinner diameter="32"></mat-spinner><span>Loading submissions...</span></div>
        <p class="error-state" *ngIf="!loading() && error()" role="alert"><mat-icon>error_outline</mat-icon>{{ error() }}</p>
        <div class="empty-state" *ngIf="!loading() && !error() && !attempts().length">
          <mat-icon>assignment_late</mat-icon>
          <h2>No submissions yet</h2>
          <p>Student attempts will appear here after an exam is submitted.</p>
        </div>
        <div class="empty-state compact" *ngIf="!loading() && !error() && attempts().length && !filteredAttempts().length">
          <mat-icon>search_off</mat-icon><p>No submissions match “{{ searchTerm() }}”.</p>
        </div>

        <div class="table-wrap" *ngIf="!loading() && !error() && filteredAttempts().length">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>{{ attemptType() === 'demo' ? 'Demo test' : 'Website quiz' }}</th>
                <th>Score</th>
                <th>Correct</th>
                <th *ngIf="attemptType() === 'demo'">Attempt</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let attempt of filteredAttempts(); let i = index">
                <td class="student-cell">
                  <span class="student-avatar">{{ getInitials(attempt) }}</span>
                  <span class="student-copy">
                    <strong>{{ getStudentName(attempt) }}</strong>
                    <small>{{ getStudentEmail(attempt) }}</small>
                    <small class="student-phone" *ngIf="getStudentPhone(attempt)">{{ getStudentPhone(attempt) }}</small>
                  </span>
                </td>
                <td class="exam-cell">{{ getExamTitle(attempt) }}</td>
                <td>
                  <strong class="score-value">{{ attempt.score }} / {{ getScoreTotal(attempt) }}</strong>
                  <span class="score-percent">{{ getScorePercent(attempt) }}%</span>
                </td>
                <td><span class="correct-value">{{ getCorrectCount(attempt) }}</span><small class="muted-value">correct</small></td>
                <td *ngIf="attemptType() === 'demo'"><span class="attempt-badge">{{ attempt.attemptNumber || 1 }}</span></td>
                <td class="date-cell">{{ attempt.submittedAt | date:'MMM d, y' }}<small>{{ attempt.submittedAt | date:'h:mm a' }}</small></td>
              </tr>
            </tbody>
          </table>
        </div>
        <footer class="list-footer" *ngIf="!loading() && filteredAttempts().length">
          Showing {{ filteredAttempts().length }} of {{ attempts().length }} submissions
        </footer>
      </section>
    </main>
  `,
  styles: [`
    :host{display:block;min-height:100vh;background:#f3f6f8;color:#1d303c}
    .attempts-page{max-width:1380px;margin:0 auto;padding:28px 32px 40px}
    .attempt-header{display:flex;justify-content:space-between;align-items:center;gap:24px;padding:26px 30px;border:1px solid #dce6e8;border-left:5px solid #27728a;border-radius:8px;background:linear-gradient(115deg,#fff 0%,#f2f8f8 100%)}
    .demo-mode .attempt-header{border-left-color:#16806b;background:linear-gradient(115deg,#fff 0%,#f1f8f4 100%)}
    .header-copy{min-width:0}
    .back-link{display:inline-flex;align-items:center;gap:5px;color:#52707d;font-size:13px;font-weight:600;text-decoration:none}
    .back-link mat-icon{width:18px;height:18px;font-size:18px}
    .back-link:hover{color:#1d5374}
    .page-kicker{display:flex;align-items:center;gap:7px;margin-top:18px;color:#27728a;font-size:11px;font-weight:700}
    .demo-mode .page-kicker{color:#16806b}
    .page-kicker mat-icon{width:17px;height:17px;font-size:17px}
    h1{margin:6px 0 0;color:#163447;font-size:27px;font-weight:700;line-height:1.2}
    .header-copy>p:last-child{margin:7px 0 0;color:#647782;font-size:14px;line-height:1.5}
    .refresh-button{display:inline-flex;align-items:center;gap:6px;flex:0 0 auto;border-color:#bfd0d6;color:#27596b}
    .summary-strip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin:18px 0 22px;border:1px solid #dce5e8;border-radius:8px;background:#fff}
    .summary-item{display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0;padding:15px 20px;border-right:1px solid #e7edef}
    .summary-item:last-child{border-right:0}
    .summary-item span{color:#657780;font-size:12px;font-weight:600}
    .summary-item strong{color:#1d5374;font-size:21px;line-height:1}
    .demo-mode .summary-item strong{color:#16806b}
    .submission-section{border:1px solid #dce5e8;border-radius:8px;background:#fff}
    .list-toolbar{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:18px 20px;border-bottom:1px solid #e7edef}
    .list-toolbar h2{margin:0;color:#1d3543;font-size:16px;font-weight:700}
    .list-toolbar p{margin:4px 0 0;color:#768791;font-size:12px}
    .search-field{display:flex;align-items:center;gap:8px;width:min(340px,45%);min-height:40px;padding:0 11px;border:1px solid #d7e1e5;border-radius:6px;background:#fff;color:#6b7c85}
    .search-field:focus-within{border-color:#45869a;box-shadow:0 0 0 3px rgba(39,114,138,.1)}
    .search-field mat-icon{flex:0 0 auto;width:18px;height:18px;font-size:18px}
    .search-field input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#1d303c;font:inherit;font-size:13px}
    .search-field input::placeholder{color:#8b9aa1}
    .table-wrap{overflow:auto}
    table{width:100%;border-collapse:collapse;text-align:left;font-size:13px}
    th,td{padding:13px 17px;border-bottom:1px solid #edf1f2;vertical-align:middle}
    th{position:sticky;top:0;background:#f7f9fa;color:#61727b;font-size:10px;font-weight:700;text-transform:uppercase;white-space:nowrap}
    tbody tr{transition:background-color 140ms ease}
    tbody tr:hover{background:#f7fafb}
    tbody tr:last-child td{border-bottom:0}
    .student-cell{display:flex;align-items:center;gap:11px;min-width:215px}
    .student-avatar{display:grid;width:36px;height:36px;flex:0 0 36px;place-items:center;border-radius:50%;background:#e4f1f3;color:#246579;font-size:12px;font-weight:700}
    .demo-mode .student-avatar{background:#e4f3ea;color:#197454}
    .student-copy{display:block;min-width:0}
    .student-copy strong,.student-copy small,.date-cell small{display:block}
    .student-copy strong{overflow:hidden;color:#243b48;font-size:13px;text-overflow:ellipsis;white-space:nowrap}
    .student-copy small{margin-top:3px;color:#71818a;font-size:11px}
    .student-copy .student-phone{color:#86949a}
    .exam-cell{min-width:180px;max-width:320px;color:#354e5b;font-weight:600;white-space:normal;line-height:1.45}
    .score-value{display:block;color:#1d5374;font-size:13px;white-space:nowrap}
    .demo-mode .score-value{color:#16704f}
    .score-percent{display:inline-block;margin-top:4px;padding:2px 6px;border-radius:4px;background:#e8f3f5;color:#276c7d;font-size:10px;font-weight:700}
    .demo-mode .score-percent{background:#e6f3eb;color:#197454}
    .correct-value{color:#276b53;font-weight:700}
    .muted-value{margin-left:4px;color:#829098;font-size:11px}
    .attempt-badge{display:inline-grid;min-width:26px;height:26px;place-items:center;border-radius:50%;background:#f0f3f4;color:#526570;font-size:11px;font-weight:700}
    .date-cell{color:#394f5b;font-size:12px;white-space:nowrap}
    .date-cell small{margin-top:4px;color:#7d8c93;font-size:11px}
    .list-footer{padding:11px 18px;border-top:1px solid #e7edef;color:#71818a;font-size:11px;text-align:right}
    .loading-state,.empty-state{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;min-height:240px;color:#70818a}
    .loading-state{flex-direction:row}
    .empty-state mat-icon{width:34px;height:34px;font-size:34px;color:#97a7ad}
    .empty-state h2,.empty-state p{margin:0}
    .empty-state h2{color:#294452;font-size:16px}
    .empty-state p{font-size:13px}
    .empty-state.compact{min-height:145px}
    .error-state{display:flex;align-items:center;gap:8px;margin:18px;padding:12px 14px;border:1px solid #efc5c5;border-radius:6px;background:#fff5f5;color:#a33b3b;font-size:13px}
    @media(max-width:760px){.attempts-page{padding:18px 16px 28px}.attempt-header{align-items:flex-start;padding:21px 20px}h1{font-size:23px}.summary-item{padding:13px 14px}.list-toolbar{align-items:flex-start;flex-direction:column}.search-field{width:100%}}
    @media(max-width:520px){.attempts-page{padding:12px 10px 22px}.attempt-header{gap:12px;padding:18px 15px}.header-copy>p:last-child{font-size:13px}.refresh-button{width:40px;min-width:40px;padding:0}.refresh-button span{display:none}.summary-item{align-items:flex-start;flex-direction:column;gap:8px;padding:12px 10px}.summary-item span{font-size:10px}.summary-item strong{font-size:19px}.list-toolbar{padding:15px}.student-cell{min-width:190px}th,td{padding:11px 12px}}
    @media(prefers-reduced-motion:reduce){tbody tr{transition:none}}
  `]
})
export class DemoTestAttemptsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private demoTestService = inject(DemoTestService);
  private quizService = inject(QuizService);
  attemptType = signal<AttemptType>('demo');
  attempts = signal<any[]>([]);
  loading = signal(false);
  error = signal('');
  searchTerm = signal('');
  studentCount = computed(() => new Set(this.attempts().map(attempt => this.attemptType() === 'demo' ? (attempt.student?._id || attempt.student?.email) : (attempt.email || attempt.name)).filter(Boolean)).size);
  recentCount = computed(() => {
    const since = Date.now() - 24 * 60 * 60 * 1000;
    return this.attempts().filter(attempt => new Date(attempt.submittedAt).getTime() >= since).length;
  });
  filteredAttempts = computed(() => {
    const term = this.searchTerm().trim().toLocaleLowerCase();
    if (!term) return this.attempts();
    return this.attempts().filter(attempt => {
      const values = this.attemptType() === 'demo'
        ? [attempt.student?.fullName, attempt.student?.email, attempt.student?.phone, attempt.test?.title]
        : [attempt.name, attempt.email, attempt.phone, attempt.quiz?.title];
      return values.some(value => String(value || '').toLocaleLowerCase().includes(term));
    });
  });

  ngOnInit() {
    this.attemptType.set(this.route.snapshot.data['attemptType'] === 'quiz' ? 'quiz' : 'demo');
    this.loadAttempts();
  }

  loadAttempts() {
    this.loading.set(true);
    this.error.set('');
    const request = this.attemptType() === 'demo'
      ? this.demoTestService.getAllDemoResults()
      : this.quizService.getAllQuizSubmissions();
    request.subscribe({
      next: results => {
        this.attempts.set(results || []);
        this.loading.set(false);
      },
      error: error => {
        this.error.set(error.error?.message || 'Unable to load student attempts.');
        this.loading.set(false);
      }
    });
  }

  getStudentName(attempt: any): string {
    return this.attemptType() === 'demo' ? attempt.student?.fullName || 'Unknown student' : attempt.name || 'Unknown student';
  }

  getStudentEmail(attempt: any): string {
    return this.attemptType() === 'demo' ? attempt.student?.email || '' : attempt.email || '';
  }

  getStudentPhone(attempt: any): string {
    return this.attemptType() === 'demo' ? attempt.student?.phone || '' : attempt.phone || '';
  }

  getExamTitle(attempt: any): string {
    return this.attemptType() === 'demo' ? attempt.test?.title || 'Deleted demo test' : attempt.quiz?.title || 'Deleted quiz';
  }

  getScoreTotal(attempt: any): number {
    return this.attemptType() === 'demo' ? attempt.totalMarks || 0 : attempt.totalQuestions || 0;
  }

  getScorePercent(attempt: any): number {
    if (this.attemptType() === 'demo') return Math.round(Number(attempt.percentage) || 0);
    return attempt.totalQuestions ? Math.round((attempt.score / attempt.totalQuestions) * 100) : 0;
  }

  getCorrectCount(attempt: any): number {
    return this.attemptType() === 'demo' ? attempt.summary?.correctAnswers || 0 : attempt.correctAnswers || 0;
  }

  getInitials(attempt: any): string {
    const name = this.getStudentName(attempt).trim();
    return name.split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase() || 'S';
  }
}
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { QuizService, Submission, LeaderboardResponse } from '../../../../shared/services/quiz.service';
import { QuizDialogComponent } from '../quiz-dialog/quiz-dialog.component';

@Component({
  selector: 'app-quiz-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatTableModule,
    MatDialogModule
  ],
  templateUrl: './quiz-details.component.html',
  styleUrls: ['./quiz-details.component.css']
})
export class QuizDetailsComponent implements OnInit {
  quizId!: string;
  quiz = signal<any>(null);
  loading = signal(false);
  
  // Language toggle
  currentLanguage = signal<'en' | 'hi'>('en');
  
  // Submissions
  submissions = signal<Submission[]>([]);
  submissionsLoading = signal(false);
  displayedColumns: string[] = ['name', 'email', 'phone','score', 'timeTaken', 'submittedAt'];
  
  // Leaderboard
  leaderboard = signal<any[]>([]);
  leaderboardLoading = signal(false);
  totalParticipants = signal(0);
  
  // Questions
  questionsLoading = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.quizId = params['id'];
      this.loadQuizDetails();
      this.loadSubmissions();
      this.loadLeaderboard();
    });
  }

  toggleLanguage() {
    const newLang = this.currentLanguage() === 'en' ? 'hi' : 'en';
    this.currentLanguage.set(newLang);
  }

  getCurrentLanguageText(): string {
    return this.currentLanguage() === 'en' ? 'English' : 'हिंदी';
  }

  getQuestionText(question: any): string {
    if (!question) return '';
    
    if (typeof question === 'string') {
      return question;
    }
    
    if (this.currentLanguage() === 'hi' && question.hindi) {
      return question.hindi;
    }
    
    return question.english || question.question || '';
  }

  getOptionText(option: any): string {
    if (!option) return '';
    
    if (typeof option === 'string') {
      return option;
    }
    
    if (this.currentLanguage() === 'hi' && option.hindi) {
      return option.hindi;
    }
    
    return option.english || option;
  }

  loadQuizDetails(): void {
    this.loading.set(true);
    this.quizService.getQuizById(this.quizId).subscribe({
      next: (quiz) => {
        this.quiz.set(quiz);
        this.loading.set(false);
      },
      error: (error) => {
        this.snackBar.open('Error loading quiz details', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  loadSubmissions(): void {
    this.submissionsLoading.set(true);
    this.quizService.getQuizSubmissions(this.quizId).subscribe({
      next: (submissions) => {
        this.submissions.set(submissions);
        this.submissionsLoading.set(false);
      },
      error: (error) => {
        this.snackBar.open('Error loading submissions', 'Close', { duration: 3000 });
        this.submissionsLoading.set(false);
      }
    });
  }

  loadLeaderboard(): void {
    this.leaderboardLoading.set(true);
    this.quizService.getQuizLeaderboard(this.quizId).subscribe({
      next: (result: LeaderboardResponse) => {
        this.leaderboard.set(result.leaderboard || []);
        this.totalParticipants.set(result.totalParticipants || 0);
        this.leaderboardLoading.set(false);
      },
      error: (error) => {
        this.snackBar.open('Error loading leaderboard', 'Close', { duration: 3000 });
        this.leaderboardLoading.set(false);
      }
    });
  }

  editQuiz(): void {
    const dialogRef = this.dialog.open(QuizDialogComponent, {
      width: '600px',
      data: { quiz: this.quiz() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadQuizDetails();
      }
    });
  }

  toggleQuizStatus(): void {
    const quiz = this.quiz();
    if (!quiz) return;

    const newStatus = !quiz.isActive;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (confirm(`Are you sure you want to ${action} this quiz?`)) {
      this.quizService.toggleQuizActive(this.quizId, newStatus).subscribe({
        next: () => {
          this.snackBar.open(`Quiz ${action}d successfully`, 'Close', { duration: 3000 });
          this.loadQuizDetails();
        },
        error: (error) => {
          this.snackBar.open(`Error ${action}ing quiz`, 'Close', { duration: 3000 });
        }
      });
    }
  }

  exportSubmissions(): void {
    const submissions = this.submissions();
    const csvContent = this.convertToCSV(submissions);
    this.downloadCSV(csvContent, `quiz-${this.quizId}-submissions.csv`);
  }

  convertToCSV(data: any[]): string {
    const headers = ['Name', 'Email', 'Score', 'Total Questions', 'Time Taken', 'Submitted At'];
    const rows = data.map(sub => [
      sub.name,
      sub.email,
      sub.score,
      sub.totalQuestions,
      sub.timeTaken,
      new Date(sub.submittedAt).toLocaleString()
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
  getScorePercentage(score: number, total: number): number {
  return total > 0 ? Math.round((score / total) * 100) : 0;
}
}
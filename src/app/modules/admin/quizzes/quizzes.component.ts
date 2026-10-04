import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

import { QuizService } from '../../../shared/services/quiz.service';
import { QuizDialogComponent } from './quiz-dialog/quiz-dialog.component';

@Component({
  selector: 'app-quizzes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './quizzes.component.html',
  styleUrl: './quizzes.component.css'
})
export class QuizzesComponent implements OnInit {
  private quizService = inject(QuizService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  quizzes = signal<any[]>([]);
  filteredQuizzes = signal<any[]>([]);
  loading = signal(false);
  
  // Search and filter
  searchTerm = '';
  statusFilter = 'all';

  ngOnInit() {
    this.loadQuizzes();
  }

  loadQuizzes() {
    this.loading.set(true);
    this.quizService.getAllQuizzes().subscribe({
      next: (quizzes) => {
        this.quizzes.set(quizzes);
        this.filterQuizzes();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading quizzes:', error);
        this.snackBar.open('Error loading quizzes', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  filterQuizzes() {
    let filtered = [...this.quizzes()];
    
    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(quiz => 
        quiz.title?.toLowerCase().includes(term) ||
        quiz.description?.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (this.statusFilter !== 'all') {
      const isActive = this.statusFilter === 'active';
      filtered = filtered.filter(quiz => quiz.isActive === isActive);
    }
    
    this.filteredQuizzes.set(filtered);
  }

  openCreateQuizDialog(quiz?: any) {
    const dialogRef = this.dialog.open(QuizDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      maxHeight: '800px',
      panelClass: 'quiz-dialog-panel',
      autoFocus: false,
      data: { quiz: quiz || null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadQuizzes();
      }
    });
  }

  editQuiz(quiz: any) {
    this.openCreateQuizDialog(quiz);
  }

  deleteQuiz(quizId: string) {
    if (confirm('Are you sure you want to delete this quiz? This will also delete all submissions.')) {
      this.quizService.deleteQuiz(quizId).subscribe({
        next: () => {
          this.snackBar.open('Quiz deleted successfully', 'Close', { duration: 3000 });
          this.loadQuizzes();
        },
        error: (error) => {
          console.error('Error deleting quiz:', error);
          this.snackBar.open('Error deleting quiz', 'Close', { duration: 3000 });
        }
      });
    }
  }

  toggleQuizStatus(quiz: any) {
    const newStatus = !quiz.isActive;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (confirm(`Are you sure you want to ${action} this quiz?`)) {
      this.quizService.toggleQuizActive(quiz._id, newStatus).subscribe({
        next: (updatedQuiz) => {
          // Update local state
          const updatedQuizzes = this.quizzes().map(q => 
            q._id === quiz._id ? { ...q, isActive: updatedQuiz.quiz.isActive } : q
          );
          this.quizzes.set(updatedQuizzes);
          this.filterQuizzes();
          
          this.snackBar.open(
            `Quiz ${action}d successfully`,
            'Close',
            { duration: 3000 }
          );
        },
        error: (error) => {
          console.error('Error toggling quiz status:', error);
          this.snackBar.open(`Error ${action}ing quiz`, 'Close', { duration: 3000 });
        }
      });
    }
  }

  viewSubmissions(quizId: string) {
    this.router.navigate(['quizzes', quizId]);
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder, FormGroup, FormArray, FormControl,
  ReactiveFormsModule, Validators,
  FormsModule
} from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TestService } from '../../../shared/services/test.service';

@Component({
  selector: 'app-take-test',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatRadioModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './take-test.component.html',
  styleUrl: './take-test.component.css'
})
export class TakeTestComponent implements OnInit, OnDestroy {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private testService = inject(TestService);
  private snackBar = inject(MatSnackBar);

  test = signal<any>(null);
  loading = signal(false);
  timeLeft = signal(0);
  currentQuestionIndex = signal(0);
  reviewQuestions = signal<number[]>([]); // Array of question indices marked for review

  testForm: FormGroup;
  timer: any;
  startTime: Date = new Date();
  selectedLanguage: 'english' | 'hindi' = 'english';

  // Computed property for current question
  currentQuestion = computed(() => {
    const testData = this.test();
    const index = this.currentQuestionIndex();
    return testData && testData.questions ? testData.questions[index] : null;
  });

  constructor() {
    this.testForm = this.fb.group({
      answers: this.fb.array([])
    });
  }

  ngOnInit() {
    const testId = this.route.snapshot.paramMap.get('id');
    if (testId) {
      this.loadTest(testId);
    }
  }

  loadTest(testId: string) {
    this.loading.set(true);

    this.testService.getTestById(testId).subscribe({
      next: (test) => {
        this.test.set(test);
        this.timeLeft.set(test.duration * 60); // seconds
        this.initializeForm(test);
        this.startTimer();
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error loading test!', 'Close', { duration: 4000 });
        this.loading.set(false);
        this.router.navigate(['/live-tests']);
      }
    });
  }

  initializeForm(test: any) {
    const answerArray = this.answers;
    answerArray.clear();

    test.questions.forEach(() => {
      answerArray.push(this.fb.control(null));
    });
  }

  get answers(): FormArray {
    return this.testForm.get('answers') as FormArray;
  }

  getAnswerControl(index: number): FormControl {
    return this.answers.at(index) as FormControl;
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.timeLeft.set(this.timeLeft() - 1);

      if (this.timeLeft() <= 0) {
        this.submitTest();
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Navigation methods
  previousQuestion() {
    if (this.currentQuestionIndex() > 0) {
      this.currentQuestionIndex.set(this.currentQuestionIndex() - 1);
    }
  }

  nextQuestion() {
    if (this.currentQuestionIndex() < this.test().questions.length - 1) {
      this.currentQuestionIndex.set(this.currentQuestionIndex() + 1);
    }
  }

  goToQuestion(index: number) {
    this.currentQuestionIndex.set(index);
  }

  clearAnswer() {
    this.getAnswerControl(this.currentQuestionIndex()).setValue(null);
  }

  markForReview() {
    const currentIndex = this.currentQuestionIndex();
    const reviewQuestions = this.reviewQuestions();
    
    // Add to review if not already there
    if (!reviewQuestions.includes(currentIndex)) {
      this.reviewQuestions.set([...reviewQuestions, currentIndex]);
    }
    
    // Move to next question
    this.nextQuestion();
  }

  saveAndNext() {
    const currentIndex = this.currentQuestionIndex();
    const reviewQuestions = this.reviewQuestions();
    
    // Remove from review if it was marked for review
    if (reviewQuestions.includes(currentIndex)) {
      this.reviewQuestions.set(reviewQuestions.filter(i => i !== currentIndex));
    }
    
    // Move to next question
    this.nextQuestion();
  }

  getQuestionStatusClass(index: number): string {
    const isAnswered = this.answers.at(index).value !== null;
    const isMarkedForReview = this.reviewQuestions().includes(index);
    const isCurrent = index === this.currentQuestionIndex();
    
    if (isCurrent) {
      return 'current';
    } else if (isMarkedForReview) {
      return 'marked-review';
    } else if (isAnswered) {
      return 'answered';
    } else {
      return 'not-answered';
    }
  }

  submitTest() {
    if (this.timer) clearInterval(this.timer);

    // Check if all questions are answered
    const unansweredQuestions = this.answers.controls
      .map((control, index) => control.value === null ? index + 1 : null)
      .filter(index => index !== null);
    
    if (unansweredQuestions.length > 0) {
      const message = `You have ${unansweredQuestions.length} unanswered questions: ${unansweredQuestions.join(', ')}. Submit anyway?`;
      
      if (!confirm(message)) {
        this.startTimer();
        return;
      }
    }

    const submission = {
      answers: this.answers.value.map((option: number) => ({
        selectedOption: option ?? -1
      })),
      timeTaken: Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000)
    };

    this.testService.submitTest(this.test()._id, submission).subscribe({
      next: (result) => {
        this.snackBar.open(`Test submitted! Score: ${result.score}/${result.totalMarks}`, 'Close', { duration: 5000 });
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open("Error submitting test!", "Close", { duration: 4000 });
      }
    });
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}
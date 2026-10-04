// admin-answer-writing.component.ts

import { Component, inject, signal, OnInit, TemplateRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, AbstractControl, ValidationErrors, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

import { AnswerWritingService, AnswerWriting } from '../../../shared/services/answer-writing.service';
import { FormsModule } from '@angular/forms';

// ============================================
// VALIDATORS
// ============================================
const startTimeValidator = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) return null;
  const selectedDate = new Date(control.value);
  const now = new Date();
  const minDateTime = new Date(now.getTime() + 5 * 60000);

  if (selectedDate < minDateTime) {
    return { pastDate: true };
  }
  return null;
};

const endTimeValidator = (startTimeControl: AbstractControl) => {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value || !startTimeControl.value) return null;
    const startDate = new Date(startTimeControl.value);
    const endDate = new Date(control.value);

    if (endDate <= startDate) {
      return { invalidEndTime: true };
    }
    return null;
  };
};

// ============================================
// INTERFACES
// ============================================
interface FilterParams {
  search: string;
  status: string;
  fromDate?: string;
  toDate?: string;
}

interface ModelAnswerData {
  remark: string;
  answerEnglish: string;
  answerHindi: string;
  modelAnswerPDF: string;
  modelAnswerPDFHi: string;
  isActive: boolean;
}

@Component({
  selector: 'app-admin-answer-writing',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatTabsModule,
    MatExpansionModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatBadgeModule
  ],
  templateUrl: './admin-answer-writing.component.html',
  styleUrls: ['./admin-answer-writing.component.css']
})
export class AdminAnswerWritingComponent implements OnInit, OnDestroy {
  // ============================================
  // VIEW CHILDREN
  // ============================================
  @ViewChild('exerciseDialog') exerciseDialog!: TemplateRef<any>;
  @ViewChild('tabGroup') tabGroup: any;
  @ViewChild('viewExerciseDialog') viewExerciseDialog!: TemplateRef<any>;

  // ============================================
  // INJECTED SERVICES
  // ============================================
  private answerWritingService = inject(AnswerWritingService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // ============================================
  // SIGNALS
  // ============================================
  exercises = signal<AnswerWriting[]>([]);
  submissions = signal<any[]>([]);
  filteredSubmissionsSignal = signal<any[]>([]);
  submissionCounts = new Map<string, number>();

  loading = signal(false);
  submissionsLoading = signal(false);
  submitting = signal(false);

  // ============================================
  // PUBLIC PROPERTIES
  // ============================================
  selectedStatus = '';
  selectedExerciseForSubmissions: AnswerWriting | null = null;
  editingExercise: AnswerWriting | null = null;
  viewingExercise: AnswerWriting | null = null;
  submissionLanguageFilter: 'all' | 'en' | 'hi' = 'all';
  fromDate: Date | null = null;
  toDate: Date | null = null;
  selectedTabIndex = 0;
  evaluationUrls = new Map<string, string>();

  showModelAnswerModal = false;
  selectedExercise: any = null;

  remarkSubmitted = false;
  englishSubmitted = false;
  hindiSubmitted = false;
  toggleSubmitted = false;

  // FIXED: Added modelAnswerPDF and modelAnswerPDFHi
  modelAnswerData: ModelAnswerData = {
    remark: '',
    answerEnglish: '',
    answerHindi: '',
    modelAnswerPDF: '',
    modelAnswerPDFHi: '',
    isActive: true
  };

  // ============================================
  // FORM CONTROLS
  // ============================================
  exerciseForm: FormGroup;
  searchControl = new FormControl('');

  // ============================================
  // DIALOG REFERENCES
  // ============================================
  private dialogRef: MatDialogRef<any> | null = null;
  private viewDialogRef: MatDialogRef<any> | null = null;
  private destroy$ = new Subject<void>();

  // ============================================
  // CONSTRUCTOR
  // ============================================
  constructor() {
    this.exerciseForm = this.buildForm();
  }

  // ============================================
  // LIFECYCLE HOOKS
  // ============================================
  ngOnInit() {
    this.loadExercises();
    this.setupSearchFilter();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // FORM BUILDING
  // ============================================
  private buildForm(): FormGroup {
    const form = this.fb.group({
      name: ['', Validators.required],
      nameHi: [''],
      description: ['', Validators.required],
      descriptionHi: [''],
      questions: this.fb.array([]),
      questionPaperPDF: [''],
      questionPaperPDFHi: [''],
      startDateTime: ['', [Validators.required, startTimeValidator]],
      endDateTime: ['', [Validators.required]],
      order: [0],
      isActive: [true]
    });

    const endDateTimeControl = form.get('endDateTime');
    const startDateTimeControl = form.get('startDateTime');

    if (endDateTimeControl && startDateTimeControl) {
      endDateTimeControl.setValidators([Validators.required, endTimeValidator(startDateTimeControl)]);
      startDateTimeControl.valueChanges.subscribe(() => {
        endDateTimeControl.updateValueAndValidity();
      });
    }

    return form;
  }

  // ============================================
  // SEARCH FILTER
  // ============================================
  private setupSearchFilter() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.loadExercises());
  }

  // ============================================
  // EXERCISE CRUD OPERATIONS
  // ============================================
  loadExercises() {
    this.loading.set(true);

    const params: FilterParams = {
      search: this.searchControl.value || '',
      status: this.selectedStatus
    };

    if (this.fromDate) {
      params.fromDate = this.fromDate.toISOString();
    }
    if (this.toDate) {
      params.toDate = this.toDate.toISOString();
    }

    this.answerWritingService.getAllExercisesAdmin(
      params.search,
      params.status,
      params.fromDate,
      params.toDate
    ).subscribe({
      next: (response) => {
        this.exercises.set(response.data);
        this.loadSubmissionCounts();
        this.loading.set(false);
      },
      error: () => {
        this.showSnackBar('Failed to load exercises');
        this.loading.set(false);
      }
    });
  }

  loadSubmissionCounts() {
    this.exercises().forEach(exercise => {
      this.answerWritingService.getExerciseSubmissions(exercise._id).subscribe({
        next: (response) => {
          this.submissionCounts.set(exercise._id, response.count);
        },
        error: () => {
          // Silently fail for submission counts
        }
      });
    });
  }

  getSubmissionCount(exerciseId: string): number {
    return this.submissionCounts.get(exerciseId) || 0;
  }

  getQuestionsCount(exercise: AnswerWriting): number {
    return (exercise.questions || []).length;
  }

  getDuration(exercise: AnswerWriting | null): string {
    if (!exercise) return 'Not available';
    const start = new Date(exercise.startDateTime);
    const end = new Date(exercise.endDateTime);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

    if (diffHours < 24) {
      return `${diffHours}h`;
    }
    const diffDays = Math.ceil(diffHours / 24);
    return `${diffDays}d`;
  }

  // ============================================
  // DATE FILTERS
  // ============================================
  applyDateFilter() {
    this.loadExercises();
  }

  clearDateFilter() {
    this.fromDate = null;
    this.toDate = null;
    this.loadExercises();
  }

  // ============================================
  // FORM HELPERS
  // ============================================
  getDefaultStartDateTime(): string {
    const now = new Date();
    const startDateTime = new Date(now.getTime() + 5 * 60000);
    return startDateTime.toISOString().slice(0, 16);
  }

  getDefaultEndDateTime(): string {
    const now = new Date();
    const endDateTime = new Date(now.getTime() + 24 * 60 * 60000);
    return endDateTime.toISOString().slice(0, 16);
  }

  getMinDateTime(): string {
    const now = new Date();
    const minDateTime = new Date(now.getTime() + 5 * 60000);
    return minDateTime.toISOString().slice(0, 16);
  }

  onDateTimeChange(): void {
    this.exerciseForm.get('endDateTime')?.updateValueAndValidity();
  }

  getQuestionControls() {
    return (this.exerciseForm.get('questions') as FormArray).controls;
  }

  addQuestion() {
    const questions = this.exerciseForm.get('questions') as FormArray;
    questions.push(this.fb.group({
      questionText: ['', Validators.required],
      questionTextHi: ['']
    }));
  }

  removeQuestion(index: number) {
    const questions = this.exerciseForm.get('questions') as FormArray;
    questions.removeAt(index);
  }

  formatDateTimeForInput(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().slice(0, 16);
  }

  // ============================================
  // CREATE/EDIT DIALOG
  // ============================================
  openCreateDialog() {
    this.editingExercise = null;
    const questions = this.exerciseForm.get('questions') as FormArray;
    while (questions.length) questions.removeAt(0);
    this.addQuestion();

    this.exerciseForm.reset({
      name: '',
      nameHi: '',
      description: '',
      descriptionHi: '',
      questionPaperPDF: '',
      questionPaperPDFHi: '',
      startDateTime: this.getDefaultStartDateTime(),
      endDateTime: this.getDefaultEndDateTime(),
      order: 0,
      isActive: true
    });

    this.dialogRef = this.dialog.open(this.exerciseDialog, {
      width: '700px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'form-dialog',
      disableClose: true
    });
  }

  openEditDialog(exercise: AnswerWriting) {
    this.editingExercise = exercise;
    const questions = this.exerciseForm.get('questions') as FormArray;
    while (questions.length) questions.removeAt(0);

    (exercise.questions || []).forEach(q => {
      questions.push(this.fb.group({
        questionText: [q.questionText, Validators.required],
        questionTextHi: [(q as any).questionTextHi || '']
      }));
    });

    this.exerciseForm.patchValue({
      name: exercise.name,
      nameHi: (exercise as any).nameHi || '',
      description: exercise.description,
      descriptionHi: (exercise as any).descriptionHi || '',
      questionPaperPDF: exercise.questionPaperPDF || '',
      questionPaperPDFHi: (exercise as any).questionPaperPDFHi || '',
      startDateTime: this.formatDateTimeForInput(exercise.startDateTime),
      endDateTime: this.formatDateTimeForInput(exercise.endDateTime),
      order: exercise.order || 0,
      isActive: exercise.isActive
    });

    this.dialogRef = this.dialog.open(this.exerciseDialog, {
      width: '700px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'form-dialog',
      disableClose: true
    });
  }

  closeDialog() {
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = null;
    }
  }

  onSubmit() {
    if (this.exerciseForm.invalid) {
      this.exerciseForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.editingExercise ? this.updateExercise() : this.createExercise();
  }

  private createExercise() {
    const formValue = this.exerciseForm.value;
    const exerciseData = {
      name: formValue.name,
      nameHi: formValue.nameHi,
      description: formValue.description,
      descriptionHi: formValue.descriptionHi,
      questions: formValue.questions,
      questionPaperPDF: formValue.questionPaperPDF,
      questionPaperPDFHi: formValue.questionPaperPDFHi,
      startDateTime: new Date(formValue.startDateTime).toISOString(),
      endDateTime: new Date(formValue.endDateTime).toISOString(),
      order: formValue.order || 0
    };

    this.answerWritingService.createExercise(exerciseData).subscribe({
      next: (response) => {
        this.showSnackBar(response.message || 'Exercise created successfully');
        this.loadExercises();
        this.closeDialog();
        this.submitting.set(false);
      },
      error: (error) => {
        this.showSnackBar(error.error?.message || 'Failed to create exercise');
        this.submitting.set(false);
      }
    });
  }

  private updateExercise() {
    if (!this.editingExercise) return;

    const formValue = this.exerciseForm.value;
    const exerciseData = {
      name: formValue.name,
      nameHi: formValue.nameHi,
      description: formValue.description,
      descriptionHi: formValue.descriptionHi,
      questions: formValue.questions,
      questionPaperPDF: formValue.questionPaperPDF,
      questionPaperPDFHi: formValue.questionPaperPDFHi,
      startDateTime: new Date(formValue.startDateTime).toISOString(),
      endDateTime: new Date(formValue.endDateTime).toISOString(),
      order: formValue.order || 0,
      isActive: formValue.isActive
    };

    this.answerWritingService.updateExercise(this.editingExercise._id, exerciseData).subscribe({
      next: (response) => {
        this.showSnackBar(response.message || 'Exercise updated successfully');
        this.loadExercises();
        this.closeDialog();
        this.submitting.set(false);
      },
      error: (error) => {
        this.showSnackBar(error.error?.message || 'Failed to update exercise');
        this.submitting.set(false);
      }
    });
  }

  // ============================================
  // EXERCISE ACTIONS
  // ============================================
  toggleExerciseStatus(exercise: AnswerWriting) {
    this.answerWritingService.toggleExerciseStatus(exercise._id).subscribe({
      next: (response) => {
        this.showSnackBar(response.message || 'Status updated successfully');
        this.loadExercises();
      },
      error: () => this.showSnackBar('Failed to update status')
    });
  }

  deleteExercise(exercise: AnswerWriting) {
    if (confirm(`Are you sure you want to delete "${exercise.name}"? This action cannot be undone.`)) {
      this.answerWritingService.deleteExercise(exercise._id).subscribe({
        next: (response) => {
          this.showSnackBar(response.message || 'Exercise deleted successfully');
          this.loadExercises();
          if (this.selectedExerciseForSubmissions?._id === exercise._id) {
            this.clearSelectedExercise();
          }
        },
        error: () => this.showSnackBar('Failed to delete exercise')
      });
    }
  }

  // ============================================
  // VIEW EXERCISE DIALOG
  // ============================================
  openViewDialog(exercise: AnswerWriting) {
    this.viewingExercise = exercise;
    this.viewDialogRef = this.dialog.open(this.viewExerciseDialog, {
      width: '700px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'view-dialog',
      disableClose: true
    });
  }

  closeViewDialog() {
    if (this.viewDialogRef) {
      this.viewDialogRef.close();
      this.viewDialogRef = null;
      this.viewingExercise = null;
    }
  }

  // ============================================
  // SUBMISSIONS
  // ============================================
  viewSubmissionsAndSwitchTab(exercise: AnswerWriting) {
    this.viewSubmissions(exercise);
    this.selectedTabIndex = 1;
  }

  filteredSubmissions() {
    return this.filteredSubmissionsSignal();
  }

  filterSubmissions() {
    const allSubmissions = this.submissions();
    if (this.submissionLanguageFilter === 'all') {
      this.filteredSubmissionsSignal.set(allSubmissions);
    } else {
      this.filteredSubmissionsSignal.set(
        allSubmissions.filter(s => s.submissionLanguage === this.submissionLanguageFilter)
      );
    }
  }

  clearSelectedExercise() {
    this.selectedExerciseForSubmissions = null;
    this.submissions.set([]);
    this.filteredSubmissionsSignal.set([]);
  }

  // ============================================
  // TAB NAVIGATION
  // ============================================
  onTabChange(event: any) {
    this.selectedTabIndex = event.index;
    if (event.index === 1 && this.selectedExerciseForSubmissions) {
      this.viewSubmissions(this.selectedExerciseForSubmissions);
    }
  }

  // ============================================
  // EVALUATION METHODS
  // ============================================
  getEvaluationUrl(submissionId: string, answerIndex: number): string {
    const key = `${submissionId}_${answerIndex}`;
    return this.evaluationUrls.get(key) || '';
  }

  openEvaluation(url: string) {
    if (url) {
      window.open(url, '_blank');
    }
  }

  submitEvaluation(submissionId: string, answerIndex: number, url: string) {
    if (!url || !url.trim()) {
      this.showSnackBar('Please enter a valid Google Drive URL');
      return;
    }

    if (!url.includes('drive.google.com') && !url.includes('docs.google.com')) {
      this.showSnackBar('Please enter a valid Google Drive URL');
      return;
    }

    const key = `${submissionId}_${answerIndex}`;
    this.evaluationUrls.set(key, url.trim());

    this.answerWritingService.submitEvaluation(submissionId, answerIndex, url.trim())
      .subscribe({
        next: (response) => {
          this.showSnackBar('Evaluation submitted successfully');
          if (this.selectedExerciseForSubmissions) {
            this.viewSubmissions(this.selectedExerciseForSubmissions);
          }
        },
        error: (error) => {
          this.evaluationUrls.delete(key);
          this.showSnackBar(error.error?.message || 'Failed to submit evaluation');
        }
      });
  }

  viewSubmissions(exercise: AnswerWriting) {
    this.selectedExerciseForSubmissions = exercise;
    this.submissionsLoading.set(true);
    this.submissionLanguageFilter = 'all';

    this.answerWritingService.getExerciseSubmissions(exercise._id).subscribe({
      next: (response) => {
        this.submissions.set(response.data || []);
        this.loadEvaluationStatuses(response.data || []);
        this.filterSubmissions();
        this.submissionsLoading.set(false);
      },
      error: () => {
        this.showSnackBar('Failed to load submissions');
        this.submissionsLoading.set(false);
      }
    });
  }

  loadEvaluationStatuses(submissions: any[]) {
    submissions.forEach(submission => {
      this.answerWritingService.getEvaluationStatus(submission._id).subscribe({
        next: (response) => {
          if (response.success && response.data.evaluationStatus) {
            response.data.evaluationStatus.forEach((status: any) => {
              if (status.isEvaluated && status.evaluatedPDF) {
                const key = `${submission._id}_${status.answerIndex}`;
                this.evaluationUrls.set(key, status.evaluatedPDF);
              }
            });
          }
        },
        error: () => {
          // Silently fail for evaluation status
        }
      });
    });
  }

  // ============================================
  // MODEL ANSWER METHODS
  // ============================================
  openModelAnswerModal(exercise: any) {
    this.selectedExercise = exercise;
    this.resetSuccessMessages();
    this.loadModelAnswerData(exercise._id);
    this.showModelAnswerModal = true;
  }

  closeModelAnswerModal(event?: MouseEvent) {
    if (event) {
      // Clicking overlay
      this.showModelAnswerModal = false;
    } else {
      // Close button clicked
      this.showModelAnswerModal = false;
    }
    this.selectedExercise = null;
  }

  resetSuccessMessages() {
    this.remarkSubmitted = false;
    this.englishSubmitted = false;
    this.hindiSubmitted = false;
    this.toggleSubmitted = false;
  }

  loadModelAnswerData(exerciseId: string) {
    this.answerWritingService.getModelAnswer(exerciseId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.modelAnswerData = {
            remark: response.data.remark || '',
            answerEnglish: response.data.answerEnglish || '',
            answerHindi: response.data.answerHindi || '',
            modelAnswerPDF: response.data.modelAnswerPDF || '',
            modelAnswerPDFHi: response.data.modelAnswerPDFHi || '',
            isActive: response.data.isActive !== undefined ? response.data.isActive : true
          };
        }
      },
      error: (error) => {
        console.error('Error loading model answer:', error);
        this.modelAnswerData = {
          remark: '',
          answerEnglish: '',
          answerHindi: '',
          modelAnswerPDF: '',
          modelAnswerPDFHi: '',
          isActive: true
        };
      }
    });
  }

  submitRemark() {
    if (!this.modelAnswerData.remark) {
      this.showSnackBar('Please enter a remark');
      return;
    }

    this.answerWritingService.updateModelAnswerField(
      this.selectedExercise._id, 
      'remark', 
      this.modelAnswerData.remark
    ).subscribe({
      next: (response) => {
        this.remarkSubmitted = true;
        this.showSnackBar('Remark submitted successfully');
        setTimeout(() => {
          this.remarkSubmitted = false;
        }, 3000);
      },
      error: (error) => {
        this.showSnackBar(error.error?.message || 'Failed to submit remark');
      }
    });
  }

  submitModelAnswer(language: 'english' | 'hindi') {
    const field = language === 'english' ? 'answerEnglish' : 'answerHindi';
    const value = language === 'english' ? this.modelAnswerData.answerEnglish : this.modelAnswerData.answerHindi;
    
    if (!value) {
      this.showSnackBar(`Please enter model answer in ${language}`);
      return;
    }

    this.answerWritingService.updateModelAnswerField(
      this.selectedExercise._id, 
      field, 
      value
    ).subscribe({
      next: (response) => {
        if (language === 'english') {
          this.englishSubmitted = true;
          setTimeout(() => { this.englishSubmitted = false; }, 3000);
        } else {
          this.hindiSubmitted = true;
          setTimeout(() => { this.hindiSubmitted = false; }, 3000);
        }
        this.showSnackBar(`${language} answer submitted successfully`);
      },
      error: (error) => {
        this.showSnackBar(error.error?.message || `Failed to submit ${language} answer`);
      }
    });
  }

  submitModelAnswerPDF(language: 'english' | 'hindi', url: string) {
    if (!url || !url.trim()) {
      this.showSnackBar('Please enter a valid URL');
      return;
    }

    const field = language === 'english' ? 'modelAnswerPDF' : 'modelAnswerPDFHi';
    
    this.answerWritingService.updateModelAnswerField(
      this.selectedExercise._id, 
      field, 
      url.trim()
    ).subscribe({
      next: (response) => {
        this.showSnackBar(`${language} PDF URL submitted successfully`);
        this.loadModelAnswerData(this.selectedExercise._id);
      },
      error: (error) => {
        this.showSnackBar(error.error?.message || `Failed to submit ${language} PDF URL`);
      }
    });
  }

  submitToggleStatus() {
    this.answerWritingService.updateModelAnswerField(
      this.selectedExercise._id, 
      'isActive', 
      this.modelAnswerData.isActive
    ).subscribe({
      next: (response) => {
        this.toggleSubmitted = true;
        this.showSnackBar(`Status updated to ${this.modelAnswerData.isActive ? 'Active' : 'Inactive'}`);
        setTimeout(() => {
          this.toggleSubmitted = false;
        }, 3000);
      },
      error: (error) => {
        this.showSnackBar(error.error?.message || 'Failed to update status');
      }
    });
  }

  onToggleChange() {
    console.log('Toggle changed to:', this.modelAnswerData.isActive);
  }

  submitAllModelAnswer() {
    if (!this.modelAnswerData.remark && 
        !this.modelAnswerData.answerEnglish && 
        !this.modelAnswerData.answerHindi) {
      return;
    }
    
    console.log('Submitting all model answer data:', this.modelAnswerData);
    this.showModelAnswerModal = false;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================
  private showSnackBar(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: 'custom-snackbar'
    });
  }
}
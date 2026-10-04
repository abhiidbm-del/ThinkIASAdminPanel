import { SubmissionPdfComponent } from '../../../shared/components/submission-pdf/submission-pdf.component';
// admin-live-test.component.ts
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { LanguageService } from '../../../shared/i18n/language.service';
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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

import { FormsModule } from '@angular/forms';
import { LiveTestService } from '../../../shared/services/live-test.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';

// ============================================
// INTERFACES
// ============================================
interface LiveTest {
  submissionCount?: number;
  _id: string;
  title: string;
  titleHi?: string;
  type: 'Full-Length' | 'Sectional';
  subject: string;
  description?: string;
  descriptionHi?: string;
  startDateTime: Date | string;
  endDateTime: Date | string;
  duration: number;
  isActive: boolean;
  questionPaperPDF?: string;
  questionPaperPDFHi?: string;
  questions?: Question[];
  meetLink?: string;
  instructions?: string;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Question {
  questionText: string;
  questionTextHi?: string;
  marks?: number;
}

interface FilterParams {
  search: string;
  status: string;
  fromDate?: string;
  toDate?: string;
}

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

// Google Meet Link Validator
const meetLinkValidator = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) return null;
  const url = control.value.trim();
  const pattern = /^https:\/\/meet\.google\.com\/[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3}$/i;
  if (!pattern.test(url)) {
    return { invalidMeetLink: true };
  }
  return null;
};

@Component({
  selector: 'app-admin-live-test',
  standalone: true,
  imports: [TranslatePipe,
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
    MatBadgeModule,
    MatSlideToggleModule,
    MatCheckboxModule
  ],


  templateUrl: './live-test.component.html',
  styleUrls: ['./live-test.component.css']
})
export class AdminLiveTestComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  readonly language = inject(LanguageService);
  openSubmissionFile(submissionId: string) { this.dialog.open(SubmissionPdfComponent, {data:{submissionId},width:'95vw',maxWidth:'1100px'}); }
  submissions: any[] = [];
  submissionsTitle = '';
  submissionsError = '';
  selectedTab = 0;
  submissionsLoading = false;
  loadAllSubmissions() { this.showSubmissions(); }
  showSubmissions(test?: LiveTest) {
    this.selectedTab = 1; this.submissionsLoading = true;
    this.submissionsTitle = test ? this.language.content(test.title, test.titleHi) : 'All submissions';
    this.submissions = []; this.submissionsError = '';
    this.http.get<any>(environment.apiUrl + '/live-tests/' + (test ? test._id + '/submissions' : 'admin/submissions')).subscribe({next: r => {this.submissions = r.data; if(test) test.submissionCount = r.data.length; this.submissionsLoading = false;}, error: e => {this.submissionsError = e.error?.message || 'Unable to load submissions.'; this.submissionsLoading = false;}});
  }
  // ============================================
  // VIEW CHILDREN
  // ============================================
  @ViewChild('testDialog') testDialog!: TemplateRef<any>;
  @ViewChild('tabGroup') tabGroup: any;
  @ViewChild('viewTestDialog') viewTestDialog!: TemplateRef<any>;

  // ============================================
  // INJECTED SERVICES
  // ============================================
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private confirmDialog = inject(ConfirmDialogService);
  private liveTestService = inject(LiveTestService);

  // ============================================
  // SIGNALS
  // ============================================
  tests = signal<LiveTest[]>([]);
  loading = signal(false);
  submitting = signal(false);

  // ============================================
  // PUBLIC PROPERTIES
  // ============================================
  selectedStatus = '';
  editingTest: LiveTest | null = null;
  viewingTest: LiveTest | null = null;
  fromDate: Date | null = null;
  toDate: Date | null = null;
  selectedTabIndex = 0;

  // ============================================
  // FORM CONTROLS
  // ============================================
  testForm: FormGroup;
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
    this.testForm = this.buildForm();
  }

  // ============================================
  // LIFECYCLE HOOKS
  // ============================================
  ngOnInit() {
    this.loadTests();
    this.setupSearchFilter();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // COMPUTED PROPERTIES
  // ============================================
  get calculatedDuration(): string {
    const start = this.testForm.get('startDateTime')?.value;
    const end = this.testForm.get('endDateTime')?.value;
    if (!start || !end) return '—';
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (endDate <= startDate) return '—';
    const diffMs = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`;
    }
    return `${minutes}m`;
  }

  // ============================================
  // FORM BUILDING
  // ============================================
  private buildForm(): FormGroup {
    const form = this.fb.group({
      title: ['', Validators.required],
      titleHi: [''],
      type: ['Full-Length', Validators.required],
      subject: ['GS Paper I', Validators.required],
      description: [''],
      descriptionHi: [''],
      questionPaperPDF: [''],
      questionPaperPDFHi: [''],
      questions: this.fb.array([]),
      meetLink: ['', [Validators.required, meetLinkValidator]],
      instructions: [''],
      startDateTime: ['', [Validators.required, startTimeValidator]],
      endDateTime: ['', [Validators.required]],
      order: [0],
      isActive: [true]
    });

    // Add end time validator
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
      .subscribe(() => this.loadTests());
  }

  // ============================================
  // TEST CRUD OPERATIONS
  // ============================================
  loadTests() {
    this.loading.set(true);
    
    const params: any = {
      search: this.searchControl.value || '',
      status: this.selectedStatus || ''
    };

    if (this.fromDate) {
      params.fromDate = this.fromDate.toISOString();
    }
    if (this.toDate) {
      params.toDate = this.toDate.toISOString();
    }

    this.liveTestService.getAllLiveTests(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.tests.set(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading tests:', error);
        this.snackBar.open(error.error?.message || 'Failed to load tests', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  // ============================================
  // DATE FILTERS
  // ============================================
  applyDateFilter() {
    this.loadTests();
  }

  clearDateFilter() {
    this.fromDate = null;
    this.toDate = null;
    this.loadTests();
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
    const endDateTime = new Date(now.getTime() + 3 * 60 * 60000);
    return endDateTime.toISOString().slice(0, 16);
  }

  getMinDateTime(): string {
    const now = new Date();
    const minDateTime = new Date(now.getTime() + 5 * 60000);
    return minDateTime.toISOString().slice(0, 16);
  }

  onDateTimeChange(): void {
    this.testForm.get('endDateTime')?.updateValueAndValidity();
  }

  getQuestionControls() {
    return (this.testForm.get('questions') as FormArray).controls;
  }

  addQuestion() {
    const questions = this.testForm.get('questions') as FormArray;
    questions.push(this.fb.group({
      questionText: [''],
      questionTextHi: [''],
      marks: [null]
    }));
  }

  removeQuestion(index: number) {
    const questions = this.testForm.get('questions') as FormArray;
    questions.removeAt(index);
  }

  formatDateTimeForInput(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().slice(0, 16);
  }

  // ============================================
  // CREATE/EDIT DIALOG
  // ============================================
  openCreateDialog() {
    this.editingTest = null;
    const questions = this.testForm.get('questions') as FormArray;
    while (questions.length) questions.removeAt(0);
    this.addQuestion();
    this.addQuestion();

    this.testForm.reset({
      title: '',
      titleHi: '',
      type: 'Full-Length',
      subject: 'GS Paper I',
      description: '',
      descriptionHi: '',
      questionPaperPDF: '',
      questionPaperPDFHi: '',
      meetLink: '',
      instructions: '',
      startDateTime: this.getDefaultStartDateTime(),
      endDateTime: this.getDefaultEndDateTime(),
      order: 0,
      isActive: true
    });

    this.dialogRef = this.dialog.open(this.testDialog, {
      width: '720px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'form-dialog',
      disableClose: true
    });
  }

  openEditDialog(test: LiveTest) {
    this.editingTest = test;
    const questions = this.testForm.get('questions') as FormArray;
    while (questions.length) questions.removeAt(0);

    (test.questions || []).forEach(q => {
      questions.push(this.fb.group({
        questionText: [q.questionText],
        questionTextHi: [(q as any).questionTextHi || ''],
        marks: [(q as any).marks || null]
      }));
    });

    this.testForm.patchValue({
      title: test.title,
      titleHi: (test as any).titleHi || '',
      type: test.type,
      subject: test.subject,
      description: test.description || '',
      descriptionHi: (test as any).descriptionHi || '',
      questionPaperPDF: test.questionPaperPDF || '',
      questionPaperPDFHi: (test as any).questionPaperPDFHi || '',
      meetLink: test.meetLink || '',
      instructions: (test as any).instructions || '',
      startDateTime: this.formatDateTimeForInput(test.startDateTime),
      endDateTime: this.formatDateTimeForInput(test.endDateTime),
      order: (test as any).order || 0,
      isActive: test.isActive
    });

    this.dialogRef = this.dialog.open(this.testDialog, {
      width: '720px',
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
    if (this.testForm.invalid) {
      this.testForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.editingTest ? this.updateTest() : this.createTest();
  }

  private createTest() {
    const formValue = this.testForm.value;
    const testData = {
      title: formValue.title,
      titleHi: formValue.titleHi,
      type: formValue.type,
      subject: formValue.subject,
      description: formValue.description,
      descriptionHi: formValue.descriptionHi,
      questionPaperPDF: formValue.questionPaperPDF,
      questionPaperPDFHi: formValue.questionPaperPDFHi,
      questions: formValue.questions,
      meetLink: formValue.meetLink,
      instructions: formValue.instructions,
      startDateTime: new Date(formValue.startDateTime).toISOString(),
      endDateTime: new Date(formValue.endDateTime).toISOString(),
      duration: this.calculateDuration(formValue.startDateTime, formValue.endDateTime),
      order: formValue.order || 0
    };

    this.liveTestService.createLiveTest(testData).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSnackBar(response.message || 'Live test created successfully!');
          this.loadTests();
          this.closeDialog();
          this.submitting.set(false);
        }
      },
      error: (error) => {
        console.error('Error creating test:', error);
        this.snackBar.open(error.error?.message || 'Failed to create test', 'Close', { duration: 3000 });
        this.submitting.set(false);
      }
    });
  }

  private updateTest() {
    if (!this.editingTest) return;

    const formValue = this.testForm.value;
    const testData = {
      title: formValue.title,
      titleHi: formValue.titleHi,
      type: formValue.type,
      subject: formValue.subject,
      description: formValue.description,
      descriptionHi: formValue.descriptionHi,
      questionPaperPDF: formValue.questionPaperPDF,
      questionPaperPDFHi: formValue.questionPaperPDFHi,
      questions: formValue.questions,
      meetLink: formValue.meetLink,
      instructions: formValue.instructions,
      startDateTime: new Date(formValue.startDateTime).toISOString(),
      endDateTime: new Date(formValue.endDateTime).toISOString(),
      duration: this.calculateDuration(formValue.startDateTime, formValue.endDateTime),
      order: formValue.order || 0,
      isActive: formValue.isActive
    };

    this.liveTestService.updateLiveTest(this.editingTest._id, testData).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSnackBar(response.message || 'Live test updated successfully!');
          this.loadTests();
          this.closeDialog();
          this.submitting.set(false);
        }
      },
      error: (error) => {
        console.error('Error updating test:', error);
        this.snackBar.open(error.error?.message || 'Failed to update test', 'Close', { duration: 3000 });
        this.submitting.set(false);
      }
    });
  }

  private calculateDuration(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
  }

  // ============================================
  // TEST ACTIONS
  // ============================================
  toggleTestStatus(test: LiveTest) {
    const newStatus = !test.isActive;
    
    this.liveTestService.toggleLiveTestStatus(test._id, newStatus).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSnackBar(response.message || `Test ${newStatus ? 'activated' : 'deactivated'} successfully!`);
          this.loadTests();
        }
      },
      error: (error) => {
        console.error('Error toggling status:', error);
        this.snackBar.open(error.error?.message || 'Failed to toggle status', 'Close', { duration: 3000 });
      }
    });
  }

  reopenTest(test: LiveTest) {
    const email = prompt('Student email');
    if (!email) return;
    const until = prompt('Reopen until (YYYY-MM-DDTHH:MM)', new Date(Date.now() + 2 * 3600000).toISOString().slice(0, 16));
    if (!until) return;
    this.liveTestService.reopenLiveTest(test._id, email, until).subscribe({
      next: (response: any) => this.showSnackBar(response.message || `Exam reopened for ${response.student?.email || email}`),
      error: (error) => this.snackBar.open(error.error?.message || 'Unable to reopen exam', 'Close', { duration: 4000 })
    });
  }

  deleteTest(test: LiveTest) {
    this.confirmDialog.ask({title: 'Delete live test?', message: `Delete "${test.title}"? This action cannot be undone.`}).subscribe(() => {
      this.liveTestService.deleteLiveTest(test._id).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSnackBar(response.message || 'Test deleted successfully!');
            this.loadTests();
          }
        },
        error: (error) => {
          console.error('Error deleting test:', error);
          this.snackBar.open(error.error?.message || 'Failed to delete test', 'Close', { duration: 3000 });
        }
      });
    });
  }

  // ============================================
  // VIEW TEST DIALOG
  // ============================================
  openViewDialog(test: LiveTest) {
    this.viewingTest = test;
    this.viewDialogRef = this.dialog.open(this.viewTestDialog, {
      width: '720px',
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
      this.viewingTest = null;
    }
  }

  // ============================================
  // TAB NAVIGATION
  // ============================================
  onTabChange(event: any) {
    this.selectedTabIndex = event.index;
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

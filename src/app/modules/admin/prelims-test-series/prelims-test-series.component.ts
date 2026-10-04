import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PrelimsTSService, PrelimsTestSeries, TestDate } from '../../../shared/services/prelims-ts.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { CreateTestDialogComponent } from '../../tests/create-test-dialog/create-test-dialog.component';


@Component({
  selector: 'app-prelims-test-series',
  standalone: true,
  imports: [TranslatePipe, 
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './prelims-test-series.component.html',
  styleUrls: ['./prelims-test-series.component.css']
})
export class PrelimsTestSeriesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private confirmDialog = inject(ConfirmDialogService);
  private router = inject(Router);
  private prelimsTSService = inject(PrelimsTSService);

  // Main data
  testSeries = signal<PrelimsTestSeries[]>([]);
  filteredTestSeries = signal<PrelimsTestSeries[]>([]);
  loading = signal(false);
  isFormVisible = signal(false);
  isEditMode = signal(false);
  editingId = signal<string | null>(null);
  submitting = signal(false);

  // Search and filter
  searchTerm = '';
  statusFilter = 'all';

  // Pagination
  currentPage = 1;
  totalItems = 0;
  itemsPerPage = 50;

  // Form
  testSeriesForm!: FormGroup;

  ngOnInit() {
    this.initForm();
    this.loadTestSeries();
  }

  initForm() {
    this.testSeriesForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      nameHi: [''],
      description: ['', [Validators.required, Validators.minLength(10)]],
      descriptionHi: [''],
      intro: [''], introHi: [''],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      testDates: this.fb.array([], [Validators.required, Validators.minLength(1)]),
      isActive: [true]
    }, { validators: this.dateRangeValidator });
  }

  dateRangeValidator(group: AbstractControl): ValidationErrors | null {
    const startDate = group.get('startDate')?.value;
    const endDate = group.get('endDate')?.value;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        return { invalidDateRange: true };
      }
    }
    return null;
  }

  get testDatesArray(): FormArray {
    return this.testSeriesForm.get('testDates') as FormArray;
  }

  get testDatesCount(): number {
    return this.testDatesArray.length;
  }

  get testDateControls(): AbstractControl[] {
    return this.testDatesArray.controls;
  }

  loadTestSeries() {
    this.loading.set(true);
    
    const params: any = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    if (this.searchTerm) {
      params.search = this.searchTerm;
    }

    if (this.statusFilter !== 'all') {
      params.isActive = this.statusFilter === 'active';
    }

    this.prelimsTSService.getAllTestSeries(params).subscribe({
      next: (response) => {
        this.testSeries.set(response.data);
        this.filteredTestSeries.set(response.data);
        this.totalItems = response.pagination.totalItems;
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading test series:', error);
        this.snackBar.open('Error loading test series', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  filterTestSeries() {
    let filtered = [...this.testSeries()];
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(series => 
        series.name?.toLowerCase().includes(term) ||
        series.nameHi?.toLowerCase().includes(term) ||
        series.description?.toLowerCase().includes(term) ||
        series.descriptionHi?.toLowerCase().includes(term)
      );
    }
    
    if (this.statusFilter !== 'all') {
      const isActive = this.statusFilter === 'active';
      filtered = filtered.filter(series => series.isActive === isActive);
    }
    
    this.filteredTestSeries.set(filtered);
  }

  // Form Actions
  showCreateForm() {
    this.isEditMode.set(false);
    this.editingId.set(null);
    this.resetForm();
    this.isFormVisible.set(true);
    // Add one empty test date
    this.addTestDate();
    setTimeout(() => {
      document.querySelector('.form-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  showEditForm(series: PrelimsTestSeries) {
    this.isEditMode.set(true);
    this.editingId.set(series._id || null);
    this.patchFormData(series);
    this.isFormVisible.set(true);
    setTimeout(() => {
      document.querySelector('.form-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  hideForm() {
    this.isFormVisible.set(false);
    this.isEditMode.set(false);
    this.editingId.set(null);
    this.resetForm();
  }

  resetForm() {
    this.testSeriesForm.reset({
      name: '',
      nameHi: '',
      description: '',
      descriptionHi: '',
      intro: '', introHi: '',
      startDate: '',
      endDate: '',
      isActive: true
    });
    while (this.testDatesArray.length) {
      this.testDatesArray.removeAt(0);
    }
  }

  patchFormData(series: PrelimsTestSeries) {
    this.testSeriesForm.patchValue({
      name: series.name,
      nameHi: series.nameHi || '',
      description: series.description,
      descriptionHi: series.descriptionHi || '',
      intro: series.intro || '', introHi: series.introHi || '',
      startDate: series.startDate,
      endDate: series.endDate,
      isActive: series.isActive
    });

    while (this.testDatesArray.length) {
      this.testDatesArray.removeAt(0);
    }
    
    if (series.testDates && series.testDates.length > 0) {
      series.testDates.forEach(testDate => {
        this.addTestDate(testDate);
      });
    }
  }

  addTestDate(testDate?: TestDate) {
    const dateGroup = this.fb.group({
      date: [testDate?.date || '', Validators.required],
      time: [testDate?.time || '09:00'],
      duration: [testDate?.duration || 120, [Validators.required, Validators.min(30)]]
    });
    this.testDatesArray.push(dateGroup);
  }

  removeTestDate(index: number) {
    if (this.testDatesArray.length <= 1) {
      this.snackBar.open('You need at least one test date', 'Close', { duration: 3000 });
      return;
    }
    this.testDatesArray.removeAt(index);
  }

  clearAllTestDates() {
    if (this.testDatesArray.length === 0) return;
    if (confirm('Are you sure you want to remove all test dates?')) {
      while (this.testDatesArray.length) {
        this.testDatesArray.removeAt(0);
      }
      this.addTestDate();
    }
  }

  onStartDateChange() {
    this.testSeriesForm.get('endDate')?.updateValueAndValidity();
  }

  getMinDateForTestDates(): Date {
    const startDate = this.testSeriesForm.get('startDate')?.value;
    if (startDate) {
      return new Date(startDate);
    }
    return new Date();
  }

  getMaxDateForTestDates(): Date {
    const endDate = this.testSeriesForm.get('endDate')?.value;
    if (endDate) {
      return new Date(endDate);
    }
    const max = new Date();
    max.setFullYear(max.getFullYear() + 1);
    return max;
  }

  addAllDatesBetweenRange() {
    const startDate = this.testSeriesForm.get('startDate')?.value;
    const endDate = this.testSeriesForm.get('endDate')?.value;
    
    if (!startDate || !endDate) {
      this.snackBar.open('Please select start and end dates first', 'Close', { duration: 3000 });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) {
      this.snackBar.open('End date must be after start date', 'Close', { duration: 3000 });
      return;
    }

    while (this.testDatesArray.length) {
      this.testDatesArray.removeAt(0);
    }

    let currentDate = new Date(start);
    let count = 0;
    while (currentDate <= end) {
      this.addTestDate({
        date: new Date(currentDate),
        time: '09:00',
        duration: 120
      });
      count++;
      currentDate.setDate(currentDate.getDate() + 7);
    }

    this.snackBar.open(`${count} test dates added successfully!`, 'Close', { duration: 3000 });
  }

  addWeeklyTestDates() {
    const startDate = this.testSeriesForm.get('startDate')?.value;
    const endDate = this.testSeriesForm.get('endDate')?.value;
    
    if (!startDate || !endDate) {
      this.snackBar.open('Please select start and end dates first', 'Close', { duration: 3000 });
      return;
    }

    const dayOfWeek = prompt('Enter day of week (0=Sunday, 1=Monday, ..., 6=Saturday):', '0');
    if (dayOfWeek === null) return;
    
    const day = parseInt(dayOfWeek);
    if (isNaN(day) || day < 0 || day > 6) {
      this.snackBar.open('Invalid day. Please enter a number between 0 and 6.', 'Close', { duration: 3000 });
      return;
    }

    while (this.testDatesArray.length) {
      this.testDatesArray.removeAt(0);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    let currentDate = new Date(start);
    
    while (currentDate.getDay() !== day) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    let count = 0;
    while (currentDate <= end) {
      this.addTestDate({
        date: new Date(currentDate),
        time: '09:00',
        duration: 120
      });
      count++;
      currentDate.setDate(currentDate.getDate() + 7);
    }

    if (count === 0) {
      this.snackBar.open('No dates found for the selected day in the range', 'Close', { duration: 3000 });
    } else {
      this.snackBar.open(`${count} weekly test dates added successfully!`, 'Close', { duration: 3000 });
    }
  }

  onSubmit() {
    if (this.testSeriesForm.invalid) {
      this.testSeriesForm.markAllAsTouched();
      this.snackBar.open('Please fix all errors before submitting', 'Close', { duration: 3000 });
      return;
    }

    this.submitting.set(true);
    const formValue = this.testSeriesForm.value;
    
    const testSeriesData: PrelimsTestSeries = {
      name: formValue.name,
      nameHi: formValue.nameHi || '',
      description: formValue.description,
      descriptionHi: formValue.descriptionHi || '',
      intro: formValue.intro || '', introHi: formValue.introHi || '',
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      testDates: formValue.testDates.map((td: any) => ({
        date: td.date,
        time: td.time || '09:00',
        duration: td.duration || 120
      })),
      isActive: formValue.isActive
    };

    if (this.isEditMode() && this.editingId()) {
      // Update existing
      this.prelimsTSService.updateTestSeries(this.editingId()!, testSeriesData).subscribe({
        next: (response) => {
          this.snackBar.open('Test series updated successfully!', 'Close', { duration: 3000 });
          this.loadTestSeries();
          this.hideForm();
          this.submitting.set(false);
        },
        error: (error) => {
          console.error('Error updating test series:', error);
          this.snackBar.open('Error updating test series', 'Close', { duration: 3000 });
          this.submitting.set(false);
        }
      });
    } else {
      // Create new
      this.prelimsTSService.createTestSeries(testSeriesData).subscribe({
        next: (response) => {
          this.snackBar.open('Test series created successfully!', 'Close', { duration: 3000 });
          this.loadTestSeries();
          this.hideForm();
          this.submitting.set(false);
        },
        error: (error) => {
          console.error('Error creating test series:', error);
          this.snackBar.open('Error creating test series', 'Close', { duration: 3000 });
          this.submitting.set(false);
        }
      });
    }
  }

  // CRUD Operations
  deleteTestSeries(id: string) {
    this.confirmDialog.ask({title: 'Delete test series?', message: 'This action cannot be undone.'}).subscribe(() => {
      this.prelimsTSService.deleteTestSeries(id).subscribe({
        next: () => {
          this.snackBar.open('Test series deleted successfully!', 'Close', { duration: 3000 });
          this.loadTestSeries();
        },
        error: (error) => {
          console.error('Error deleting test series:', error);
          this.snackBar.open('Error deleting test series', 'Close', { duration: 3000 });
        }
      });
    });
  }

  toggleStatus(testSeries: PrelimsTestSeries) {
    const newStatus = !testSeries.isActive;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (confirm(`Are you sure you want to ${action} this test series?`)) {
      this.prelimsTSService.toggleStatus(testSeries._id!).subscribe({
        next: () => {
          this.snackBar.open(`Test series ${action}d successfully!`, 'Close', { duration: 3000 });
          this.loadTestSeries();
        },
        error: (error) => {
          console.error('Error toggling status:', error);
          this.snackBar.open(`Error ${action}ing test series`, 'Close', { duration: 3000 });
        }
      });
    }
  }

  viewTestSeries(id: string) {
    const series = this.testSeries().find(item => item._id === id);
    if (series) this.showEditForm(series);
  }

  // Helpers
  formatDate(date: Date | string): string {
    if (!date) return '—';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '—';
    }
  }

  formatDateRange(start: Date | string, end: Date | string): string {
    return `${this.formatDate(start)} - ${this.formatDate(end)}`;
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }

  trackByIndex(index: number): number {
    return index;
  }

  slotStart(slot: TestDate) {
    const date = new Date(slot.date);
    const [hours, minutes] = String(slot.time || '09:00').split(':').map(Number);
    date.setHours(hours || 0, minutes || 0, 0, 0);
    return date;
  }

  openPaperDialog(series: PrelimsTestSeries, slot: TestDate) {
    const start = this.slotStart(slot);
    const dialogRef = this.dialog.open(CreateTestDialogComponent, {
      width: '90vw', maxWidth: '1200px', height: '90vh', maxHeight: 'calc(100vh - 24px)',
      panelClass: 'create-test-dialog-panel', autoFocus: false,
      data: {
        test: slot.exam || null,
        seriesId: series._id,
        seriesKind: 'pre',
        slotId: slot._id || (slot as any).id,
        startTime: start,
        endTime: new Date(start.getTime() + (slot.duration || 120) * 60000),
        duration: slot.duration || 120,
        title: `${series.name} - ${this.formatDate(slot.date)}`
      }
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.loadTestSeries(); });
  }

  openReopen(series: PrelimsTestSeries, exam: any) {
    const email = prompt('Student email');
    if (!email) return;
    const until = prompt('Reopen until (YYYY-MM-DDTHH:MM)', new Date(Date.now() + 2 * 3600000).toISOString().slice(0, 16));
    if (!until) return;
    this.prelimsTSService.reopenExam(series._id!, exam._id, email, until).subscribe({
      next: () => this.snackBar.open('Exam reopened for the student', 'Close', { duration: 3000 }),
      error: error => this.snackBar.open(error.error?.message || 'Unable to reopen exam', 'Close', { duration: 4000 })
    });
  }
}
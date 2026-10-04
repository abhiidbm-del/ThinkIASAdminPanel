import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { Component, inject, signal, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { MentorshipService, MentorshipProgram, CreateMentorshipProgramDto, UpdateMentorshipProgramDto } from '../../../shared/services/mentorship.service';

@Component({
  selector: 'app-admin-mentorship',
  standalone: true,
  imports: [TranslatePipe, 
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './admin-mentorship.component.html',
  styleUrl: './admin-mentorship.component.css'
})
export class AdminMentorshipComponent implements OnInit {
  @ViewChild('programDialog') programDialog!: TemplateRef<any>;

  private mentorshipService = inject(MentorshipService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  programs = signal<MentorshipProgram[]>([]);
  loading = signal(false);
  submitting = signal(false);
  
  selectedStatus = '';
  editingProgram: MentorshipProgram | null = null;
  dialogRef!: MatDialogRef<any>;

  private http = inject(HttpClient);
  relatedPrograms: any[] = [];
  relatedBatches: any[] = [];
  loadBatches(programId: string, reset = true) {
    this.relatedBatches = [];
    if (reset) this.programForm.patchValue({batchId: null});
    if (!programId) return;
    this.http.get<any>(`${environment.apiUrl}/programs/${programId}/batches`).subscribe({next: r => {
      if (this.programForm.value.programId === programId) this.relatedBatches = r.data || [];
    }, error: () => this.showSnackBar('Batches could not be loaded.')});
  }
  programForm: FormGroup;
  searchControl = new FormControl('');

  constructor() {
    this.programForm = this.fb.group({
      nameHindi: [''], descriptionHindi: [''], durationHindi: [''], programId: [null], batchId: [null],
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      duration: ['', [Validators.required]],
      startDate: ['', [Validators.required]],
      medium: ['', [Validators.required]],
      fee: [0, [Validators.required, Validators.min(0)]],
      brochureHindi: ['', [Validators.required]],
      brochureEnglish: ['', [Validators.required]],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.http.get<any>(`${environment.apiUrl}/programs?activeOnly=true`).subscribe({next: r => this.relatedPrograms = r.data || [], error: () => this.showSnackBar('Programs could not be loaded.')});
    this.loadPrograms();
    
    // Setup search with debounce
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.loadPrograms();
    });
  }

  loadPrograms() {
    this.loading.set(true);
    this.mentorshipService.getAllProgramsAdmin(
      this.searchControl.value || '', 
      this.selectedStatus
    ).subscribe({
      next: (response) => {
        this.programs.set(response.data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading programs:', error);
        this.showSnackBar('Failed to load programs');
        this.loading.set(false);
      }
    });
  }

  openCreateDialog() {
    this.editingProgram = null;
    this.programForm.reset({
      name: '',
      description: '',
      duration: '',
      startDate: '',
      medium: '',
      fee: 0,
      brochureHindi: '',
      brochureEnglish: '',
      isActive: true
    });

    this.dialogRef = this.dialog.open(this.programDialog, {
      width: '1000px',
      disableClose: true
    });
  }

  openEditDialog(program: MentorshipProgram) {
    this.editingProgram = program;
    this.programForm.patchValue({nameHindi: program.nameHindi || '', descriptionHindi: program.descriptionHindi || '', durationHindi: program.durationHindi || '', programId: program.programId?._id || program.programId || null, batchId: program.batchId?._id || program.batchId || null});
    this.loadBatches(this.programForm.value.programId, false);
    this.programForm.patchValue({
      name: program.name,
      description: program.description,
      duration: program.duration,
      startDate: program.startDate,
      medium: program.medium,
      fee: program.fee,
      brochureHindi: program.brochureHindi,
      brochureEnglish: program.brochureEnglish,
      isActive: program.isActive
    });

    this.dialogRef = this.dialog.open(this.programDialog, {
      width: '1000px',
      disableClose: true
    });
  }

  closeDialog() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  onSubmit() {
    if (this.programForm.invalid) return;

    this.submitting.set(true);
    
    if (this.editingProgram) {
      this.updateProgram();
    } else {
      this.createProgram();
    }
  }

  createProgram() {
    const programData: CreateMentorshipProgramDto = {
      nameHindi: this.programForm.value.nameHindi, descriptionHindi: this.programForm.value.descriptionHindi, durationHindi: this.programForm.value.durationHindi, programId: this.programForm.value.programId || null, batchId: this.programForm.value.batchId || null,
      name: this.programForm.value.name,
      description: this.programForm.value.description,
      duration: this.programForm.value.duration,
      startDate: new Date(this.programForm.value.startDate).toISOString(),
      medium: this.programForm.value.medium,
      fee: this.programForm.value.fee,
      brochureHindi: this.programForm.value.brochureHindi,
      brochureEnglish: this.programForm.value.brochureEnglish
    };

    this.mentorshipService.createProgram(programData).subscribe({
      next: (response) => {
        this.showSnackBar(response.message);
        this.loadPrograms();
        this.closeDialog();
        this.submitting.set(false);
      },
      error: (error) => {
        console.error('Error creating program:', error);
        this.showSnackBar(error.error?.message || 'Failed to create program');
        this.submitting.set(false);
      }
    });
  }

  updateProgram() {
    if (!this.editingProgram) return;

    const programData: UpdateMentorshipProgramDto = {
      nameHindi: this.programForm.value.nameHindi, descriptionHindi: this.programForm.value.descriptionHindi, durationHindi: this.programForm.value.durationHindi, programId: this.programForm.value.programId || null, batchId: this.programForm.value.batchId || null,
      name: this.programForm.value.name,
      description: this.programForm.value.description,
      duration: this.programForm.value.duration,
      startDate: new Date(this.programForm.value.startDate).toISOString(),
      medium: this.programForm.value.medium,
      fee: this.programForm.value.fee,
      brochureHindi: this.programForm.value.brochureHindi,
      brochureEnglish: this.programForm.value.brochureEnglish,
      isActive: this.programForm.value.isActive
    };

    this.mentorshipService.updateProgram(this.editingProgram._id, programData).subscribe({
      next: (response) => {
        this.showSnackBar(response.message);
        this.loadPrograms();
        this.closeDialog();
        this.submitting.set(false);
      },
      error: (error) => {
        console.error('Error updating program:', error);
        this.showSnackBar(error.error?.message || 'Failed to update program');
        this.submitting.set(false);
      }
    });
  }

  toggleProgramStatus(program: MentorshipProgram) {
    const action = program.isActive ? 'deactivate' : 'activate';
    
    if (confirm(`Are you sure you want to ${action} this program?`)) {
      this.mentorshipService.toggleProgramStatus(program._id).subscribe({
        next: (response) => {
          this.showSnackBar(response.message);
          this.loadPrograms();
        },
        error: (error) => {
          console.error('Error toggling program status:', error);
          this.showSnackBar(error.error?.message || 'Failed to update program status');
        }
      });
    }
  }

  deleteProgram(program: MentorshipProgram) {
    if (confirm('Are you sure you want to delete this program? This action cannot be undone.')) {
      this.mentorshipService.deleteProgram(program._id).subscribe({
        next: (response) => {
          this.showSnackBar(response.message);
          this.loadPrograms();
        },
        error: (error) => {
          console.error('Error deleting program:', error);
          this.showSnackBar(error.error?.message || 'Failed to delete program');
        }
      });
    }
  }

  private showSnackBar(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
}
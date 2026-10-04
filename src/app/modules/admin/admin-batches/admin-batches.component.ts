import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { Component, inject, signal, OnInit, Input, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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

import { BatchService, Batch, CreateBatchDto, UpdateBatchDto } from '../../../shared/services/batch.service';

@Component({
  selector: 'app-admin-batches',
  standalone: true,
  imports: [TranslatePipe, 
    CommonModule,
    ReactiveFormsModule,
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
  ],
  template: `
    <div class="batches-admin-container">
      <div class="header">
        <div class="header-info">
          <h3>
            <i class="fas fa-layer-group"></i>
            Batches - {{ programName }}
          </h3>
        </div>
        
        <div class="admin-actions">
          <button mat-raised-button color="primary" (click)="openCreateDialog()">
            <i class="fas fa-plus"></i>
            Add Batch
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-row" *ngIf="batches().length > 0">
        <mat-form-field appearance="outline" class="status-field">
          <mat-label>{{ 'Filter by Status' | t }}</mat-label>
          <mat-select [(value)]="selectedStatus" (selectionChange)="loadBatches()">
            <mat-option value="">All Batches</mat-option>
            <mat-option value="active">{{ 'Active Only' | t }}</mat-option>
            <mat-option value="inactive">{{ 'Inactive Only' | t }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading">
        <div class="spinner"></div>
        <p>{{ 'Loading batches...' | t }}</p>
      </div>

      <!-- Batches List -->
      <div *ngIf="!loading()">
        <div *ngIf="batches().length === 0" class="no-items">
          <mat-card>
            <mat-card-content>
              <i class="fas fa-inbox"></i>
              <p>No batches found for this program.</p>
              <button mat-button color="primary" (click)="openCreateDialog()">
                Create First Batch
              </button>
            </mat-card-content>
          </mat-card>
        </div>

        <div *ngIf="batches().length > 0" class="batches-table-container">
          <table class="batches-table">
            <thead>
              <tr>
                <!-- <th>Order</th> -->
                <th>Batch Name</th>
                <th>{{ 'Start Date' | t }}</th>
                <th>End Date</th>
                <th>{{ 'Duration' | t }}</th>
                <th>Brochures</th>
                <th>{{ 'Status' | t }}</th>
                <th>{{ 'Actions' | t }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let batch of batches()">
                <!-- <td class="order-cell">{{ batch.order || 0 }}</td> -->
                <td class="name-cell">{{ batch.batchName }}</td>
                <td>{{ batch.startDate | date:'mediumDate' }}</td>
                <td>{{ batch.endDate | date:'mediumDate' }}</td>
                <td>{{ batch.duration }}</td>
                <td class="brochure-cell">
                  <a *ngIf="batch.brochureHindi" [href]="batch.brochureHindi" target="_blank" mat-button color="accent" size="small">
                    <i class="fas fa-file-pdf"></i> हिंदी
                  </a>
                  <a *ngIf="batch.brochureEnglish" [href]="batch.brochureEnglish" target="_blank" mat-button color="accent" size="small">
                    <i class="fas fa-file-pdf"></i> English
                  </a>
                  <span *ngIf="!batch.brochureHindi && !batch.brochureEnglish" class="no-brochure">No brochures</span>
                </td>
                <td>
                  <span class="status-badge" [class.active]="batch.isActive" [class.inactive]="!batch.isActive">
                    {{ (batch.isActive ? 'Active' : 'Inactive') | t }}
                  </span>
                </td>
                <td class="actions-cell">
                  <button mat-icon-button color="primary" (click)="openEditDialog(batch)" matTooltip="Edit batch">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button mat-icon-button [color]="batch.isActive ? 'warn' : 'primary'" 
                          (click)="toggleBatchStatus(batch)"
                          matTooltip="{{ batch.isActive ? 'Deactivate' : 'Activate' }}">
                    <i class="fas" [class.fa-eye-slash]="batch.isActive" [class.fa-eye]="!batch.isActive"></i>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteBatch(batch)" matTooltip="Delete batch">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <ng-template #batchDialog>
      <h2 mat-dialog-title>{{ editingBatch ? 'Edit' : 'Create' }} Batch</h2>

      <form [formGroup]="batchForm" (ngSubmit)="onSubmit()"><mat-form-field><mat-label>{{ 'Batch name (Hindi)' | t }}</mat-label><input matInput formControlName="batchNameHindi"></mat-form-field><mat-form-field><mat-label>{{ 'Duration (Hindi)' | t }}</mat-label><input matInput formControlName="durationHindi"></mat-form-field>
        <mat-dialog-content class="dialog-content">
          <div class="form-grid">
            <!-- Batch Name -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Batch Name *</mat-label>
              <input matInput formControlName="batchName" placeholder="e.g., Morning Batch, Weekend Batch">
              <mat-error *ngIf="batchForm.get('batchName')?.hasError('required')">
                Batch name is required
              </mat-error>
            </mat-form-field>

            <!-- Date Range -->
            <div class="date-range-group">
              <mat-form-field appearance="outline">
                <mat-label>{{ 'Start Date *' | t }}</mat-label>
                <input matInput [matDatepicker]="startPicker" formControlName="startDate">
                <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
                <mat-error *ngIf="batchForm.get('startDate')?.hasError('required')">{{ 'Start date is required' | t }}</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>{{ 'End Date *' | t }}</mat-label>
                <input matInput [matDatepicker]="endPicker" formControlName="endDate">
                <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
                <mat-error *ngIf="batchForm.get('endDate')?.hasError('required')">{{ 'End date is required' | t }}</mat-error>
              </mat-form-field>
            </div>

            <!-- Calculated Duration Preview -->
            <div *ngIf="batchForm.get('startDate')?.value && batchForm.get('endDate')?.value" class="duration-preview">
              <i class="fas fa-hourglass-half"></i>
              Duration: {{ calculateDuration() }}
            </div>

            <!-- Brochure Links -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'Hindi Brochure Link' | t }}</mat-label>
              <input matInput formControlName="brochureHindi" placeholder="https://example.com/brochure-hindi.pdf">
              <mat-hint>Link to Hindi brochure PDF</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'English Brochure Link' | t }}</mat-label>
              <input matInput formControlName="brochureEnglish" placeholder="https://example.com/brochure-english.pdf">
              <mat-hint>Link to English brochure PDF</mat-hint>
            </mat-form-field>

            <!-- Order -->
            <mat-form-field appearance="outline">
              <mat-label>Display Order</mat-label>
              <input matInput type="number" formControlName="order" placeholder="Higher number = Higher priority">
              <mat-hint>Order for display (higher = higher priority)</mat-hint>
            </mat-form-field>

            <!-- Active Status (for edit only) -->
            <mat-checkbox *ngIf="editingBatch" formControlName="isActive" class="full-width">
              Active Batch
            </mat-checkbox>
          </div>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
          <button mat-button type="button" (click)="closeDialog()">{{ 'Cancel' | t }}</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="!batchForm.valid || submitting()">
            {{ submitting() ? 'Saving...' : (editingBatch ? 'Update' : 'Create') }}
          </button>
        </mat-dialog-actions>
      </form>
    </ng-template>
  `,
  styleUrls: ['./admin-batches.component.css']
})
export class AdminBatchesComponent implements OnInit {
  @ViewChild('batchDialog') batchDialog!: TemplateRef<any>;
  @Input() programId: string = '';
  @Input() programName: string = '';

  private batchService = inject(BatchService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  batches = signal<Batch[]>([]);
  loading = signal(false);
  submitting = signal(false);
  
  selectedStatus = '';
  editingBatch: Batch | null = null;
  dialogRef!: MatDialogRef<any>;

  batchForm: FormGroup;

  constructor() {
    this.batchForm = this.fb.group({
      batchNameHindi: [''], durationHindi: [''],
      batchName: ['', [Validators.required]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      brochureHindi: [''],
      brochureEnglish: [''],
      order: [0],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.loadBatches();
  }

  loadBatches() {
    if (!this.programId) return;
    
    this.loading.set(true);
    this.batchService.getAllBatchesAdmin(this.programId, this.selectedStatus).subscribe({
      next: (response) => {
        this.batches.set(response.data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading batches:', error);
        this.showSnackBar('Failed to load batches');
        this.loading.set(false);
      }
    });
  }

  openCreateDialog() {
    this.editingBatch = null;
    this.batchForm.reset({
      batchName: '',
      startDate: '',
      endDate: '',
      brochureHindi: '',
      brochureEnglish: '',
      order: 0,
      isActive: true
    });

    this.dialogRef = this.dialog.open(this.batchDialog, {
      width: '600px',
      disableClose: true
    });
  }

  openEditDialog(batch: Batch) {
    this.editingBatch = batch;
    this.batchForm.patchValue({
      batchName: batch.batchName, batchNameHindi: batch.batchNameHindi, durationHindi: batch.durationHindi,
      startDate: new Date(batch.startDate),
      endDate: new Date(batch.endDate),
      brochureHindi: batch.brochureHindi || '',
      brochureEnglish: batch.brochureEnglish || '',
      order: batch.order,
      isActive: batch.isActive
    });

    this.dialogRef = this.dialog.open(this.batchDialog, {
      width: '600px',
      disableClose: true
    });
  }

  closeDialog() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  onSubmit() {
    if (this.batchForm.invalid) return;

    this.submitting.set(true);
    
    if (this.editingBatch) {
      this.updateBatch();
    } else {
      this.createBatch();
    }
  }

  createBatch() {
    const batchData: CreateBatchDto = {
      batchName: this.batchForm.value.batchName, batchNameHindi: this.batchForm.value.batchNameHindi, durationHindi: this.batchForm.value.durationHindi,
      startDate: new Date(this.batchForm.value.startDate).toISOString(),
      endDate: new Date(this.batchForm.value.endDate).toISOString(),
      brochureHindi: this.batchForm.value.brochureHindi,
      brochureEnglish: this.batchForm.value.brochureEnglish,
      order: this.batchForm.value.order
    };

    this.batchService.createBatch(this.programId, batchData).subscribe({
      next: (response) => {
        this.showSnackBar(response.message);
        this.loadBatches();
        this.closeDialog();
        this.submitting.set(false);
      },
      error: (error) => {
        console.error('Error creating batch:', error);
        this.showSnackBar(error.error?.message || 'Failed to create batch');
        this.submitting.set(false);
      }
    });
  }

  updateBatch() {
    if (!this.editingBatch) return;

    const batchData: UpdateBatchDto = {
      batchName: this.batchForm.value.batchName, batchNameHindi: this.batchForm.value.batchNameHindi, durationHindi: this.batchForm.value.durationHindi,
      startDate: new Date(this.batchForm.value.startDate).toISOString(),
      endDate: new Date(this.batchForm.value.endDate).toISOString(),
      brochureHindi: this.batchForm.value.brochureHindi,
      brochureEnglish: this.batchForm.value.brochureEnglish,
      order: this.batchForm.value.order,
      isActive: this.batchForm.value.isActive
    };

    this.batchService.updateBatch(this.editingBatch._id, batchData).subscribe({
      next: (response) => {
        this.showSnackBar(response.message);
        this.loadBatches();
        this.closeDialog();
        this.submitting.set(false);
      },
      error: (error) => {
        console.error('Error updating batch:', error);
        this.showSnackBar(error.error?.message || 'Failed to update batch');
        this.submitting.set(false);
      }
    });
  }

  toggleBatchStatus(batch: Batch) {
    this.batchService.toggleBatchStatus(batch._id).subscribe({
      next: (response) => {
        this.showSnackBar(response.message);
        this.loadBatches();
      },
      error: (error) => {
        console.error('Error toggling batch status:', error);
        this.showSnackBar(error.error?.message || 'Failed to update batch status');
      }
    });
  }

  deleteBatch(batch: Batch) {
    if (confirm('Are you sure you want to delete this batch? This action cannot be undone.')) {
      this.batchService.deleteBatch(batch._id).subscribe({
        next: (response) => {
          this.showSnackBar(response.message);
          this.loadBatches();
        },
        error: (error) => {
          console.error('Error deleting batch:', error);
          this.showSnackBar(error.error?.message || 'Failed to delete batch');
        }
      });
    }
  }

  calculateDuration(): string {
    const start = this.batchForm.get('startDate')?.value;
    const end = this.batchForm.get('endDate')?.value;
    
    if (!start || !end) return '';
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffMonths / 12);
    
    if (diffYears > 0) {
      const remainingMonths = diffMonths % 12;
      if (remainingMonths > 0) {
        return `${diffYears} year${diffYears > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
      }
      return `${diffYears} year${diffYears > 1 ? 's' : ''}`;
    } else if (diffMonths > 0) {
      const remainingDays = diffDays % 30;
      if (remainingDays > 0) {
        return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
      }
      return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
    }
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  }

  private showSnackBar(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
}
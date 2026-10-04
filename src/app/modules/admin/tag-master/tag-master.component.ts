import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TagService } from '../../../shared/services/tag.service';
import { Tag } from '../../../core/models/tag.model';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-tag-master',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TitleCasePipe
  ],
  templateUrl: './tag-master.component.html',
  styleUrls: ['./tag-master.component.css']
})
export class TagMasterComponent implements OnInit {
  @ViewChild('tagDialogTemplate') tagDialogTemplate!: TemplateRef<any>;
  
  tagForm: FormGroup;
  tags: Tag[] = [];
  isLoading = false;
  isSubmitting = false;
  message: string = '';
  messageType: 'success' | 'error' = 'success';
  editingTag: Tag | null = null;
  
  categorySuggestions: string[] = [];
  private dialogRef: MatDialogRef<any> | null = null;

  constructor(
    private fb: FormBuilder,
    private tagService: TagService,
    private dialog: MatDialog
    , private confirmDialog: ConfirmDialogService
  ) {
    this.tagForm = this.createForm();
  }

  ngOnInit() {
    this.loadTags();
    this.loadCategories();
  }

  createForm(): FormGroup {
    return this.fb.group({
      category: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      subCategory: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      topic: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]]
    });
  }

  loadTags(): void {
    this.isLoading = true;
    this.tagService.getTags().subscribe({
      next: (tags) => {
        this.tags = tags;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading tags:', error);
        this.showMessage('Error loading tags', 'error');
        this.isLoading = false;
      }
    });
  }

  loadCategories(): void {
    this.tagService.getCategories().subscribe({
      next: (categories) => {
        this.categorySuggestions = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  openCreateDialog(): void {
    this.editingTag = null;
    this.tagForm.reset();
    this.openDialog();
  }

  editTag(tag: Tag): void {
    this.editingTag = tag;
    this.tagForm.patchValue({
      category: tag.category,
      subCategory: tag.subCategory,
      topic: tag.topic
    });
    this.openDialog();
  }

  openDialog(): void {
    this.dialogRef = this.dialog.open(this.tagDialogTemplate, {
      width: '500px',
      maxWidth: '90vw',
      panelClass: 'tag-dialog-panel',
      autoFocus: false
    });

    this.dialogRef.afterClosed().subscribe(() => {
      this.resetForm();
    });
  }

  closeDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  onSubmit(): void {
    if (this.tagForm.valid) {
      this.isSubmitting = true;
      const formData = this.tagForm.value;

      if (this.editingTag) {
        // Update existing tag
        this.tagService.updateTag(this.editingTag._id, formData).subscribe({
          next: (response) => {
            this.showMessage('Tag updated successfully!', 'success');
            this.loadTags();
            this.closeDialog();
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error updating tag:', error);
            this.showMessage(error.error?.message || 'Error updating tag', 'error');
            this.isSubmitting = false;
          }
        });
      } else {
        // Create new tag
        this.tagService.createTag(formData).subscribe({
          next: (response) => {
            this.showMessage('Tag created successfully!', 'success');
            this.loadTags();
            this.loadCategories(); // Refresh categories
            this.closeDialog();
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error creating tag:', error);
            this.showMessage(error.error?.message || 'Error creating tag', 'error');
            this.isSubmitting = false;
          }
        });
      }
    } else {
      this.markFormGroupTouched();
      this.showMessage('Please fill all fields correctly', 'error');
    }
  }

  deleteTag(tag: Tag): void {
    this.confirmDialog.ask({title: 'Delete tag?', message: `Are you sure you want to delete "${tag.tag}"? This action cannot be undone.`}).subscribe(() => {
      this.tagService.deleteTag(tag._id).subscribe({
        next: (response) => {
          this.showMessage('Tag deleted successfully!', 'success');
          this.loadTags();
          this.loadCategories(); // Refresh categories
        },
        error: (error) => {
          console.error('Error deleting tag:', error);
          this.showMessage('Error deleting tag', 'error');
        }
      });
    });
  }

  resetForm(): void {
    this.tagForm.reset();
    this.editingTag = null;
  }

  markFormGroupTouched(): void {
    Object.keys(this.tagForm.controls).forEach(key => {
      this.tagForm.get(key)?.markAsTouched();
    });
  }

  showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.tagForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}
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
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

import { DemoTestService } from '../../../shared/services/demo-test.service';
import { DemoTestDialogComponent } from './demo-test-dialog/demo-test-dialog.component';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-demo-tests',
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
    ReactiveFormsModule,
    CKEditorModule
  ],
  templateUrl: './demo-tests.component.html',
  styleUrl: './demo-tests.component.css'
})
export class DemoTestsComponent implements OnInit {
  private demoTestService = inject(DemoTestService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private confirmDialog = inject(ConfirmDialogService);

  tests = signal<any[]>([]);
  filteredTests = signal<any[]>([]);
  loading = signal(false);
  
  // Search and filter
  searchTerm = '';
  statusFilter = 'all';
  
  // Intro modal
  showIntroModal = false;
  selectedTest: any = null;
  introContent = new FormControl('');
  updatingIntro = false;
  
  // CKEditor
  public Editor = ClassicEditor;
  public editorConfig = {
    toolbar: [
      'heading', '|',
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'bulletedList', 'numberedList', '|',
      'insertTable', 'blockQuote', '|',
      'undo', 'redo'
    ],
    table: {
      contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
    },
    height: '300px'
  };

  ngOnInit() {
    this.loadDemoTests();
  }

  loadDemoTests() {
    this.loading.set(true);
    this.demoTestService.getDemoTests().subscribe({
      next: (tests) => {
        this.tests.set(tests);
        this.filterTests();
        this.loading.set(false);
      },
      error: (error) => {
        this.snackBar.open('Error loading demo tests', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  filterTests() {
    let filtered = [...this.tests()];
    
    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(test => 
        test.title?.toLowerCase().includes(term) ||
        test.description?.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (this.statusFilter !== 'all') {
      const isActive = this.statusFilter === 'active';
      filtered = filtered.filter(test => test.isActive === isActive);
    }
    
    this.filteredTests.set(filtered);
  }

  openCreateDemoTestDialog(test?: any) {
    const dialogRef = this.dialog.open(DemoTestDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      maxHeight: '800px',
      panelClass: 'demo-test-dialog-panel',
      autoFocus: false,
      data: { test: test || null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDemoTests();
      }
    });
  }

  editDemoTest(test: any) {
    this.openCreateDemoTestDialog(test);
  }

  deleteDemoTest(testId: string) {
    this.confirmDialog.ask({title: 'Delete demo test?', message: 'This will also delete all associated results. This action cannot be undone.'}).subscribe(() => {
      this.demoTestService.deleteDemoTest(testId).subscribe({
        next: () => {
          this.snackBar.open('Demo test deleted successfully', 'Close', { duration: 3000 });
          this.loadDemoTests();
        },
        error: (error) => {
          this.snackBar.open('Error deleting demo test: ' + error.error?.message, 'Close', { duration: 3000 });
        }
      });
    });
  }

  toggleDemoTestStatus(test: any) {
    const newStatus = !test.isActive;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (confirm(`Are you sure you want to ${action} this demo test?`)) {
      this.demoTestService.toggleDemoTestStatus(test._id).subscribe({
        next: (updatedTest) => {
          // Update local state
          const updatedTests = this.tests().map(t => 
            t._id === test._id ? { ...t, isActive: updatedTest.test.isActive } : t
          );
          this.tests.set(updatedTests);
          this.filterTests();
          
          this.snackBar.open(
            `Demo test ${action}d successfully`,
            'Close',
            { duration: 3000 }
          );
        },
        error: (error) => {
          this.snackBar.open(`Error ${action}ing demo test`, 'Close', { duration: 3000 });
        }
      });
    }
  }

  viewResults(test: any) {
    this.router.navigate(['/admin/demo-results', test._id]);
  }

  previewDemoTest(test: any) {
    this.router.navigate(['/take-demo-test', test._id]);
  }

  // Intro Modal Methods
  openIntroModal(test: any) {
    this.selectedTest = test;
    this.introContent.setValue(test.introPage || '');
    this.showIntroModal = true;
  }

  closeIntroModal() {
    this.showIntroModal = false;
    this.selectedTest = null;
    this.introContent.setValue('');
    this.updatingIntro = false;
  }

  updateIntro() {
    if (!this.selectedTest) return;

    const introPage = this.introContent.value?.trim() || '';
    this.updatingIntro = true;
    
    this.demoTestService.updateDemoTest(this.selectedTest._id, { introPage }).subscribe({
      next: (updatedTest) => {
        const updatedTests = this.tests().map(t => 
          t._id === this.selectedTest._id ? { ...t, introPage } : t
        );
        this.tests.set(updatedTests);
        this.filterTests();
        
        this.snackBar.open(
          introPage ? 'Intro saved successfully!' : 'Intro removed!',
          'Close',
          { duration: 3000 }
        );
        
        this.closeIntroModal();
      },
      error: (error) => {
        console.error('Error updating intro:', error);
        this.snackBar.open(
          'Failed to save intro: ' + (error.error?.message || 'Unknown error'),
          'Close',
          { duration: 3000 }
        );
        this.updatingIntro = false;
      }
    });
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
import { Component, inject, signal, OnInit, ElementRef, ViewChild, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../../shared/services/auth.service';
import { TestService } from '../../../shared/services/test.service';
import { CreateTestDialogComponent } from '../create-test-dialog/create-test-dialog.component';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { DomSanitizer } from '@angular/platform-browser';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-live-tests',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    FormsModule,
    ReactiveFormsModule,
    CKEditorModule
  ],
  templateUrl: './live-tests.component.html',
  styleUrl: './live-tests.component.css'
})
export class LiveTestsComponent implements OnInit {
  private authService = inject(AuthService);
  private testService = inject(TestService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private confirmDialog = inject(ConfirmDialogService);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('videoLinkInput') videoLinkInput!: ElementRef<HTMLInputElement>;

  tests = signal<any[]>([]);
  loading = signal(false);
  pdfDownloading = signal<string | null>(null); // Track which test is downloading PDF
  isAdmin = this.authService.currentUser()?.role === 'admin';

  showVideoLinkModal = false;
  selectedTest: any = null;
  videoLinkInputValue = '';
  updatingVideoLink = false;

  showIntroModal = false;
  showViewIntroModal = false;
  introContent = new FormControl('');
  updatingIntro = false;

  // CKEditor configuration
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
    this.loadTests();
  }

  loadTests() {
    this.loading.set(true);
    if (this.isAdmin) {
      this.testService.getAllTests().subscribe({
        next: (tests) => {
          this.tests.set(tests);
          this.loading.set(false);
        },
        error: (error) => {
          this.snackBar.open('Error loading tests', 'Close', { duration: 3000 });
          this.loading.set(false);
        }
      });
    } else {
      this.testService.getUpcomingTests().subscribe({
        next: (tests) => {
          this.tests.set(tests);
          this.loading.set(false);
        },
        error: (error) => {
          this.snackBar.open('Error loading tests', 'Close', { duration: 3000 });
          this.loading.set(false);
        }
      });
    }
  }

  openVideoLinkModal(test: any) {
    this.selectedTest = test;
    this.videoLinkInputValue = test.videoLink || '';
    this.showVideoLinkModal = true;
    
    // Focus the input after modal is shown
    setTimeout(() => {
      if (this.videoLinkInput) {
        this.videoLinkInput.nativeElement.focus();
      }
    }, 100);
  }

  closeVideoLinkModal() {
    this.showVideoLinkModal = false;
    this.selectedTest = null;
    this.videoLinkInputValue = '';
    this.updatingVideoLink = false;
  }

  updateVideoLink() {
    if (!this.selectedTest) return;

    const videoLink = this.videoLinkInputValue.trim();
    
    // Validate URL if provided
    if (videoLink && !this.isValidUrl(videoLink)) {
      this.snackBar.open('Please enter a valid URL', 'Close', { duration: 3000 });
      return;
    }

    this.updatingVideoLink = true;
    
    // Use the updateTest API with only videoLink field
    this.testService.updateTest(this.selectedTest._id, { videoLink }).subscribe({
      next: (updatedTest) => {
        // Update the test in the local array
        const updatedTests = this.tests().map(t => 
          t._id === this.selectedTest._id ? { ...t, videoLink } : t
        );
        this.tests.set(updatedTests);
        
        this.snackBar.open(
          videoLink ? 'Video link saved successfully!' : 'Video link removed!',
          'Close', 
          { duration: 3000 }
        );
        
        this.closeVideoLinkModal();
      },
      error: (error) => {
        console.error('Error updating video link:', error);
        this.snackBar.open(
          'Failed to save video link: ' + (error.error?.message || 'Unknown error'),
          'Close', 
          { duration: 3000 }
        );
        this.updatingVideoLink = false;
      }
    });
  }

  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  }

  clearVideoLink() {
    this.videoLinkInputValue = '';
  }

  canAddVideoLink(test: any): boolean {
    if (!test.startTime) return false;
    const now = new Date();
    const endTime = new Date(new Date(test.startTime).getTime() + (test.duration || 0) * 60000);
    return now > endTime; // Only allow adding video link after test has ended
  }

  openVideoInNewTab(test: any) {
    if (test.videoLink) {
      window.open(test.videoLink, '_blank');
    }
  }

  openCreateTestDialog(test?: any) {
    const dialogRef = this.dialog.open(CreateTestDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      maxHeight: 'calc(100vh - 24px)',
      panelClass: 'create-test-dialog-panel',
      autoFocus: false,
      data: { test: test || null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTests();
      }
    });
  }

  editTest(test: any) {
    this.openCreateTestDialog(test);
  }

  reopenTest(test: any) {
    const email = prompt('Student email');
    if (!email) return;
    const until = prompt('Reopen until (YYYY-MM-DDTHH:MM)', new Date(Date.now() + 2 * 3600000).toISOString().slice(0, 16));
    if (!until) return;
    this.testService.reopenExam(test._id, email, until).subscribe({
      next: (response: any) => this.snackBar.open(`Exam reopened for ${response.student?.email || email}`, 'Close', { duration: 4000 }),
      error: (error: any) => this.snackBar.open(error.error?.message || 'Unable to reopen exam', 'Close', { duration: 4000 })
    });
  }

  deleteTest(testId: string) {
    this.confirmDialog.ask({title: 'Delete test?', message: 'This will also delete all associated results. This action cannot be undone.'}).subscribe(() => {
      this.testService.deleteTest(testId).subscribe({
        next: () => {
          this.snackBar.open('Test deleted successfully', 'Close', { duration: 3000 });
          this.loadTests();
        },
        error: (error) => {
          this.snackBar.open('Error deleting test: ' + error.error?.message, 'Close', { duration: 3000 });
        }
      });
    });
  }

  canStartTest(test: any): boolean {
    if (!test.startTime) return false;
    const now = new Date();
    const startTime = new Date(test.startTime);
    const endTime = new Date(startTime.getTime() + (test.duration || 0) * 60000);
    return now >= startTime && now <= endTime;
  }

  startTest(test: any) {
    if (this.canStartTest(test)) {
      this.router.navigate(['/take-test', test._id]);
    } else {
      const now = new Date();
      const startTime = new Date(test.startTime);
      if (now < startTime) {
        this.snackBar.open('Test has not started yet', 'Close', { duration: 3000 });
      } else {
        this.snackBar.open('Test has already ended', 'Close', { duration: 3000 });
      }
    }
  }

  viewResults(testId: string) {
    this.router.navigate(['/results'], { queryParams: { testId } });
  }

  // Intro Modal Methods - UPDATED to use introPage
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
    
    console.log('Saving introPage for test:', this.selectedTest._id);
    console.log('introPage content:', introPage);
    
    this.updatingIntro = true;
    
    // Use the updateTest API with only introPage field
    this.testService.updateTest(this.selectedTest._id, { introPage }).subscribe({
      next: (updatedTest) => {
        // Update the test in the local array
        const updatedTests = this.tests().map(t => 
          t._id === this.selectedTest._id ? { ...t, introPage } : t
        );
        this.tests.set(updatedTests);
        
        this.snackBar.open(
          introPage ? 'Intro saved successfully!' : 'Intro removed!',
          'Close', 
          { duration: 3000 }
        );
        
        this.closeIntroModal();
      },
      error: (error) => {
        console.error('Error updating introPage:', error);
        this.snackBar.open(
          'Failed to save intro: ' + (error.error?.message || 'Unknown error'),
          'Close', 
          { duration: 3000 }
        );
        this.updatingIntro = false;
      }
    });
  }

  // View Intro Modal Methods - UPDATED to use introPage
  openViewIntroModal(test: any) {
    this.selectedTest = test;
    this.showViewIntroModal = true;
  }

  closeViewIntroModal() {
    this.showViewIntroModal = false;
    this.selectedTest = null;
  }

  getSafeIntroHtml(introPage: string) {
    // Sanitize the HTML content for safe display
    return this.sanitizer.sanitize(SecurityContext.HTML, introPage || 'No introduction available.');
  }

  // PDF Download functionality
  downloadPdf(testId: string, type: 'en' | 'hi') {
    this.pdfDownloading.set(testId);
    
    const languageText = type === 'en' ? 'English' : 'Hindi';
    
    // Find the test to get the title for the filename
    const test = this.tests().find(t => t._id === testId);
    const testTitle = test?.title || 'test';
    
    this.testService.downloadQuestionPaperPdf(testId, type).subscribe({
      next: (response: any) => {
        if (response.success && response.base64) {
          this.downloadBase64Pdf(
            response.base64, 
            response.fileName || `question-paper-${testId}-${type}.pdf`,
            testTitle
          );
          this.snackBar.open(`${languageText} PDF downloaded successfully!`, 'Close', { duration: 3000 });
        } else {
          this.snackBar.open('Failed to generate PDF', 'Close', { duration: 3000 });
        }
        this.pdfDownloading.set(null);
      },
      error: (error) => {
        console.error('Error downloading PDF:', error);
        this.snackBar.open(`Error downloading ${languageText} PDF: ${error.error?.message || 'Unknown error'}`, 'Close', { duration: 3000 });
        this.pdfDownloading.set(null);
      }
    });
  }

  private downloadBase64Pdf(base64Data: string, fileName: string, testTitle: string) {
    try {
      // Decode base64 string
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      
      // Add a descriptive title as data attribute for accessibility
      link.setAttribute('data-test-title', testTitle);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error('Error processing PDF data:', error);
      this.snackBar.open('Error processing PDF file', 'Close', { duration: 3000 });
    }
  }
}
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { LanguageService } from '../../../shared/i18n/language.service';
import { Component, inject, signal, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Clipboard } from '@angular/cdk/clipboard';
import { QuestionService, Question, QuestionsResponse, PaginationInfo } from '../../../shared/services/question.service';
import { TagService, TagResponse } from '../../../shared/services/tag.service';
import { CreateQuestionDialogComponent } from './create-question-dialog/create-question-dialog.component';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-questions-master',
  standalone: true,
  imports: [TranslatePipe, 
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatTooltipModule,
    TruncatePipe,
    SafeHtmlPipe
  ],
  templateUrl: './questions-master.component.html',
  styleUrls: ['./questions-master.component.css']
})
export class QuestionsMasterComponent implements OnInit {
  private http = inject(HttpClient);
  readonly language = inject(LanguageService);
  importFile: File | null = null;
  importFiles: File[] = [];
  importPreview: any[] = [];
  importTags: string[] = [];
  importError = '';
  importing = false;
  getImportFileNames(): string {
    return this.importFiles.map(file => file.name).join(' + ');
  }

  previewImport(event: Event) {
    const input = event.target as HTMLInputElement;
    this.importFiles = Array.from(input.files || []);
    this.importFile = this.importFiles[0] || null;
    this.importPreview = []; this.importTags = []; this.importError = '';
    if (!this.importFile) return;
    if (this.importFiles.length > 2 || this.importFiles.some(file => !/\.(csv|json|docx)$/i.test(file.name) || file.size > 5 * 1024 * 1024)) {
      this.importError = this.language.hindi ? 'अधिकतम दो CSV, JSON या DOCX फ़ाइलें चुनें। हर फ़ाइल 5 MB तक होनी चाहिए।' : 'Select up to two CSV, JSON, or DOCX files. Each file must be up to 5 MB.';
      this.importFile = null; this.importFiles = []; return;
    }
    if (this.importFiles.length === 2 && this.importFiles.some(file => !/\.docx$/i.test(file.name))) {
      this.importError = this.language.hindi ? 'English और Hindi को साथ import करने के लिए केवल दो DOCX फ़ाइलें चुनें।' : 'Select two DOCX files to import English and Hindi together.';
      this.importFile = null; this.importFiles = []; return;
    }
    const form = new FormData(); this.importFiles.forEach(file => form.append('file', file)); form.append('preview', 'true');
    this.importing = true;
    this.http.post<any>(`${environment.apiUrl}/questions/import`, form).subscribe({
      next: r => { this.importPreview = r.questions; this.importing = false; },
      error: e => { this.importError = e.error?.message || 'Unable to preview file.'; this.importing = false; }
    });
  }
  confirmImport() {
    if (!this.importFiles.length || !this.importPreview.length || !this.importTags.length || this.importing) return;
    const form = new FormData(); this.importFiles.forEach(file => form.append('file', file));
    form.append('importTags', JSON.stringify(this.importTags));
    this.importing = true;
    this.http.post<any>(`${environment.apiUrl}/questions/import`, form).subscribe({
      next: r => { this.snackBar.open(this.language.hindi ? r.messageHindi : r.message, this.language.text('Close'), {duration: 5000}); this.importPreview = []; this.importFile = null; this.importFiles = []; this.importTags = []; this.importing = false; this.currentPage.set(0); this.loadQuestions(); },
      error: e => { this.importError = e.error?.message || 'Import failed.'; this.importing = false; }
    });
  }
  private questionService = inject(QuestionService);
  private tagService = inject(TagService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private sanitizer = inject(DomSanitizer);
  private clipboard = inject(Clipboard);
  private confirmDialog = inject(ConfirmDialogService);
  
  private viewDialogRef: MatDialogRef<any> | null = null;
  private bulkTagDialogRef: MatDialogRef<any> | null = null;

  @ViewChild('viewDialogTemplate') viewDialogTemplate!: TemplateRef<any>;
  @ViewChild('bulkTagDialogTemplate') bulkTagDialogTemplate!: TemplateRef<any>;

    exporting = signal(false);
  questions = signal<Question[]>([]);
  tags = signal<TagResponse[]>([]);
  loading = signal(false);
  selectedQuestion: Question | null = null;
  
  // Multi-selection signals
  selectedQuestions = signal<Question[]>([]);
  allSelected = signal(false);
  someSelected = signal(false);

  // UIDs panel visibility
  showUIDsPanel = signal(false);

  // Bulk tag assignment
  selectedTags: string[] = [];
  replaceExistingTags = false;
  bulkTagLoading = signal(false);

  // Pagination signals
  totalQuestions = signal(0);
  pageSize = signal(10);
  currentPage = signal(0);
  paginationInfo = signal<PaginationInfo | null>(null);

  ngOnInit() {
    this.loadQuestions();
    this.loadTags();
  }

  loadQuestions() {
    this.loading.set(true);
    
    const page = this.currentPage() + 1;
    const limit = this.pageSize();

    this.questionService.getQuestions(page, limit).subscribe({
      next: (response: QuestionsResponse) => {
        this.questions.set(response.questions);
        this.paginationInfo.set(response.pagination);
        this.totalQuestions.set(response.pagination.totalQuestions);
        this.loading.set(false);
        
        // Update selection states after loading
        this.updateSelectionStates();
      },
      error: (error) => {
        this.snackBar.open('Error loading questions', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  loadTags() {
    this.tagService.getTags().subscribe({
      next: (tags) => {
        this.tags.set(tags);
      },
      error: (error) => {
        this.snackBar.open('Error loading tags', 'Close', { duration: 3000 });
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.clearSelection(); // Clear selection when changing page
    this.showUIDsPanel.set(false); // Close UIDs panel on page change
    this.loadQuestions();
  }

  getQuestionId(question: Question): string {
    return question.uid || question._id || 'N/A';
  }

  // Show selected UIDs functionality
  showSelectedUIDs() {
    const selected = this.selectedQuestions();
    if (selected.length === 0) {
      this.snackBar.open('Please select questions first', 'Close', { duration: 3000 });
      return;
    }
    this.showUIDsPanel.set(true);
  }

  closeUIDsPanel() {
    this.showUIDsPanel.set(false);
  }

  getSelectedQuestionUIDs(): string[] {
    return this.selectedQuestions()
      .map(q => q.uid || q._id)
      .filter(id => !!id) as string[];
  }

  copySelectedUIDs() {
    const uids = this.getSelectedQuestionUIDs();
    if (uids.length === 0) {
      this.snackBar.open('No UIDs to copy', 'Close', { duration: 3000 });
      return;
    }

    // Create comma-separated list of UIDs
    const uidsText = uids.join(',\n');
    
    // Copy to clipboard
    this.clipboard.copy(uidsText);
    
    // Show success message
    this.snackBar.open(`${uids.length} UID${uids.length > 1 ? 's' : ''} copied to clipboard!`, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  openViewDialog(question: Question) {
    this.selectedQuestion = question;
    this.viewDialogRef = this.dialog.open(this.viewDialogTemplate, {
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      maxHeight: '800px',
      panelClass: 'view-question-dialog-panel',
      autoFocus: false
    });

    this.viewDialogRef.afterClosed().subscribe(() => {
      this.selectedQuestion = null;
    });
  }

  closeViewDialog() {
    if (this.viewDialogRef) {
      this.viewDialogRef.close();
    }
  }

  openCreateQuestionDialog(question?: Question) {
    const dialogRef = this.dialog.open(CreateQuestionDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      maxHeight: '800px',
      panelClass: 'create-question-dialog-panel',
      autoFocus: false,
      data: { 
        question: question || null,
        tags: this.tags()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadQuestions();
        this.loadTags();

      }
    });
  }

  editQuestion(question: Question) {
    this.closeViewDialog();
    this.openCreateQuestionDialog(question);
  }

  // Single question deletion
  deleteQuestion(question: Question) {
    const questionId = question.uid || question._id;
    if (!questionId) {
      this.snackBar.open('Cannot delete question: Invalid ID', 'Close', { duration: 3000 });
      return;
    }

    this.confirmDialog.ask({title: 'Delete question?', message: 'This question will be permanently removed.'}).subscribe(() => {
      this.questionService.deleteQuestion(questionId).subscribe({
        next: () => {
          this.snackBar.open('Question deleted successfully', 'Close', { duration: 3000 });
          this.loadQuestions();
          // Remove from selection if it was selected
          this.removeFromSelection(question);
        },
        error: (error) => {
          this.snackBar.open('Error deleting question: ' + error.error?.message, 'Close', { duration: 3000 });
        }
      });
    });
  }

  // Multi-question deletion
  deleteSelectedQuestions() {
    const selected = this.selectedQuestions();
    if (selected.length === 0) {
      return;
    }

    const questionIds = selected.map(q => q.uid || q._id).filter(id => !!id);
    if (questionIds.length === 0) {
      this.snackBar.open('No valid questions to delete', 'Close', { duration: 3000 });
      return;
    }

    this.confirmDialog.ask({title: 'Delete selected questions?', message: `${selected.length} question${selected.length > 1 ? 's' : ''} will be permanently removed.`}).subscribe(() => {
      this.loading.set(true);
      
      // Delete questions one by one
      const deletePromises = questionIds.map(id => 
        this.questionService.deleteQuestion(id!).toPromise()
      );

      Promise.all(deletePromises).then(() => {
        this.snackBar.open(`Successfully deleted ${selected.length} question${selected.length > 1 ? 's' : ''}`, 'Close', { duration: 3000 });
        this.clearSelection();
        this.showUIDsPanel.set(false);
        this.loadQuestions();
      }).catch(error => {
        this.loading.set(false);
        this.snackBar.open('Error deleting some questions', 'Close', { duration: 3000 });
        console.error('Delete error:', error);
      });
    });
  }

  // Bulk tag assignment
  openBulkTagDialog() {
    const selected = this.selectedQuestions();
    if (selected.length === 0) {
      this.snackBar.open('Please select questions first', 'Close', { duration: 3000 });
      return;
    }

    // Reset form
    this.selectedTags = [];
    this.replaceExistingTags = false;

    this.bulkTagDialogRef = this.dialog.open(this.bulkTagDialogTemplate, {
      width: '500px',
      maxWidth: '90vw',
      panelClass: 'bulk-tag-dialog-panel',
      autoFocus: false
    });

    this.bulkTagDialogRef.afterClosed().subscribe(() => {
      // Clear selection after dialog closes
      this.clearSelection();
      this.showUIDsPanel.set(false);
    });
  }

  closeBulkTagDialog() {
    if (this.bulkTagDialogRef) {
      this.bulkTagDialogRef.close();
    }
  }

  removeTagFromSelection(tagId: string) {
    this.selectedTags = this.selectedTags.filter(id => id !== tagId);
  }

  async applyBulkTags() {
    const selectedQuestions = this.selectedQuestions();
    if (selectedQuestions.length === 0 || this.selectedTags.length === 0) {
      return;
    }

    this.bulkTagLoading.set(true);

    try {
      // Update each question with the selected tags
      const updatePromises = selectedQuestions.map(question => {
        const questionId = question.uid || question._id;
        if (!questionId) return Promise.resolve();

        // Determine new tags based on replaceExistingTags option
        let newTags: string[];
        if (this.replaceExistingTags) {
          // Replace existing tags
          newTags = [...this.selectedTags];
        } else {
          // Add to existing tags, avoiding duplicates
          const existingTags = question.tags || [];
          newTags = [...new Set([...existingTags, ...this.selectedTags])];
        }

        // Prepare update payload
        const updatePayload = {
          ...question,
          tags: newTags
        };

        return this.questionService.updateQuestion(questionId, updatePayload).toPromise();
      });

      await Promise.all(updatePromises);
      
      this.snackBar.open(
        `Successfully updated tags for ${selectedQuestions.length} question${selectedQuestions.length > 1 ? 's' : ''}`,
        'Close',
        { duration: 3000 }
      );
      
      this.closeBulkTagDialog();
      this.loadQuestions(); // Reload to show updated tags
    } catch (error) {
      console.error('Error updating tags:', error);
      this.snackBar.open('Error updating tags for some questions', 'Close', { duration: 3000 });
    } finally {
      this.bulkTagLoading.set(false);
    }
  }

  getTagName(tagId: string): string {
    const tag = this.tags().find(t => t._id === tagId);
    return tag ? tag.tag : tagId;
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  // Helper method to get current page info for display
  getCurrentPageInfo(): string {
    const pagination = this.paginationInfo();
    if (!pagination) return '';
    
    const startItem = (this.currentPage() * this.pageSize()) + 1;
    const endItem = Math.min(startItem + this.pageSize() - 1, this.totalQuestions());
    
    return `Showing ${startItem}-${endItem} of ${this.totalQuestions()} questions`;
  }

  // Sanitize HTML content for display
  sanitizeHtml(html: string) {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  // Selection management methods
  isSelected(question: Question): boolean {
    return this.selectedQuestions().some(q => 
      (q._id && q._id === question._id) || (q.uid && q.uid === question.uid)
    );
  }

  toggleQuestionSelection(question: Question, checked: boolean): void {
    const currentSelection = this.selectedQuestions();
    
    if (checked) {
      // Add to selection
      if (!this.isSelected(question)) {
        this.selectedQuestions.set([...currentSelection, question]);
      }
    } else {
      // Remove from selection
      this.selectedQuestions.set(
        currentSelection.filter(q => 
          !((q._id && q._id === question._id) || (q.uid && q.uid === question.uid))
        )
      );
    }
    
    this.updateSelectionStates();
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      // Select all current page questions
      this.selectedQuestions.set([...this.questions()]);
    } else {
      // Clear selection
      this.selectedQuestions.set([]);
    }
    
    this.updateSelectionStates();
  }

  clearSelection(): void {
    this.selectedQuestions.set([]);
    this.showUIDsPanel.set(false);
    this.updateSelectionStates();
  }

  removeFromSelection(question: Question): void {
    const currentSelection = this.selectedQuestions();
    this.selectedQuestions.set(
      currentSelection.filter(q => 
        !((q._id && q._id === question._id) || (q.uid && q.uid === question.uid))
      )
    );
    this.updateSelectionStates();
  }

  updateSelectionStates(): void {
    const currentQuestions = this.questions();
    const selected = this.selectedQuestions();
    
    // Update allSelected signal
    const allSelected = currentQuestions.length > 0 && 
                       selected.length === currentQuestions.length;
    this.allSelected.set(allSelected);
    
    // Update someSelected signal (indeterminate state)
    const someSelected = selected.length > 0 && selected.length < currentQuestions.length;
    this.someSelected.set(someSelected);
  }

  // Optional: Get selected question IDs
  getSelectedQuestionIds(): string[] {
    return this.selectedQuestions()
      .map(q => q.uid || q._id)
      .filter(id => !!id) as string[];
  }

  exportToCSV(): void {
    const questions = this.questions();
    if (questions.length === 0) {
      this.snackBar.open('No questions to export', 'Close', { duration: 3000 });
      return;
    }

    this.exporting.set(true);
    
    try {
      // Define CSV headers
      const headers = [
        'UID',
        'Question (English)',
        'Question (Hindi)',
        'Description (English)',
        'Description (Hindi)',
        'Options (English)',
        'Options (Hindi)',
        'Correct Answer',
        'Tags',
        'Created At',
        'Updated At'
      ];

      // Prepare CSV data
      const csvData = questions.map(question => {
        // Format options
        const optionsEn = question.options.map(opt => opt.english).join(' | ');
        const optionsHi = question.options.map(opt => opt.hindi || '').join(' | ');
        
        // Get correct answer letter
        const correctAnswer = this.getOptionLetter(question.correctAnswer);
        
        // Format tags
        const tags = question.tags.map(tagId => this.getTagName(tagId)).join(', ');
        
        return [
          question.uid || question._id || '',
          this.stripHtml(question.question.english),
          this.stripHtml(question.question.hindi || ''),
          this.stripHtml(question.description?.english || ''),
          this.stripHtml(question.description?.hindi || ''),
          this.stripHtml(optionsEn),
          this.stripHtml(optionsHi),
          correctAnswer,
          tags,
          question.createdAt ? new Date(question.createdAt).toLocaleString() : '',
          question.updatedAt ? new Date(question.updatedAt).toLocaleString() : ''
        ];
      });

      // Create CSV content
      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => {
          // Escape quotes and wrap in quotes if contains commas or quotes
          const escaped = String(field).replace(/"/g, '""');
          return /[,"\n]/.test(escaped) ? `"${escaped}"` : escaped;
        }).join(','))
        .join('\n');

      // Create and download CSV file
      this.downloadCSV(csvContent, `all-questions-${new Date().toISOString().split('T')[0]}.csv`);
      
      this.snackBar.open(`Exported ${questions.length} questions to CSV`, 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      this.snackBar.open('Error exporting questions to CSV', 'Close', { duration: 3000 });
    } finally {
      this.exporting.set(false);
    }
  }

  /**
   * Export selected questions to CSV
   */
  exportSelectedToCSV(): void {
    const selectedQuestions = this.selectedQuestions();
    if (selectedQuestions.length === 0) {
      this.snackBar.open('Please select questions to export', 'Close', { duration: 3000 });
      return;
    }

    this.exporting.set(true);
    
    try {
      // Define CSV headers
      const headers = [
        'UID',
        'Question (English)',
        'Question (Hindi)',
        'Description (English)',
        'Description (Hindi)',
        'Options (English)',
        'Options (Hindi)',
        'Correct Answer',
        'Tags',
        'Created At',
        'Updated At'
      ];

      // Prepare CSV data
      const csvData = selectedQuestions.map(question => {
        // Format options
        const optionsEn = question.options.map(opt => opt.english).join(' | ');
        const optionsHi = question.options.map(opt => opt.hindi || '').join(' | ');
        
        // Get correct answer letter
        const correctAnswer = this.getOptionLetter(question.correctAnswer);
        
        // Format tags
        const tags = question.tags.map(tagId => this.getTagName(tagId)).join(', ');
        
        return [
          question.uid || question._id || '',
          this.stripHtml(question.question.english),
          this.stripHtml(question.question.hindi || ''),
          this.stripHtml(question.description?.english || ''),
          this.stripHtml(question.description?.hindi || ''),
          this.stripHtml(optionsEn),
          this.stripHtml(optionsHi),
          correctAnswer,
          tags,
          question.createdAt ? new Date(question.createdAt).toLocaleString() : '',
          question.updatedAt ? new Date(question.updatedAt).toLocaleString() : ''
        ];
      });

      // Create CSV content
      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => {
          // Escape quotes and wrap in quotes if contains commas or quotes
          const escaped = String(field).replace(/"/g, '""');
          return /[,"\n]/.test(escaped) ? `"${escaped}"` : escaped;
        }).join(','))
        .join('\n');

      // Create and download CSV file
      this.downloadCSV(csvContent, `selected-questions-${new Date().toISOString().split('T')[0]}.csv`);
      
      this.snackBar.open(`Exported ${selectedQuestions.length} selected questions to CSV`, 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Error exporting selected questions to CSV:', error);
      this.snackBar.open('Error exporting selected questions to CSV', 'Close', { duration: 3000 });
    } finally {
      this.exporting.set(false);
    }
  }

  /**
   * Helper method to download CSV file
   */
  /**
 * Helper method to download CSV file with proper UTF-8 encoding for Hindi text
 */
private downloadCSV(csvContent: string, filename: string): void {
  // Add UTF-8 BOM (Byte Order Mark) for Excel compatibility with Unicode
  const BOM = '\uFEFF';
  
  // Create a Blob with UTF-8 encoding and BOM for Hindi/Unicode support
  const blob = new Blob([BOM + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  // Create a download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Append link, click it, and remove it
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

  /**
   * Helper method to strip HTML tags from content
   */
  private stripHtml(html: string): string {
    if (!html) return '';
    
    // Create a temporary div element
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Get text content and trim
    const text = tempDiv.textContent || tempDiv.innerText || '';
    
    // Remove multiple spaces and newlines
    return text.replace(/\s+/g, ' ').trim();
  }
}

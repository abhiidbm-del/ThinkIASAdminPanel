// module-test-dialog/module-test-dialog.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ModuleTestService } from '../../../../shared/services/module-test.service';
import { QuestionService } from '../../../../shared/services/question.service';
import { FormsModule } from '@angular/forms';

interface Question {
  _id: string;
  uid: string;
  question: {
    english: string;
    hindi: string;
    _id?: string;
  };
  options: Array<{
    english: string;
    hindi: string;
    _id?: string;
  }>;
  correctAnswer: number;
  description?: {
    english: string;
    hindi: string;
  };
  tags: any[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Tag {
  _id: string;
  tag: string;
  questionCount: number;
}

@Component({
  selector: 'app-module-test-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCheckboxModule
  ],
  templateUrl: './module-test-dialog.component.html',
  styleUrls: ['./module-test-dialog.component.css']
})
export class ModuleTestDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private moduleTestService = inject(ModuleTestService);
  private questionService = inject(QuestionService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<ModuleTestDialogComponent>);
  private data = inject(MAT_DIALOG_DATA);

  testForm: FormGroup;
  isEdit = signal(false);
  loading = signal(false);
  questionsLoading = signal(false);
  
  // Questions from API
  allQuestions = signal<Question[]>([]);
  filteredQuestions = signal<Question[]>([]);
  
  // Tags
  tags = signal<Tag[]>([]);
  tagsLoading = signal(false);
  currentFilterTag = signal<string | null>(null);
  showTagFilter = signal(false);
  
  // Add by UID functionality
  showAddByUid = signal(false);
  uidTextareaValue = signal('');
  uidProcessingStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  // Question selection
  selectedQuestions = signal<Question[]>([]);
  temporarilySelectedUids = signal<string[]>([]);

  constructor() {
    this.testForm = this.createTestForm();
    this.isEdit.set(!!this.data.test);
  }

  createTestForm(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      description: [''],
      isActive: [true, Validators.required],
      passingScore: [70, [Validators.min(0), Validators.max(100)]],
      timeLimit: [null],
      questionUids: [[]]
    });
  }

  ngOnInit() {
    this.loadAvailableQuestions().then(() => {
      if (this.isEdit()) {
        this.populateForm(this.data.test);
      }
    });
    this.loadTags();
  }

  loadAvailableQuestions(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.questionsLoading.set(true);
      this.questionService.getAllQuestions().subscribe({
        next: (response: any) => {
          const questions: Question[] = (response.questions || []).map((q: any) => ({
            _id: q._id,
            uid: q.uid,
            question: {
              english: q.question?.english || '',
              hindi: q.question?.hindi || '',
              _id: q.question?._id
            },
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            description: q.description,
            tags: q.tags || [],
            isActive: q.isActive !== undefined ? q.isActive : true,
            createdAt: q.createdAt,
            updatedAt: q.updatedAt
          }));
          
          this.allQuestions.set(questions);
          this.filteredQuestions.set(questions);
          this.questionsLoading.set(false);
          resolve();
        },
        error: (error: any) => {
          console.error('Error loading questions:', error);
          this.snackBar.open('Error loading questions', 'Close', { duration: 3000 });
          this.questionsLoading.set(false);
          reject(error);
        }
      });
    });
  }

  populateForm(test: any) {
    this.testForm.patchValue({
      title: test.title,
      description: test.description,
      isActive: test.isActive,
      passingScore: test.passingScore || 70,
      timeLimit: test.timeLimit || null
    });

    const questionUids = test.questionUids || [];
    this.setSelectedQuestionsFromUids(questionUids);
  }

  setSelectedQuestionsFromUids(questionUids: string[]) {
    if (questionUids.length > 0) {
      const allQuestions = this.allQuestions();
      const selectedQuestions = allQuestions.filter(q => questionUids.includes(q.uid));
      this.selectedQuestions.set(selectedQuestions);
    }
  }

  loadTags() {
    this.tagsLoading.set(true);
    this.questionService.getTags().subscribe({
      next: (response: any) => {
        const tags: Tag[] = (response || []).map((tag: any) => ({
          _id: tag._id,
          tag: tag.tag,
          questionCount: 0
        }));
        this.calculateTagQuestionCounts(tags);
        this.tags.set(tags);
        this.tagsLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading tags:', error);
        this.tagsLoading.set(false);
      }
    });
  }

  calculateTagQuestionCounts(tags: Tag[]) {
    const allQuestions = this.allQuestions();
    tags.forEach(tag => {
      const count = allQuestions.filter(q => 
        q.tags && Array.isArray(q.tags) && 
        q.tags.some((t: any) => {
          if (typeof t === 'object') return t._id === tag._id || t.tag === tag.tag;
          return t === tag._id;
        })
      ).length;
      tag.questionCount = count;
    });
    const noneQuestions = allQuestions.filter(q => !q.tags || q.tags.length === 0);
    if (noneQuestions.length > 0) {
      tags.push({ _id: 'none', tag: 'None', questionCount: noneQuestions.length });
    }
  }

  // Filter by Tag functionality
  toggleTagFilter() {
    this.showTagFilter.set(!this.showTagFilter());
  }

  applyTagFilter(tag: Tag) {
    this.currentFilterTag.set(tag.tag);
    this.showTagFilter.set(false);
    const allQuestions = this.allQuestions();
    let filtered: Question[];
    
    if (tag._id === 'none') {
      filtered = allQuestions.filter(q => !q.tags || q.tags.length === 0);
    } else {
      filtered = allQuestions.filter(q => 
        q.tags && Array.isArray(q.tags) && 
        q.tags.some((t: any) => {
          if (typeof t === 'object') return t._id === tag._id || t.tag === tag.tag;
          return t === tag._id;
        })
      );
    }
    
    this.filteredQuestions.set(filtered);
    this.snackBar.open(`Filtered by tag: ${tag.tag} (${filtered.length} questions)`, 'Close', { duration: 3000 });
  }

  clearTagFilter() {
    this.currentFilterTag.set(null);
    this.showTagFilter.set(false);
    this.filteredQuestions.set(this.allQuestions());
    this.snackBar.open('Tag filter cleared', 'Close', { duration: 2000 });
  }

  getQuestionTags(question: Question): string {
    if (!question.tags || question.tags.length === 0) return 'None';
    
    const tagNames = question.tags
      .map((tag: any) => {
        if (typeof tag === 'object') return tag.tag;
        const foundTag = this.tags().find(t => t._id === tag);
        return foundTag ? foundTag.tag : 'Unknown';
      })
      .filter(tagName => tagName !== 'Unknown');
    
    return tagNames.length > 0 ? tagNames.join(', ') : 'None';
  }

  // Available questions for display
  availableQuestions(): Question[] {
    return this.filteredQuestions();
  }

  // Add by UID functionality
  toggleAddByUid() {
    this.showAddByUid.set(!this.showAddByUid());
    if (!this.showAddByUid()) {
      this.uidTextareaValue.set('');
    }
  }

  onUidTextareaChange(event: Event) {
    const value = (event.target as HTMLTextAreaElement).value;
    this.uidTextareaValue.set(value);
  }

  async processUids() {
    const textareaValue = this.uidTextareaValue().trim();
    
    if (!textareaValue) {
      this.snackBar.open('Please enter at least one UID', 'Close', { duration: 2000 });
      return;
    }
    
    const uids = textareaValue
      .split(/[\n,]+/)
      .map(uid => uid.trim())
      .filter(uid => uid.length > 0);
    
    if (uids.length === 0) {
      this.snackBar.open('No valid UIDs found', 'Close', { duration: 2000 });
      return;
    }
    
    this.uidProcessingStatus.set('loading');
    
    try {
      const allQuestions = this.allQuestions();
      const foundQuestions: Question[] = [];
      const notFoundUids: string[] = [];
      const duplicateUids: string[] = [];
      const currentSelectedUids = this.selectedQuestions().map(q => q.uid);
      
      uids.forEach(uid => {
        const question = allQuestions.find(q => q.uid === uid);
        if (question) {
          if (currentSelectedUids.includes(uid)) {
            duplicateUids.push(uid);
          } else {
            foundQuestions.push(question);
          }
        } else {
          notFoundUids.push(uid);
        }
      });
      
      let message = '';
      
      if (foundQuestions.length > 0) {
        const updatedQuestions = [...this.selectedQuestions(), ...foundQuestions];
        this.selectedQuestions.set(updatedQuestions);
        this.updateQuestionUidsFormControl();
        message += `Added ${foundQuestions.length} question(s) to test. `;
      }
      
      if (duplicateUids.length > 0) {
        message += `${duplicateUids.length} question(s) already exist in test. `;
      }
      
      if (notFoundUids.length > 0) {
        message += `${notFoundUids.length} UID(s) not found.`;
      }
      
      if (foundQuestions.length === 0 && duplicateUids.length === 0 && notFoundUids.length > 0) {
        message = 'No valid questions found. Check the UIDs and try again.';
      }
      
      this.snackBar.open(message, 'Close', { duration: 5000 });
      
      setTimeout(() => {
        this.showAddByUid.set(false);
        this.uidTextareaValue.set('');
        this.uidProcessingStatus.set('idle');
      }, 1000);
      
    } catch (error) {
      console.error('Error processing UIDs:', error);
      this.snackBar.open('Error processing UIDs', 'Close', { duration: 3000 });
      this.uidProcessingStatus.set('idle');
    }
  }

  getUidCount(): number {
    const textareaValue = this.uidTextareaValue().trim();
    if (!textareaValue) return 0;
    return textareaValue
      .split(/[\n,]+/)
      .map(uid => uid.trim())
      .filter(uid => uid.length > 0)
      .length;
  }

  clearUids() {
    this.uidTextareaValue.set('');
    this.uidProcessingStatus.set('idle');
  }

  onSelectionChange(selectedUids: string[]) {
    this.temporarilySelectedUids.set(selectedUids);
  }

  isAllFilteredSelected(): boolean {
    const filteredQuestions = this.filteredQuestions();
    const tempSelectedUids = this.temporarilySelectedUids();
    if (filteredQuestions.length === 0) return false;
    return filteredQuestions.every(q => tempSelectedUids.includes(q.uid));
  }

  toggleSelectAll() {
    const filteredQuestions = this.filteredQuestions();
    const filteredUids = filteredQuestions.map(q => q.uid);
    const currentTempUids = this.temporarilySelectedUids();
    
    if (this.isAllFilteredSelected()) {
      const remaining = currentTempUids.filter(uid => !filteredUids.includes(uid));
      this.temporarilySelectedUids.set(remaining);
    } else {
      const allSelectedUids = [...new Set([...currentTempUids, ...filteredUids])];
      this.temporarilySelectedUids.set(allSelectedUids);
    }
  }

  addSelectedToTest() {
    const tempSelectedUids = this.temporarilySelectedUids();
    
    if (tempSelectedUids.length === 0) {
      this.snackBar.open('No questions selected', 'Close', { duration: 2000 });
      return;
    }
    
    const allQuestions = this.allQuestions();
    const currentSelectedUids = this.selectedQuestions().map(q => q.uid);
    
    const newQuestions = allQuestions.filter(q => 
      tempSelectedUids.includes(q.uid) && !currentSelectedUids.includes(q.uid)
    );
    
    const duplicateCount = tempSelectedUids.filter(uid => currentSelectedUids.includes(uid)).length;
    
    if (newQuestions.length > 0) {
      const updatedQuestions = [...this.selectedQuestions(), ...newQuestions];
      this.selectedQuestions.set(updatedQuestions);
      this.updateQuestionUidsFormControl();
      
      let message = `Added ${newQuestions.length} question(s) to test`;
      if (duplicateCount > 0) {
        message += ` (${duplicateCount} already in test)`;
      }
      
      this.snackBar.open(message, 'Close', { duration: 3000 });
      this.temporarilySelectedUids.set([]);
    } else if (duplicateCount > 0) {
      this.snackBar.open(`All selected questions already exist in test`, 'Close', { duration: 3000 });
    }
  }

  clearAll() {
    this.selectedQuestions.set([]);
    this.temporarilySelectedUids.set([]);
    this.updateQuestionUidsFormControl();
    this.snackBar.open('All questions removed from test', 'Close', { duration: 2000 });
  }

  removeQuestion(index: number) {
    const currentSelectedQuestions = [...this.selectedQuestions()];
    const questionToRemove = currentSelectedQuestions[index];
    
    currentSelectedQuestions.splice(index, 1);
    this.selectedQuestions.set(currentSelectedQuestions);
    
    const currentTempUids = this.temporarilySelectedUids();
    const updatedTempUids = currentTempUids.filter(uid => uid !== questionToRemove.uid);
    this.temporarilySelectedUids.set(updatedTempUids);
    
    this.updateQuestionUidsFormControl();
    this.snackBar.open('Question removed from test', 'Close', { duration: 2000 });
  }

  getQuestionDisplayText(question: Question): string {
    const engText = question.question.english;
    return engText.length > 100 ? engText.substring(0, 100) + '...' : engText;
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  isQuestionSelected(uid: string): boolean {
    return this.temporarilySelectedUids().includes(uid) || 
           this.selectedQuestions().some(q => q.uid === uid);
  }

  updateQuestionUidsFormControl() {
    const questionUids = this.selectedQuestions().map(q => q.uid);
    this.testForm.patchValue({ questionUids });
  }

onSubmit() {
  if (this.testForm.valid && this.selectedQuestions().length > 0) {
    this.loading.set(true);
    
    const formValue = this.testForm.value;
    const testData = {
      title: formValue.title,
      description: formValue.description || '',
      isActive: formValue.isActive,
      passingScore: formValue.passingScore || 70,
      timeLimit: formValue.timeLimit || null,
      questionUids: this.selectedQuestions().map(q => q.uid),
      moduleId: this.data.moduleId  // Make sure this is passed
    };

    const operation = this.isEdit() 
      ? this.moduleTestService.updateModuleTest(this.data.test._id, testData)
      : this.moduleTestService.createModuleTest(testData);

    operation.subscribe({
      next: () => {
        this.snackBar.open(`Test ${this.isEdit() ? 'updated' : 'created'} successfully`, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (error: any) => {
        this.loading.set(false);
        console.error('Error:', error);
        this.snackBar.open(`Error ${this.isEdit() ? 'updating' : 'creating'} test: ${error.error?.message || 'Unknown error'}`, 'Close', { duration: 3000 });
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  } else if (this.selectedQuestions().length === 0) {
    this.snackBar.open('Please add at least one question to the test', 'Close', { duration: 3000 });
  } else {
    this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
  }
}

  onCancel() {
    this.dialogRef.close(false);
  }
}
import { TranslatePipe } from '../../../../shared/i18n/translate.pipe';
import { Component, inject, signal, OnInit, ViewChild, TemplateRef, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { QuestionService, Question } from '../../../../shared/services/question.service';
import { TagService, TagResponse } from '../../../../shared/services/tag.service';
import { FormsModule } from '@angular/forms'; // Add this import
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

// Simplified form interface - using flat structure for form
interface QuestionFormData {
  question: {
    english: string;
    hindi: string;
  };
  description: {
    english: string;
    hindi: string;
  };
  options: Array<{
    english: string;
    hindi: string;
  }>;
  correctAnswer: number;
  tags: string[];
}

@Component({
  selector: 'app-create-question-dialog',
  standalone: true,
  imports: [TranslatePipe, 
    CommonModule,
    ReactiveFormsModule,
    TitleCasePipe,
    FormsModule, // Add this
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatAutocompleteModule,
    CKEditorModule
  ],
  templateUrl: './create-question-dialog.component.html',
  styleUrls: ['./create-question-dialog.component.css']
})
export class CreateQuestionDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private questionService = inject(QuestionService);
  private tagService = inject(TagService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<CreateQuestionDialogComponent>);
  private data = inject(MAT_DIALOG_DATA);

  @ViewChild('addTagDialogTemplate') addTagDialogTemplate!: TemplateRef<any>;
  @ViewChildren('tagSearchInput') tagSearchInputs!: QueryList<ElementRef>;
  @ViewChildren(MatSelect) tagSelects!: QueryList<MatSelect>;


  // CKEditor instance
  public Editor = ClassicEditor;
  
  // CKEditor configuration
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

  questionForm: FormGroup;
  addTagForm: FormGroup;
  isEdit = signal(false);
  loading = signal(false);
  isDragOver = signal(false);
  fileUploadLoading = signal(false);
  addTagLoading = signal(false);
  availableTags: TagResponse[] = [];
  currentQuestionIndexForTag: number | null = null;
  private addTagDialogRef: MatDialogRef<any> | null = null;

  // Track which language sections are visible for each question
  languageSectionVisibility: { [questionIndex: number]: { english: boolean; hindi: boolean } } = {};

  // Tag search functionality
  tagSearchQuery: { [questionIndex: number]: string } = {};
  filteredTags: { [questionIndex: number]: TagResponse[] } = {};

  constructor() {
    this.questionForm = this.createQuestionForm();
    this.addTagForm = this.createAddTagForm();
    this.isEdit.set(!!this.data.question);
    this.availableTags = this.data.tags || [];
  }

  createQuestionForm(): FormGroup {
    return this.fb.group({
      questions: this.fb.array([])
    });
  }

  createAddTagForm(): FormGroup {
    return this.fb.group({
      category: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      subCategory: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      topic: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]]
    });
  }

  get questions(): FormArray {
    return this.questionForm.get('questions') as FormArray;
  }

  ngOnInit() {
    if (this.isEdit()) {
      this.populateForm(this.data.question);
    }
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  addQuestion(questionData?: Partial<QuestionFormData>) {
    const defaultOptions = [
      { english: '', hindi: '' },
      { english: '', hindi: '' },
      { english: '', hindi: '' },
      { english: '', hindi: '' }
    ];

    const questionGroup = this.fb.group({
      question: this.fb.group({
        english: [questionData?.question?.english || '', Validators.required],
        hindi: [questionData?.question?.hindi || '']
      }),
      description: this.fb.group({
        english: [questionData?.description?.english || ''],
        hindi: [questionData?.description?.hindi || '']
      }),
      options: this.fb.array(
        (questionData?.options || defaultOptions).map((opt: any) => 
          this.fb.group({
            english: [opt.english || '', Validators.required],
            hindi: [opt.hindi || '']
          })
        )
      ),
      correctAnswer: [questionData?.correctAnswer ?? 0, [Validators.required, Validators.min(0), Validators.max(3)]],
      tags: [questionData?.tags || []]
    });

    const questionIndex = this.questions.length;
    this.questions.push(questionGroup);
    
    // Initialize language section visibility - BOTH VISIBLE BY DEFAULT
    this.languageSectionVisibility[questionIndex] = {
      english: true,  // English is visible by default
      hindi: true     // Hindi is also visible by default
    };

    // Initialize tag search for this question
    this.tagSearchQuery[questionIndex] = '';
    this.filteredTags[questionIndex] = [...this.availableTags];

    // Set required validators based on language visibility
    this.updateValidatorsForQuestion(questionIndex);
  }

  removeQuestion(index: number) {
    this.questions.removeAt(index);
    // Remove from language visibility tracking
    delete this.languageSectionVisibility[index];
    // Remove from tag search tracking
    delete this.tagSearchQuery[index];
    delete this.filteredTags[index];
    // Reindex remaining questions
    this.reindexLanguageVisibility(index);
  }

  private reindexLanguageVisibility(removedIndex: number) {
    const newVisibility: { [key: number]: any } = {};
    const newTagSearch: { [key: number]: string } = {};
    const newFilteredTags: { [key: number]: TagResponse[] } = {};
    
    Object.keys(this.languageSectionVisibility).forEach(key => {
      const numKey = parseInt(key);
      if (numKey > removedIndex) {
        newVisibility[numKey - 1] = this.languageSectionVisibility[numKey];
        newTagSearch[numKey - 1] = this.tagSearchQuery[numKey];
        newFilteredTags[numKey - 1] = this.filteredTags[numKey];
      } else if (numKey < removedIndex) {
        newVisibility[numKey] = this.languageSectionVisibility[numKey];
        newTagSearch[numKey] = this.tagSearchQuery[numKey];
        newFilteredTags[numKey] = this.filteredTags[numKey];
      }
    });
    
    this.languageSectionVisibility = newVisibility;
    this.tagSearchQuery = newTagSearch;
    this.filteredTags = newFilteredTags;
  }

  getOptions(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('options') as FormArray;
  }

  getQuestionControl(index: number, language: 'english' | 'hindi'): FormControl {
    return this.questions.at(index).get(`question.${language}`) as FormControl;
  }

  getDescriptionControl(index: number, language: 'english' | 'hindi'): FormControl {
    return this.questions.at(index).get(`description.${language}`) as FormControl;
  }

  getOptionControl(questionIndex: number, optionIndex: number, language: 'english' | 'hindi'): FormControl {
    const optionsArray = this.getOptions(questionIndex);
    return optionsArray.at(optionIndex).get(language) as FormControl;
  }

  getCorrectAnswerControl(index: number): FormControl {
    return this.questions.at(index).get('correctAnswer') as FormControl;
  }

  getTagsControl(index: number): FormControl {
    return this.questions.at(index).get('tags') as FormControl;
  }

  // Language section visibility methods
  showEnglishSection(questionIndex: number): boolean {
    return this.languageSectionVisibility[questionIndex]?.english || false;
  }

  showHindiSection(questionIndex: number): boolean {
    return this.languageSectionVisibility[questionIndex]?.hindi || false;
  }

  removeLanguageSection(questionIndex: number, language: 'english' | 'hindi') {
    // Don't allow removing if it's the last language
    const hasEnglish = this.showEnglishSection(questionIndex);
    const hasHindi = this.showHindiSection(questionIndex);
    
    if ((language === 'english' && !hasHindi) || (language === 'hindi' && !hasEnglish)) {
      this.snackBar.open(`Cannot remove ${language} as it's the only language remaining`, 'Close', { duration: 3000 });
      return;
    }
    
    this.languageSectionVisibility[questionIndex][language] = false;
    this.updateValidatorsForQuestion(questionIndex);
  }

  addLanguageSection(questionIndex: number) {
    // Determine which language to add
    const langToAdd = !this.showEnglishSection(questionIndex) ? 'english' : 'hindi';
    this.languageSectionVisibility[questionIndex][langToAdd] = true;
    this.updateValidatorsForQuestion(questionIndex);
  }

  private updateValidatorsForQuestion(questionIndex: number) {
    const questionGroup = this.questions.at(questionIndex);
    const hasEnglish = this.showEnglishSection(questionIndex);
    const hasHindi = this.showHindiSection(questionIndex);

    // At least one language must be visible
    if (!hasEnglish && !hasHindi) {
      // This shouldn't happen, but if it does, add English back
      this.languageSectionVisibility[questionIndex].english = true;
      return;
    }

    // Update question validators
    const englishQuestionControl = this.getQuestionControl(questionIndex, 'english');
    if (hasEnglish) {
      englishQuestionControl.setValidators([Validators.required]);
    } else {
      englishQuestionControl.clearValidators();
      englishQuestionControl.setValue(''); // Clear value when removed
    }
    englishQuestionControl.updateValueAndValidity();

    // Hindi question is optional even when visible
    const hindiQuestionControl = this.getQuestionControl(questionIndex, 'hindi');
    if (!hasHindi) {
      hindiQuestionControl.setValue(''); // Clear value when removed
    }

    // Update option validators for English
    if (hasEnglish) {
      this.getOptions(questionIndex).controls.forEach((option, index) => {
        const englishOptionControl = this.getOptionControl(questionIndex, index, 'english');
        englishOptionControl.setValidators([Validators.required]);
        englishOptionControl.updateValueAndValidity();
      });
    } else {
      this.getOptions(questionIndex).controls.forEach((option, index) => {
        const englishOptionControl = this.getOptionControl(questionIndex, index, 'english');
        englishOptionControl.clearValidators();
        englishOptionControl.setValue(''); // Clear value when removed
        englishOptionControl.updateValueAndValidity();
      });
    }

    // Hindi options are always optional
    this.getOptions(questionIndex).controls.forEach((option, index) => {
      const hindiOptionControl = this.getOptionControl(questionIndex, index, 'hindi');
      if (!hasHindi) {
        hindiOptionControl.setValue(''); // Clear value when removed
      }
      // Hindi options are never required
      hindiOptionControl.clearValidators();
      hindiOptionControl.updateValueAndValidity();
    });

    // Update description validators (both are optional)
    if (!hasEnglish) {
      this.getDescriptionControl(questionIndex, 'english').setValue('');
    }
    if (!hasHindi) {
      this.getDescriptionControl(questionIndex, 'hindi').setValue('');
    }

    // Update form group validators
    questionGroup.updateValueAndValidity();
  }

  // Tag search methods
  filterTags(questionIndex: number) {
  const searchQuery = this.tagSearchQuery[questionIndex]?.toLowerCase().trim();
  
  if (!searchQuery) {
    this.filteredTags[questionIndex] = [...this.availableTags];
    return;
  }

  const filtered = this.availableTags.filter(tag => {
    const tagString = tag.tag.toLowerCase();
    
    // Check for exact match
    if (tagString === searchQuery) return true;
    
    // Check if any part of the tag contains the search query
    if (tagString.includes(searchQuery)) return true;
    
    // Check individual levels
    const levels = tagString.split('/');
    for (const level of levels) {
      if (level.includes(searchQuery)) return true;
    }
    
    // Check individual words within levels
    for (const level of levels) {
      const words = level.split(/[-_\s]+/);
      for (const word of words) {
        if (word.includes(searchQuery)) return true;
      }
    }
    
    return false;
  });

  // Sort results
  this.filteredTags[questionIndex] = filtered.sort((a, b) => {
    const aTag = a.tag.toLowerCase();
    const bTag = b.tag.toLowerCase();
    
    // Exact match first
    if (aTag === searchQuery) return -1;
    if (bTag === searchQuery) return 1;
    
    // Starts with search query
    const aStarts = aTag.startsWith(searchQuery);
    const bStarts = bTag.startsWith(searchQuery);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    
    // Check which has the search query earlier
    const aIndex = aTag.indexOf(searchQuery);
    const bIndex = bTag.indexOf(searchQuery);
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    
    // Check if any level exactly matches the search query
    const aLevels = aTag.split('/');
    const bLevels = bTag.split('/');
    for (let i = 0; i < Math.min(aLevels.length, bLevels.length); i++) {
      if (aLevels[i].includes(searchQuery) && !bLevels[i].includes(searchQuery)) return -1;
      if (!aLevels[i].includes(searchQuery) && bLevels[i].includes(searchQuery)) return 1;
    }
    
    // Alphabetical
    return aTag.localeCompare(bTag);
  });
}

onTagSearchInput(event: any, questionIndex: number) {
  this.tagSearchQuery[questionIndex] = event.target.value;
  this.filterTags(questionIndex);
}


  clearTagSearch(questionIndex: number) {
  this.tagSearchQuery[questionIndex] = '';
  this.filterTags(questionIndex);
  
  // Focus back on the search input
  setTimeout(() => {
    const searchInputs = this.tagSearchInputs.toArray();
    if (searchInputs[questionIndex]) {
      searchInputs[questionIndex].nativeElement.focus();
    }
  });
}

// Update the isExactMatch method
isExactMatch(tag: string, searchQuery: string | undefined): boolean {
  if (!searchQuery) return false;
  return tag.toLowerCase() === searchQuery.toLowerCase().trim();
}

  populateForm(question: Question) {
    this.clearAllQuestions();
    
    // Convert Question to QuestionFormData
    const questionData: QuestionFormData = {
      question: {
        english: question.question?.english || '',
        hindi: question.question?.hindi || ''
      },
      description: {
        english: question.description?.english || '',
        hindi: question.description?.hindi || ''
      },
      options: (question.options || []).map(opt => ({
        english: opt.english || '',
        hindi: opt.hindi || ''
      })),
      correctAnswer: question.correctAnswer || 0,
      tags: question.tags || []
    };
    
    this.addQuestion(questionData);
  }

  clearAllQuestions() {
    while (this.questions.length > 0) {
      this.questions.removeAt(0);
    }
    this.languageSectionVisibility = {};
    this.tagSearchQuery = {};
    this.filteredTags = {};
  }

  // Add Tag Dialog methods
  openAddTagDialog(questionIndex: number) {
    this.tagSelects?.forEach(select => select.close());
    this.currentQuestionIndexForTag = questionIndex;
    this.addTagForm.reset();
    
    this.addTagDialogRef = this.dialog.open(this.addTagDialogTemplate, {
      width: '450px',
      maxWidth: '90vw',
      panelClass: 'add-tag-dialog-panel',
      autoFocus: false
    });

    this.addTagDialogRef.afterClosed().subscribe(() => {
      this.currentQuestionIndexForTag = null;
    });
  }

  closeAddTagDialog() {
    if (this.addTagDialogRef) {
      this.addTagDialogRef.close();
    }
  }

  onAddTagSubmit() {
    if (this.addTagForm.valid && this.currentQuestionIndexForTag !== null) {
      this.addTagLoading.set(true);
      const formData = this.addTagForm.value;

      this.tagService.createTag(formData).subscribe({
        next: (response: any) => {
          const newTag: TagResponse = response.tag || response;
          const questionIndex = this.currentQuestionIndexForTag;

          if (!newTag?._id || questionIndex === null) {
            this.snackBar.open('Tag was created but could not be assigned to the question', 'Close', { duration: 3000 });
            this.addTagLoading.set(false);
            return;
          }

          // Refresh tags list from API
          this.tagService.getTags().subscribe({
            next: (tags) => {
              this.availableTags = tags;
              
              // Update filtered tags for all questions
              Object.keys(this.filteredTags).forEach(key => {
                const index = parseInt(key);
                this.filteredTags[index] = [...this.availableTags];
              });
              
              // Get current tags for the question
              const currentTags = this.getTagsControl(questionIndex).value || [];
              
              // Add the new tag to the question's tags
              const updatedTags = currentTags.includes(newTag._id)
                ? currentTags
                : [...currentTags, newTag._id];
              this.getTagsControl(questionIndex).setValue(updatedTags);
              
              this.snackBar.open('Tag created and added to question successfully!', 'Close', { duration: 3000 });
              this.closeAddTagDialog();
              this.addTagLoading.set(false);
            },
            error: (error) => {
              console.error('Error refreshing tags:', error);
              // Fallback to manual addition
              this.availableTags = [...this.availableTags, newTag];
              Object.keys(this.filteredTags).forEach(key => {
                const index = parseInt(key);
                this.filteredTags[index] = [...this.availableTags];
              });
              const currentTags = this.getTagsControl(questionIndex).value || [];
              this.getTagsControl(questionIndex).setValue(
                currentTags.includes(newTag._id) ? currentTags : [...currentTags, newTag._id]
              );
              this.snackBar.open('Tag created and added to question successfully!', 'Close', { duration: 3000 });
              this.closeAddTagDialog();
              this.addTagLoading.set(false);
            }
          });
        },
        error: (error) => {
          console.error('Error creating tag:', error);
          this.snackBar.open(error.error?.message || 'Error creating tag', 'error');
          this.addTagLoading.set(false);
        }
      });
    }
  }

  isAddTagFieldInvalid(fieldName: string): boolean {
    const field = this.addTagForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  // Drag and drop handlers
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileUpload(files[0]);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.handleFileUpload(file);
    }
  }

  async handleFileUpload(file: File) {
    if (/\.docx?$/i.test(file.name)) {
      this.snackBar.open('DOCX files must be uploaded from the Question Bank import section.', 'Close', { duration: 5000 });
      return;
    }

    if (!file.type.includes('text/plain')) {
      this.snackBar.open('Please upload only TXT files.', 'Close', { duration: 3000 });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.snackBar.open('File size should be less than 5MB', 'Close', { duration: 3000 });
      return;
    }

    this.fileUploadLoading.set(true);

    try {
      const text = await this.readTextFile(file);
      const questions = this.parseQuestionsFromText(text);
      
      if (questions.length > 0) {
        this.addQuestionsFromFile(questions);
        this.snackBar.open(`Successfully imported ${questions.length} questions from file`, 'Close', { duration: 3000 });
      } else {
        this.snackBar.open('No questions found in the file. Please check the format.', 'Close', { duration: 5000 });
      }
    } catch (error) {
      console.error('Error reading file:', error);
      this.snackBar.open('Error reading file. Please try again with a different file.', 'Close', { duration: 3000 });
    } finally {
      this.fileUploadLoading.set(false);
    }
  }

  readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      
      reader.onerror = (e) => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file, 'UTF-8');
    });
  }

  // Helper to strip HTML for plain text
  private stripHtml(html: string | undefined): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  parseQuestionsFromText(text: string): QuestionFormData[] {
    const questions: QuestionFormData[] = [];
    const questionMap = new Map<number, { english?: any; hindi?: any }>();
    
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Match English questions: Q1E. [question text]
      const englishMatch = trimmedLine.match(/^Q(\d+)E\.\s*(.+)/i);
      if (englishMatch) {
        const questionNumber = parseInt(englishMatch[1]);
        const content = englishMatch[2];
        
        const parsedData = this.parseQuestionLine(content);
        if (parsedData) {
          if (!questionMap.has(questionNumber)) {
            questionMap.set(questionNumber, {});
          }
          questionMap.get(questionNumber)!.english = parsedData;
        }
      }
      
      // Match Hindi questions: Q1H. [question text]
      const hindiMatch = trimmedLine.match(/^Q(\d+)H\.\s*(.+)/i);
      if (hindiMatch) {
        const questionNumber = parseInt(hindiMatch[1]);
        const content = hindiMatch[2];
        
        const parsedData = this.parseHindiQuestionLine(content);
        if (parsedData) {
          if (!questionMap.has(questionNumber)) {
            questionMap.set(questionNumber, {});
          }
          questionMap.get(questionNumber)!.hindi = parsedData;
        }
      }
    });

    // Combine English and Hindi data
    questionMap.forEach((data, questionNumber) => {
      if (data.english) {
        const combinedQuestion: QuestionFormData = {
          question: {
            english: data.english.question || '',
            hindi: data.hindi?.question || ''
          },
          description: {
            english: data.english.description || '',
            hindi: data.hindi?.description || ''
          },
          options: this.combineOptions(data.english.options || [], data.hindi?.options || []),
          correctAnswer: data.english.correctAnswer ?? 0,
          tags: []
        };
        
        if (this.isQuestionComplete(combinedQuestion)) {
          questions.push(combinedQuestion);
        }
      }
    });

    // Sort by question number
    const sortedQuestions = questions.sort((a, b) => {
      const aNum = this.getQuestionNumber(a, questionMap);
      const bNum = this.getQuestionNumber(b, questionMap);
      return aNum - bNum;
    });

    return sortedQuestions;
  }

  private getQuestionNumber(question: QuestionFormData, questionMap: Map<number, any>): number {
    for (const [num, data] of questionMap.entries()) {
      if (data.english?.question === question.question.english) {
        return num;
      }
    }
    return 0;
  }

  private combineOptions(englishOptions: string[], hindiOptions: string[]): Array<{english: string, hindi: string}> {
    const combined = [];
    for (let i = 0; i < 4; i++) {
      combined.push({
        english: englishOptions[i] || '',
        hindi: hindiOptions[i] || ''
      });
    }
    return combined;
  }

  parseQuestionLine(content: string): any {
    const cansMatch = content.match(/CANS?\.\s*([A-D])(?:\s|\.|$)/i);
    if (!cansMatch) return null;
    
    const correctAnswer = cansMatch[1].toUpperCase().charCodeAt(0) - 65;
    let processedContent = content.substring(0, cansMatch.index).trim();
    
    let description = '';
    const descMatch = processedContent.match(/DESC?\.\s*(.+?)(?=\s*CANS?\.|$)/i);
    if (descMatch) {
      description = descMatch[1].trim();
      processedContent = processedContent.substring(0, descMatch.index).trim();
    }
    
    const questionData = this.extractQuestionAndOptions(processedContent);
    
    if (!questionData) return null;
    
    return {
      question: questionData.question,
      description: description,
      options: questionData.options,
      correctAnswer: correctAnswer
    };
  }

  isQuestionComplete(question: QuestionFormData): boolean {
    const hasEnglishQuestion = !!question.question.english && question.question.english.trim().length > 0;
    const hasOptions = question.options.filter(opt => 
      !!opt.english && opt.english.trim().length > 0
    ).length >= 2;

    return hasEnglishQuestion && hasOptions;
  }

  addQuestionsFromFile(questions: QuestionFormData[]) {
    if (!this.isEdit() || this.questions.length === 0) {
      this.clearAllQuestions();
    }
    
    questions.forEach((questionData) => {
      if (this.isQuestionComplete(questionData)) {
        this.addQuestion(questionData);
      }
    });

    this.questionForm.updateValueAndValidity();
  }

  parseHindiQuestionLine(content: string): any {
    let correctAnswer = 0;
    let processedContent = content;
    
    const cansMatch = content.match(/CANS?\.\s*([A-D])(?:\s|\.|$)/i);
    if (cansMatch) {
      correctAnswer = cansMatch[1].toUpperCase().charCodeAt(0) - 65;
      processedContent = content.substring(0, cansMatch.index).trim();
    } else {
      correctAnswer = 0;
    }
    
    let description = '';
    const descMatch = processedContent.match(/DESC?\.\s*(.+?)(?=\s*CANS?\.|$)/i);
    if (descMatch) {
      description = descMatch[1].trim();
      processedContent = processedContent.substring(0, descMatch.index).trim();
    }
    
    const questionData = this.extractHindiQuestionAndOptions(processedContent);
    
    if (!questionData) return null;
    
    return {
      question: questionData.question,
      description: description,
      options: questionData.options,
      correctAnswer: correctAnswer
    };
  }

  extractHindiQuestionAndOptions(content: string): { question: string; options: string[] } | null {
    const options = ['', '', '', ''];
    let questionText = '';
    
    const optionPattern = /(A\.|B\.|C\.|D\.)\s*([^A-Z]*?(?=(?:A\.|B\.|C\.|D\.|DESC\.|CANS\.|$)))/gi;
    
    let matches: RegExpExecArray | null;
    const foundOptions: { marker: string, text: string }[] = [];
    
    while ((matches = optionPattern.exec(content)) !== null) {
      const marker = matches[1];
      const text = matches[2].trim();
      foundOptions.push({ marker, text });
    }
    
    if (foundOptions.length === 0) {
      return this.extractQuestionAndOptions(content);
    }
    
    const firstOptionIndex = content.indexOf(foundOptions[0].marker);
    if (firstOptionIndex !== -1) {
      questionText = content.substring(0, firstOptionIndex).trim();
    }
    
    foundOptions.forEach(opt => {
      const index = opt.marker.charCodeAt(0) - 65;
      if (index >= 0 && index < 4) {
        let cleanText = opt.text
          .replace(/\s*DESC\..*$/i, '')
          .replace(/\s*CANS\..*$/i, '')
          .trim();
        options[index] = cleanText;
      }
    });
    
    return {
      question: questionText,
      options: options
    };
  }

  extractQuestionAndOptions(content: string): { question: string; options: string[] } | null {
    const options = ['', '', '', ''];
    let questionText = '';
    
    const optionMarkers = ['A.', 'B.', 'C.', 'D.'];
    const markerPositions: { marker: string, index: number }[] = [];
    
    optionMarkers.forEach(marker => {
      const index = content.indexOf(marker);
      if (index !== -1) {
        markerPositions.push({ marker, index });
      }
    });
    
    if (markerPositions.length === 0) return null;
    
    markerPositions.sort((a, b) => a.index - b.index);
    questionText = content.substring(0, markerPositions[0].index).trim();
    
    for (let i = 0; i < markerPositions.length; i++) {
      const currentMarker = markerPositions[i];
      const nextMarker = i < markerPositions.length - 1 ? markerPositions[i + 1] : null;
      
      const startIndex = currentMarker.index + currentMarker.marker.length;
      let endIndex = content.length;
      
      if (nextMarker) {
        endIndex = nextMarker.index;
      } else {
        const descIndex = content.indexOf('DESC', startIndex);
        const cansIndex = content.indexOf('CANS', startIndex);
        
        const possibleEnds = [descIndex, cansIndex].filter(idx => idx !== -1);
        if (possibleEnds.length > 0) {
          endIndex = Math.min(...possibleEnds);
        }
      }
      
      let optionText = content.substring(startIndex, endIndex).trim();
      optionText = optionText
        .replace(/\s*DESC\..*$/i, '')
        .replace(/\s*CANS\..*$/i, '')
        .trim();
      
      const optionIndex = currentMarker.marker.charCodeAt(0) - 65;
      if (optionIndex >= 0 && optionIndex < 4) {
        options[optionIndex] = optionText;
      }
    }
    
    return {
      question: questionText,
      options: options
    };
  }

  onSubmit() {
    if (this.questionForm.valid && this.questions.length > 0) {
      this.loading.set(true);
      
      const formData = this.questionForm.value;
      
      // Convert form data to backend format
      const questionsData = formData.questions.map((q: any) => ({
        question: {
          english: q.question.english || '',
          hindi: q.question.hindi || ''
        },
        description: {
          english: q.description?.english || '',
          hindi: q.description?.hindi || ''
        },
        options: q.options.map((opt: any, index: number) => ({
          english: opt.english || '',
          hindi: opt.hindi || ''
        })),
        correctAnswer: q.correctAnswer,
        tags: q.tags || []
      }));

      const requestPayload = { questions: questionsData };

      console.log('Submitting questions:', requestPayload);

      if (this.isEdit()) {
        const questionId = this.data.question.uid || this.data.question._id;
        this.questionService.updateQuestion(questionId!, questionsData[0]).subscribe({
          next: () => {
            this.snackBar.open('Question updated successfully', 'Close', { duration: 3000 });
            this.dialogRef.close(true);
          },
          error: (error) => {
            this.loading.set(false);
            console.error('Error:', error);
            this.snackBar.open(`Error updating question: ${error.error?.message || 'Unknown error'}`, 'Close', { duration: 3000 });
          }
        });
      } else {
        this.questionService.createQuestions(requestPayload).subscribe({
          next: () => {
            this.snackBar.open('Questions created successfully', 'Close', { duration: 3000 });
            this.dialogRef.close(true);
          },
          error: (error) => {
            this.loading.set(false);
            console.error('Error:', error);
            this.snackBar.open(`Error creating questions: ${error.error?.message || 'Unknown error'}`, 'Close', { duration: 3000 });
          }
        });
      }
    } else if (this.questions.length === 0) {
      this.snackBar.open('Please add at least one question', 'Close', { duration: 3000 });
    } else {
      console.log('Form errors:', this.questionForm.errors);
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
    }
  }

  private logFormErrors(form: FormGroup | FormArray, path: string = '') {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.logFormErrors(control, path + key + '.');
      } else {
        if (control?.errors) {
          console.log(path + key, control.errors);
        }
      }
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
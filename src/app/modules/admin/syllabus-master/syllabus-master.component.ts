import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, AbstractControl, ValidationErrors } from '@angular/forms';
import { AdminService } from '../../../shared/services/admin.service';
import { HttpClientModule } from '@angular/common/http';
import { DirectoryExplorerComponent } from '../../../shared/components/directory-explorer/directory-explorer.component';

// Custom validator for at least one language
export function atLeastOneLanguageValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  
  if (!value) {
    return null;
  }
  
  const hasEnglish = value.fileNameEnglish || value.fileLinkEnglish;
  const hasHindi = value.fileNameHindi || value.fileLinkHindi;
  
  if (!hasEnglish && !hasHindi) {
    return { atLeastOneLanguage: true };
  }
  
  // Validate that if fileName exists, fileLink must also exist
  if (value.fileNameEnglish && !value.fileLinkEnglish) {
    return { englishLinkRequired: true };
  }
  
  if (value.fileNameHindi && !value.fileLinkHindi) {
    return { hindiLinkRequired: true };
  }
  
  return null;
}

@Component({
  selector: 'app-syllabus-master',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    HttpClientModule,
    DirectoryExplorerComponent
  ],
  templateUrl: './syllabus-master.component.html',
  styleUrls: ['./syllabus-master.component.css']
})
export class SyllabusMasterComponent implements OnInit {
  // Main tabs - Added 'videos' option
  activeTab: 'upsc-syllabus' | 'topicwise' | 'videos' = 'upsc-syllabus';
  
  // Syllabus subtabs
  syllabusSubTab: 'prelims' | 'mains' = 'prelims';
  
  // Topicwise subtabs
  topicwiseSubTab: 'gs1' | 'gs2' | 'gs3' | 'gs4' | 'essay' | 'optional' = 'gs1';
  
  // Video subtabs
  videoSubTab: 'gs1' | 'gs2' | 'gs3' | 'gs4' | 'essay' | 'strategy' | 'current' | 'mock' = 'gs1';
  
  // Forms (keep existing)
  prelimsForm: FormGroup;
  mainsForm: FormGroup;
  
  // Data storage (keep existing)
  prelimsData: any = {};
  mainsData: any = {};
  
  // Edit states (keep existing)
  isEditingPrelims = false;
  isEditingMains = false;
  
  // Computed properties (keep existing)
  get hasPrelimsData(): boolean {
    return (this.prelimsData.gs1 && (this.prelimsData.gs1.fileNameEnglish || this.prelimsData.gs1.fileNameHindi)) ||
           (this.prelimsData.gs2 && (this.prelimsData.gs2.fileNameEnglish || this.prelimsData.gs2.fileNameHindi));
  }
  
  get hasMainsData(): boolean {
    return (this.mainsData.gs1 && (this.mainsData.gs1.fileNameEnglish || this.mainsData.gs1.fileNameHindi)) ||
           (this.mainsData.gs2 && (this.mainsData.gs2.fileNameEnglish || this.mainsData.gs2.fileNameHindi)) ||
           (this.mainsData.gs3 && (this.mainsData.gs3.fileNameEnglish || this.mainsData.gs3.fileNameHindi)) ||
           (this.mainsData.gs4 && (this.mainsData.gs4.fileNameEnglish || this.mainsData.gs4.fileNameHindi)) ||
           (this.mainsData.essay && (this.mainsData.essay.fileNameEnglish || this.mainsData.essay.fileNameHindi)) ||
           (this.mainsData.optionalSubjects && this.mainsData.optionalSubjects.length > 0);
  }

  isLoading = false;
  message: string = '';
  messageType: 'success' | 'error' = 'success';

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService
  ) {
    this.prelimsForm = this.createPrelimsForm();
    this.mainsForm = this.createMainsForm();
  }

  ngOnInit() {
    this.loadPrelimsData();
    this.loadMainsData();
  }

  // Main Tab Management - Added 'videos'
  switchTab(tab: 'upsc-syllabus' | 'topicwise' | 'videos'): void {
    this.activeTab = tab;
    if (tab === 'upsc-syllabus') {
      // Load data when switching to syllabus tab
      if (this.syllabusSubTab === 'prelims') {
        this.loadPrelimsData();
      } else {
        this.loadMainsData();
      }
    }
    // For topicwise and videos tabs, data is loaded by the DirectoryExplorer component
  }

  // Keep existing methods exactly as they are
  switchSyllabusSubTab(subtab: 'prelims' | 'mains'): void {
    this.syllabusSubTab = subtab;
    if (subtab === 'prelims') {
      this.loadPrelimsData();
    } else {
      this.loadMainsData();
    }
  }

  switchTopicwiseSubTab(subtab: 'gs1' | 'gs2' | 'gs3' | 'gs4' | 'essay' | 'optional'): void {
    this.topicwiseSubTab = subtab;
  }

  // New method for video subtabs
  switchVideoSubTab(subtab: 'gs1' | 'gs2' | 'gs3' | 'gs4' | 'essay' | 'strategy' | 'current' | 'mock'): void {
    this.videoSubTab = subtab;
  }

  // Edit Mode Management (keep existing)
  enablePrelimsEdit(): void {
    this.isEditingPrelims = true;
    this.populatePrelimsForm(this.prelimsData);
  }

  enableMainsEdit(): void {
    this.isEditingMains = true;
    this.populateMainsForm(this.mainsData);
  }

  cancelPrelimsEdit(): void {
    this.isEditingPrelims = false;
    this.prelimsForm.reset();
  }

  cancelMainsEdit(): void {
    this.isEditingMains = false;
    this.mainsForm.reset();
    this.optionalSubjects.clear();
  }

  // KEEP ALL YOUR EXISTING METHODS EXACTLY AS THEY ARE
  // PRELIMS FORM
  createPrelimsForm(): FormGroup {
    return this.fb.group({
      gs1: this.fb.group({
        fileNameEnglish: [''],
        fileLinkEnglish: ['', [Validators.pattern('https?://.+')]],
        descriptionEnglish: [''],
        fileNameHindi: [''],
        fileLinkHindi: ['', [Validators.pattern('https?://.+')]],
        descriptionHindi: ['']
      }, { validators: atLeastOneLanguageValidator }),
      gs2: this.fb.group({
        fileNameEnglish: [''],
        fileLinkEnglish: ['', [Validators.pattern('https?://.+')]],
        descriptionEnglish: [''],
        fileNameHindi: [''],
        fileLinkHindi: ['', [Validators.pattern('https?://.+')]],
        descriptionHindi: ['']
      }, { validators: atLeastOneLanguageValidator })
    });
  }

  get prelimsGs1Form(): FormGroup { return this.prelimsForm.get('gs1') as FormGroup; }
  get prelimsGs2Form(): FormGroup { return this.prelimsForm.get('gs2') as FormGroup; }

  // MAINS FORM
  createMainsForm(): FormGroup {
    return this.fb.group({
      gs1: this.fb.group({
        fileNameEnglish: [''],
        fileLinkEnglish: ['', [Validators.pattern('https?://.+')]],
        descriptionEnglish: [''],
        fileNameHindi: [''],
        fileLinkHindi: ['', [Validators.pattern('https?://.+')]],
        descriptionHindi: ['']
      }, { validators: atLeastOneLanguageValidator }),
      gs2: this.fb.group({
        fileNameEnglish: [''],
        fileLinkEnglish: ['', [Validators.pattern('https?://.+')]],
        descriptionEnglish: [''],
        fileNameHindi: [''],
        fileLinkHindi: ['', [Validators.pattern('https?://.+')]],
        descriptionHindi: ['']
      }, { validators: atLeastOneLanguageValidator }),
      gs3: this.fb.group({
        fileNameEnglish: [''],
        fileLinkEnglish: ['', [Validators.pattern('https?://.+')]],
        descriptionEnglish: [''],
        fileNameHindi: [''],
        fileLinkHindi: ['', [Validators.pattern('https?://.+')]],
        descriptionHindi: ['']
      }, { validators: atLeastOneLanguageValidator }),
      gs4: this.fb.group({
        fileNameEnglish: [''],
        fileLinkEnglish: ['', [Validators.pattern('https?://.+')]],
        descriptionEnglish: [''],
        fileNameHindi: [''],
        fileLinkHindi: ['', [Validators.pattern('https?://.+')]],
        descriptionHindi: ['']
      }, { validators: atLeastOneLanguageValidator }),
      essay: this.fb.group({
        fileNameEnglish: [''],
        fileLinkEnglish: ['', [Validators.pattern('https?://.+')]],
        descriptionEnglish: [''],
        fileNameHindi: [''],
        fileLinkHindi: ['', [Validators.pattern('https?://.+')]],
        descriptionHindi: ['']
      }, { validators: atLeastOneLanguageValidator }),
      optionalSubjects: this.fb.array([])
    });
  }

  get mainsGs1Form(): FormGroup { return this.mainsForm.get('gs1') as FormGroup; }
  get mainsGs2Form(): FormGroup { return this.mainsForm.get('gs2') as FormGroup; }
  get mainsGs3Form(): FormGroup { return this.mainsForm.get('gs3') as FormGroup; }
  get mainsGs4Form(): FormGroup { return this.mainsForm.get('gs4') as FormGroup; }
  get mainsEssayForm(): FormGroup { return this.mainsForm.get('essay') as FormGroup; }
  get optionalSubjects(): FormArray { return this.mainsForm.get('optionalSubjects') as FormArray; }

  // Optional Subject Methods (keep existing)
  createOptionalSubject(): FormGroup {
    return this.fb.group({
      subjectName: ['', Validators.required],
      documents: this.fb.array([this.createDocument()])
    });
  }

  createDocument(): FormGroup {
    return this.fb.group({
      fileNameEnglish: [''],
      fileLinkEnglish: ['', [Validators.pattern('https?://.+')]],
      descriptionEnglish: [''],
      fileNameHindi: [''],
      fileLinkHindi: ['', [Validators.pattern('https?://.+')]],
      descriptionHindi: ['']
    }, { validators: atLeastOneLanguageValidator });
  }

  addOptionalSubject(): void {
    this.optionalSubjects.push(this.createOptionalSubject());
  }

  removeOptionalSubject(index: number): void {
    this.optionalSubjects.removeAt(index);
  }

  getDocuments(optionalSubjectIndex: number): FormArray {
    return this.optionalSubjects.at(optionalSubjectIndex).get('documents') as FormArray;
  }

  addDocument(optionalSubjectIndex: number): void {
    this.getDocuments(optionalSubjectIndex).push(this.createDocument());
  }

  removeDocument(optionalSubjectIndex: number, documentIndex: number): void {
    this.getDocuments(optionalSubjectIndex).removeAt(documentIndex);
  }

  // Data Loading (keep existing)
  loadPrelimsData(): void {
    this.isLoading = true;
    this.adminService.getSyllabus('prelims').subscribe({
      next: (data) => {
        this.prelimsData = data || {};
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading prelims data:', error);
        this.prelimsData = {};
        this.isLoading = false;
      }
    });
  }

  loadMainsData(): void {
    this.isLoading = true;
    this.adminService.getSyllabus('mains').subscribe({
      next: (data) => {
        this.mainsData = data || {};
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading mains data:', error);
        this.mainsData = {};
        this.isLoading = false;
      }
    });
  }

  populatePrelimsForm(data: any): void {
    ['gs1', 'gs2'].forEach((paper) => {
      if (data[paper]) {
        const paperForm = this.prelimsForm.get(paper) as FormGroup;
        paperForm.patchValue({
          fileNameEnglish: data[paper]?.fileNameEnglish || '',
          fileLinkEnglish: data[paper]?.fileLinkEnglish || '',
          descriptionEnglish: data[paper]?.descriptionEnglish || '',
          fileNameHindi: data[paper]?.fileNameHindi || '',
          fileLinkHindi: data[paper]?.fileLinkHindi || '',
          descriptionHindi: data[paper]?.descriptionHindi || ''
        });
      }
    });
  }

  populateMainsForm(data: any): void {
    // Clear existing optional subjects
    this.optionalSubjects.clear();

    // Populate GS papers and Essay
    ['essay', 'gs1', 'gs2', 'gs3', 'gs4'].forEach((paper) => {
      if (data[paper]) {
        const paperForm = this.mainsForm.get(paper) as FormGroup;
        paperForm.patchValue({
          fileNameEnglish: data[paper]?.fileNameEnglish || '',
          fileLinkEnglish: data[paper]?.fileLinkEnglish || '',
          descriptionEnglish: data[paper]?.descriptionEnglish || '',
          fileNameHindi: data[paper]?.fileNameHindi || '',
          fileLinkHindi: data[paper]?.fileLinkHindi || '',
          descriptionHindi: data[paper]?.descriptionHindi || ''
        });
      }
    });

    // Populate Optional Subjects
    if (data['optionalSubjects'] && Array.isArray(data['optionalSubjects'])) {
      data['optionalSubjects'].forEach((subjectData: any) => {
        const subject = this.createOptionalSubject();
        subject.patchValue({ subjectName: subjectData.subjectName });
        
        const documents = subject.get('documents') as FormArray;
        documents.clear();
        
        if (subjectData.documents && Array.isArray(subjectData.documents)) {
          subjectData.documents.forEach((doc: any) => {
            documents.push(this.fb.group({
              fileNameEnglish: [doc.fileNameEnglish || ''],
              fileLinkEnglish: [doc.fileLinkEnglish || ''],
              descriptionEnglish: [doc.descriptionEnglish || ''],
              fileNameHindi: [doc.fileNameHindi || ''],
              fileLinkHindi: [doc.fileLinkHindi || ''],
              descriptionHindi: [doc.descriptionHindi || '']
            }, { validators: atLeastOneLanguageValidator }));
          });
        }
        
        this.optionalSubjects.push(subject);
      });
    }
  }

  // Form Submission (keep existing)
  onSubmitPrelims(): void {
      this.isLoading = true;
      
      const payload = {
        gs1: this.prelimsGs1Form.value,
        gs2: this.prelimsGs2Form.value
      };

      this.adminService.saveSyllabus('prelims', payload).subscribe({
        next: (response) => {
          this.showMessage('Prelims syllabus saved successfully!', 'success');
          this.isLoading = false;
          this.isEditingPrelims = false;
          this.loadPrelimsData();
        },
        error: (error) => {
          console.error('Error saving prelims syllabus:', error);
          this.showMessage(error.error?.message || 'Error saving prelims syllabus', 'error');
          this.isLoading = false;
        }
      });
    // } else {
    //   this.markFormGroupTouched(this.prelimsForm);
    //   this.showLanguageValidationErrors(this.prelimsForm);
    // }
  }

  onSubmitMains(): void {
    // if (this.mainsForm.valid) {
      this.isLoading = true;
      
      // Build payload according to desired structure
      const payload: any = {
        gs1: this.mainsGs1Form.value,
        gs2: this.mainsGs2Form.value,
        gs3: this.mainsGs3Form.value,
        gs4: this.mainsGs4Form.value,
        essay: this.mainsEssayForm.value,
        optionalSubjects: []
      };

      // Build optional subjects as array
      this.optionalSubjects.controls.forEach((subjectGroup) => {
        const subjectData = {
          subjectName: subjectGroup.get('subjectName')?.value,
          documents: (subjectGroup.get('documents') as FormArray).controls.map(docGroup => docGroup.value)
        };
        payload.optionalSubjects.push(subjectData);
      });

      this.adminService.saveSyllabus('mains', payload).subscribe({
        next: (response) => {
          this.showMessage('Mains syllabus saved successfully!', 'success');
          this.isLoading = false;
          this.isEditingMains = false;
          this.loadMainsData();
        },
        error: (error) => {
          console.error('Error saving mains syllabus:', error);
          this.showMessage(error.error?.message || 'Error saving mains syllabus', 'error');
          this.isLoading = false;
        }
      });
    // } else {
    //   this.markFormGroupTouched(this.mainsForm);
    //   this.showLanguageValidationErrors(this.mainsForm);
    // }
  }

  // Utility Methods (keep existing)
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(group => {
          if (group instanceof FormGroup) {
            this.markFormGroupTouched(group);
          }
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }

  // Helper method for template
  getMainsControl(groupName: string, controlName: string): any {
    const group = this.mainsForm.get(groupName);
    return group ? group.get(controlName) : null;
  }

  // Helper to check if a form group has language validation errors
  hasLanguageError(formGroup: FormGroup): boolean {
    return formGroup.errors?.['atLeastOneLanguage'] || 
           formGroup.errors?.['englishLinkRequired'] || 
           formGroup.errors?.['hindiLinkRequired'];
  }

  getLanguageErrorMessage(formGroup: FormGroup): string {
    if (formGroup.errors?.['atLeastOneLanguage']) {
      return 'At least one language (English or Hindi) must be provided';
    }
    if (formGroup.errors?.['englishLinkRequired']) {
      return 'English file link is required when English file name is provided';
    }
    if (formGroup.errors?.['hindiLinkRequired']) {
      return 'Hindi file link is required when Hindi file name is provided';
    }
    return '';
  }

  // Helper methods for optional subject documents
  hasDocumentLanguageError(subjectIndex: number, documentIndex: number): boolean {
    const documentForm = this.getDocuments(subjectIndex).at(documentIndex) as FormGroup;
    return this.hasLanguageError(documentForm);
  }

  getDocumentLanguageErrorMessage(subjectIndex: number, documentIndex: number): string {
    const documentForm = this.getDocuments(subjectIndex).at(documentIndex) as FormGroup;
    return this.getLanguageErrorMessage(documentForm);
  }

  showLanguageValidationErrors(form: FormGroup): void {
    let errorMessage = 'Please fill all required fields correctly';
    
    const findLanguageErrors = (fg: FormGroup): string | null => {
      for (const key in fg.controls) {
        const control = fg.get(key);
        if (control instanceof FormGroup && this.hasLanguageError(control)) {
          return this.getLanguageErrorMessage(control);
        } else if (control instanceof FormArray) {
          for (let i = 0; i < control.length; i++) {
            const item = control.at(i);
            if (item instanceof FormGroup) {
              const err = findLanguageErrors(item);
              if (err) return err;
            }
          }
        }
      }
      return null;
    };
    
    const langError = findLanguageErrors(form);
    if (langError) {
      errorMessage = langError;
    }
    
    this.showMessage(errorMessage, 'error');
  }

  // Helper method to get form group
  getMainsFormGroup(groupName: string): FormGroup {
    return this.mainsForm.get(groupName) as FormGroup;
  }

  clearForm() {
  // Reset reactive form
  this.prelimsForm.reset();
  this.prelimsForm.markAsPristine();
  this.prelimsForm.markAsUntouched();

  // 🔴 ALSO reset prelimsData (THIS FIXES IT)
  this.prelimsData = {
    gs1: {
      fileNameEnglish: '',
      fileNameHindi: ''
    },
    gs2: {
      fileNameEnglish: '',
      fileNameHindi: ''
    }
  };
}

clearMainsForm() {
  // Reset the entire form to initial state
  this.mainsForm.reset();

  // Clear FormArray (IMPORTANT)
  const optionalSubjectsArray = this.mainsForm.get('optionalSubjects') as FormArray;
  optionalSubjectsArray.clear();

  // Reset form state
  this.mainsForm.markAsPristine();
  this.mainsForm.markAsUntouched();

  // ALSO reset mainsData used in hasMainsData
  this.mainsData = {
    gs1: { fileNameEnglish: '', fileNameHindi: '' },
    gs2: { fileNameEnglish: '', fileNameHindi: '' },
    gs3: { fileNameEnglish: '', fileNameHindi: '' },
    gs4: { fileNameEnglish: '', fileNameHindi: '' },
    essay: { fileNameEnglish: '', fileNameHindi: '' }
  };
}


}
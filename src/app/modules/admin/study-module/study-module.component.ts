// study-module.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ModuleService, Module, DirectoryContents } from '../../../shared/services/module.service';
import { ModuleTestService, ModuleTest } from '../../../shared/services/module-test.service';
import { QuestionService } from '../../../shared/services/question.service';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ModuleTestDialogComponent } from './module-test-dialog/module-test-dialog.component';

interface BreadcrumbItem {
  name: string;
  id: string;
  item?: Module;
}

@Component({
  selector: 'app-study-module',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './study-module.component.html',
  styleUrls: ['./study-module.component.css']
})
export class StudyModuleComponent implements OnInit {
  private moduleService = inject(ModuleService);
  private moduleTestService = inject(ModuleTestService);
  private questionService = inject(QuestionService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // Data
  modules: Module[] = [];
  currentItems: Module[] = [];
  currentItem: Module | null = null;
  moduleTests: ModuleTest[] = [];
  currentModuleForTests: Module | null = null;
  currentTest: ModuleTest | null = null;

  // Map to store test counts for each module
  moduleTestCounts: { [key: string]: number } = {};

  // UI State
  loading = false;
  showModuleList = true;
  reorderMode = false;

  // Modal states
  showModal = false;
  isEditing = false;
  showCreateFolderModal = false;
  showCreateFileModal = false;
  showEditFileModal = false;
  showRenameModal = false;
  showDeleteModal = false;
  showReorderConfirmModal = false;
  showTestManagementModal = false;
  showTestSubmissionsModal = false;
  showTestLeaderboardModal = false;

  // Form Data
  selectedModuleId: string | null = null;
  imageBase64: string | null = null;
  imagePreview: string | null = null;

  newFolderName = '';
  newFolderNameHi = '';
  newFileName = '';
  newFileNameHi = '';
  newFileLink = '';
  newFileDescription = '';

  editFileName = '';
  editFileNameHi = '';
  editFileLink = '';
  editFileDescription = '';
  renameNewName = '';
  renameNewNameHi = '';

  selectedItem: Module | null = null;

  // Test submissions data
  testSubmissions: any[] = [];
  testLeaderboard: any[] = [];

  // Messages
  errorMessage = '';
  successMessage = '';

  // Breadcrumbs
  breadcrumbs: BreadcrumbItem[] = [];
  navigationHistory: Module[] = [];

  // Store original order for reset
  private originalModuleOrder: Module[] = [];

  // Module Form
  moduleForm: FormGroup = this.fb.group({
    nameEnglish: ['', Validators.required],
    nameHindi: ['', Validators.required],
    icon: ['bi-book'],
    order: [0]
  });

  ngOnInit() {
    this.loadModules();
  }

  // ============ Module Loading ============
  loadModules() {
    this.loading = true;
    this.moduleService.getAdminModules().subscribe({
      next: (modules) => {
        this.modules = modules.sort((a, b) => a.order - b.order);
        this.originalModuleOrder = [...this.modules];
        // Load test counts for all modules
        this.loadAllModuleTestCounts();
        this.loading = false;
        this.clearMessages();
      },
      error: (error) => {
        this.showError('Failed to load modules', error);
      }
    });
  }

  // Load test counts for all modules
  loadAllModuleTestCounts() {
    this.modules.forEach(module => {
      this.loadModuleTestCount(module._id);
    });
  }

  // Load test count for a single module
  loadModuleTestCount(moduleId: string) {
    this.moduleTestService.getModuleTestsByModule(moduleId).subscribe({
      next: (tests) => {
        this.moduleTestCounts[moduleId] = tests.length;
        // If this is the current module's tests, update moduleTests
        if (this.currentModuleForTests && this.currentModuleForTests._id === moduleId) {
          this.moduleTests = tests;
        }
      },
      error: (error) => {
        // If no tests found or error, set count to 0
        this.moduleTestCounts[moduleId] = 0;
        console.error(`Error loading test count for module ${moduleId}:`, error);
      }
    });
  }

  // ============ Test Helper Methods ============
  getModuleTestCount(moduleId: string): number {
    return this.moduleTestCounts[moduleId] || 0;
  }

  getModulesWithTestsCount(): number {
    return this.modules.filter(m => this.getModuleTestCount(m._id) > 0).length;
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  getScorePercentage(score: number, total: number): number {
    return total > 0 ? Math.round((score / total) * 100) : 0;
  }

  getPassedCount(): number {
    return this.testSubmissions.filter(s => s.passed).length;
  }

  getFailedCount(): number {
    return this.testSubmissions.filter(s => !s.passed).length;
  }

  getAverageScore(): number {
    if (this.testSubmissions.length === 0) return 0;
    const total = this.testSubmissions.reduce((sum, s) => sum + this.getScorePercentage(s.score, s.totalQuestions), 0);
    return Math.round(total / this.testSubmissions.length);
  }

  // ============ Test Management Functions ============
  openTestManagement(module: Module) {
    this.currentModuleForTests = module;
    this.loadModuleTests(module._id);
    this.showTestManagementModal = true;
  }

  loadModuleTests(moduleId: string) {
    this.loading = true;
    this.moduleTestService.getModuleTestsByModule(moduleId).subscribe({
      next: (tests) => {
        this.moduleTests = tests;
        // Update the count in the map
        this.moduleTestCounts[moduleId] = tests.length;
        this.loading = false;
      },
      error: (error) => {
        this.showError('Failed to load tests', error);
        this.loading = false;
      }
    });
  }

  openCreateTestModalForModule() {
    const dialogRef = this.dialog.open(ModuleTestDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      maxHeight: '800px',
      panelClass: 'module-test-dialog-panel',
      autoFocus: false,
      data: {
        moduleId: this.currentModuleForTests?._id,
        test: null
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.currentModuleForTests) {
          this.loadModuleTests(this.currentModuleForTests._id);
          // Also update the count
          this.loadModuleTestCount(this.currentModuleForTests._id);
        }
        this.snackBar.open('Test created successfully', 'Close', { duration: 3000 });
      }
    });
  }

  editTest(test: ModuleTest) {
    const dialogRef = this.dialog.open(ModuleTestDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      maxHeight: '800px',
      panelClass: 'module-test-dialog-panel',
      autoFocus: false,
      data: {
        moduleId: this.currentModuleForTests?._id,
        test: test
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.currentModuleForTests) {
          this.loadModuleTests(this.currentModuleForTests._id);
          this.loadModuleTestCount(this.currentModuleForTests._id);
        }
        this.snackBar.open('Test updated successfully', 'Close', { duration: 3000 });
      }
    });
  }

  toggleTestStatus(test: ModuleTest) {
    const newStatus = !test.isActive;
    const action = newStatus ? 'activate' : 'deactivate';

    if (confirm(`Are you sure you want to ${action} this test?`)) {
      this.moduleTestService.toggleModuleTestActive(test._id, newStatus).subscribe({
        next: () => {
          this.snackBar.open(`Test ${action}d successfully`, 'Close', { duration: 3000 });
          if (this.currentModuleForTests) {
            this.loadModuleTests(this.currentModuleForTests._id);
            this.loadModuleTestCount(this.currentModuleForTests._id);
          }
        },
        error: (error) => {
          console.error('Error toggling test status:', error);
          this.snackBar.open(`Error ${action}ing test`, 'Close', { duration: 3000 });
        }
      });
    }
  }

  deleteTest(testId: string) {
    if (confirm('Are you sure you want to delete this test? This will also delete all submissions.')) {
      this.moduleTestService.deleteModuleTest(testId).subscribe({
        next: () => {
          this.snackBar.open('Test deleted successfully', 'Close', { duration: 3000 });
          if (this.currentModuleForTests) {
            this.loadModuleTests(this.currentModuleForTests._id);
            this.loadModuleTestCount(this.currentModuleForTests._id);
          }
        },
        error: (error) => {
          console.error('Error deleting test:', error);
          this.snackBar.open('Error deleting test', 'Close', { duration: 3000 });
        }
      });
    }
  }

  viewTestSubmissionsForModule(test: ModuleTest) {
    this.currentTest = test;
    this.loading = true;
    this.moduleTestService.getModuleTestSubmissions(test._id).subscribe({
      next: (submissions: any) => {
        this.testSubmissions = submissions;
        this.showTestSubmissionsModal = true;
        this.loading = false;
      },
      error: (error: any) => {
        this.showError('Failed to load submissions', error);
        this.loading = false;
      }
    });
  }

  // study-module.component.ts - Fix viewTestLeaderboardForModule

// study-module.component.ts - Fix viewTestLeaderboardForModule

viewTestLeaderboardForModule(test: ModuleTest) {
  this.currentTest = test;
  this.loading = true;
  
  // Get the module ID from currentModuleForTests or from the test
  const moduleId = this.currentModuleForTests?._id || test.moduleId;
  
  // If moduleId is undefined or null, show error
  if (!moduleId) {
    this.snackBar.open('Module ID not found for leaderboard', 'Close', { duration: 3000 });
    this.loading = false;
    return;
  }
  
  this.moduleTestService.getModuleTestLeaderboard(moduleId).subscribe({
    next: (response: any) => {
      this.testLeaderboard = response.leaderboard || [];
      this.showTestLeaderboardModal = true;
      this.loading = false;
    },
    error: (error: any) => {
      this.showError('Failed to load leaderboard', error);
      this.loading = false;
    }
  });
}

  exportSubmissionsCSV() {
    if (this.testSubmissions.length === 0) return;

    const headers = ['Name', 'Email', 'Phone', 'Score', 'Total Questions', 'Percentage', 'Time Taken', 'Passed', 'Submitted At'];
    const rows = this.testSubmissions.map((sub: any) => [
      sub.name,
      sub.email,
      sub.phone || '',
      sub.score,
      sub.totalQuestions,
      this.getScorePercentage(sub.score, sub.totalQuestions) + '%',
      this.formatTime(sub.timeTaken),
      sub.passed ? 'Yes' : 'No',
      new Date(sub.submittedAt).toLocaleString()
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-submissions-${this.currentTest?.title || 'export'}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // ============ Reorder Functions ============
  moveModuleUp(index: number) {
    if (index === 0) return;
    const temp = this.modules[index];
    this.modules[index] = this.modules[index - 1];
    this.modules[index - 1] = temp;
    this.updateModuleOrders();
  }

  moveModuleDown(index: number) {
    if (index === this.modules.length - 1) return;
    const temp = this.modules[index];
    this.modules[index] = this.modules[index + 1];
    this.modules[index + 1] = temp;
    this.updateModuleOrders();
  }

  moveModuleToTop(index: number) {
    if (index === 0) return;
    const module = this.modules[index];
    this.modules.splice(index, 1);
    this.modules.unshift(module);
    this.updateModuleOrders();
  }

  moveModuleToBottom(index: number) {
    if (index === this.modules.length - 1) return;
    const module = this.modules[index];
    this.modules.splice(index, 1);
    this.modules.push(module);
    this.updateModuleOrders();
  }

  private updateModuleOrders() {
    this.modules.forEach((module, index) => {
      module.order = index;
    });
  }

  toggleReorderMode() {
    this.reorderMode = !this.reorderMode;
    if (!this.reorderMode) {
      this.modules = [...this.originalModuleOrder];
    }
  }

  resetModuleOrder() {
    this.modules = [...this.originalModuleOrder];
    this.reorderMode = false;
    this.successMessage = 'Module order reset to original';
    setTimeout(() => this.successMessage = '', 3000);
  }

  saveModuleOrder() {
    this.loading = true;
    const reorderData = this.modules.map((module, index) => ({
      id: module._id,
      order: index
    }));

    const promises = reorderData.map(data =>
      this.moduleService.updateModuleOrder(data.id, data.order).toPromise()
    );

    Promise.all(promises).then(() => {
      this.loading = false;
      this.reorderMode = false;
      this.showReorderConfirmModal = true;
      this.successMessage = 'Module order updated successfully';
      this.originalModuleOrder = [...this.modules];
    }).catch((error) => {
      this.loading = false;
      this.showError('Failed to save module order', error);
      this.modules = [...this.originalModuleOrder];
    });
  }

  // ============ Navigation Functions ============
  navigateToModule(module: Module) {
    if (this.reorderMode) return;

    this.showModuleList = false;
    this.currentItem = module;
    this.updateBreadcrumbs();
    this.loadDirectoryContents(module._id);
    // Load test count for this module
    this.loadModuleTestCount(module._id);
  }

  navigateTo(item: Module) {
    if (item.type === 'folder') {
      if (this.currentItem) {
        this.navigationHistory.push(this.currentItem);
      }
      this.currentItem = item;
      this.updateBreadcrumbs();
      this.loadDirectoryContents(item._id);
    } else if (item.type === 'file') {
      this.openFile(item);
    }
  }

  navigateUp() {
    if (this.navigationHistory.length > 0) {
      this.currentItem = this.navigationHistory.pop() || null;
      this.updateBreadcrumbs();
      this.loadDirectoryContents(this.currentItem?._id || 'root');
    } else if (this.currentItem) {
      this.backToModules();
    }
  }

  backToModules() {
    this.showModuleList = true;
    this.currentItem = null;
    this.navigationHistory = [];
    this.currentItems = [];
    this.breadcrumbs = [];
    this.loadModules();
  }

  navigateBreadcrumb(breadcrumb: BreadcrumbItem) {
    if (breadcrumb.id === 'modules') {
      this.backToModules();
      return;
    }

    if (breadcrumb.item) {
      const itemIndex = this.navigationHistory.findIndex(item => item._id === breadcrumb.id);
      if (itemIndex >= 0) {
        this.navigationHistory = this.navigationHistory.slice(0, itemIndex);
        this.currentItem = breadcrumb.item;
      } else if (this.currentItem && breadcrumb.id === this.currentItem._id) {
        return;
      }
      this.updateBreadcrumbs();
      this.loadDirectoryContents(breadcrumb.id);
    }
  }

  private updateBreadcrumbs() {
    const breadcrumbs: BreadcrumbItem[] = [{ name: 'Modules', id: 'modules' }];

    for (const item of this.navigationHistory) {
      breadcrumbs.push({
        name: this.getDisplayName(item),
        id: item._id,
        item: item
      });
    }

    if (this.currentItem) {
      breadcrumbs.push({
        name: this.getDisplayName(this.currentItem),
        id: this.currentItem._id,
        item: this.currentItem
      });
    }

    this.breadcrumbs = breadcrumbs;
  }

  private loadDirectoryContents(parentId: string) {
    this.loading = true;
    this.moduleService.getDirectoryContents(parentId).subscribe({
      next: (response: DirectoryContents) => {
        this.currentItems = response.items || [];
        this.loading = false;
        this.clearMessages();
      },
      error: (error) => {
        this.showError('Failed to load directory contents', error);
      }
    });
  }

  // ============ Module CRUD ============
  openCreateModal() {
    this.isEditing = false;
    this.selectedModuleId = null;
    this.imageBase64 = null;
    this.imagePreview = null;
    this.moduleForm.reset({
      icon: 'bi-book',
      order: this.modules.length
    });
    this.showModal = true;
  }

  openEditModal(module: Module) {
    this.isEditing = true;
    this.selectedModuleId = module._id;
    this.imageBase64 = null;
    this.imagePreview = this.moduleService.getImageUrl(module.image);

    this.moduleForm.patchValue({
      nameEnglish: module.name.english,
      nameHindi: module.name.hindi,
      icon: module.icon,
      order: module.order
    });
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.imageBase64 = null;
    this.imagePreview = null;
    this.moduleForm.reset();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imageBase64 = e.target.result;
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.imageBase64 = null;
    this.imagePreview = null;
  }

  saveModule() {
    if (this.moduleForm.invalid) {
      Object.keys(this.moduleForm.controls).forEach(key => {
        this.moduleForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (!this.isEditing && !this.imageBase64) {
      alert('Please select an image');
      return;
    }

    const moduleData = {
      nameEnglish: this.moduleForm.value.nameEnglish,
      nameHindi: this.moduleForm.value.nameHindi,
      icon: this.moduleForm.value.icon,
      order: this.moduleForm.value.order,
      ...(this.imageBase64 && { image: this.imageBase64 })
    };

    if (this.isEditing && this.selectedModuleId) {
      this.moduleService.updateModule(this.selectedModuleId, moduleData).subscribe({
        next: () => {
          this.loadModules();
          this.closeModal();
          this.successMessage = 'Module updated successfully';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.showError('Error updating module', error);
        }
      });
    } else {
      this.moduleService.createModule(moduleData).subscribe({
        next: () => {
          this.loadModules();
          this.closeModal();
          this.successMessage = 'Module created successfully';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.showError('Error creating module', error);
        }
      });
    }
  }

  deleteModule(id: string) {
    if (confirm('Are you sure you want to delete this module? This will delete all contents inside it.')) {
      this.moduleService.deleteModule(id).subscribe({
        next: () => {
          this.loadModules();
          this.successMessage = 'Module deleted successfully';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.showError('Error deleting module', error);
        }
      });
    }
  }

  toggleStatus(module: Module) {
    this.moduleService.toggleModuleStatus(module._id).subscribe({
      next: () => {
        this.loadModules();
        this.successMessage = `Module ${module.isActive ? 'deactivated' : 'activated'} successfully`;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.showError('Error toggling module status', error);
      }
    });
  }

  // ============ Folder Operations ============
  openCreateFolderModal() {
    this.newFolderName = '';
    this.newFolderNameHi = '';
    this.showCreateFolderModal = true;
    this.clearMessages();
  }

  createFolder() {
    if (!this.newFolderName.trim() || !this.currentItem) {
      this.errorMessage = 'Folder name is required';
      return;
    }

    this.moduleService.createFolder({
      nameEnglish: this.newFolderName.trim(),
      nameHindi: this.newFolderNameHi.trim(),
      parentId: this.currentItem._id
    }).subscribe({
      next: () => {
        this.showCreateFolderModal = false;
        this.successMessage = 'Folder created successfully';
        setTimeout(() => this.successMessage = '', 3000);
        this.loadDirectoryContents(this.currentItem!._id);
      },
      error: (error) => {
        this.showError('Failed to create folder', error);
      }
    });
  }

  // ============ File Operations ============
  openCreateFileModal() {
    this.newFileName = '';
    this.newFileNameHi = '';
    this.newFileLink = '';
    this.newFileDescription = '';
    this.showCreateFileModal = true;
    this.clearMessages();
  }

  createFile() {
    if (!this.newFileName.trim() || !this.newFileLink.trim() || !this.currentItem) {
      this.errorMessage = 'File name and link are required';
      return;
    }

    this.moduleService.createFile({
      nameEnglish: this.newFileName.trim(),
      nameHindi: this.newFileNameHi.trim(),
      parentId: this.currentItem._id,
      fileLink: this.newFileLink.trim(),
      fileDescription: this.newFileDescription.trim()
    }).subscribe({
      next: () => {
        this.showCreateFileModal = false;
        this.successMessage = 'File added successfully';
        setTimeout(() => this.successMessage = '', 3000);
        this.loadDirectoryContents(this.currentItem!._id);
      },
      error: (error) => {
        this.showError('Failed to add file', error);
      }
    });
  }

  openEditFileModal(item: Module) {
    if (item.type !== 'file') return;

    this.selectedItem = item;
    this.editFileName = item.name.english;
    this.editFileNameHi = item.name.hindi || '';
    this.editFileLink = item.fileLink || '';
    this.editFileDescription = item.fileDescription || '';
    this.showEditFileModal = true;
  }

  updateFile() {
    if (!this.editFileName.trim() || !this.editFileLink.trim() || !this.selectedItem) {
      this.errorMessage = 'File name and link are required';
      return;
    }

    this.moduleService.updateFile(this.selectedItem._id, {
      nameEnglish: this.editFileName.trim(),
      nameHindi: this.editFileNameHi.trim(),
      fileLink: this.editFileLink.trim(),
      fileDescription: this.editFileDescription.trim()
    }).subscribe({
      next: () => {
        this.showEditFileModal = false;
        this.successMessage = 'File updated successfully';
        setTimeout(() => this.successMessage = '', 3000);
        this.loadDirectoryContents(this.currentItem?._id || 'root');
      },
      error: (error) => {
        this.showError('Failed to update file', error);
      }
    });
  }

  openFile(item: Module) {
    if (item.type === 'file' && item.fileLink) {
      window.open(item.fileLink, '_blank');
    }
  }

  // ============ Rename Operations ============
  openRenameModal(item: Module) {
    this.selectedItem = item;
    this.renameNewName = item.name.english;
    this.renameNewNameHi = item.name.hindi || '';
    this.showRenameModal = true;
  }

  renameItem() {
    if (!this.renameNewName.trim() || !this.selectedItem) {
      this.errorMessage = 'New name is required';
      return;
    }

    if (this.selectedItem.type === 'folder') {
      this.moduleService.renameFolder(this.selectedItem._id, {
        nameEnglish: this.renameNewName.trim(),
        nameHindi: this.renameNewNameHi.trim()
      }).subscribe({
        next: () => {
          this.showRenameModal = false;
          this.successMessage = 'Folder renamed successfully';
          setTimeout(() => this.successMessage = '', 3000);
          this.updateNavigationAfterRename();
          this.loadDirectoryContents(this.currentItem?._id || 'root');
        },
        error: (error) => {
          this.showError('Failed to rename folder', error);
        }
      });
    } else if (this.selectedItem.type === 'file') {
      this.moduleService.updateFile(this.selectedItem._id, {
        nameEnglish: this.renameNewName.trim(),
        nameHindi: this.renameNewNameHi.trim()
      }).subscribe({
        next: () => {
          this.showRenameModal = false;
          this.successMessage = 'File renamed successfully';
          setTimeout(() => this.successMessage = '', 3000);
          this.loadDirectoryContents(this.currentItem?._id || 'root');
        },
        error: (error) => {
          this.showError('Failed to rename file', error);
        }
      });
    }
  }

  private updateNavigationAfterRename() {
    if (this.selectedItem && this.currentItem && this.currentItem._id === this.selectedItem._id) {
      this.currentItem.name.english = this.renameNewName;
      if (this.renameNewNameHi) {
        this.currentItem.name.hindi = this.renameNewNameHi;
      }
    }

    const navIndex = this.navigationHistory.findIndex(item => item._id === this.selectedItem?._id);
    if (navIndex >= 0 && this.selectedItem) {
      this.navigationHistory[navIndex].name.english = this.renameNewName;
      if (this.renameNewNameHi) {
        this.navigationHistory[navIndex].name.hindi = this.renameNewNameHi;
      }
    }

    this.updateBreadcrumbs();
  }

  // ============ Delete Operations ============
  openDeleteModal(item: Module) {
    this.selectedItem = item;
    this.showDeleteModal = true;
  }

  deleteItem() {
    if (!this.selectedItem) return;

    this.moduleService.deleteDirectoryItem(this.selectedItem._id).subscribe({
      next: () => {
        this.showDeleteModal = false;

        if (this.currentItem && this.currentItem._id === this.selectedItem?._id) {
          this.navigateUp();
        } else {
          this.loadDirectoryContents(this.currentItem?._id || 'root');
        }

        this.successMessage = `${this.getItemTypeLabel(this.selectedItem!.type)} deleted successfully`;
        setTimeout(() => this.successMessage = '', 3000);
        this.selectedItem = null;
      },
      error: (error) => {
        this.showError('Failed to delete item', error);
      }
    });
  }

  // ============ Helper Methods ============
  getImageUrl(image: string): string {
    return this.moduleService.getImageUrl(image);
  }

  getDisplayName(item: Module): string {
    return this.moduleService.getDisplayName(item);
  }

  hasHindiName(item: Module): boolean {
    return this.moduleService.hasHindiName(item);
  }

  getFileIconClass(item: Module): string {
    return this.moduleService.getFileIconClass(item.fileType);
  }

  getFileIconColor(item: Module): string {
    return this.moduleService.getFileIconColor(item.fileType);
  }

  getFileTypeLabel(item: Module): string {
    return this.moduleService.getFileTypeLabel(item.fileType);
  }

  getItemTypeLabel(type: string): string {
    switch (type) {
      case 'module': return 'Module';
      case 'folder': return 'Folder';
      case 'file': return 'File';
      default: return 'Item';
    }
  }

  private showError(message: string, error: any) {
    this.loading = false;
    this.errorMessage = `${message}: ${error.error?.message || error.message || 'Unknown error'}`;
    console.error(message, error);
    setTimeout(() => this.errorMessage = '', 5000);
  }

  private clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  
}
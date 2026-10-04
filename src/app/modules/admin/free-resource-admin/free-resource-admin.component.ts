import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FreeResourceService, FreeResourceItem, ReorderModuleData } from '../../../shared/services/free-resource.service';

interface BreadcrumbItem {
  name: string;
  id: string | null;
  item?: FreeResourceItem;
}

@Component({
  selector: 'app-free-resource-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './free-resource-admin.component.html',
  styleUrls: ['./free-resource-admin.component.css']
})
export class FreeResourceAdminComponent implements OnInit {
  // Data
  modules: FreeResourceItem[] = [];
  currentItems: FreeResourceItem[] = [];
  currentItem: FreeResourceItem | null = null;
  
  // UI State
  loading = false;
  showModuleList = true;
  reorderMode = false;
  
  // Modal states
  showCreateModuleModal = false;
  showCreateFolderModal = false;
  showCreateFileModal = false;
  showEditFileModal = false;
  showEditModuleModal = false;
  showRenameModal = false;
  showDeleteModal = false;
  showReorderConfirmModal = false;
  
  // Form Data
  newModuleName = '';
  newModuleNameHi = '';
  newFolderName = '';
  newFileName = '';
  newFileLink = '';
  editFileName = '';
  editFileLink = '';
  editModuleName = '';
  editModuleNameHi = '';
  renameNewName = '';
  newFileDescription = '';
  editFileDescription = '';
  
  selectedItem: FreeResourceItem | null = null;
  
  // Messages
  errorMessage = '';
  successMessage = '';
  
  // Breadcrumbs
  breadcrumbs: BreadcrumbItem[] = [];
  navigationHistory: FreeResourceItem[] = [];
  
  // Store original order for reset
  private originalModuleOrder: FreeResourceItem[] = [];
  
  constructor(private freeResourceService: FreeResourceService) {}
  
  ngOnInit() {
    this.loadModules();
  }
  
  // Load modules
  loadModules() {
    this.loading = true;
    
    this.freeResourceService.getModules().subscribe({
      next: (response) => {
        this.modules = response.modules || [];
        // Initialize order if not present
        this.modules = this.modules.map((module, index) => ({
          ...module,
          order: module.order ?? index
        }));
        // Save original order for reset
        this.originalModuleOrder = [...this.modules];
        this.loading = false;
        this.clearMessages();
      },
      error: (error) => {
        this.showError('Failed to load modules', error);
      }
    });
  }
  
  // Move module up in order
  moveModuleUp(index: number) {
    if (index === 0) return; // Already at top
    
    // Swap with previous item
    const temp = this.modules[index];
    this.modules[index] = this.modules[index - 1];
    this.modules[index - 1] = temp;
    
    // Update order numbers
    this.updateModuleOrders();
  }
  
  // Move module down in order
  moveModuleDown(index: number) {
    if (index === this.modules.length - 1) return; // Already at bottom
    
    // Swap with next item
    const temp = this.modules[index];
    this.modules[index] = this.modules[index + 1];
    this.modules[index + 1] = temp;
    
    // Update order numbers
    this.updateModuleOrders();
  }
  
  // Move module to top
  moveModuleToTop(index: number) {
    if (index === 0) return;
    
    const module = this.modules[index];
    this.modules.splice(index, 1);
    this.modules.unshift(module);
    
    // Update order numbers
    this.updateModuleOrders();
  }
  
  // Move module to bottom
  moveModuleToBottom(index: number) {
    if (index === this.modules.length - 1) return;
    
    const module = this.modules[index];
    this.modules.splice(index, 1);
    this.modules.push(module);
    
    // Update order numbers
    this.updateModuleOrders();
  }
  
  // Update order numbers for all modules
  private updateModuleOrders() {
    this.modules.forEach((module, index) => {
      module.order = index;
    });
  }
  
  // Save module order to backend
  saveModuleOrder() {
    this.loading = true;
    
    const reorderData: ReorderModuleData[] = this.modules.map((module, index) => ({
      id: module._id,
      order: index
    }));
    
    this.freeResourceService.reorderModules(reorderData).subscribe({
      next: (response) => {
        this.loading = false;
        this.reorderMode = false;
        this.showReorderConfirmModal = true;
        this.successMessage = 'Module order updated successfully';
        
        // Update modules with response (which has the final order)
        if (response.modules) {
          this.modules = response.modules;
          this.originalModuleOrder = [...this.modules];
        }
      },
      error: (error) => {
        this.loading = false;
        this.showError('Failed to save module order', error);
        // Revert to original order on error
        this.modules = [...this.originalModuleOrder];
      }
    });
  }
  
  // Toggle reorder mode
  toggleReorderMode() {
    this.reorderMode = !this.reorderMode;
    
    if (!this.reorderMode) {
      // If exiting reorder mode without saving, revert to original order
      this.modules = [...this.originalModuleOrder];
    }
  }
  
  // Reset module order to original
  resetModuleOrder() {
    this.modules = [...this.originalModuleOrder];
    this.reorderMode = false;
    this.successMessage = 'Module order reset to original';
    setTimeout(() => this.successMessage = '', 3000);
  }
  
  // Get safe order value (with fallback)
  getModuleOrder(module: FreeResourceItem): number {
    return module.order ?? 0;
  }
  
  // Navigate to module
  navigateToModule(module: FreeResourceItem) {
    // Don't navigate if in reorder mode
    if (this.reorderMode) return;
    
    this.showModuleList = false;
    this.currentItem = module;
    this.updateBreadcrumbs();
    this.loadDirectoryTree(module._id);
  }
  
  // Navigate to folder
  navigateTo(item: FreeResourceItem) {
    if (item.type === 'folder') {
      if (this.currentItem) {
        this.navigationHistory.push(this.currentItem);
      }
      
      this.currentItem = item;
      this.updateBreadcrumbs();
      this.loadDirectoryTree(item._id);
    } else {
      this.openFile(item);
    }
  }
  
  // Load directory tree
  loadDirectoryTree(parentId?: string) {
    this.loading = true;
    
    this.freeResourceService.getDirectoryTree(parentId).subscribe({
      next: (response) => {
        this.currentItems = response.items || [];
        this.loading = false;
        this.clearMessages();
      },
      error: (error) => {
        this.showError('Failed to load directory', error);
      }
    });
  }
  
  // Update breadcrumbs
  updateBreadcrumbs() {
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Add navigation history
    if (this.navigationHistory.length > 0) {
      this.navigationHistory.forEach(item => {
        breadcrumbs.push({
          name: this.getDisplayName(item),
          id: item._id,
          item: item
        });
      });
    }
    
    // Add current item
    if (this.currentItem) {
      breadcrumbs.push({
        name: this.getDisplayName(this.currentItem),
        id: this.currentItem._id,
        item: this.currentItem
      });
    }
    
    this.breadcrumbs = breadcrumbs;
  }
  
  // Navigate via breadcrumb
  navigateBreadcrumb(breadcrumb: BreadcrumbItem) {
    if (breadcrumb.id === null) {
      this.showModuleList = true;
      this.currentItem = null;
      this.navigationHistory = [];
      this.currentItems = [];
      this.updateBreadcrumbs();
      this.loadModules();
      return;
    }
    
    if (breadcrumb.item) {
      const itemIndex = this.navigationHistory.findIndex(item => 
        item._id === breadcrumb.id
      );
      
      if (itemIndex >= 0) {
        this.navigationHistory = this.navigationHistory.slice(0, itemIndex);
        this.currentItem = breadcrumb.item;
      } else if (this.currentItem && breadcrumb.id === this.currentItem._id) {
        return;
      }
      
      this.updateBreadcrumbs();
      this.loadDirectoryTree(breadcrumb.id);
    }
  }
  
  // Navigate up
  navigateUp() {
    if (this.navigationHistory.length > 0) {
      this.currentItem = this.navigationHistory.pop() || null;
      this.updateBreadcrumbs();
      const parentId = this.currentItem?._id;
      this.loadDirectoryTree(parentId);
    } else if (this.currentItem) {
      this.showModuleList = true;
      this.currentItem = null;
      this.navigationHistory = [];
      this.currentItems = [];
      this.updateBreadcrumbs();
      this.loadModules();
    }
  }
  
  // Back to modules
  backToModules() {
    this.showModuleList = true;
    this.currentItem = null;
    this.navigationHistory = [];
    this.currentItems = [];
    this.breadcrumbs = [];
    this.loadModules();
  }
  
  // Create module
  createModule() {
    if (!this.newModuleName.trim()) {
      this.errorMessage = 'Module name is required';
      return;
    }
    
    this.freeResourceService.createModule({
      name: this.newModuleName.trim(),
      nameHi: this.newModuleNameHi.trim()
    }).subscribe({
      next: (response) => {
        this.showCreateModuleModal = false;
        this.newModuleName = '';
        this.newModuleNameHi = '';
        this.successMessage = `Module "${response.module?.name}" created successfully`;
        this.loadModules();
      },
      error: (error) => {
        this.showError('Failed to create module', error);
      }
    });
  }
  
  // Create folder
  createFolder() {
    if (!this.newFolderName.trim() || !this.currentItem) {
      this.errorMessage = 'Folder name is required';
      return;
    }
    
    this.freeResourceService.createFolder({
      name: this.newFolderName.trim(),
      parentId: this.currentItem._id
    }).subscribe({
      next: (response) => {
        this.showCreateFolderModal = false;
        this.newFolderName = '';
        this.successMessage = 'Folder created successfully';
        this.loadDirectoryTree(this.currentItem?._id);
      },
      error: (error) => {
        this.showError('Failed to create folder', error);
      }
    });
  }
  
  // Create file
  createFile() {
    if (!this.newFileName.trim() || !this.newFileLink.trim() || !this.currentItem) {
      this.errorMessage = 'File name and link are required';
      return;
    }
    
    this.freeResourceService.createFile({
      name: this.newFileName.trim(),
      parentId: this.currentItem._id,
      fileLink: this.newFileLink.trim(),
      fileDescription: this.newFileDescription.trim()
    }).subscribe({
      next: (response) => {
        this.showCreateFileModal = false;
        this.newFileName = '';
        this.newFileLink = '';
        this.newFileDescription = '';
        this.successMessage = 'File added successfully';
        this.loadDirectoryTree(this.currentItem?._id);
      },
      error: (error) => {
        this.showError('Failed to add file', error);
      }
    });
  }
  
  // Update file
  updateFile() {
    if (!this.editFileName.trim() || !this.editFileLink.trim() || !this.selectedItem) {
      this.errorMessage = 'File name and link are required';
      return;
    }
    
    this.freeResourceService.updateFile(this.selectedItem._id, {
      name: this.editFileName.trim(),
      fileLink: this.editFileLink.trim(),
      fileDescription: this.editFileDescription.trim()
    }).subscribe({
      next: (response) => {
        this.showEditFileModal = false;
        this.editFileName = '';
        this.editFileLink = '';
        this.editFileDescription = '';
        this.selectedItem = null;
        this.successMessage = 'File updated successfully';
        this.loadDirectoryTree(this.currentItem?._id);
      },
      error: (error) => {
        this.showError('Failed to update file', error);
      }
    });
  }
  
  // Update module
  updateModule() {
    if (!this.editModuleName.trim() || !this.selectedItem) {
      this.errorMessage = 'Module name is required';
      return;
    }
    
    this.freeResourceService.updateModule(this.selectedItem._id, {
      name: this.editModuleName.trim(),
      nameHi: this.editModuleNameHi.trim()
    }).subscribe({
      next: (response) => {
        this.showEditModuleModal = false;
        this.editModuleName = '';
        this.editModuleNameHi = '';
        this.selectedItem = null;
        this.successMessage = 'Module updated successfully';
        this.loadModules();
      },
      error: (error) => {
        this.showError('Failed to update module', error);
      }
    });
  }
  
  // Open file link
  openFile(item: FreeResourceItem) {
    if (item.type === 'file' && item.fileLink) {
      window.open(item.fileLink, '_blank');
    }
  }
  
  // Rename item
  renameItem() {
    if (!this.renameNewName.trim() || !this.selectedItem) {
      this.errorMessage = 'New name is required';
      return;
    }
    
    this.freeResourceService.renameItem(this.selectedItem._id, this.renameNewName.trim()).subscribe({
      next: (response) => {
        this.showRenameModal = false;
        this.renameNewName = '';
        
        // Update navigation history if needed
        if (this.navigationHistory.some(item => item._id === this.selectedItem?._id)) {
          const index = this.navigationHistory.findIndex(item => item._id === this.selectedItem?._id);
          if (index >= 0) {
            this.navigationHistory[index].name = this.renameNewName.trim();
          }
        }
        
        // Update current item if needed
        if (this.currentItem && this.currentItem._id === this.selectedItem?._id) {
          this.currentItem.name = this.renameNewName.trim();
        }
        
        this.selectedItem = null;
        this.successMessage = 'Renamed successfully';
        this.updateBreadcrumbs();
        this.loadDirectoryTree(this.currentItem?._id);
      },
      error: (error) => {
        this.showError('Failed to rename', error);
      }
    });
  }
  
  // Delete item
  deleteItem() {
    if (!this.selectedItem) return;
    
    this.freeResourceService.deleteItem(this.selectedItem._id).subscribe({
      next: (response) => {
        this.showDeleteModal = false;
        
        // Clean up navigation history
        this.navigationHistory = this.navigationHistory.filter(
          item => item._id !== this.selectedItem?._id
        );
        
        // Handle current item deletion
        if (this.currentItem && this.currentItem._id === this.selectedItem?._id) {
          this.navigateUp();
        } else {
          this.loadDirectoryTree(this.currentItem?._id);
        }
        
        this.selectedItem = null;
        this.successMessage = 'Deleted successfully';
        this.updateBreadcrumbs();
        this.loadModules();
      },
      error: (error) => {
        this.showError('Failed to delete', error);
      }
    });
  }
  
  // Modal openers
  openCreateModuleModal() {
    this.newModuleName = '';
    this.newModuleNameHi = '';
    this.showCreateModuleModal = true;
    this.clearMessages();
  }
  
  openCreateFolderModal() {
    this.newFolderName = '';
    this.showCreateFolderModal = true;
    this.clearMessages();
  }
  
  openCreateFileModal() {
    this.newFileName = '';
    this.newFileLink = '';
    this.newFileDescription = '';
    this.showCreateFileModal = true;
    this.clearMessages();
  }
  
  openEditFileModal(item: FreeResourceItem) {
    if (item.type !== 'file') return;
    
    this.selectedItem = item;
    this.editFileName = item.name;
    this.editFileLink = item.fileLink || '';
    this.editFileDescription = item.fileDescription || '';
    this.showEditFileModal = true;
    this.clearMessages();
  }
  
  openEditModuleModal(item: FreeResourceItem) {
    if (item.type !== 'module') return;
    
    this.selectedItem = item;
    this.editModuleName = item.name;
    this.editModuleNameHi = item.nameHi || '';
    this.showEditModuleModal = true;
    this.clearMessages();
  }
  
  openRenameModal(item: FreeResourceItem) {
    if (item.type === 'module') {
      this.openEditModuleModal(item);
      return;
    }
    
    this.selectedItem = item;
    this.renameNewName = item.name;
    this.showRenameModal = true;
    this.clearMessages();
  }
  
  openDeleteModal(item: FreeResourceItem) {
    this.selectedItem = item;
    this.showDeleteModal = true;
    this.clearMessages();
  }
  
  // Helper methods
  private showError(message: string, error: any) {
    this.loading = false;
    this.errorMessage = `${message}: ${error.error?.message || error.message || 'Unknown error'}`;
    console.error(message, error);
    
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }
  
  private clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }
  
  // Display helpers
  getDisplayName(item: FreeResourceItem): string {
    return this.freeResourceService.getDisplayName(item);
  }
  
  hasHindiName(item: FreeResourceItem | null | undefined): boolean {
    if (!item) return false;
    return this.freeResourceService.hasHindiName(item);
  }
  
  getHindiName(item: FreeResourceItem): string {
    return item.nameHi || '';
  }
  
  getFileIconColor(item: FreeResourceItem): string {
    return this.freeResourceService.getFileIconColor(item.fileType);
  }
  
  getFileIconClass(item: FreeResourceItem): string {
    return this.freeResourceService.getFileIconClass(item.fileType);
  }
  
  getFileTypeLabel(item: FreeResourceItem): string {
    return this.freeResourceService.getFileTypeLabel(item.fileType);
  }
  
  getItemTypeLabel(type: string): string {
    switch(type) {
      case 'module': return 'Module';
      case 'folder': return 'Folder';
      case 'file': return 'File';
      default: return 'Item';
    }
  }
}
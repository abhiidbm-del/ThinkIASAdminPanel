import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DirectoryService } from '../../../shared/services/directory.service';
import { DirectoryItem } from '../../../core/models/directory.model';

interface BreadcrumbItem {
  name: string;
  id: string | null;
  item?: DirectoryItem;
}

@Component({
  selector: 'app-directory-master',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './directory-master.component.html',
  styleUrls: ['./directory-master.component.css']
})
export class DirectoryMasterComponent implements OnInit {
  // Data
  items: DirectoryItem[] = [];
  currentItem: DirectoryItem | null = null;
  breadcrumbs: BreadcrumbItem[] = [];
  
  // Track navigation history for breadcrumb
  navigationHistory: DirectoryItem[] = [];
  
  // UI State
  loading = false;
  showCreateFolderModal = false;
  showCreateFileModal = false;
  showEditFileModal = false;
  showRenameModal = false;
  showDeleteModal = false;
  
  // Form Data
  newFolderName = '';
  newFileName = '';
  newFileLink = '';
  newFileDescription = '';
  
  editFileName = '';
  editFileLink = '';
  editFileDescription = '';
  
  renameNewName = '';
  selectedItem: DirectoryItem | null = null;
  
  // Messages
  errorMessage = '';
  successMessage = '';
  
  constructor(private directoryService: DirectoryService) {}
  
  ngOnInit() {
    this.loadDirectoryTree();
    this.updateBreadcrumbs();
  }
  
  // Load directory tree
  loadDirectoryTree(parentId?: string | null) {
    this.loading = true;
    const apiParentId = parentId || undefined;
    
    this.directoryService.getDirectoryTree(apiParentId).subscribe({
      next: (response) => {
        this.items = response.items || [];
        this.loading = false;
        this.clearMessages();
      },
      error: (error) => {
        this.showError('Failed to load directory', error);
      }
    });
  }
  
  // Navigate to item
  navigateTo(item: DirectoryItem) {
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
  
  // Update breadcrumbs
  updateBreadcrumbs() {
    const breadcrumbs: BreadcrumbItem[] = [];
    
    breadcrumbs.push({
      name: 'Root',
      id: null
    });
    
    if (this.navigationHistory.length > 0) {
      this.navigationHistory.forEach(item => {
        breadcrumbs.push({
          name: item.name,
          id: item._id,
          item: item
        });
      });
    }
    
    if (this.currentItem) {
      breadcrumbs.push({
        name: this.currentItem.name,
        id: this.currentItem._id,
        item: this.currentItem
      });
    }
    
    this.breadcrumbs = breadcrumbs;
  }
  
  // Navigate via breadcrumb
  navigateBreadcrumb(breadcrumb: BreadcrumbItem) {
    if (breadcrumb.id === null) {
      this.currentItem = null;
      this.navigationHistory = [];
      this.loadDirectoryTree();
      this.updateBreadcrumbs();
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
      this.loadDirectoryTree(this.currentItem?._id || null);
    } else if (this.currentItem) {
      this.currentItem = null;
      this.updateBreadcrumbs();
      this.loadDirectoryTree();
    }
  }
  
  // Create folder
  createFolder() {
    if (!this.newFolderName.trim()) {
      this.errorMessage = 'Folder name is required';
      return;
    }
    
    const parentId = this.currentItem?._id || null;
    
    this.directoryService.createFolder(this.newFolderName.trim(), parentId).subscribe({
      next: (response) => {
        this.showCreateFolderModal = false;
        this.newFolderName = '';
        this.successMessage = 'Folder created successfully';
        this.loadDirectoryTree(parentId);
      },
      error: (error) => {
        this.showError('Failed to create folder', error);
      }
    });
  }
  
  // Create file (with link)
  createFile() {
    if (!this.newFileName.trim() || !this.newFileLink.trim()) {
      this.errorMessage = 'File name and link are required';
      return;
    }
    
    const parentId = this.currentItem?._id || null;
    
    this.directoryService.createFile(
      this.newFileName.trim(),
      parentId,
      this.newFileLink.trim(),
      this.newFileDescription.trim()
    ).subscribe({
      next: (response) => {
        this.showCreateFileModal = false;
        this.newFileName = '';
        this.newFileLink = '';
        this.newFileDescription = '';
        this.successMessage = 'File link added successfully';
        this.loadDirectoryTree(parentId);
      },
      error: (error) => {
        this.showError('Failed to add file link', error);
      }
    });
  }
  
  // Update file
  updateFile() {
    if (!this.editFileName.trim() || !this.editFileLink.trim() || !this.selectedItem) {
      this.errorMessage = 'File name and link are required';
      return;
    }
    
    this.directoryService.updateFile(
      this.selectedItem._id,
      this.editFileName.trim(),
      this.editFileLink.trim(),
      this.editFileDescription.trim()
    ).subscribe({
      next: (response) => {
        this.showEditFileModal = false;
        this.editFileName = '';
        this.editFileLink = '';
        this.editFileDescription = '';
        this.selectedItem = null;
        this.successMessage = 'File updated successfully';
        const parentId = this.currentItem?._id || null;
        this.loadDirectoryTree(parentId);
      },
      error: (error) => {
        this.showError('Failed to update file', error);
      }
    });
  }
  
  // Open file link
  openFile(item: DirectoryItem) {
    if (item.type === 'file' && item.fileLink) {
      window.open(item.fileLink, '_blank');
    }
  }
  
  // Copy file link to clipboard
  copyFileLink(item: DirectoryItem) {
    if (item.type === 'file' && item.fileLink) {
      navigator.clipboard.writeText(item.fileLink).then(() => {
        this.successMessage = 'Link copied to clipboard!';
        setTimeout(() => this.successMessage = '', 3000);
      }).catch(err => {
        this.errorMessage = 'Failed to copy link';
      });
    }
  }
  
  // Rename item
  renameItem() {
    if (!this.renameNewName.trim() || !this.selectedItem) {
      this.errorMessage = 'New name is required';
      return;
    }
    
    this.directoryService.renameItem(this.selectedItem._id, this.renameNewName.trim()).subscribe({
      next: (response) => {
        this.showRenameModal = false;
        this.renameNewName = '';
        
        if (this.navigationHistory.some(item => item._id === this.selectedItem?._id)) {
          const index = this.navigationHistory.findIndex(item => item._id === this.selectedItem?._id);
          if (index >= 0) {
            this.navigationHistory[index].name = this.renameNewName.trim();
          }
        }
        
        if (this.currentItem && this.currentItem._id === this.selectedItem?._id) {
          this.currentItem.name = this.renameNewName.trim();
        }
        
        this.selectedItem = null;
        this.successMessage = 'Renamed successfully';
        this.updateBreadcrumbs();
        const parentId = this.currentItem?._id || null;
        this.loadDirectoryTree(parentId);
      },
      error: (error) => {
        this.showError('Failed to rename', error);
      }
    });
  }
  
  // Delete item
  deleteItem() {
    if (!this.selectedItem) return;
    
    this.directoryService.deleteItem(this.selectedItem._id).subscribe({
      next: (response) => {
        this.showDeleteModal = false;
        
        this.navigationHistory = this.navigationHistory.filter(
          item => item._id !== this.selectedItem?._id
        );
        
        if (this.currentItem && this.currentItem._id === this.selectedItem?._id) {
          this.navigateUp();
        } else {
          const parentId = this.currentItem?._id || null;
          this.loadDirectoryTree(parentId);
        }
        
        this.selectedItem = null;
        this.successMessage = 'Deleted successfully';
        this.updateBreadcrumbs();
      },
      error: (error) => {
        this.showError('Failed to delete', error);
      }
    });
  }
  
  // Modal openers
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
  
  openEditFileModal(item: DirectoryItem) {
    if (item.type !== 'file') return;
    
    this.selectedItem = item;
    this.editFileName = item.name;
    this.editFileLink = item.fileLink || '';
    this.editFileDescription = item.description || '';
    this.showEditFileModal = true;
    this.clearMessages();
  }
  
  openRenameModal(item: DirectoryItem) {
    this.selectedItem = item;
    this.renameNewName = item.name;
    this.showRenameModal = true;
    this.clearMessages();
  }
  
  openDeleteModal(item: DirectoryItem) {
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
  
  // File icon methods
  getFileIconColor(item: DirectoryItem): string {
    if (!item.fileType) return 'linear-gradient(135deg, #f1f5f9, #e2e8f0)';
    
    switch (item.fileType) {
      case 'pdf': return 'linear-gradient(135deg, #fee2e2, #fecaca)';
      case 'image': return 'linear-gradient(135deg, #dbeafe, #bfdbfe)';
      case 'document': return 'linear-gradient(135deg, #dcfce7, #bbf7d0)';
      case 'video': return 'linear-gradient(135deg, #fce7f3, #fbcfe8)';
      case 'audio': return 'linear-gradient(135deg, #fef3c7, #fde68a)';
      default: return 'linear-gradient(135deg, #f1f5f9, #e2e8f0)';
    }
  }
  
  getFileIconClass(item: DirectoryItem): string {
    if (!item.fileType) return 'fa fa-file';
    
    switch (item.fileType) {
      case 'pdf': return 'fa fa-file-pdf-o';
      case 'image': return 'fa fa-image';
      case 'document': return 'fa fa-file-text';
      case 'video': return 'fa fa-video-camera';
      case 'audio': return 'fa fa-music';
      default: return 'fa fa-file';
    }
  }
  
  getFileTypeLabel(fileType?: string): string {
    if (!fileType || fileType === 'other') {
      return 'File';
    }
    return fileType.charAt(0).toUpperCase() + fileType.slice(1);
  }
}
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopicwiseDirectoryService } from '../../../shared/services/topicwise-directory.service';

interface BreadcrumbItem {
  name: string;
  id: string | null;
  item?: any;
}

@Component({
  selector: 'app-directory-explorer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './directory-explorer.component.html',
  styleUrls: ['./directory-explorer.component.css']
})
export class DirectoryExplorerComponent implements OnInit, OnChanges {
  @Input() category: string = '';
  @Input() categoryName: string = '';
  @Input() resourceType: 'material' | 'video' = 'material'; // 'material' for topicwise, 'video' for videos
  
  // Data
  items: any[] = [];
  currentItem: any = null;
  breadcrumbs: BreadcrumbItem[] = [];
  
  // Track navigation history
  navigationHistory: any[] = [];
  
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
  newFileDuration = ''; // New field for videos
  newFileThumbnail = ''; // New field for videos
  
  editFileName = '';
  editFileLink = '';
  editFileDescription = '';
  editFileDuration = ''; // New field for videos
  editFileThumbnail = ''; // New field for videos
  
  renameNewName = '';
  selectedItem: any = null;
  
  // Messages
  errorMessage = '';
  successMessage = '';
  
  constructor(
    private directoryService: TopicwiseDirectoryService
  ) {}
  
  ngOnInit() {
    this.loadDirectoryTree();
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['category'] && !changes['category'].firstChange) {
      this.resetNavigation();
      this.loadDirectoryTree();
    }
  }
  
  resetNavigation() {
    this.currentItem = null;
    this.navigationHistory = [];
    this.breadcrumbs = [];
    this.items = [];
  }
  
  // Load directory tree
  loadDirectoryTree(parentId?: string | null) {
    this.loading = true;
    
    if (this.resourceType === 'video') {
      // Use video API methods
      this.directoryService.getVideoDirectoryTree(this.category, parentId).subscribe({
        next: (response: any) => {
          this.items = response.items || response.tree || [];
          this.loading = false;
          this.clearMessages();
          this.updateBreadcrumbs();
        },
        error: (error: any) => {
          this.showError('Failed to load video directory', error);
        }
      });
    } else {
      // Use topicwise API methods (default)
      this.directoryService.getDirectoryTree(this.category, parentId).subscribe({
        next: (response: any) => {
          this.items = response.items || response.tree || [];
          this.loading = false;
          this.clearMessages();
          this.updateBreadcrumbs();
        },
        error: (error: any) => {
          this.showError('Failed to load directory', error);
        }
      });
    }
  }
  
  // Navigate to item
  navigateTo(item: any) {
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
      name: this.categoryName,
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
    
    if (this.resourceType === 'video') {
      // Create video folder
      this.directoryService.createVideoFolder(
        this.category,
        this.newFolderName.trim(), 
        parentId
      ).subscribe({
        next: (response: any) => {
          this.showCreateFolderModal = false;
          this.newFolderName = '';
          this.successMessage = 'Video folder created successfully';
          this.loadDirectoryTree(parentId);
        },
        error: (error: any) => {
          this.showError('Failed to create video folder', error);
        }
      });
    } else {
      // Create topicwise folder
      this.directoryService.createFolder(
        this.category,
        this.newFolderName.trim(), 
        parentId
      ).subscribe({
        next: (response: any) => {
          this.showCreateFolderModal = false;
          this.newFolderName = '';
          this.successMessage = 'Folder created successfully';
          this.loadDirectoryTree(parentId);
        },
        error: (error: any) => {
          this.showError('Failed to create folder', error);
        }
      });
    }
  }
  
  // Create file/video
  createFile() {
    if (!this.newFileName.trim() || !this.newFileLink.trim()) {
      this.errorMessage = 'Name and link are required';
      return;
    }
    
    const parentId = this.currentItem?._id || null;
    
    if (this.resourceType === 'video') {
      // Create video
      this.directoryService.createVideo(
        this.category,
        this.newFileName.trim(),
        parentId,
        this.newFileLink.trim(),
        this.newFileDescription.trim(),
        this.newFileDuration.trim(),
        this.newFileThumbnail.trim()
      ).subscribe({
        next: (response: any) => {
          this.showCreateFileModal = false;
          this.resetFormFields();
          this.successMessage = 'Video added successfully';
          this.loadDirectoryTree(parentId);
        },
        error: (error: any) => {
          this.showError('Failed to add video', error);
        }
      });
    } else {
      // Create topicwise file
      this.directoryService.createFile(
        this.category,
        this.newFileName.trim(),
        parentId,
        this.newFileLink.trim(),
        this.newFileDescription.trim()
      ).subscribe({
        next: (response: any) => {
          this.showCreateFileModal = false;
          this.resetFormFields();
          this.successMessage = 'File link added successfully';
          this.loadDirectoryTree(parentId);
        },
        error: (error: any) => {
          this.showError('Failed to add file link', error);
        }
      });
    }
  }
  
  // Update file/video
  updateFile() {
    if (!this.editFileName.trim() || !this.editFileLink.trim() || !this.selectedItem) {
      this.errorMessage = 'Name and link are required';
      return;
    }
    
    if (this.resourceType === 'video') {
      // Update video
      this.directoryService.updateVideo(
        this.selectedItem._id,
        this.editFileName.trim(),
        this.editFileLink.trim(),
        this.editFileDescription.trim(),
        this.editFileDuration.trim(),
        this.editFileThumbnail.trim()
      ).subscribe({
        next: (response: any) => {
          this.showEditFileModal = false;
          this.resetFormFields();
          this.selectedItem = null;
          this.successMessage = 'Video updated successfully';
          const parentId = this.currentItem?._id || null;
          this.loadDirectoryTree(parentId);
        },
        error: (error: any) => {
          this.showError('Failed to update video', error);
        }
      });
    } else {
      // Update topicwise file
      this.directoryService.updateFile(
        this.selectedItem._id,
        this.editFileName.trim(),
        this.editFileLink.trim(),
        this.editFileDescription.trim()
      ).subscribe({
        next: (response: any) => {
          this.showEditFileModal = false;
          this.resetFormFields();
          this.selectedItem = null;
          this.successMessage = 'File updated successfully';
          const parentId = this.currentItem?._id || null;
          this.loadDirectoryTree(parentId);
        },
        error: (error: any) => {
          this.showError('Failed to update file', error);
        }
      });
    }
  }
  
  // Open file/video link
  openFile(item: any) {
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
    
    if (this.resourceType === 'video') {
      // Rename video item
      this.directoryService.renameVideoItem(this.selectedItem._id, this.renameNewName.trim()).subscribe({
        next: (response: any) => {
          this.handleRenameSuccess();
        },
        error: (error: any) => {
          this.showError('Failed to rename video item', error);
        }
      });
    } else {
      // Rename topicwise item
      this.directoryService.renameItem(this.selectedItem._id, this.renameNewName.trim()).subscribe({
        next: (response: any) => {
          this.handleRenameSuccess();
        },
        error: (error: any) => {
          this.showError('Failed to rename item', error);
        }
      });
    }
  }
  
  // Handle rename success
  private handleRenameSuccess() {
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
  }
  
  // Delete item
  deleteItem() {
    if (!this.selectedItem) return;
    
    if (this.resourceType === 'video') {
      // Delete video item
      this.directoryService.deleteVideoItem(this.selectedItem._id).subscribe({
        next: (response: any) => {
          this.handleDeleteSuccess();
        },
        error: (error: any) => {
          this.showError('Failed to delete video item', error);
        }
      });
    } else {
      // Delete topicwise item
      this.directoryService.deleteItem(this.selectedItem._id).subscribe({
        next: (response: any) => {
          this.handleDeleteSuccess();
        },
        error: (error: any) => {
          this.showError('Failed to delete item', error);
        }
      });
    }
  }
  
  // Handle delete success
  private handleDeleteSuccess() {
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
  }
  
  // Modal openers
  openCreateFolderModal() {
    this.newFolderName = '';
    this.showCreateFolderModal = true;
    this.clearMessages();
  }
  
  openCreateFileModal() {
    this.resetFormFields();
    this.showCreateFileModal = true;
    this.clearMessages();
  }
  
  openEditFileModal(item: any) {
    if (item.type !== 'file') return;
    
    this.selectedItem = item;
    this.editFileName = item.name;
    this.editFileLink = item.fileLink || '';
    this.editFileDescription = item.description || '';
    
    // Additional fields for videos
    if (this.resourceType === 'video') {
      this.editFileDuration = item.duration || '';
      this.editFileThumbnail = item.thumbnail || '';
    }
    
    this.showEditFileModal = true;
    this.clearMessages();
  }
  
  openRenameModal(item: any) {
    this.selectedItem = item;
    this.renameNewName = item.name;
    this.showRenameModal = true;
    this.clearMessages();
  }
  
  openDeleteModal(item: any) {
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
  
  private resetFormFields() {
    this.newFileName = '';
    this.newFileLink = '';
    this.newFileDescription = '';
    this.newFileDuration = '';
    this.newFileThumbnail = '';
    this.editFileName = '';
    this.editFileLink = '';
    this.editFileDescription = '';
    this.editFileDuration = '';
    this.editFileThumbnail = '';
  }
  
  // File icon methods - updated for videos
  getFileIconColor(item: any): string {
    if (!item.fileType) return 'linear-gradient(135deg, #f1f5f9, #e2e8f0)';
    
    if (this.resourceType === 'video') {
      return 'linear-gradient(135deg, #fce7f3, #fbcfe8)'; // Pink gradient for videos
    }
    
    switch (item.fileType) {
      case 'pdf': return 'linear-gradient(135deg, #fee2e2, #fecaca)';
      case 'image': return 'linear-gradient(135deg, #dbeafe, #bfdbfe)';
      case 'document': return 'linear-gradient(135deg, #dcfce7, #bbf7d0)';
      case 'video': return 'linear-gradient(135deg, #fce7f3, #fbcfe8)';
      case 'audio': return 'linear-gradient(135deg, #fef3c7, #fde68a)';
      case 'youtube': return 'linear-gradient(135deg, #fee2e2, #fecaca)';
      case 'vimeo': return 'linear-gradient(135deg, #dbeafe, #bfdbfe)';
      case 'drive': return 'linear-gradient(135deg, #dcfce7, #bbf7d0)';
      default: return 'linear-gradient(135deg, #f1f5f9, #e2e8f0)';
    }
  }
  
  getFileIconClass(item: any): string {
    if (!item.fileType) return 'fa fa-file';
    
    if (this.resourceType === 'video') {
      if (item.fileType === 'youtube') return 'fa fa-youtube-play';
      if (item.fileType === 'vimeo') return 'fa fa-play-circle';
      if (item.fileType === 'drive') return 'fa fa-cloud';
      return 'fa fa-video-camera';
    }
    
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
      return this.resourceType === 'video' ? 'Video' : 'File';
    }
    
    if (this.resourceType === 'video') {
      switch (fileType) {
        case 'youtube': return 'YouTube Video';
        case 'vimeo': return 'Vimeo Video';
        case 'drive': return 'Google Drive';
        case 'video': return 'Video File';
        default: return fileType.charAt(0).toUpperCase() + fileType.slice(1);
      }
    }
    
    return fileType.charAt(0).toUpperCase() + fileType.slice(1);
  }
  
  // Get item description for display
  getItemDescription(item: any): string {
    if (this.resourceType === 'video' && item.duration) {
      return `${this.getFileTypeLabel(item.fileType)} • ${item.duration}`;
    }
    return this.getFileTypeLabel(item.fileType);
  }
}
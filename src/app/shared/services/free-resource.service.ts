import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface FreeResourceItem {
  _id: string;
  name: string;
  nameHi: string;
  type: 'module' | 'folder' | 'file';
  path: string;
  fullPath: string;
  parent: string | null;
  fileLink?: string;
  fileDescription?: string;
  fileType?: string;
  order?: number; // Add order field
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  children?: FreeResourceItem[];
}

export interface CreateModuleData {
  name: string;
  nameHi?: string;
}

export interface CreateFolderData {
  name: string;
  parentId: string;
}

export interface CreateFileData {
  name: string;
  parentId: string;
  fileLink: string;
  fileDescription?: string;
}

export interface UpdateFileData {
  name?: string;
  fileLink?: string;
  fileDescription?: string;
}

export interface UpdateModuleData {
  name?: string;
  nameHi?: string;
}

export interface ReorderModuleData {
  id: string;
  order: number;
}

export interface ApiResponse {
  message: string;
  modules?: FreeResourceItem[];
  items?: FreeResourceItem[];
  module?: FreeResourceItem;
  folder?: FreeResourceItem;
  file?: FreeResourceItem;
  item?: FreeResourceItem;
}

@Injectable({
  providedIn: 'root'
})
export class FreeResourceService {
  private apiUrl = `${environment.apiUrl}/freeResource`;

  constructor(private http: HttpClient) {}

  // Create new module
  createModule(data: CreateModuleData): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/modules`, data);
  }

  // Create folder
  createFolder(data: CreateFolderData): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/folders`, data);
  }

  // Create file
  createFile(data: CreateFileData): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/files`, data);
  }

  // Get all modules (now sorted by order)
  getModules(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/modules`);
  }

  // Get directory tree
  getDirectoryTree(parentId?: string): Observable<ApiResponse> {
    const params: any = {};
    if (parentId) {
      params.parentId = parentId;
    }
    return this.http.get<ApiResponse>(`${this.apiUrl}/tree`, { params });
  }

  // Get full module tree
  getModuleTree(moduleId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/modules/${moduleId}/tree`);
  }

  // Update file
  updateFile(fileId: string, data: UpdateFileData): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/files/${fileId}`, data);
  }

  // Update module
  updateModule(moduleId: string, data: UpdateModuleData): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/modules/${moduleId}`, data);
  }

  // Update single module order
  updateModuleOrder(moduleId: string, order: number): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/modules/${moduleId}/order`, { order });
  }

  // Reorder multiple modules at once
  reorderModules(modules: ReorderModuleData[]): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/modules/reorder`, { modules });
  }

  // Rename item
  renameItem(itemId: string, newName: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/items/${itemId}/rename`, { newName });
  }

  // Delete item
  deleteItem(itemId: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/items/${itemId}`);
  }

  // Helper methods
  getFileIconClass(fileType?: string): string {
    if (!fileType) return 'fa fa-file';
    
    switch (fileType) {
      case 'pdf': return 'fa fa-file-pdf-o';
      case 'image': return 'fa fa-image';
      case 'document': return 'fa fa-file-text';
      case 'video': return 'fa fa-video-camera';
      case 'audio': return 'fa fa-music';
      default: return 'fa fa-file';
    }
  }

  getFileIconColor(fileType?: string): string {
    if (!fileType) return 'linear-gradient(135deg, #f1f5f9, #e2e8f0)';
    
    switch (fileType) {
      case 'pdf': return 'linear-gradient(135deg, #fee2e2, #fecaca)';
      case 'image': return 'linear-gradient(135deg, #dbeafe, #bfdbfe)';
      case 'document': return 'linear-gradient(135deg, #dcfce7, #bbf7d0)';
      case 'video': return 'linear-gradient(135deg, #fce7f3, #fbcfe8)';
      case 'audio': return 'linear-gradient(135deg, #fef3c7, #fde68a)';
      default: return 'linear-gradient(135deg, #f1f5f9, #e2e8f0)';
    }
  }

  getFileTypeLabel(fileType?: string): string {
    if (!fileType || fileType === 'other') {
      return 'File';
    }
    return fileType.charAt(0).toUpperCase() + fileType.slice(1);
  }

  hasHindiName(module: FreeResourceItem): boolean {
    return !!module.nameHi && module.nameHi.trim().length > 0;
  }

  getDisplayName(item: FreeResourceItem): string {
    return item.name;
  }
}
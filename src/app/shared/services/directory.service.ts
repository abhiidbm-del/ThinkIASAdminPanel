import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environment/environment';
import { 
  DirectoryItem, 
  CreateFolderRequest, 
  CreateFileRequest, 
  UpdateFileRequest, 
  RenameRequest,
  DirectoryTreeResponse,
  DirectoryResponse,
  SearchResponse 
} from '../../core/models/directory.model';

@Injectable({
  providedIn: 'root'
})
export class DirectoryService {
  private apiUrl = `${environment.apiUrl}/directories`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Create folder
  createFolder(name: string, parentId: string | null = null): Observable<DirectoryResponse> {
    const request: CreateFolderRequest = { name, parentId };
    return this.http.post<DirectoryResponse>(`${this.apiUrl}/folders`, request, {
      headers: this.getHeaders()
    });
  }

  // Create file (with link)
  createFile(name: string, parentId: string | null, fileLink: string, description: string = ''): Observable<DirectoryResponse> {
    const request: CreateFileRequest = { name, parentId, fileLink, description };
    return this.http.post<DirectoryResponse>(`${this.apiUrl}/files`, request, {
      headers: this.getHeaders()
    });
  }

  // Update file
  updateFile(fileId: string, name: string, fileLink: string, description: string = ''): Observable<DirectoryResponse> {
    const request: UpdateFileRequest = { name, fileLink, description };
    return this.http.put<DirectoryResponse>(`${this.apiUrl}/files/${fileId}`, request, {
      headers: this.getHeaders()
    });
  }

  // Get directory tree
  getDirectoryTree(parentId?: string | null): Observable<DirectoryTreeResponse> {
    let params = new HttpParams();
    if (parentId) {
      params = params.set('parentId', parentId);
    }

    return this.http.get<DirectoryTreeResponse>(`${this.apiUrl}/tree`, {
      headers: this.getHeaders(),
      params
    });
  }

  // Get files by type
  getFilesByType(fileType: string): Observable<SearchResponse> {
    return this.http.get<SearchResponse>(`${this.apiUrl}/type/${fileType}`, {
      headers: this.getHeaders()
    });
  }

  // Search files
  searchFiles(query: string): Observable<SearchResponse> {
    return this.http.get<SearchResponse>(`${this.apiUrl}/search/files`, {
      headers: this.getHeaders(),
      params: { query }
    });
  }

  // Rename item
  renameItem(itemId: string, newName: string): Observable<DirectoryResponse> {
    const request: RenameRequest = { newName };
    return this.http.put<DirectoryResponse>(`${this.apiUrl}/${itemId}/rename`, request, {
      headers: this.getHeaders()
    });
  }

  // Delete item
  deleteItem(itemId: string): Observable<{ message: string; item: { _id: string; name: string; type: string } }> {
    return this.http.delete<{ message: string; item: { _id: string; name: string; type: string } }>(`${this.apiUrl}/${itemId}`, {
      headers: this.getHeaders()
    });
  }
}
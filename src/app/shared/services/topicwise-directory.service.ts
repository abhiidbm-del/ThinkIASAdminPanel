import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TopicwiseDirectoryItem } from '../../core/models/topicwise-directory.model';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class TopicwiseDirectoryService {
  private apiUrl = `${environment.apiUrl}/topicwiseDirectory`;
    private apiVideoUrl = `${environment.apiUrl}/videoLecture`;

  constructor(private http: HttpClient) {}

  // Create folder
  createFolder(category: string, name: string, parentId: string | null = null): Observable<any> {
    return this.http.post(`${this.apiUrl}/folders`, {
      category,
      name,
      parentId
    });
  }

  // Create file
  createFile(category: string, name: string, parentId: string | null, fileLink: string, description: string = ''): Observable<any> {
    return this.http.post(`${this.apiUrl}/files`, {
      category,
      name,
      parentId,
      fileLink,
      description
    });
  }

  // Get directory tree for a category
  getDirectoryTree(category: string, parentId?: string | null): Observable<{ items: TopicwiseDirectoryItem[] }> {
    const params: any = {};
    if (parentId) {
      params.parentId = parentId;
    }
    return this.http.get<{ items: TopicwiseDirectoryItem[] }>(
      `${this.apiUrl}/tree/${category}`,
      { params }
    );
  }

  // Update file
  updateFile(id: string, name: string, fileLink: string, description: string = ''): Observable<any> {
    return this.http.put(`${this.apiUrl}/files/${id}`, {
      name,
      fileLink,
      description
    });
  }

  // Rename item
  renameItem(id: string, newName: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/rename`, {
      newName
    });
  }

  // Delete item
  deleteItem(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }


  getVideoDirectoryTree(category: string, parentId: string | null = null): Observable<any> {
    let url = `${this.apiVideoUrl}/tree/${category}`;
    if (parentId) {
      url += `?parentId=${parentId}`;
    }
    return this.http.get(url);
  }

  // Create folder
  createVideoFolder(category: string, name: string, parentId: string | null = null): Observable<any> {
    return this.http.post(`${this.apiVideoUrl}/folders`, {
      category,
      name,
      parentId
    });
  }

  // Create video
  createVideo(
    category: string, 
    name: string, 
    parentId: string | null, 
    fileLink: string, 
    description: string = '', 
    duration: string = '', 
    thumbnail: string = ''
  ): Observable<any> {
    return this.http.post(`${this.apiVideoUrl}/videos`, {
      category,
      name,
      parentId,
      fileLink,
      description,
      duration,
      thumbnail
    });
  }

  // Update video
  updateVideo(
    id: string, 
    name: string, 
    fileLink: string, 
    description: string = '', 
    duration: string = '', 
    thumbnail: string = ''
  ): Observable<any> {
    return this.http.put(`${this.apiVideoUrl}/videos/${id}`, {
      name,
      fileLink,
      description,
      duration,
      thumbnail
    });
  }

  // Rename item
  renameVideoItem(id: string, newName: string): Observable<any> {
    return this.http.put(`${this.apiVideoUrl}/${id}/rename`, { newName });
  }

  // Delete item
  deleteVideoItem(id: string): Observable<any> {
    return this.http.delete(`${this.apiVideoUrl}/${id}`);
  }

}
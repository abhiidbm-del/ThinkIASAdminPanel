import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class LiveContentService {
  private baseUrl = `${environment.apiUrl}/live-content`;

  constructor(private http: HttpClient) {}

  // Create new YouTube video
  createLiveContent(youtubeUrl: string): Observable<any> {
    return this.http.post(this.baseUrl, { youtubeUrl });
  }

  // Get all live content (admin)
  getAllLiveContent(): Observable<any> {
    return this.http.get(this.baseUrl);
  }

  // Toggle active status
  toggleLiveContentStatus(id: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${id}/toggle-status`, {});
  }

  // Delete live content
  deleteLiveContent(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  // Get active live content (public)
  getActiveLiveContent(): Observable<any> {
    return this.http.get(`${this.baseUrl}/public`);
  }
}
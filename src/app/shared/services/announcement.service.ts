import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Announcement, 
  CreateAnnouncementDto, 
  UpdateAnnouncementDto, 
  ApiResponse 
} from '../../core/models/announcement.model';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {
  private apiUrl = `${environment.apiUrl}/announcements`;

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Get all announcements (admin)
  getAnnouncements(): Observable<ApiResponse<Announcement[]>> {
    return this.http.get<ApiResponse<Announcement[]>>(this.apiUrl, {
      headers: this.getHeaders()
    });
  }

  // Get active announcements (public) with language support
  getActiveAnnouncements(): Observable<ApiResponse<Announcement[]>> {
    return this.http.get<ApiResponse<Announcement[]>>(
      `${this.apiUrl}/public/active`
    );
  }

  // Get announcement by ID
  getAnnouncementById(id: string): Observable<ApiResponse<Announcement>> {
    return this.http.get<ApiResponse<Announcement>>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  // Create announcement
  createAnnouncement(data: CreateAnnouncementDto): Observable<ApiResponse<Announcement>> {
    return this.http.post<ApiResponse<Announcement>>(
      this.apiUrl,
      data,
      { headers: this.getHeaders() }
    );
  }

  // Update announcement
  updateAnnouncement(id: string, data: UpdateAnnouncementDto): Observable<ApiResponse<Announcement>> {
    return this.http.put<ApiResponse<Announcement>>(
      `${this.apiUrl}/${id}`,
      data,
      { headers: this.getHeaders() }
    );
  }

  // Delete announcement
  deleteAnnouncement(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  // Toggle announcement status
  toggleStatus(id: string): Observable<ApiResponse<Announcement>> {
    return this.http.patch<ApiResponse<Announcement>>(
      `${this.apiUrl}/${id}/toggle-status`,
      {},
      { headers: this.getHeaders() }
    );
  }
}
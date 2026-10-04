import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface MentorshipProgram {
  _id: string;
  name: string;
  nameHindi?: string; descriptionHindi?: string; durationHindi?: string;
  programId?: any; batchId?: any;
  description: string;
  duration: string;
  startDate: string;
  medium: 'english' | 'hindi' | 'english/hindi';
  fee: number;
  brochureHindi: string;
  brochureEnglish: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
}

export interface CreateMentorshipProgramDto {
  name: string;
  nameHindi?: string; descriptionHindi?: string; durationHindi?: string;
  programId?: any; batchId?: any;
  description: string;
  duration: string;
  startDate: string;
  medium: 'english' | 'hindi' | 'english/hindi' ;
  fee: number;
  brochureHindi: string;
  brochureEnglish: string;
}

export interface UpdateMentorshipProgramDto extends Partial<CreateMentorshipProgramDto> {
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MentorshipService {
  private apiUrl = `${environment.apiUrl}/mentorship`;

  constructor(private http: HttpClient) {}

  // Public methods
  getActivePrograms(search?: string, medium?: string): Observable<{ success: boolean; count: number; data: MentorshipProgram[] }> {
    let params: any = {};
    if (search) params.search = search;
    if (medium) params.medium = medium;
    
    return this.http.get<{ success: boolean; count: number; data: MentorshipProgram[] }>(this.apiUrl, { params });
  }

  getProgramById(id: string): Observable<{ success: boolean; data: MentorshipProgram }> {
    return this.http.get<{ success: boolean; data: MentorshipProgram }>(`${this.apiUrl}/${id}`);
  }

  // Admin methods
  createProgram(programData: CreateMentorshipProgramDto): Observable<{ success: boolean; message: string; data: MentorshipProgram }> {
    return this.http.post<{ success: boolean; message: string; data: MentorshipProgram }>(this.apiUrl, programData);
  }

  getAllProgramsAdmin(search?: string, status?: string): Observable<{ success: boolean; count: number; data: MentorshipProgram[] }> {
    let params: any = {};
    if (search) params.search = search;
    if (status) params.status = status;
    
    return this.http.get<{ success: boolean; count: number; data: MentorshipProgram[] }>(`${this.apiUrl}/admin/all`, { params });
  }

  updateProgram(id: string, programData: UpdateMentorshipProgramDto): Observable<{ success: boolean; message: string; data: MentorshipProgram }> {
    return this.http.put<{ success: boolean; message: string; data: MentorshipProgram }>(`${this.apiUrl}/${id}`, programData);
  }

  deleteProgram(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  toggleProgramStatus(id: string): Observable<{ success: boolean; message: string; data: MentorshipProgram }> {
    return this.http.patch<{ success: boolean; message: string; data: MentorshipProgram }>(`${this.apiUrl}/${id}/toggle-status`, {});
  }
}
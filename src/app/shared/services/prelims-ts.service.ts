import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface TestDate {
  date: Date | string;
  time?: string;
  duration?: number;
  _id?: string;
  exam?: any;
}

export interface PrelimsTestSeries {
  _id?: string;
  name: string;
  nameHi?: string;
  description: string;
  descriptionHi?: string;
  intro?: string; introHi?: string;
  startDate: Date | string;
  endDate: Date | string;
  testDates: TestDate[];
  isActive: boolean;
  totalTests?: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface PaginatedResponse {
  success: boolean;
  data: PrelimsTestSeries[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PrelimsTSService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/prelims-ts`;

  // ============================================
  // ADMIN APIS
  // ============================================

  createTestSeries(data: PrelimsTestSeries): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  getAllTestSeries(params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
  }): Observable<PaginatedResponse> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.isActive !== undefined && params.isActive !== null) {
        httpParams = httpParams.set('isActive', params.isActive.toString());
      }
      if (params.search) httpParams = httpParams.set('search', params.search);
    }
    return this.http.get<PaginatedResponse>(`${this.baseUrl}/admin`, { params: httpParams });
  }

  getTestSeriesById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  updateTestSeries(id: string, data: Partial<PrelimsTestSeries>): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  toggleStatus(id: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${id}/toggle-status`, {});
  }

  deleteTestSeries(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  // ============================================
  // STUDENT APIS
  // ============================================

  getAvailableTests(): Observable<any> {
    return this.http.get(`${this.baseUrl}/student/all`);
  }

  getCurrentlyAvailableTests(): Observable<any> {
    return this.http.get(`${this.baseUrl}/student/available`);
  }

  getUpcomingTests(): Observable<any> {
    return this.http.get(`${this.baseUrl}/student/upcoming`);
  }

  reopenExam(seriesId: string, examId: string, email: string, until: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${seriesId}/exams/${examId}/reopen`, { email, until });
  }
}
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface Batch {
  _id: string;
  programId: string;
  batchName: string;
  batchNameHindi?: string; durationHindi?: string;
  startDate: Date;
  endDate: Date;
  duration: string;
  brochureHindi: string;
  brochureEnglish: string;
  order: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateBatchDto {
  batchName: string;
  batchNameHindi?: string; durationHindi?: string;
  startDate: string;
  endDate: string;
  brochureHindi?: string;
  brochureEnglish?: string;
  order?: number;
}

export interface UpdateBatchDto {
  batchName?: string;
  batchNameHindi?: string; durationHindi?: string;
  startDate?: string;
  endDate?: string;
  brochureHindi?: string;
  brochureEnglish?: string;
  isActive?: boolean;
  order?: number;
}

@Injectable({
  providedIn: 'root'
})
export class BatchService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Admin routes
  getAllBatchesAdmin(programId: string, status?: string): Observable<any> {
    let url = `${this.apiUrl}/programs/${programId}/batches/admin?`;
    if (status) url += `status=${status}`;
    return this.http.get(url);
  }

  createBatch(programId: string, data: CreateBatchDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/programs/${programId}/batches`, data);
  }

  updateBatch(batchId: string, data: UpdateBatchDto): Observable<any> {
    return this.http.put(`${this.apiUrl}/batches/${batchId}`, data);
  }

  deleteBatch(batchId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/batches/${batchId}`);
  }

  toggleBatchStatus(batchId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/batches/${batchId}/toggle-status`, {});
  }

  // Public routes
  getActiveBatches(programId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/programs/${programId}/batches`);
  }

  getBatchById(batchId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/batches/${batchId}`);
  }
}
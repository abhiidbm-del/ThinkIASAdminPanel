// shared/services/module-test.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface ModuleTest {
  _id: string;
  title: string;
  description: string;
  isActive: boolean;
  questionUids: string[];
  moduleId?: string;        // Add this
  passingScore?: number;    // Add this
  timeLimit?: number | null; // Add this
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleTestSubmission {
  _id: string;
  name: string;
  email: string;
  phone: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  timeTaken: number;
  passed: boolean;
  percentage: number;
  submittedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ModuleTestService {
  private apiUrl = `${environment.apiUrl}/module-tests`;

  constructor(private http: HttpClient) {}

  // ============ Admin Operations ============
  

  // shared/services/module-test.service.ts
createModuleTest(data: any): Observable<any> {
  return this.http.post(this.apiUrl, data);
}

  getAllModuleTests(): Observable<ModuleTest[]> {
    return this.http.get<ModuleTest[]>(this.apiUrl);
  }

  getModuleTestById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  updateModuleTest(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteModuleTest(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  toggleModuleTestActive(id: string, isActive: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/toggle-active`, { isActive });
  }

  getModuleTestSubmissions(id: string): Observable<ModuleTestSubmission[]> {
    return this.http.get<ModuleTestSubmission[]>(`${this.apiUrl}/${id}/submissions`);
  }

  // ============ Module Specific ============
  getModuleTestsByModule(moduleId: string): Observable<ModuleTest[]> {
    return this.http.get<ModuleTest[]>(`${this.apiUrl}/module/${moduleId}/tests`);
  }

  // ============ Public Operations ============
  getActiveModuleTests(): Observable<ModuleTest[]> {
    return this.http.get<ModuleTest[]>(`${this.apiUrl}/active`);
  }

  // submitModuleTest(id: string, data: any): Observable<any> {
  //   return this.http.post(`${this.apiUrl}/${id}/submit`, data);
  // }

  submitModuleTest(moduleId: string, data: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/public/${moduleId}/submit-module-test`, data);
}

  // getModuleTestLeaderboard(id: string): Observable<any> {
  //   return this.http.get(`${this.apiUrl}/${id}/leaderboard`);
  // }

  getModuleTestLeaderboard(moduleId: string): Observable<any> {
  // Use the public endpoint with moduleId
  return this.http.get(`${this.apiUrl}/public/${moduleId}/module-test-leaderboard`);
}

  checkModuleTestAvailability(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/availability`);
  }
}
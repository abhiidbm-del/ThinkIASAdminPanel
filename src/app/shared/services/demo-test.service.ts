import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class DemoTestService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/demo-tests`;

  // Admin APIs
  createDemoTest(testData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, testData);
  }

  getDemoTests(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin`);
  }

  updateDemoTest(testId: string, testData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/${testId}`, testData);
  }

  deleteDemoTest(testId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${testId}`);
  }

  toggleDemoTestStatus(testId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/${testId}/toggle-status`, {});
  }

  // Public APIs (available to both admin and students)
  getAvailableDemoTests(): Observable<any> {
    return this.http.get(`${this.apiUrl}/available`);
  }

  getDemoTestById(testId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${testId}`);
  }

  submitDemoTest(testId: string, data: { answers: any[], timeTaken: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${testId}/submit`, data);
  }

  checkDemoTestAvailability(testId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${testId}/availability`);
  }

  getStudentDemoTestResult(testId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${testId}/result`);
  }

  getStudentDemoResults(): Observable<any> {
    return this.http.get(`${this.apiUrl}/student/results`);
  }
}
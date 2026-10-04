// services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface Student {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}`;
  constructor(private http: HttpClient) {}

  getAllStudents(): Observable<Student[]> {
    return this.http.get<Student[]>(`${this.apiUrl}/admin/students`);
  }

  setStatus(id: string, isActive: boolean): Observable<any> {
    return this.http.patch(this.apiUrl + '/admin/students/' + id + '/status', { isActive });
  }
  deleteStudent(studentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/users/${studentId}`);
  }

getStudentResultsByAdmin(studentId: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/results/student/admin/${studentId}`, {
  });
}

// user.service.ts or test.service.ts
getStudentTestResultByAdmin(testId: string, studentId: string): Observable<any> {
  return this.http.get<any>(
    `${this.apiUrl}/results/admin/test/${testId}/student/${studentId}`,
  );
}

getMe(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth/me`);
  }
}
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface ModelAnswerData {
  remark: string;
  answerEnglish: string;
  answerHindi: string;
  modelAnswerPDF: string;
  modelAnswerPDFHi: string;
  isActive: boolean;
}

export interface Question {
  _id?: string;
  questionText: string;
  questionTextHi?: string;
}

export interface AnswerWriting {
  _id: string;
  name: string;
  nameHi?: string;
  description: string;
  descriptionHi?: string;
  questions: Question[];
  questionPaperPDF: string;
  questionPaperPDFHi?: string;
  startDateTime: Date;
  endDateTime: Date;
  isActive: boolean;
  order: number;
  status?: string;
  isAvailable?: boolean;
  isUpcoming?: boolean;
  isExpired?: boolean;
  hasSubmitted?: boolean;
  userSubmission?: any;
}

export interface AnswerSubmission {
  questionId: string;
  answerPDF: string;
  language?: string;
}

export interface StudentSubmission {
  _id: string;
  answerWritingId: AnswerWriting;
  studentId: any;
  answers: Array<{
    questionId: string;
    answerPDF: string;
    answerPDFHi?: string;
    submittedAt: Date;
  }>;
  submittedAt: Date;
  isLate: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AnswerWritingService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

 

  createExercise(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/answer-writing`, data);
  }

  updateExercise(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/answer-writing/${id}`, data);
  }

  deleteExercise(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/answer-writing/${id}`);
  }

  toggleExerciseStatus(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/answer-writing/${id}/toggle-status`, {});
  }

  getExerciseSubmissions(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/answer-writing/${id}/submissions`);
  }

  // Student routes (with language param)
  getAvailableExercises(lang: string = 'en'): Observable<any> {
    return this.http.get(`${this.apiUrl}/answer-writing/available?lang=${lang}`);
  }

  getExerciseById(id: string, lang: string = 'en'): Observable<any> {
    return this.http.get(`${this.apiUrl}/answer-writing/${id}?lang=${lang}`);
  }

  

  getMySubmissions(lang: string = 'en'): Observable<any> {
    return this.http.get(`${this.apiUrl}/answer-writing/my-submissions?lang=${lang}`);
  }

  // In answer-writing.service.ts
submitAnswers(id: string, answers: AnswerSubmission[]): Observable<any> {
  // Language is now part of each answer object
  return this.http.post(`${this.apiUrl}/answer-writing/${id}/submit`, { answers });
}

// In answer-writing.service.ts
getAllExercisesAdmin(search?: string, status?: string, fromDate?: string, toDate?: string): Observable<any> {
  let url = `${this.apiUrl}/answer-writing/admin/all?`;
  if (search) url += `search=${search}&`;
  if (status) url += `status=${status}&`;
  if (fromDate) url += `fromDate=${fromDate}&`;
  if (toDate) url += `toDate=${toDate}`;
  return this.http.get(url);
}

// In answer-writing.service.ts
submitEvaluation(submissionId: string, answerIndex: number, evaluatedPDF: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/answer-writing/submissions/${submissionId}/evaluate`, {
    answerIndex,
    evaluatedPDF
  });
}



  getEvaluationStatus(submissionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/answer-writing/submissions/${submissionId}/evaluation-status`);
  }

  getExerciseEvaluations(exerciseId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/answer-writing/${exerciseId}/evaluations`);
  }

  bulkSubmitEvaluations(exerciseId: string, evaluations: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/answer-writing/${exerciseId}/evaluations/bulk`, { evaluations });
  }

  getModelAnswer(exerciseId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/answer-writing/${exerciseId}/model-answer`);
  }

  updateModelAnswer(exerciseId: string, data: Partial<ModelAnswerData>): Observable<any> {
    return this.http.put(`${this.apiUrl}/answer-writing/${exerciseId}/model-answer`, data);
  }

  updateModelAnswerField(exerciseId: string, field: string, value: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/answer-writing/${exerciseId}/model-answer/${field}`, { value });
  }
}
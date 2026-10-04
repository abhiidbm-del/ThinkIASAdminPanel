import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { SupportFeature, SupportFeaturePayload, SupportFeatureResponse } from '../../core/models/support-feature.model';

@Injectable({ providedIn: 'root' })
export class SupportFeatureService {
  private readonly apiUrl = `${environment.apiUrl}/support-features`;
  constructor(private http: HttpClient) {}
  getAll(): Observable<SupportFeatureResponse<SupportFeature[]>> { return this.http.get<SupportFeatureResponse<SupportFeature[]>>(this.apiUrl); }
  create(data: SupportFeaturePayload): Observable<SupportFeatureResponse<SupportFeature>> { return this.http.post<SupportFeatureResponse<SupportFeature>>(this.apiUrl, data); }
  update(id: string, data: SupportFeaturePayload): Observable<SupportFeatureResponse<SupportFeature>> { return this.http.put<SupportFeatureResponse<SupportFeature>>(`${this.apiUrl}/${id}`, data); }
  delete(id: string): Observable<SupportFeatureResponse<never>> { return this.http.delete<SupportFeatureResponse<never>>(`${this.apiUrl}/${id}`); }
}

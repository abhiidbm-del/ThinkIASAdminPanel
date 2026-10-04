import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { AppConfig, AppConfigResponse } from '../../core/models/app-config.model';

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly apiUrl = `${environment.apiUrl}/app/config`;

  constructor(private http: HttpClient) {}

  get(): Observable<AppConfigResponse> {
    return this.http.get<AppConfigResponse>(this.apiUrl);
  }

  update(config: AppConfig): Observable<AppConfigResponse> {
    return this.http.put<AppConfigResponse>(this.apiUrl, config);
  }
}

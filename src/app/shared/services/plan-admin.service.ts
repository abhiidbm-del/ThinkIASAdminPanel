import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface AdminPlan {
  _id?: string;
  id: string;
  accessType?: 'pre' | 'mains' | 'combo';
  name: string;
  subtitle: string;
  badge: string;
  baseAmount: number;
  totalAmount: number;
  duration: string;
  features: string[];
  nameHindi?: string; subtitleHindi?: string; badgeHindi?: string; durationHindi?: string; featuresHindi?: string[];
  displayOrder: number;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class PlanAdminService {
  constructor(private http: HttpClient) {}
  getAll(): Observable<{ success: boolean; data: AdminPlan[] }> {
    return this.http.get<{ success: boolean; data: AdminPlan[] }>(`${environment.apiUrl}/plans/admin/all`);
  }
  create(plan: AdminPlan): Observable<{ success: boolean; data: AdminPlan }> { return this.http.post<{success: boolean; data: AdminPlan}>(environment.apiUrl + '/plans/admin', plan); }
  update(plan: AdminPlan): Observable<{ success: boolean; data: AdminPlan }> {
    return this.http.put<{ success: boolean; data: AdminPlan }>(`${environment.apiUrl}/plans/admin/${plan.id}`, plan);
  }
}

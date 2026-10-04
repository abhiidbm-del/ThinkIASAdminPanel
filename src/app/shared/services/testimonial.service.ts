import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { Testimonial, TestimonialPayload, TestimonialResponse } from '../../core/models/testimonial.model';

@Injectable({ providedIn: 'root' })
export class TestimonialService {
  private readonly apiUrl = `${environment.apiUrl}/testimonials`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<TestimonialResponse<Testimonial[]>> {
    return this.http.get<TestimonialResponse<Testimonial[]>>(this.apiUrl);
  }

  create(data: TestimonialPayload, imageFile: File | null): Observable<TestimonialResponse<Testimonial>> {
    const body = imageFile ? this.toFormData(data, imageFile) : data;
    return this.http.post<TestimonialResponse<Testimonial>>(this.apiUrl, body);
  }

  update(id: string, data: TestimonialPayload, imageFile: File | null): Observable<TestimonialResponse<Testimonial>> {
    const body = imageFile ? this.toFormData(data, imageFile) : data;
    return this.http.put<TestimonialResponse<Testimonial>>(`${this.apiUrl}/${id}`, body);
  }

  delete(id: string): Observable<TestimonialResponse<never>> {
    return this.http.delete<TestimonialResponse<never>>(`${this.apiUrl}/${id}`);
  }

  private toFormData(data: TestimonialPayload, imageFile: File | null): FormData {
    const formData = new FormData();
    formData.append('rating', String(data.rating));
    formData.append('description', data.description);
    formData.append('name', data.name);
    formData.append('nameHindi', data.nameHindi || '');
    formData.append('descriptionHindi', data.descriptionHindi || '');
    formData.append('subtitleHindi', data.subtitleHindi || '');
    formData.append('subtitle', data.subtitle);
    // The upload middleware accepts the profile file under the `image` field.
    // When no new file is selected, create/update uses JSON and preserves (or
    // explicitly clears) the existing image URL there.
    if (imageFile) formData.append('image', imageFile);
    return formData;
  }
}

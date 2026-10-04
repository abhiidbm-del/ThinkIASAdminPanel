import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { LanguageService } from '../../../shared/i18n/language.service';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
@Component({selector: 'app-careers-admin', standalone: true, imports: [CommonModule, FormsModule, TranslatePipe],
templateUrl: './careers.component.html',
styleUrls: ['./careers.component.css']
})
export class CareersComponent implements OnInit {
  private http=inject(HttpClient); readonly language=inject(LanguageService);
  jobs:any[]=[]; candidates:any[]=[]; form:any=null; selectedJob:any=null; message=''; saving=false;
  types=['full-time','part-time','contract','internship','remote'];
  ngOnInit(){this.load();}
  load(){this.http.get<any>(`${environment.apiUrl}/jobs/admin/all`,{params:{limit:100}}).subscribe({next:r=>this.jobs=r.data,error:e=>this.message=e.error?.message||'Unable to load jobs.'});}
  edit(job:any){this.form={...job};}
  save(){if(this.saving)return;this.saving=true;const request=this.form._id?this.http.put(`${environment.apiUrl}/jobs/${this.form._id}`,this.form):this.http.post(`${environment.apiUrl}/jobs`,this.form);request.subscribe({next:()=>{this.saving=false;this.form=null;this.load();},error:e=>{this.saving=false;this.message=e.error?.message||'Unable to save.';}});}
  toggle(job:any){this.http.patch(`${environment.apiUrl}/jobs/${job._id}/toggle`,{}).subscribe({next:()=>this.load(),error:e=>this.message=e.error?.message||'Unable to update.'});}
  applications(job:any){this.selectedJob=job;this.candidates=[];this.http.get<any>(`${environment.apiUrl}/admin/jobs/${job._id}/applications`,{params:{limit:100}}).subscribe({next:r=>this.candidates=r.data,error:e=>this.message=e.error?.message||'Unable to load applications.'});}
  download(candidate:any){this.http.get(`${environment.apiUrl}/admin/applications/${candidate._id}/resume`,{responseType:'blob'}).subscribe({next:blob=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=candidate.resumeOriginalName||'resume.pdf';a.click();URL.revokeObjectURL(url);},error:()=>this.message=this.language.hindi?'बायोडाटा डाउनलोड नहीं हुआ।':'Unable to download resume.'});}
}

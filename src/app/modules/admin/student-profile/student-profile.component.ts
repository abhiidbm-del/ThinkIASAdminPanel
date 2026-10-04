import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
@Component({selector:'app-student-profile',standalone:true,imports:[CommonModule,RouterLink,TranslatePipe],templateUrl:'./student-profile.component.html',styleUrls:['./student-profile.component.css']})
export class StudentProfileComponent implements OnInit {
  private http=inject(HttpClient); private route=inject(ActivatedRoute);
  student:any;error='';saving=false;
  toggleStatus(){this.saving=true;this.http.patch<any>(environment.apiUrl+'/admin/students/'+this.student._id+'/status',{isActive:this.student.isActive===false}).subscribe({next:r=>{this.student.isActive=r.data.isActive;this.saving=false;},error:e=>{this.error=e.error?.message||'Unable to update account.';this.saving=false;}});}
  ngOnInit(){this.http.get<any>(`${environment.apiUrl}/admin/students/${this.route.snapshot.paramMap.get('id')}`).subscribe({next:r=>this.student=r.data,error:e=>this.error=e.error?.message||'Unable to load profile.'});}
}

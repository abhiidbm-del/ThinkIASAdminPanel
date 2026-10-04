import {Component,OnInit,inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environment/environment';
import {TranslatePipe} from '../../../shared/i18n/translate.pipe';
@Component({standalone:true,imports:[CommonModule,FormsModule,TranslatePipe],templateUrl:'./program-faqs.component.html',styleUrls:['./program-faqs.component.css']})
export class ProgramFaqsComponent implements OnInit {
 private http=inject(HttpClient);faqs:any[]=[];programs:any[]=[];form:any=null;filter='';error='';message='';saving=false;
 ngOnInit(){this.load();this.http.get<any>(environment.apiUrl+'/programs?activeOnly=true').subscribe({next:r=>this.programs=r.data,error:()=>this.error='Unable to load programs.'});}
 get visible(){return this.faqs.filter(f=>!this.filter||f.programId?._id===this.filter);}
 load(){this.http.get<any>(environment.apiUrl+'/program-faqs/admin').subscribe({next:r=>this.faqs=r.data,error:e=>this.error=e.error?.message||'Unable to load FAQs.'});}
 edit(f:any){this.error='';this.form={...f,programId:f.programId?._id||f.programId||''};}
 save(){if(this.saving)return;if(!this.form.programId || !this.form.question?.trim() || !this.form.answer?.trim()){this.error='Program, question and answer are required.';return;}this.error='';this.saving=true;const req=this.form._id?this.http.put(environment.apiUrl+'/program-faqs/'+this.form._id,this.form):this.http.post(environment.apiUrl+'/program-faqs',this.form);req.subscribe({next:()=>{this.form=null;this.saving=false;this.message='FAQ saved successfully.';this.load();},error:e=>{this.saving=false;this.error=e.error?.message||'Unable to save FAQ.';}});}
 remove(f:any){if(!confirm('Delete this FAQ?'))return;this.http.delete(environment.apiUrl+'/program-faqs/'+f._id).subscribe({next:()=>this.load(),error:e=>this.error=e.error?.message||'Unable to delete FAQ.'});}
}

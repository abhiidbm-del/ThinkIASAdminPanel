import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environment/environment';

interface Session { _id:string; status:string; online:boolean; lastHeartbeatAt:string; latestSnapshotUrl?:string; recordingUrl?:string; snapshotCount:number; violations:any[]; student?:{fullName:string;email:string}; test?:{title:string}; }
@Component({
  selector:'app-exam-monitoring',
  standalone:true,
  imports: [TranslatePipe, CommonModule],
  template: `
<main class="page">
  <header>
    <div>
      <h1>{{ 'Exam Monitoring' | t }}</h1>
      <p>{{ 'Watch student screens live and review saved recordings after submission.' | t }}</p>
    </div>
    <div class="header-actions">
      <button type="button" (click)="load()">{{ 'Refresh' | t }}</button>
      <button class="delete" type="button" (click)="deleteAllSessions()">Delete all sessions</button>
    </div>
  </header>
  <nav class="tabs">
    <button type="button" [class.active]="activeTab()==='live'" (click)="activeTab.set('live')">Live Students ({{liveCount()}})</button>
    <button type="button" [class.active]="activeTab()==='history'" (click)="activeTab.set('history')">{{ 'All Sessions' | t }}</button>
  </nav>
  <p *ngIf="loading()">{{ 'Loading sessions...' | t }}</p>
  <section class="grid">
    <article *ngFor="let item of visibleSessions()">
      <div class="preview">
        <img *ngIf="item.latestSnapshotUrl" [src]="item.latestSnapshotUrl" alt="Latest snapshot" referrerpolicy="no-referrer">
        <span *ngIf="!item.latestSnapshotUrl">{{ 'No snapshot' | t }}</span>
        <b [class.online]="item.online">{{ (item.online?'LIVE':(item.status|uppercase)) | t }}</b>
        <button class="delete overlay-delete" type="button" (click)="deleteSession(item,$event)">Delete</button>
      </div>
      <h2>{{ (item.student?.fullName||'Student') | t }}</h2>
      <p>{{item.student?.email}}</p>
      <strong>{{item.test?.title||'Exam'}}</strong>
      <div class="meta">
        <span>{{item.snapshotCount||0}} snapshots</span>
        <span>{{item.violations.length||0}} flags</span>
      </div>
      <div class="card-actions">
        <button class="watch" type="button" *ngIf="item.online" (click)="watch(item)">{{ '▶ Watch Live' | t }}</button>
        <button type="button" *ngIf="item.recordingUrl" (click)="viewRecording(item)">{{ 'View recording' | t }}</button>
        <button class="delete" type="button" (click)="deleteSession(item,$event)">Delete</button>
      </div>
      <p *ngIf="item.status === 'completed' && !item.recordingUrl">{{ 'Recording upload pending' | t }}</p>
    </article>
  </section>
  <p *ngIf="!loading()&&!visibleSessions().length">{{activeTab()==='live'?'No students are live right now.':'No monitoring sessions found.'}}</p>
  <div class="viewer-backdrop" *ngIf="selected() as item">
    <section class="viewer">
      <header>
        <div>
          <h2>{{item.student?.fullName}} — {{item.test?.title}}</h2>
          <span [class.connected]="liveStatus()==='LIVE'">{{liveStatus()}}</span>
        </div>
        <div class="viewer-actions">
          <button class="delete" type="button" (click)="deleteSession(item)">Delete</button>
          <button type="button" (click)="closeViewer()">{{ '✕ Close' | t }}</button>
        </div>
      </header>
      <video *ngIf="item.online" #liveVideo autoplay playsinline controls></video>
      <video *ngIf="!item.online && item.recordingUrl" [src]="item.recordingUrl" playsinline controls preload="metadata"></video>
      <p>{{ (item.online ? 'Live screen, camera and audio from the student exam.' : 'Test finished. Screen sharing and recording have stopped.') | t }}</p>
    </section>
  </div>
</main>
  `,
  styles: [`
.page{max-width:1200px;margin:30px auto;padding:0 20px}
header{display:flex;justify-content:space-between;align-items:center;gap:12px}
.header-actions{display:flex;gap:8px;flex-wrap:wrap}
button,a{background:#3f51b5;color:#fff;border:0;border-radius:7px;padding:10px 15px;text-decoration:none;cursor:pointer}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px}
.grid article{background:#fff;border:1px solid #ddd;border-radius:12px;padding:14px}
.preview{height:180px;background:#202124;border-radius:8px;display:grid;place-items:center;color:#aaa;position:relative;overflow:hidden}
.preview img{width:100%;height:100%;object-fit:cover}
.preview b{position:absolute;top:8px;right:8px;background:#666;color:#fff;border-radius:99px;padding:4px 8px;font-size:11px;z-index:2}
.preview b.online{background:#c62828}
.grid h2{margin:12px 0 2px}
.grid p{margin:0 0 10px;color:#667}
.meta{display:flex;justify-content:space-between;margin:14px 0}
.tabs{display:flex;gap:8px;margin:22px 0}
.tabs button{background:#e8edf5;color:#334155}
.tabs button.active{background:#3f51b5;color:#fff}
.card-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
.card-actions button{flex:1;min-width:120px}
.watch{background:#c62828}
.delete{background:#e53935!important;color:#fff!important;font-weight:800}
.overlay-delete{position:absolute;left:8px;bottom:8px;z-index:3;padding:8px 14px}
.viewer-actions{display:flex;gap:8px;flex-wrap:wrap}
.viewer-backdrop{position:fixed;inset:0;background:#000c;z-index:2000;display:grid;place-items:center;padding:20px}
.viewer{width:min(1000px,96vw);background:#101317;color:#fff;border-radius:14px;padding:18px;box-shadow:0 20px 80px #000}
.viewer header{gap:20px}
.viewer h2{margin:0 0 5px}
.viewer header span{color:#ffca28}
.viewer header span.connected{color:#5cff79}
.viewer video{display:block;width:100%;max-height:72vh;margin-top:16px;background:#000;border-radius:9px}
.viewer p{color:#b9c2cf;margin-bottom:0}
@media(max-width:600px){header{align-items:flex-start;flex-direction:column}.viewer header{flex-direction:column}.tabs{overflow:auto}}
  `]
})
export class ExamMonitoringComponent implements OnInit,OnDestroy {
 private http=inject(HttpClient); @ViewChild('liveVideo') liveVideo?:ElementRef<HTMLVideoElement>;
 sessions=signal<Session[]>([]);loading=signal(true);activeTab=signal<'live'|'history'>('live');selected=signal<Session|null>(null);liveStatus=signal('Connecting to student camera...');
 private timer?:number;private answerTimer?:number;private peer?:RTCPeerConnection;private requestId='';private iceServers:RTCIceServer[]=[{urls:'stun:stun.l.google.com:19302'}];
 ngOnInit(){this.load();this.loadIceConfig();this.timer=window.setInterval(()=>this.load(false),5000)}
 ngOnDestroy(){if(this.timer)clearInterval(this.timer);this.closeViewer()}
 load(show=true){if(show)this.loading.set(true);this.http.get<any>(`${environment.apiUrl}/proctoring/admin/sessions`).subscribe({next:r=>{
   this.sessions.set(r.data||[]);this.loading.set(false);
   const current=this.selected();
   const updated=current?(r.data||[]).find((s:Session)=>s._id===current._id):null;
   if(updated){
     if(!updated.online&&this.peer){this.closeViewer(false);this.activeTab.set('history');}
     this.selected.set(updated);
     if(!updated.online)this.liveStatus.set(updated.recordingUrl?'Completed — recording ready':updated.status==='completed'?'Test completed. Recording upload pending.':'Student is offline.');
   } else if(current) this.closeViewer();
 },error:()=>this.loading.set(false)})}
 viewRecording(s:Session){this.closeViewer();this.selected.set(s);this.liveStatus.set('Completed — recording ready');}
  visibleSessions():Session[]{return this.activeTab()==='live'?this.sessions().filter(x=>x.online):this.sessions()}
  liveCount():number{return this.sessions().filter(x=>x.online).length}
 deleteSession(s:Session,event?:Event){
  event?.stopPropagation();
  if(!confirm(`Delete this monitoring session for ${s.student?.fullName||'the student'}? This cannot be undone.`))return;
  this.http.delete(`${environment.apiUrl}/proctoring/admin/sessions/${s._id}`).subscribe({
    next:()=>{ if(this.selected()?._id===s._id)this.closeViewer(); this.sessions.set(this.sessions().filter(item=>item._id!==s._id)); },
    error:err=>alert(err.error?.message||'Unable to delete session')
  });
 }
 deleteAllSessions(){
  if(!this.sessions().length)return;
  if(!confirm('Delete ALL monitoring sessions? This cannot be undone.'))return;
  this.http.delete(`${environment.apiUrl}/proctoring/admin/sessions`).subscribe({
    next:()=>{ this.closeViewer(); this.sessions.set([]); },
    error:err=>alert(err.error?.message||'Unable to delete sessions')
  });
 }
 watch(s:Session){if(!s.online)return;this.closeViewer(false);this.selected.set(s);this.liveStatus.set('Connecting to student camera...');window.setTimeout(()=>this.createViewer(s),0)}
 closeViewer(clear=true){if(this.answerTimer)clearInterval(this.answerTimer);this.answerTimer=undefined;this.peer?.close();this.peer=undefined;if(this.requestId&&this.selected())this.http.delete(`${environment.apiUrl}/proctoring/admin/sessions/${this.selected()!._id}/live`,{params:{requestId:this.requestId}}).subscribe();this.requestId='';if(this.liveVideo?.nativeElement)this.liveVideo.nativeElement.srcObject=null;if(clear)this.selected.set(null)}
 private async loadIceConfig(){try{const r=await firstValueFrom(this.http.get<any>(`${environment.apiUrl}/proctoring/ice-config`));if(r?.data?.iceServers?.length)this.iceServers=r.data.iceServers}catch{}}
 private async createViewer(s:Session){if(this.selected()?._id!==s._id||!this.selected()?.online)return;try{const p=new RTCPeerConnection({iceServers:this.iceServers});this.peer=p;p.addTransceiver('video',{direction:'recvonly'});p.addTransceiver('audio',{direction:'recvonly'});p.ontrack=e=>{const v=this.liveVideo?.nativeElement;if(v){v.srcObject=e.streams[0];v.play().catch(()=>undefined)}this.liveStatus.set('LIVE')};p.oniceconnectionstatechange=()=>{if(['connected','completed'].includes(p.iceConnectionState))this.liveStatus.set('LIVE');if(p.iceConnectionState==='failed')this.liveStatus.set('Connection failed. Please reconnect.');if(p.iceConnectionState==='disconnected')this.liveStatus.set('Student connection interrupted.')};await p.setLocalDescription(await p.createOffer());await this.waitForIce(p);if(this.peer!==p)return;const r=await firstValueFrom(this.http.post<any>(`${environment.apiUrl}/proctoring/admin/sessions/${s._id}/live/offer`,{offer:p.localDescription?.toJSON()}));if(this.peer!==p){this.http.delete(`${environment.apiUrl}/proctoring/admin/sessions/${s._id}/live`,{params:{requestId:r.data.requestId}}).subscribe();return;}this.requestId=r.data.requestId;this.answerTimer=window.setInterval(()=>this.pollAnswer(s._id),1500);this.pollAnswer(s._id)}catch(e:any){if(this.selected()?._id===s._id)this.liveStatus.set(e?.error?.message||'Unable to start live view.')}}
 private pollAnswer(id:string){if(!this.requestId||this.peer?.remoteDescription)return;this.http.get<any>(`${environment.apiUrl}/proctoring/admin/sessions/${id}/live/answer`,{params:{requestId:this.requestId}}).subscribe({next:r=>{if(!r?.data?.answer||!this.peer||this.peer.remoteDescription)return;this.peer.setRemoteDescription(r.data.answer).catch(()=>this.liveStatus.set('Invalid student stream response.'));if(this.answerTimer)clearInterval(this.answerTimer)}})}
 private waitForIce(p:RTCPeerConnection):Promise<void>{if(p.iceGatheringState==='complete')return Promise.resolve();return new Promise(resolve=>{const done=()=>{if(p.iceGatheringState==='complete'){p.removeEventListener('icegatheringstatechange',done);resolve()}};p.addEventListener('icegatheringstatechange',done);window.setTimeout(()=>{p.removeEventListener('icegatheringstatechange',done);resolve()},8000)})}
}

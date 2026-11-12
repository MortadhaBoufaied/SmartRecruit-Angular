import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { apiError } from '../../core/api-error';
import { Application, Job } from '../../models/api.models';
import { RecruitmentApiService } from '../../services/recruitment-api.service';

type ApplicationFilter = 'ALL' | 'ACTIVE' | 'COMPLETE';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-intro"><span class="page-kicker">YOUR SEARCH</span><h1>Applications, all in one place.</h1><p>Follow each role from submission through the latest update.</p></div>
    <div class="application-summary"><div><strong>{{items.length}}</strong><span>All applications</span></div><div><strong>{{activeCount}}</strong><span>In progress</span></div><div><strong>{{completeCount}}</strong><span>Completed</span></div></div>
    <div class="application-toolbar"><div class="tabs" role="tablist" aria-label="Filter applications"><button type="button" *ngFor="let filter of filters" [class.active]="activeFilter===filter.value" [attr.aria-selected]="activeFilter===filter.value" role="tab" (click)="activeFilter=filter.value">{{filter.label}} <span>{{count(filter.value)}}</span></button></div><a class="button primary" routerLink="/jobs">Find more roles <span aria-hidden="true">→</span></a></div>
    <div class="alert-error" *ngIf="error" role="alert"><span>{{error}}</span><button class="secondary" type="button" (click)="load()">Try again</button></div>
    <div class="state" *ngIf="loading"><span class="loading-dots" aria-hidden="true"></span>Loading your applications…</div>
    <div class="empty-state" *ngIf="!loading && !error && !items.length"><div class="empty-illustration" aria-hidden="true">↗</div><h3>Your next opportunity is out there</h3><p>When you apply, your application and its latest status will appear here.</p><a class="button primary" routerLink="/jobs">Explore open roles</a></div>
    <div class="empty-state compact-empty" *ngIf="!loading && items.length && !visibleItems.length"><h3>No {{activeFilter==='ACTIVE'?'in-progress':'completed'}} applications</h3><p>Choose another filter to see the rest of your applications.</p></div>
    <div class="timeline application-timeline" *ngIf="!loading && visibleItems.length">
      <article class="application-timeline-card" *ngFor="let application of visibleItems; trackBy: trackApplication">
        <i class="timeline-marker" [ngClass]="statusClass(application.status)" aria-hidden="true"></i>
        <div class="timeline-content">
          <div class="application-line-top"><span class="pill" [ngClass]="statusClass(application.status)">{{statusLabel(application.status)}}</span><small>Submitted {{application.createdAt | date:'mediumDate'}}</small></div>
          <h2>{{jobTitles[application.jobId] || 'Role ' + application.jobId.slice(0,8)}}</h2>
          <p class="application-reference">Reference {{application.id.slice(0,8)}} <span>·</span> Last updated {{application.updatedAt | date:'mediumDate'}}</p>
          <p class="application-message" *ngIf="application.message">{{application.message}}</p>
          <div class="status-explainer" [ngSwitch]="application.status">
            <p *ngSwitchCase="'PENDING'">Your application has been submitted and is waiting for the hiring team.</p>
            <p *ngSwitchCase="'REVIEWING'">The hiring team is reviewing your application.</p>
            <p *ngSwitchCase="'INTERVIEW'">The team would like to continue the conversation. Check your interviews and notifications for details.</p>
            <p *ngSwitchCase="'HIRED'">Congratulations. The hiring team marked this application as hired.</p>
            <p *ngSwitchCase="'REJECTED'">The hiring team has closed this application. You can keep exploring other roles.</p>
            <p *ngSwitchCase="'UNAVAILABLE'">This role is no longer available.</p>
            <p *ngSwitchDefault>Your application status has been updated.</p>
          </div>
          <a class="text-link" *ngIf="application.status==='INTERVIEW'" routerLink="/interviews">View interviews and schedule <span aria-hidden="true">→</span></a>
        </div>
      </article>
    </div>
  `
})
export class ApplicationsComponent implements OnInit {
  readonly filters: {value: ApplicationFilter; label: string}[] = [{value:'ALL',label:'All'}, {value:'ACTIVE',label:'In progress'}, {value:'COMPLETE',label:'Completed'}];
  items: Application[] = [];
  jobTitles: Record<string, string> = {};
  loading = true;
  error = '';
  activeFilter: ApplicationFilter = 'ALL';
  constructor(private readonly api: RecruitmentApiService) {}
  ngOnInit() { this.load(); }

  get activeCount() { return this.items.filter(item => ['PENDING','REVIEWING','INTERVIEW'].includes(item.status)).length; }
  get completeCount() { return this.items.length - this.activeCount; }
  get visibleItems() { return this.items.filter(item => this.activeFilter === 'ALL' || (this.activeFilter === 'ACTIVE' ? ['PENDING','REVIEWING','INTERVIEW'].includes(item.status) : ['HIRED','REJECTED','UNAVAILABLE'].includes(item.status))); }
  count(filter: ApplicationFilter) { return filter === 'ALL' ? this.items.length : filter === 'ACTIVE' ? this.activeCount : this.completeCount; }
  trackApplication(_: number, item: Application) { return item.id; }
  statusLabel(status: string) { return status.charAt(0) + status.slice(1).toLowerCase(); }
  statusClass(status: string) { return status === 'HIRED' ? 'success' : status === 'REJECTED' || status === 'UNAVAILABLE' ? 'neutral' : status === 'INTERVIEW' ? 'warning' : ''; }

  load() {
    this.loading = true; this.error = '';
    this.api.candidateApplications().subscribe({
      next: items => {
        this.items = [...items].sort((a,b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
        this.loading = false;
        const ids = [...new Set(items.map(item => item.jobId))].filter(id => !this.jobTitles[id]);
        for (const id of ids) this.api.job(id).pipe(catchError(() => of(null))).subscribe((job: Job | null) => { if (job) this.jobTitles = {...this.jobTitles, [id]: job.title}; });
      },
      error: error => { this.error = apiError(error, 'Your applications could not be loaded.'); this.loading = false; }
    });
  }
}

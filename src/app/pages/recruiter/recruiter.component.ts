import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { apiError } from '../../core/api-error';
import { Application, Business, Job, JobRequest } from '../../models/api.models';
import { RecruitmentApiService } from '../../services/recruitment-api.service';

type RecruiterTab = 'jobs' | 'applications' | 'businesses';

@Component({
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule, FormsModule, RouterLink],
  template: `
    <div class="page-intro"><span class="page-kicker">RECRUITER WORKSPACE</span><h1>Hiring, with a clear next step.</h1><p>Manage your businesses and roles, then keep candidate conversations moving.</p></div>
    <div class="recruiter-summary" aria-label="Recruiting summary">
      <div><span class="summary-icon">▦</span><span><strong>{{publishedCount}}</strong><small>Published roles</small></span></div>
      <div><span class="summary-icon">◷</span><span><strong>{{applications.length}}</strong><small>Applications to review</small></span></div>
      <div><span class="summary-icon">◎</span><span><strong>{{businesses.length}}</strong><small>Businesses</small></span></div>
    </div>
    <div class="tabs" role="tablist" aria-label="Recruiter workspace sections">
      <button type="button" role="tab" [attr.aria-selected]="tab==='jobs'" [class.active]="tab==='jobs'" (click)="setTab('jobs')">Job offers <span>{{jobs.length}}</span></button>
      <button type="button" role="tab" [attr.aria-selected]="tab==='applications'" [class.active]="tab==='applications'" (click)="setTab('applications')">Applications <span>{{applications.length}}</span></button>
      <button type="button" role="tab" [attr.aria-selected]="tab==='businesses'" [class.active]="tab==='businesses'" (click)="setTab('businesses')">Businesses <span>{{businesses.length}}</span></button>
    </div>

    <div class="auth-message success" role="status" *ngIf="message">{{message}}</div>
    <div class="alert-error" role="alert" *ngIf="errorMessage"><span>{{errorMessage}}</span><button class="secondary" type="button" (click)="load()">Try again</button></div>

    <section *ngIf="tab==='jobs'" class="recruiter-section" aria-label="Job offers">
      <div class="section-heading"><div><h2>Your roles</h2><p>Create roles as drafts, review the details, then publish when ready.</p></div><button class="primary" type="button" (click)="startNewJob()" [disabled]="!businesses.length">＋ Create a role</button></div>
      <div class="empty-state" *ngIf="!loading && !jobs.length"><div class="empty-illustration" aria-hidden="true">▦</div><h3>No roles yet</h3><p>Start with a draft. You can review it and publish when your team is ready.</p><button class="primary" type="button" (click)="startNewJob()" [disabled]="!businesses.length">Create your first role</button><button class="link-button" *ngIf="!businesses.length" type="button" (click)="setTab('businesses')">Add a business first</button></div>
      <div class="jobs-admin-list" *ngIf="jobs.length">
        <article class="admin-job-card" *ngFor="let job of jobs; trackBy: trackJob">
          <div class="admin-job-main"><div class="admin-job-title"><span class="job-company-mark" aria-hidden="true">{{job.title.slice(0,1).toUpperCase()}}</span><div><h3>{{job.title}}</h3><p>{{job.location || 'Location not specified'}} <span>·</span> {{job.contractType || 'Contract type not specified'}}</p></div></div><span class="pill" [ngClass]="statusClass(job.status)">{{job.status}}</span></div>
          <p class="admin-job-description">{{job.description}}</p>
          <div class="admin-job-meta"><span>{{businessName(job.businessId)}}</span><span>Updated {{job.updatedAt | date:'mediumDate'}}</span><span *ngIf="job.expiresAt">Closes {{job.expiresAt | date:'mediumDate'}}</span></div>
          <div class="actions admin-job-actions">
            <button class="secondary" type="button" (click)="editJob(job)" [disabled]="busyId===job.id">Edit</button>
            <button class="primary" type="button" *ngIf="job.status==='DRAFT'" (click)="publish(job)" [disabled]="busyId===job.id">{{busyId===job.id?'Working…':'Publish role'}}</button>
            <button class="secondary" type="button" *ngIf="job.status==='PUBLISHED'" (click)="changeJobState(job,'close')" [disabled]="busyId===job.id">Close role</button>
            <button class="secondary" type="button" *ngIf="job.status==='CLOSED'" (click)="changeJobState(job,'reopen')" [disabled]="busyId===job.id">Reopen role</button>
            <button class="danger" type="button" *ngIf="job.status==='DRAFT' || job.status==='CLOSED'" (click)="removeJob(job)" [disabled]="busyId===job.id">Delete</button>
          </div>
        </article>
      </div>
      <p class="state" *ngIf="loading">Loading your roles…</p>
    </section>

    <section *ngIf="tab==='applications'" aria-label="Candidate applications">
      <div class="section-heading"><div><h2>Candidate applications</h2><p>Review each application and update its current stage.</p></div><a class="button secondary" routerLink="/interviews">View interviews</a></div>
      <div class="state" *ngIf="loading">Loading applications…</div>
      <div class="empty-state" *ngIf="!loading && !applications.length"><div class="empty-illustration" aria-hidden="true">◷</div><h3>No applications to review</h3><p>Applications for your published roles will appear here.</p><button class="secondary" type="button" (click)="setTab('jobs')">Review job offers</button></div>
      <div class="application-list" *ngIf="applications.length">
        <article class="application-card" *ngFor="let application of applications; trackBy: trackApplication">
          <div class="application-person"><span class="avatar-light" aria-hidden="true">{{application.candidateId.slice(0,1).toUpperCase()}}</span><div><h3>Candidate <span>{{application.candidateId.slice(0,8)}}</span></h3><p>Applied {{application.createdAt | date:'mediumDate'}}</p></div></div>
          <div class="application-role"><small>ROLE</small><strong>{{jobTitle(application.jobId)}}</strong></div>
          <div class="application-role"><small>CV REFERENCE</small><strong>{{application.candidateCvId.slice(0,8)}}</strong></div>
          <div class="application-stage"><label [for]="'status-'+application.id">Stage</label><select [id]="'status-'+application.id" [(ngModel)]="applicationStatus[application.id]" [ngModelOptions]="{standalone:true}"><option *ngFor="let status of applicationStatuses" [value]="status">{{statusLabel(status)}}</option></select></div>
          <button class="secondary" type="button" (click)="saveApplicationStatus(application)" [disabled]="busyId===application.id || applicationStatus[application.id]===application.status">{{busyId===application.id?'Saving…':'Save stage'}}</button>
        </article>
      </div>
    </section>

    <section *ngIf="tab==='businesses'" aria-label="Businesses">
      <div class="section-heading"><div><h2>Your businesses</h2><p>Roles are published under the business that owns the opportunity.</p></div></div>
      <div class="split">
        <form class="panel form-stack" [formGroup]="businessForm" (ngSubmit)="createBusiness()">
          <div><span class="eyebrow">BUSINESS PROFILE</span><h2>Add a business</h2><p class="muted">Add a clear profile so candidates know who is hiring.</p></div>
          <label>Business name<input formControlName="name" placeholder="e.g. Northstar Studio"></label>
          <div class="grid2"><label>Industry<input formControlName="industry" placeholder="e.g. Technology"></label><label>Website<input formControlName="website" type="url" placeholder="https://example.com"></label></div>
          <label>Description<textarea formControlName="description" placeholder="What does your organization do?"></textarea></label>
          <div class="grid2"><label>City<input formControlName="city" placeholder="City"></label><label>Country<input formControlName="country" placeholder="Country"></label></div>
          <label>Address<input formControlName="address" placeholder="Street address (optional)"></label>
          <button class="primary" type="submit" [disabled]="businessForm.invalid || busyId==='business'">{{busyId==='business'?'Saving…':'Create business'}}</button>
        </form>
        <div class="business-list">
          <div class="empty-state" *ngIf="!loading && !businesses.length"><div class="empty-illustration" aria-hidden="true">◎</div><h3>Your business profile will live here</h3><p>Create a business to start drafting roles for your team.</p></div>
          <article class="business-card" *ngFor="let business of businesses"><div class="business-card-top"><span class="job-company-mark" aria-hidden="true">{{business.name.slice(0,1).toUpperCase()}}</span><span class="pill" [ngClass]="business.status==='ACTIVE'?'success':'neutral'">{{business.status}}</span></div><h3>{{business.name}}</h3><p>{{business.description || 'Add a short description to help candidates understand your organization.'}}</p><div class="business-meta"><span *ngIf="business.industry">{{business.industry}}</span><span *ngIf="business.city || business.country">{{business.city}}{{business.city && business.country ? ', ' : ''}}{{business.country}}</span><a *ngIf="business.website" [href]="safeWebsite(business.website)" target="_blank" rel="noopener noreferrer">Visit website ↗</a></div></article>
          <p class="state" *ngIf="loading">Loading businesses…</p>
        </div>
      </div>
    </section>

    <div class="modal-backdrop" *ngIf="showJobEditor" (click)="closeJobEditor()">
      <section class="job-editor panel" role="dialog" aria-modal="true" aria-labelledby="job-editor-title" (click)="$event.stopPropagation()">
        <button class="icon-button close-editor" type="button" aria-label="Close editor" (click)="closeJobEditor()">×</button>
        <span class="eyebrow">{{editingJobId ? 'EDIT ROLE' : 'NEW ROLE'}}</span><h2 id="job-editor-title">{{editingJobId ? 'Update role details' : 'Create a draft role'}}</h2><p class="muted">Review the details before publishing. Draft roles stay private.</p>
        <form class="form-stack" [formGroup]="jobForm" (ngSubmit)="saveJob()">
          <label>Business<select formControlName="businessId"><option value="">Select business</option><option *ngFor="let business of businesses" [value]="business.id">{{business.name}}</option></select></label>
          <label>Role title<input formControlName="title" placeholder="e.g. Senior product designer"></label>
          <label>Description<textarea formControlName="description" placeholder="Describe the role, responsibilities and what success looks like."></textarea></label>
          <div class="grid2"><label>Location<input formControlName="location" placeholder="Remote, Tunis, …"></label><label>Employment type<input formControlName="contractType" placeholder="Full-time, contract, …"></label></div>
          <label>Application deadline <span class="input-hint">Optional</span><input type="date" formControlName="expiresAt"></label>
          <div class="form-actions"><button class="primary" type="submit" [disabled]="jobForm.invalid || busyId==='job'">{{busyId==='job'?'Saving…':editingJobId?'Save changes':'Save as draft'}}</button><button class="secondary" type="button" (click)="closeJobEditor()">Cancel</button></div>
        </form>
      </section>
    </div>
  `
})
export class RecruiterComponent implements OnInit {
  tab: RecruiterTab = 'jobs';
  readonly applicationStatuses = ['PENDING', 'REVIEWING', 'INTERVIEW', 'HIRED', 'REJECTED', 'UNAVAILABLE'];
  businesses: Business[] = [];
  jobs: Job[] = [];
  applications: Application[] = [];
  applicationStatus: Record<string, string> = {};
  loading = true;
  busyId = '';
  message = '';
  errorMessage = '';
  showJobEditor = false;
  editingJobId = '';
  businessForm = this.fb.nonNullable.group({ name: ['', [Validators.required, Validators.maxLength(160)]], description: [''], website: [''], industry: [''], address: [''], city: [''], country: [''] });
  jobForm = this.fb.nonNullable.group({ businessId: ['', Validators.required], title: ['', [Validators.required, Validators.maxLength(180)]], description: ['', [Validators.required, Validators.maxLength(10000)]], location: ['', [Validators.required, Validators.maxLength(180)]], contractType: ['', [Validators.required, Validators.maxLength(80)]], expiresAt: [''] });

  constructor(private readonly fb: FormBuilder, private readonly api: RecruitmentApiService) {}
  get publishedCount() { return this.jobs.filter(job => job.status === 'PUBLISHED').length; }

  ngOnInit() { this.load(); }
  setTab(tab: RecruiterTab) { this.tab = tab; this.message = ''; this.errorMessage = ''; }
  trackJob(_: number, job: Job) { return job.id; }
  trackApplication(_: number, application: Application) { return application.id; }
  statusLabel(status: string) { return status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' '); }
  statusClass(status: string) { return status === 'PUBLISHED' ? 'success' : status === 'CLOSED' || status === 'EXPIRED' ? 'neutral' : ''; }
  businessName(id: string) { return this.businesses.find(item => item.id === id)?.name ?? 'Business'; }
  jobTitle(id: string) { return this.jobs.find(item => item.id === id)?.title ?? `Role ${id.slice(0, 8)}`; }
  safeWebsite(url: string) { return /^https?:\/\//i.test(url) ? url : `https://${url}`; }

  load() {
    this.loading = true;
    this.errorMessage = '';
    let finished = 0;
    const done = () => { finished++; if (finished >= 3) this.loading = false; };
    this.api.recruiterBusinesses().subscribe({ next: items => { this.businesses = items; if (!this.jobForm.controls.businessId.value && items[0]) this.jobForm.controls.businessId.setValue(items[0].id); done(); }, error: error => { this.errorMessage ||= apiError(error, 'Could not load business profiles.'); done(); } });
    this.api.recruiterJobs().subscribe({ next: items => { this.jobs = items; done(); }, error: error => { this.errorMessage ||= apiError(error, 'Could not load job offers.'); done(); } });
    this.api.recruiterApplications().subscribe({ next: items => { this.applications = items; this.applicationStatus = Object.fromEntries(items.map(item => [item.id, item.status])); done(); }, error: error => { this.errorMessage ||= apiError(error, 'Could not load applications.'); done(); } });
  }

  startNewJob() {
    if (!this.businesses.length) { this.setTab('businesses'); return; }
    this.editingJobId = '';
    this.jobForm.reset({ businessId: this.businesses[0].id, title: '', description: '', location: '', contractType: '', expiresAt: '' });
    this.showJobEditor = true;
  }

  editJob(job: Job) {
    this.editingJobId = job.id;
    this.jobForm.reset({ businessId: job.businessId, title: job.title, description: job.description, location: job.location, contractType: job.contractType, expiresAt: job.expiresAt ? job.expiresAt.slice(0, 10) : '' });
    this.showJobEditor = true;
  }

  closeJobEditor() { this.showJobEditor = false; this.editingJobId = ''; }

  saveJob() {
    if (this.jobForm.invalid || this.busyId) { this.jobForm.markAllAsTouched(); return; }
    const value = this.jobForm.getRawValue();
    const payload: JobRequest = { businessId: value.businessId, title: value.title.trim(), description: value.description.trim(), location: value.location.trim(), contractType: value.contractType.trim(), ...(value.expiresAt ? { expiresAt: new Date(`${value.expiresAt}T23:59:59`).toISOString() } : {}) };
    const id = this.editingJobId;
    this.busyId = 'job';
    const request = id ? this.api.updateJob(id, payload) : this.api.createJob(payload);
    request.subscribe({ next: () => { this.busyId = ''; this.closeJobEditor(); this.flash(id ? 'Role details updated.' : 'Draft role created. Review it, then publish when ready.'); this.load(); }, error: error => { this.busyId = ''; this.errorMessage = apiError(error, 'Could not save the role.'); } });
  }

  publish(job: Job) {
    if (this.busyId) return;
    this.busyId = job.id;
    this.api.publishJob(job.id).subscribe({ next: () => { this.busyId = ''; this.flash(`${job.title} is now published.`); this.load(); }, error: error => { this.busyId = ''; this.errorMessage = apiError(error, 'Could not publish this role.'); } });
  }

  changeJobState(job: Job, action: 'close' | 'reopen') {
    if (this.busyId) return;
    this.busyId = job.id;
    const request = action === 'close' ? this.api.closeJob(job.id) : this.api.reopenJob(job.id);
    request.subscribe({ next: () => { this.busyId = ''; this.flash(action === 'close' ? 'Role closed. It is no longer shown in public search.' : 'Role reopened and ready for applications.'); this.load(); }, error: error => { this.busyId = ''; this.errorMessage = apiError(error, 'Could not update this role.'); } });
  }

  removeJob(job: Job) {
    if (this.busyId || !confirm(`Delete the draft “${job.title}”? This cannot be undone.`)) return;
    this.busyId = job.id;
    this.api.deleteJob(job.id).subscribe({ next: () => { this.busyId = ''; this.flash('Draft role deleted.'); this.load(); }, error: error => { this.busyId = ''; this.errorMessage = apiError(error, 'Could not delete this role.'); } });
  }

  createBusiness() {
    if (this.businessForm.invalid || this.busyId) { this.businessForm.markAllAsTouched(); return; }
    this.busyId = 'business';
    const value = this.businessForm.getRawValue();
    this.api.createRecruiterBusiness({ ...value, name: value.name.trim() }).subscribe({ next: business => { this.busyId = ''; this.businessForm.reset(); this.jobForm.controls.businessId.setValue(business.id); this.flash('Business profile created.'); this.load(); }, error: error => { this.busyId = ''; this.errorMessage = apiError(error, 'Could not create the business profile.'); } });
  }

  saveApplicationStatus(application: Application) {
    const status = this.applicationStatus[application.id];
    if (!status || status === application.status || this.busyId) return;
    this.busyId = application.id;
    this.api.updateApplication(application.id, status).subscribe({ next: updated => { Object.assign(application, updated); this.applicationStatus[application.id] = updated.status; this.busyId = ''; this.flash('Application stage updated.'); }, error: error => { this.busyId = ''; this.errorMessage = apiError(error, 'Could not update the application.'); this.applicationStatus[application.id] = application.status; } });
  }

  private flash(message: string) { this.message = message; this.errorMessage = ''; window.setTimeout(() => { if (this.message === message) this.message = ''; }, 5000); }
}

import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { apiError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { CandidateCv, Job } from '../../models/api.models';
import { CvApiService } from '../../services/cv-api.service';
import { RecruitmentApiService } from '../../services/recruitment-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe],
  template: `
    <div class="public-shell">
      <a class="skip-link" href="#opportunities">Skip to job results</a>
      <header class="public-header">
        <a class="brand" routerLink="/jobs" aria-label="SmartRecruit home">
          <i class="brand-mark">SR</i><span class="brand-copy"><span class="brand-name">SmartRecruit</span><small class="brand-caption">Find work that fits</small></span>
        </a>
        <nav class="public-nav" aria-label="Main navigation">
          <a routerLink="/jobs">Explore roles</a>
          <a class="button secondary" *ngIf="!auth.authenticated()" routerLink="/login">Sign in</a>
          <a class="button primary" *ngIf="!auth.authenticated()" routerLink="/login" [queryParams]="{mode:'signup'}">Create account</a>
          <a class="button primary" *ngIf="auth.authenticated()" routerLink="/dashboard">My workspace</a>
        </nav>
      </header>

      <main class="public-main">
        <section class="public-hero">
          <div class="public-hero-inner">
            <div class="hero-copy">
              <span class="hero-eyebrow">Make your next move</span>
              <h1>Good work starts with <span>the right fit.</span></h1>
              <p class="hero-lead">Explore opportunities from hiring teams and find a role that matches the way you want to grow.</p>
              <div class="hero-trust"><span><i></i>Browse without an account</span><span><i></i>Apply with your CV</span></div>
            </div>
            <form class="search-panel" (ngSubmit)="search()" aria-label="Search jobs">
              <div class="search-grid">
                <div class="search-control"><label for="job-keywords">Role or keyword</label><input id="job-keywords" name="q" [(ngModel)]="q" placeholder="e.g. Product designer" autocomplete="off"></div>
                <div class="search-control"><label for="job-location">Location</label><input id="job-location" name="location" [(ngModel)]="location" placeholder="City or remote"></div>
                <div class="search-control"><label for="job-contract">Employment type</label><select id="job-contract" name="contractType" [(ngModel)]="contractType"><option value="">Any type</option><option *ngFor="let type of contractTypes" [value]="type">{{type}}</option></select></div>
                <button class="primary search-submit" type="submit"><span aria-hidden="true">⌕</span> Search roles</button>
              </div>
            </form>
          </div>
        </section>

        <section class="public-content" id="opportunities">
          <div class="browse-heading">
            <div><span class="eyebrow">OPEN OPPORTUNITIES</span><h2>Roles worth a closer look</h2><p>Use the filters to narrow your search.</p></div>
            <div class="result-tools"><span class="result-count" *ngIf="!loading && !errorMessage">{{totalElements}} {{totalElements === 1 ? 'role' : 'roles'}}</span><button class="link-button" type="button" *ngIf="hasFilters" (click)="reset()">Clear filters</button></div>
          </div>

          <div class="auth-message info" role="status" *ngIf="applyPrompt">You’re signed in. Select your CV below to complete your application.</div>
          <div class="alert-error" role="alert" *ngIf="errorMessage"><div><strong>We couldn’t load opportunities.</strong><p>{{errorMessage}}</p></div><button class="secondary" type="button" (click)="load()">Try again</button></div>

          <div class="jobs-grid" *ngIf="loading" aria-label="Loading opportunities" aria-live="polite">
            <article class="job-card job-skeleton" *ngFor="let n of skeletons"><span class="skeleton skeleton-line short"></span><span class="skeleton skeleton-line title"></span><span class="skeleton skeleton-line"></span><span class="skeleton skeleton-block"></span><span class="skeleton skeleton-line short"></span></article>
          </div>

          <div class="empty-state" *ngIf="!loading && !errorMessage && !jobs.length">
            <div class="empty-illustration" aria-hidden="true">⌕</div>
            <h3>No roles match those filters</h3>
            <p>Try a different title or location, or clear your filters to see all current opportunities.</p>
            <button class="secondary" type="button" (click)="reset()" *ngIf="hasFilters">Clear filters</button>
          </div>

          <div class="jobs-grid" *ngIf="!loading && jobs.length">
            <article class="job-card" *ngFor="let job of jobs; trackBy: trackJob">
              <div class="job-card-top"><span class="job-company-mark" aria-hidden="true">{{companyInitial(job.title)}}</span><span class="pill neutral">{{job.contractType || 'Opportunity'}}</span></div>
              <h3 class="job-card-title">{{job.title}}</h3>
              <div class="job-card-meta"><span aria-hidden="true">⌖</span><span>{{job.location || 'Location not specified'}}</span><span *ngIf="job.publishedAt">· {{job.publishedAt | date:'mediumDate'}}</span></div>
              <p class="job-card-description" [class.expanded]="expandedJobIds.has(job.id)">{{job.description}}</p>
              <button class="link-button job-details-toggle" type="button" (click)="toggleDetails(job.id)" [attr.aria-expanded]="expandedJobIds.has(job.id)">{{expandedJobIds.has(job.id)?'Show less':'Read full description'}}</button>
              <div class="job-card-footer">
                <span class="job-posted">{{job.publishedAt ? ('Posted ' + (job.publishedAt | date:'mediumDate')) : 'Published opportunity'}}</span>
                <ng-container *ngIf="auth.hasRole('CANDIDATE'); else otherAudience">
                  <span class="pill success" *ngIf="hasApplied(job.id)">Applied</span>
                  <div class="job-apply-controls" *ngIf="!hasApplied(job.id)">
                    <select *ngIf="cvs.length" [(ngModel)]="selectedCvId" [ngModelOptions]="{standalone:true}" [attr.aria-label]="'Choose the CV for '+job.title"><option value="">Choose a CV</option><option *ngFor="let cv of cvs" [value]="cv.id">{{cv.originalFilename}}</option></select>
                    <button class="primary" type="button" *ngIf="cvs.length" (click)="apply(job)" [disabled]="applyingId === job.id || !selectedCvId" [attr.aria-label]="'Apply to ' + job.title">
                      {{applyingId === job.id ? 'Sending…' : 'Apply now'}} <span aria-hidden="true">→</span>
                    </button>
                    <a class="button primary" *ngIf="!cvs.length" routerLink="/cvs">Upload a CV <span aria-hidden="true">→</span></a>
                  </div>
                </ng-container>
                <ng-template #otherAudience>
                  <a class="button primary" *ngIf="!auth.authenticated()" [routerLink]="['/login']" [queryParams]="{returnUrl: applyReturnUrl(job.id)}">Sign in to apply <span aria-hidden="true">→</span></a>
                  <span class="job-posted" *ngIf="auth.authenticated()">Candidate accounts can apply to this role.</span>
                </ng-template>
              </div>
              <small class="field-error" *ngIf="auth.hasRole('CANDIDATE') && !cvs.length && !hasApplied(job.id)"><a routerLink="/cvs">Upload a CV</a> to apply.</small>
            </article>
          </div>

          <div class="pagination" *ngIf="!loading && !errorMessage && totalPages > 1" aria-label="Job search pages">
            <button class="secondary" type="button" (click)="goToPage(page - 1)" [disabled]="page === 0">← Previous</button>
            <span>Page {{page + 1}} of {{totalPages}}</span>
            <button class="secondary" type="button" (click)="goToPage(page + 1)" [disabled]="page + 1 >= totalPages">Next →</button>
          </div>
        </section>
      </main>

      <footer class="public-footer"><span>© {{year}} SmartRecruit. A more thoughtful way to hire.</span><a routerLink="/login" [queryParams]="{mode:'signup'}">Join the community</a></footer>
      <div class="toast" [class.toast-error]="messageKind === 'error'" [class.success]="messageKind === 'success'" role="status" *ngIf="message">{{message}}</div>
    </div>
  `
})
export class JobsComponent implements OnInit {
  readonly contractTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary', 'Freelance'];
  readonly skeletons = [1, 2, 3, 4];
  readonly year = new Date().getFullYear();
  q = '';
  location = '';
  contractType = '';
  jobs: Job[] = [];
  cvs: CandidateCv[] = [];
  selectedCvId = '';
  appliedIds = new Set<string>();
  expandedJobIds = new Set<string>();
  loading = true;
  errorMessage = '';
  message = '';
  messageKind: 'success' | 'error' = 'success';
  applyPrompt = false;
  applyingId = '';
  page = 0;
  totalElements = 0;
  totalPages = 0;
  private readonly pageSize = 12;

  constructor(private readonly api: RecruitmentApiService, private readonly cvApi: CvApiService, public readonly auth: AuthService, private readonly router: Router, private readonly route: ActivatedRoute) {}

  get hasFilters() { return !!(this.q.trim() || this.location.trim() || this.contractType); }

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    this.applyPrompt = !!params.get('apply') && this.auth.hasRole('CANDIDATE');
    if (this.auth.hasRole('CANDIDATE')) {
      this.cvApi.list().subscribe({ next: items => { this.cvs = items.filter(item => item.status === 'ACTIVE'); this.selectedCvId = this.cvs[0]?.id ?? ''; }, error: () => this.showMessage('Could not load your CVs. Open CV Studio to check your documents.', 'error') });
      this.api.candidateApplications().subscribe({ next: items => this.appliedIds = new Set(items.map(item => item.jobId)), error: () => undefined });
    }
    this.load();
  }

  search() { this.page = 0; this.load(); }
  reset() { this.q = ''; this.location = ''; this.contractType = ''; this.page = 0; this.load(); }
  goToPage(page: number) { this.page = page; this.load(); document.getElementById('opportunities')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  trackJob(_: number, job: Job) { return job.id; }
  companyInitial(title: string) { return (title || 'SR').trim().slice(0, 1).toUpperCase(); }
  hasApplied(id: string) { return this.appliedIds.has(id); }
  toggleDetails(id: string) { const expanded = new Set(this.expandedJobIds); expanded.has(id) ? expanded.delete(id) : expanded.add(id); this.expandedJobIds = expanded; }
  applyReturnUrl(jobId: string) { return `/jobs?apply=${encodeURIComponent(jobId)}`; }

  load() {
    this.loading = true;
    this.errorMessage = '';
    this.api.jobs(this.q.trim(), this.location.trim(), this.contractType, this.page, this.pageSize).subscribe({
      next: result => { this.jobs = result.content ?? []; this.totalElements = result.totalElements ?? this.jobs.length; this.totalPages = result.totalPages ?? 0; this.loading = false; },
      error: error => { this.errorMessage = apiError(error, 'Please try again in a moment.'); this.jobs = []; this.totalElements = 0; this.totalPages = 0; this.loading = false; }
    });
  }

  apply(job: Job) {
    const cv = this.cvs.find(item => item.id === this.selectedCvId);
    if (!cv) return;
    this.applyingId = job.id;
    this.api.apply(job.id, cv.id).subscribe({
      next: () => { this.appliedIds = new Set(this.appliedIds).add(job.id); this.showMessage(`Application sent for ${job.title}.`, 'success'); this.applyingId = ''; },
      error: error => { this.showMessage(apiError(error, 'Your application could not be sent. Please try again.'), 'error'); this.applyingId = ''; }
    });
  }

  private showMessage(message: string, kind: 'success' | 'error') { this.message = message; this.messageKind = kind; window.setTimeout(() => { if (this.message === message) this.message = ''; }, 5000); }
}

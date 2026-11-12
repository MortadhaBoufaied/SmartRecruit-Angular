import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { apiError } from '../../core/api-error';
import { CandidateCv, CvAnalysis, JobRecommendation } from '../../models/api.models';
import { CvApiService } from '../../services/cv-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-intro"><span class="page-kicker">CV STUDIO</span><h1>Your experience, ready to go.</h1><p>Keep your CVs in one private place. Review a document before applying, or run an ATS check against a role you’re interested in.</p></div>
    <section class="cv-hero panel"><div><span class="eyebrow">YOUR DOCUMENTS</span><h2>{{cvs.length}} {{cvs.length===1?'CV':'CVs'}} in your library</h2><p>PDF, DOC and DOCX files up to 10 MB. Only you can access your uploaded documents.</p></div><label class="upload" [class.upload-disabled]="uploading">{{uploading?'Uploading…':'＋ Upload a CV'}}<input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" (change)="upload($event)" [disabled]="uploading"></label></section>

    <div class="auth-message error" role="alert" *ngIf="error">{{error}}</div>
    <div class="auth-message success" role="status" *ngIf="message">{{message}}</div>
    <section class="panel ats-context"><label for="target-role">Optional target role description</label><textarea id="target-role" [(ngModel)]="jobDescription" rows="3" placeholder="Paste a role description to compare relevant terms"></textarea><small>The local ATS check compares your document structure and skills with this description. Leave blank for a general review.</small></section>
    <div class="state" *ngIf="loading"><span class="loading-dots" aria-hidden="true"></span>Loading your private documents…</div>
    <div class="empty-state" *ngIf="!loading && !cvs.length"><div class="empty-illustration" aria-hidden="true">▤</div><h3>Start with your latest CV</h3><p>Upload a PDF or Word document. You can keep multiple versions and choose which one to use when applying.</p><label class="upload">Upload your first CV<input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" (change)="upload($event)" [disabled]="uploading"></label></div>

    <div class="cv-grid" *ngIf="!loading && cvs.length">
      <article class="cv-card" *ngFor="let cv of cvs; trackBy: trackCv">
        <div class="cv-card-head"><span class="cv-file-icon" aria-hidden="true">{{fileType(cv.originalFilename)}}</span><span class="pill success">{{cv.status}}</span></div>
        <h3>{{cv.originalFilename}}</h3><p class="cv-file-meta">{{cv.contentType || fileType(cv.originalFilename)}} <span>·</span> {{cv.sizeBytes / 1024 | number:'1.0-0'}} KB</p>
        <small>Added {{cv.uploadedAt | date:'mediumDate'}}</small>
        <div class="cv-card-actions"><button class="secondary" type="button" (click)="download(cv)" [disabled]="busyId===cv.id">{{busyId===cv.id?'Preparing…':'Download'}}</button><button class="primary" type="button" (click)="scan(cv)" [disabled]="busyId===cv.id">{{busyId===cv.id?'Checking…':'Run ATS check'}}</button><button class="icon-button danger" type="button" [attr.aria-label]="'Delete '+cv.originalFilename" title="Delete CV" (click)="remove(cv)" [disabled]="busyId===cv.id">⌫</button></div>
        <section class="analysis" *ngIf="analysis?.cvId===cv.id" aria-live="polite">
          <div class="analysis-title"><div><span class="eyebrow">DOCUMENT CHECK</span><h4>ATS readiness</h4></div><div class="score"><strong>{{analysis?.score | number:'1.0-0'}}</strong><small>out of 100</small></div></div>
          <p class="analysis-disclaimer">A local structure and skills check. It is a guide, not a hiring decision.</p>
          <div *ngIf="analysis?.matchedKeywords?.length"><h4>Matching terms</h4><div class="tags"><span class="pill success" *ngFor="let term of analysis?.matchedKeywords">{{term}}</span></div></div>
          <div *ngIf="analysis?.missingKeywords?.length"><h4>Terms to consider</h4><div class="tags"><span class="pill warning" *ngFor="let term of analysis?.missingKeywords">{{term}}</span></div></div>
          <div *ngIf="analysis?.skills?.length"><h4>Skills detected</h4><div class="tags"><span class="pill neutral" *ngFor="let skill of analysis?.skills">{{skill}}</span></div></div>
          <div *ngIf="analysis?.suggestions?.length"><h4>Suggestions</h4><ul class="suggestion-list"><li *ngFor="let suggestion of analysis?.suggestions">{{suggestion}}</li></ul></div>
        </section>
      </article>
    </div>

    <section class="recommendation-section" *ngIf="recommendations.length">
      <div class="section-heading"><div><span class="eyebrow">BASED ON YOUR PROFILE</span><h2>Roles to explore</h2><p>Suggestions are generated from your CV and available opportunity data.</p></div><a class="button secondary" routerLink="/jobs">Browse all roles</a></div>
      <div class="recommendation-grid"><article class="recommendation-card" *ngFor="let item of recommendations"><div class="recommendation-top"><span class="job-company-mark" aria-hidden="true">{{item.title.slice(0,1).toUpperCase()}}</span><span class="match-score">{{item.score | number:'1.0-0'}}% match</span></div><h3>{{item.title}}</h3><p class="muted">{{item.location || 'Location not specified'}}</p><small>{{item.reason}}</small><a class="text-link" routerLink="/jobs" [queryParams]="{q:item.title}">Explore this role <span aria-hidden="true">→</span></a></article></div>
    </section>
  `
})
export class CvsComponent implements OnInit {
  cvs: CandidateCv[] = [];
  analysis: CvAnalysis | null = null;
  recommendations: JobRecommendation[] = [];
  jobDescription = '';
  loading = true;
  uploading = false;
  busyId = '';
  message = '';
  error = '';

  constructor(private readonly api: CvApiService) {}
  ngOnInit() { this.load(); this.loadRecommendations(); }
  trackCv(_: number, cv: CandidateCv) { return cv.id; }
  fileType(name: string) { return name.split('.').pop()?.toUpperCase() || 'CV'; }

  load() {
    this.loading = true;
    this.api.list().subscribe({ next: values => { this.cvs = values.filter(cv => cv.status === 'ACTIVE'); this.loading = false; }, error: error => { this.error = apiError(error, 'Your documents could not be loaded.'); this.loading = false; } });
  }

  upload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.clearFeedback();
    const allowed = /\.(pdf|doc|docx)$/i.test(file.name);
    if (!allowed) { this.error = 'Choose a PDF, DOC or DOCX file.'; input.value = ''; return; }
    if (file.size > 10 * 1024 * 1024) { this.error = 'Your CV must be 10 MB or smaller.'; input.value = ''; return; }
    this.uploading = true;
    this.api.upload(file).subscribe({ next: () => { this.uploading = false; this.message = 'CV uploaded securely. It is ready to use with applications.'; this.load(); input.value = ''; }, error: error => { this.error = apiError(error, 'CV upload failed.'); this.uploading = false; input.value = ''; } });
  }

  scan(cv: CandidateCv) {
    this.clearFeedback();
    this.busyId = cv.id;
    this.api.scan(cv.id, this.jobDescription.trim()).subscribe({ next: result => { this.analysis = result; this.busyId = ''; }, error: error => { this.error = apiError(error, 'The CV check could not be completed.'); this.busyId = ''; } });
  }

  loadRecommendations() { this.api.recommendations().subscribe({ next: values => this.recommendations = values, error: () => this.recommendations = [] }); }

  download(cv: CandidateCv) {
    this.clearFeedback();
    this.busyId = cv.id;
    this.api.download(cv.id).subscribe({ next: file => { const url = URL.createObjectURL(file); const anchor = document.createElement('a'); anchor.href = url; anchor.download = cv.originalFilename; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); this.busyId = ''; }, error: error => { this.error = apiError(error, 'Your CV could not be downloaded.'); this.busyId = ''; } });
  }

  remove(cv: CandidateCv) {
    if (this.busyId || !confirm(`Delete “${cv.originalFilename}”? Its stored document will also be removed.`)) return;
    this.clearFeedback();
    this.busyId = cv.id;
    this.api.delete(cv.id).subscribe({ next: () => { this.cvs = this.cvs.filter(item => item.id !== cv.id); if (this.analysis?.cvId === cv.id) this.analysis = null; this.busyId = ''; this.message = 'CV deleted.'; }, error: error => { this.error = apiError(error, 'The CV could not be deleted.'); this.busyId = ''; } });
  }

  private clearFeedback() { this.error = ''; this.message = ''; }
}

import {CommonModule} from '@angular/common';
import {Component, OnInit} from '@angular/core';
import {apiError} from '../../core/api-error';
import {AnalyticsOverview, ApplicationMetric, OfferMetric} from '../../models/api.models';
import {AnalyticsApiService} from '../../services/analytics-api.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-head">
      <div><span class="eyebrow">ANALYTICS</span><h1>Recruitment performance</h1>
        <p class="muted" *ngIf="overview">Updated {{overview.generatedAt | date:'medium'}}</p></div>
      <button class="primary" (click)="exportPdf()" [disabled]="exporting || loading || !overview">{{exporting ? 'Preparing report…' : '↓ Export PDF'}}</button>
    </div>
    <div class="auth-message error" role="alert" *ngIf="error"><span>{{error}}</span><button class="secondary" type="button" *ngIf="!overview" (click)="load()">Try again</button></div>
    <div class="auth-message success" role="status" *ngIf="message">{{message}}</div>
    <div class="state" *ngIf="loading">Loading analytics…</div>
    <ng-container *ngIf="!loading && overview">
      <div class="kpis">
        <article><span class="kpi-label">Published offers</span><b class="kpi-value">{{overview.publishedJobs | number}}</b><span class="kpi-note">Currently open</span></article>
        <article><span class="kpi-label">Applications</span><b class="kpi-value">{{overview.applications | number}}</b><span class="kpi-note">Across your roles</span></article>
        <article><span class="kpi-label">Interviews</span><b class="kpi-value">{{overview.interviews | number}}</b><span class="kpi-note">Scheduled conversations</span></article>
        <article><span class="kpi-label">Hires</span><b class="kpi-value">{{overview.hires | number}}</b><span class="kpi-note">Successful outcomes</span></article>
      </div>
      <div class="split">
        <section class="panel">
          <h2>Application status</h2>
          <div class="metric-row" *ngFor="let item of overview.applicationsByStatus | keyvalue">
            <span>{{item.key}}</span><b>{{item.value}}</b>
            <div class="metric-bar"><i [style.width.%]="percent(item.value)"></i></div>
          </div>
          <p class="empty" *ngIf="!statusCount">Metrics appear after recruitment events arrive.</p>
        </section>
        <section class="panel"><h2>Offer activity</h2><div class="metric-row"><span>Closed offers</span><b>{{overview.closedJobs}}</b></div></section>
      </div>
      <section class="panel table-wrap">
        <h2>Offers</h2>
        <table><thead><tr><th>Offer</th><th>Status</th><th>Applications</th><th>Last activity</th></tr></thead>
          <tbody><tr *ngFor="let offer of offers"><td>{{offer.title}}</td><td>{{offer.status}}</td><td>{{offer.applications}}</td><td>{{offer.lastActivityAt | date:'mediumDate'}}</td></tr></tbody>
        </table>
        <p class="empty" *ngIf="!offers.length">No offer events are available yet.</p>
      </section>
      <section class="panel">
        <h2>Application summary</h2>
        <div class="metric-row" *ngFor="let item of applicationMetrics"><span>{{item.status}}</span><b>{{item.count}}</b><small>Last activity {{item.lastActivityAt | date:'mediumDate'}}</small></div>
        <p class="empty" *ngIf="!applicationMetrics.length">No application events are available yet.</p>
      </section>
    </ng-container>
  `
})
export class AnalyticsComponent implements OnInit {
  overview: AnalyticsOverview | null = null;
  offers: OfferMetric[] = [];
  applicationMetrics: ApplicationMetric[] = [];
  loading = true;
  exporting = false;
  error = '';
  message = '';

  constructor(private readonly api: AnalyticsApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true; this.error = '';
    this.api.overview().subscribe({
      next: value => { this.overview = value; this.loading = false; },
      error: error => { this.error = apiError(error, 'Analytics could not be loaded.'); this.loading = false; }
    });
    this.api.offers().subscribe({next: value => this.offers = value, error: () => this.offers = []});
    this.api.applications().subscribe({next: value => this.applicationMetrics = value, error: () => this.applicationMetrics = []});
  }

  get statusCount() { return Object.keys(this.overview?.applicationsByStatus ?? {}).length; }
  percent(value: number) {
    const max = Math.max(...Object.values(this.overview?.applicationsByStatus ?? {}), 1);
    return Math.min(100, value / max * 100);
  }

  exportPdf() {
    this.exporting = true;
    this.api.exportPdf().subscribe({
      next: file => {
        const url = URL.createObjectURL(file);
        const anchor = document.createElement('a');
        anchor.href = url; anchor.download = 'smartrecruit-analytics.pdf'; anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000); this.exporting = false; this.message = 'Your PDF report is ready.';
      },
      error: error => { this.error = apiError(error, 'The report could not be exported.'); this.exporting = false; }
    });
  }
}

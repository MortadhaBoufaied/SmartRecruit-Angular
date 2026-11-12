import {CommonModule} from '@angular/common';
import {Component} from '@angular/core';
import {RouterLink} from '@angular/router';
import {AuthService} from '../../core/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-intro">
      <span class="page-kicker">YOUR SMARTRECRUIT HOME</span>
      <h1>Welcome back, {{firstName}}.</h1>
      <p *ngIf="isCandidate">Keep your profile and CV ready so the right opportunity is easier to act on.</p>
      <p *ngIf="isRecruiter">Manage your hiring workflow, review applications and keep your team moving.</p>
      <p *ngIf="isAdmin">Review platform activity and keep recruiter onboarding moving.</p>
    </div>

    <section class="dashboard-hero" aria-label="Account overview">
      <div>
        <span class="hero-eyebrow">{{roleLabel}} workspace</span>
        <h2 *ngIf="isCandidate">A stronger application starts with a ready CV.</h2>
        <h2 *ngIf="isRecruiter">A clear path from open role to great hire.</h2>
        <h2 *ngIf="isAdmin">The right people and tools, in one place.</h2>
        <p *ngIf="isCandidate">Upload your latest CV, get an ATS review and explore opportunities that match your skills.</p>
        <p *ngIf="isRecruiter">Create a role, review candidates and track hiring performance from your workspace.</p>
        <p *ngIf="isAdmin">Review recruiter requests, manage platform users and keep subscription plans current.</p>
        <a class="button mint-button" *ngIf="isCandidate" routerLink="/cvs">Open CV Studio <span aria-hidden="true">→</span></a>
        <a class="button mint-button" *ngIf="isRecruiter" routerLink="/recruiter">Open recruiter workspace <span aria-hidden="true">→</span></a>
        <a class="button mint-button" *ngIf="isAdmin" routerLink="/admin">Review administration <span aria-hidden="true">→</span></a>
      </div>
      <div class="dashboard-hero-art" aria-hidden="true"><span>SR</span><i></i><b></b></div>
    </section>

    <div class="section-heading">
      <div><h2>Good next steps</h2><p>Shortcuts to the tasks that matter most.</p></div>
      <span class="role-pill">{{roleLabel}}</span>
    </div>
    <div class="card-grid">
      <article class="feature-card" *ngIf="isCandidate">
        <span class="feature-icon" aria-hidden="true">⌕</span><h3>Find your next role</h3>
        <p>Search public opportunities by skill, location and contract type.</p>
        <a class="button secondary" routerLink="/jobs">Browse opportunities</a>
      </article>
      <article class="feature-card" *ngIf="isCandidate">
        <span class="feature-icon" aria-hidden="true">▤</span><h3>Track applications</h3>
        <p>See the latest status for each role you have applied to.</p>
        <a class="button secondary" routerLink="/applications">View applications</a>
      </article>
      <article class="feature-card" *ngIf="isCandidate">
        <span class="feature-icon" aria-hidden="true">◇</span><h3>Know your plan</h3>
        <p>Review included features, billing history and plan options.</p>
        <a class="button secondary" routerLink="/subscriptions">View plans</a>
      </article>
      <article class="feature-card" *ngIf="isRecruiter">
        <span class="feature-icon" aria-hidden="true">▦</span><h3>Manage open roles</h3>
        <p>Create offers, update job details and move roles through their lifecycle.</p>
        <a class="button secondary" routerLink="/recruiter">Manage roles</a>
      </article>
      <article class="feature-card" *ngIf="isRecruiter">
        <span class="feature-icon" aria-hidden="true">↗</span><h3>Understand hiring activity</h3>
        <p>Review offer and application trends, then export a report.</p>
        <a class="button secondary" routerLink="/analytics">Open analytics</a>
      </article>
      <article class="feature-card" *ngIf="isRecruiter">
        <span class="feature-icon" aria-hidden="true">◷</span><h3>Prepare interviews</h3>
        <p>Review scheduled conversations and share an external meeting link.</p>
        <a class="button secondary" routerLink="/interviews">View interviews</a>
      </article>
      <article class="feature-card" *ngIf="isAdmin">
        <span class="feature-icon" aria-hidden="true">◎</span><h3>Review recruiter access</h3>
        <p>Check employment proof and approve or reject recruiter accounts.</p>
        <a class="button secondary" routerLink="/admin">Open administration</a>
      </article>
      <article class="feature-card" *ngIf="isAdmin">
        <span class="feature-icon" aria-hidden="true">◇</span><h3>Maintain plan options</h3>
        <p>Update audience plans and review recruiter subscriptions.</p>
        <a class="button secondary" routerLink="/subscriptions">Manage subscriptions</a>
      </article>
      <article class="feature-card">
        <span class="feature-icon" aria-hidden="true">◉</span><h3>Stay up to date</h3>
        <p>Read and manage your account and workflow notifications.</p>
        <a class="button secondary" routerLink="/notifications">Open notifications</a>
      </article>
    </div>
  `
})
export class DashboardComponent {
  constructor(public readonly auth: AuthService) {}

  get firstName() { return this.auth.user()?.fullName?.trim().split(/\s+/)[0] || 'there'; }
  get isCandidate() { return this.auth.hasRole('CANDIDATE'); }
  get isRecruiter() { return this.auth.hasRole('RECRUITER'); }
  get isAdmin() { return this.auth.hasRole('PLATFORM_ADMINISTRATOR'); }
  get roleLabel() { return this.isAdmin ? 'Platform admin' : this.isRecruiter ? 'Recruiter' : 'Candidate'; }
}

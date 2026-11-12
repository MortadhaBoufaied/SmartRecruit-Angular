import {CommonModule} from '@angular/common';
import {Component, OnInit} from '@angular/core';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {AuthService} from '../core/auth.service';

@Component({
  selector: 'sr-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app">
      <a class="skip-link" href="#main-content">Skip to main content</a>
      <aside aria-label="Main navigation">
        <a class="brand" routerLink="/dashboard" aria-label="SmartRecruit workspace home">
          <i class="brand-mark" aria-hidden="true">SR</i>
          <span class="brand-copy"><span class="brand-name">SmartRecruit</span><small class="brand-caption">Hiring, made clearer</small></span>
        </a>

        <div class="sidebar-label">Workspace</div>
        <nav aria-label="Workspace">
          <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}"><span class="nav-icon" aria-hidden="true">⌂</span>Overview</a>
          <a routerLink="/jobs" routerLinkActive="active"><span class="nav-icon" aria-hidden="true">⌕</span>Find opportunities</a>
          <ng-container *ngIf="auth.hasRole('CANDIDATE')">
            <a routerLink="/cvs" routerLinkActive="active"><span class="nav-icon" aria-hidden="true">✦</span>CV Studio</a>
            <a routerLink="/applications" routerLinkActive="active"><span class="nav-icon" aria-hidden="true">▤</span>My applications</a>
          </ng-container>
          <ng-container *ngIf="auth.hasRole('RECRUITER')">
            <a routerLink="/recruiter" routerLinkActive="active"><span class="nav-icon" aria-hidden="true">▦</span>Recruiter workspace</a>
            <a routerLink="/analytics" routerLinkActive="active"><span class="nav-icon" aria-hidden="true">↗</span>Analytics</a>
          </ng-container>
          <a *ngIf="auth.hasRole('CANDIDATE') || auth.hasRole('RECRUITER')" routerLink="/interviews" routerLinkActive="active"><span class="nav-icon" aria-hidden="true">◷</span>Interviews</a>
        </nav>

        <div class="sidebar-label">Account</div>
        <nav aria-label="Account">
          <a routerLink="/subscriptions" routerLinkActive="active"><span class="nav-icon" aria-hidden="true">◇</span>Plans & billing</a>
          <a routerLink="/notifications" routerLinkActive="active"><span class="nav-icon" aria-hidden="true">◉</span>Notifications</a>
          <a routerLink="/profile" routerLinkActive="active"><span class="nav-icon" aria-hidden="true">○</span>Profile</a>
          <a *ngIf="auth.hasRole('PLATFORM_ADMINISTRATOR')" routerLink="/admin" routerLinkActive="active"><span class="nav-icon" aria-hidden="true">⚙</span>Administration</a>
        </nav>

        <div class="sidebar-bottom">
          <div class="sidebar-user">
            <span class="avatar" aria-hidden="true">{{initials}}</span>
            <span class="sidebar-user-copy"><strong>{{auth.user()?.fullName || 'SmartRecruit user'}}</strong><small>{{roleLabel}}</small></span>
          </div>
          <button class="signout" type="button" (click)="logout()"><span aria-hidden="true">↪</span> Sign out</button>
        </div>
      </aside>

      <main id="main-content">
        <header>
          <div class="topbar-left"><strong>Your workspace</strong><small>Everything you need for your next hiring step.</small></div>
          <div class="topbar-actions">
            <a class="button secondary" routerLink="/jobs"><span aria-hidden="true">⌕</span> Browse jobs</a>
            <span class="role-pill">{{roleLabel}}</span>
          </div>
        </header>
        <section class="content"><router-outlet /></section>
      </main>
    </div>
  `
})
export class ShellComponent implements OnInit {
  constructor(public auth: AuthService, private readonly router: Router) {}

  ngOnInit() {
    if (!this.auth.user()) this.auth.me().subscribe();
  }

  get roleLabel() {
    const role = this.auth.user()?.role || this.auth.roles()[0];
    return role === 'PLATFORM_ADMINISTRATOR' ? 'Platform admin' : role === 'RECRUITER' ? 'Recruiter' : 'Candidate';
  }

  get initials() {
    return (this.auth.user()?.fullName || 'SR').split(/\s+/).filter(Boolean).slice(0, 2).map(name => name[0].toUpperCase()).join('');
  }

  logout() {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}

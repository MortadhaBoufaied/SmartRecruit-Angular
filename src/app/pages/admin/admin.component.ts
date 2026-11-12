import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { apiError } from '../../core/api-error';
import { Business, UserStatus, UserView } from '../../models/api.models';
import { IdentityApiService } from '../../services/identity-api.service';
import { RecruitmentApiService } from '../../services/recruitment-api.service';

type AdminTab = 'users' | 'recruiters' | 'businesses';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-intro"><span class="page-kicker">PLATFORM ADMINISTRATION</span><h1>Keep the marketplace healthy.</h1><p>Review recruiter access, manage user accounts and connect businesses with approved hiring teams.</p></div>
    <div class="admin-summary"><div><strong>{{users.length}}</strong><small>Platform users</small></div><div><strong>{{pending.length}}</strong><small>Recruiters awaiting review</small></div><div><strong>{{businesses.length}}</strong><small>Business profiles</small></div></div>
    <div class="tabs" role="tablist" aria-label="Administration sections"><button type="button" role="tab" [attr.aria-selected]="tab==='users'" [class.active]="tab==='users'" (click)="setTab('users')">Users <span>{{users.length}}</span></button><button type="button" role="tab" [attr.aria-selected]="tab==='recruiters'" [class.active]="tab==='recruiters'" (click)="setTab('recruiters')">Recruiter review <span class="tab-attention" *ngIf="pending.length">{{pending.length}}</span></button><button type="button" role="tab" [attr.aria-selected]="tab==='businesses'" [class.active]="tab==='businesses'" (click)="setTab('businesses')">Businesses <span>{{businesses.length}}</span></button></div>
    <div class="auth-message success" role="status" *ngIf="message">{{message}}</div>
    <div class="alert-error" role="alert" *ngIf="error"><span>{{error}}</span><button class="secondary" type="button" (click)="load()">Try again</button></div>
    <div class="state" *ngIf="loading"><span class="loading-dots" aria-hidden="true"></span>Loading administration data…</div>

    <section *ngIf="!loading && tab==='users'" aria-label="Platform users">
      <div class="section-heading"><div><h2>Platform users</h2><p>Review account status and access.</p></div></div>
      <div class="empty-state" *ngIf="!users.length"><h3>No users to display</h3></div>
      <div class="table-wrap" *ngIf="users.length"><table><thead><tr><th>User</th><th>Role</th><th>Joined</th><th>Status</th><th>Account access</th></tr></thead><tbody><tr *ngFor="let user of users; trackBy: trackUser"><td><strong>{{user.fullName}}</strong><small>{{user.email}}</small></td><td>{{roleLabel(user.role)}}</td><td>{{user.createdAt | date:'mediumDate'}}</td><td><span class="pill" [ngClass]="statusClass(user.status)">{{statusLabel(user.status)}}</span></td><td><select [ngModel]="user.status" [ngModelOptions]="{standalone:true}" (ngModelChange)="setStatus(user,$event)" [disabled]="busyId===user.id" [attr.aria-label]="'Account status for '+user.fullName"><option value="ACTIVE">Active</option><option value="PENDING">Pending</option><option value="REJECTED">Rejected</option><option value="INACTIVE">Inactive</option></select></td></tr></tbody></table></div>
    </section>

    <section *ngIf="!loading && tab==='recruiters'" aria-label="Recruiter approval queue">
      <div class="section-heading"><div><h2>Recruiter review</h2><p>Review employment proof before activating recruiter accounts.</p></div><span class="role-pill" *ngIf="pending.length">{{pending.length}} awaiting review</span></div>
      <div class="empty-state" *ngIf="!pending.length"><div class="empty-illustration" aria-hidden="true">✓</div><h3>Review queue is clear</h3><p>New recruiter registrations will appear here.</p></div>
      <div class="review-grid" *ngIf="pending.length"><article class="review-card" *ngFor="let user of pending; trackBy: trackUser"><div class="review-person"><span class="avatar-light">{{initials(user.fullName)}}</span><div><h3>{{user.fullName}}</h3><p>{{user.email}}</p><small>Requested access {{user.createdAt | date:'mediumDate'}}</small></div><span class="pill warning">Review required</span></div><div class="review-note"><strong>Employment proof</strong><p>Open the uploaded document to confirm the applicant’s relationship to a hiring organization.</p></div><div class="actions"><button class="secondary" type="button" (click)="proof(user)" [disabled]="busyId===user.id">{{busyId===user.id?'Opening…':'View proof'}}</button><button class="danger" type="button" (click)="reject(user)" [disabled]="busyId===user.id">Reject</button><button class="primary" type="button" (click)="approve(user)" [disabled]="busyId===user.id">{{busyId===user.id?'Saving…':'Approve recruiter'}}</button></div></article></div>
    </section>

    <section *ngIf="!loading && tab==='businesses'" aria-label="Business management">
      <div class="section-heading"><div><h2>Business profiles</h2><p>Assign each business to an active recruiter account.</p></div></div>
      <div class="split admin-business-layout">
        <form class="panel form-stack" [formGroup]="form" (ngSubmit)="createBusiness()">
          <div><span class="eyebrow">NEW BUSINESS</span><h2>Create a business</h2><p class="muted">Choose the recruiter who will manage roles for this organization.</p></div>
          <label>Business owner<select formControlName="ownerUserId"><option value="">Choose an active recruiter</option><option *ngFor="let recruiter of activeRecruiters" [value]="recruiter.id">{{recruiter.fullName}} · {{recruiter.email}}</option></select></label>
          <p class="input-hint" *ngIf="!activeRecruiters.length">There are no active recruiters yet. Review and approve a recruiter first.</p>
          <label>Business name<input formControlName="name" placeholder="Organization name"></label>
          <div class="grid2"><label>Industry<input formControlName="industry" placeholder="Industry"></label><label>Website<input formControlName="website" type="url" placeholder="https://example.com"></label></div>
          <label>Description<textarea formControlName="description" placeholder="A short introduction for candidates"></textarea></label>
          <div class="grid2"><label>City<input formControlName="city"></label><label>Country<input formControlName="country"></label></div>
          <label>Address<input formControlName="address"></label>
          <button class="primary" type="submit" [disabled]="form.invalid || !activeRecruiters.length || busyId==='business'">{{busyId==='business'?'Creating…':'Create business'}}</button>
        </form>
        <div class="business-list"><div class="empty-state" *ngIf="!businesses.length"><div class="empty-illustration" aria-hidden="true">◎</div><h3>No businesses yet</h3><p>Created business profiles will appear here.</p></div><article class="business-card" *ngFor="let business of businesses"><div class="business-card-top"><span class="job-company-mark">{{business.name.slice(0,1).toUpperCase()}}</span><span class="pill" [ngClass]="business.status==='ACTIVE'?'success':'neutral'">{{business.status}}</span></div><h3>{{business.name}}</h3><p>{{business.description || business.industry || 'Business profile'}}</p><div class="business-meta"><span>{{ownerName(business.ownerUserId)}}</span><span *ngIf="business.city || business.country">{{business.city}}{{business.city && business.country?', ':''}}{{business.country}}</span></div><button class="danger" type="button" (click)="removeBusiness(business)" [disabled]="busyId===business.id">{{busyId===business.id?'Updating…':'Deactivate business'}}</button></article></div>
      </div>
    </section>
  `
})
export class AdminComponent implements OnInit {
  tab: AdminTab = 'users';
  users: UserView[] = [];
  businesses: Business[] = [];
  loading = true;
  busyId = '';
  message = '';
  error = '';
  form = this.fb.nonNullable.group({ ownerUserId: ['', Validators.required], name: ['', [Validators.required, Validators.maxLength(180)]], description: [''], website: [''], industry: [''], address: [''], city: [''], country: [''], status: ['ACTIVE'] });
  constructor(private readonly fb: FormBuilder, private readonly identity: IdentityApiService, private readonly recruitment: RecruitmentApiService) {}
  ngOnInit() { this.load(); }
  get pending() { return this.users.filter(user => user.role === 'RECRUITER' && user.status === 'PENDING'); }
  get activeRecruiters() { return this.users.filter(user => user.role === 'RECRUITER' && user.status === 'ACTIVE'); }
  setTab(tab: AdminTab) { this.tab = tab; this.error = ''; this.message = ''; }
  trackUser(_: number, user: UserView) { return user.id; }
  roleLabel(role: string) { return role === 'PLATFORM_ADMINISTRATOR' ? 'Administrator' : role.charAt(0) + role.slice(1).toLowerCase(); }
  statusLabel(status: string) { return status.charAt(0) + status.slice(1).toLowerCase(); }
  statusClass(status: string) { return status === 'ACTIVE' ? 'success' : status === 'PENDING' ? 'warning' : status === 'REJECTED' ? 'danger' : 'neutral'; }
  initials(name: string) { return name.split(/\s+/).slice(0,2).map(part => part[0]?.toUpperCase()).join(''); }
  ownerName(id: string) { const owner = this.users.find(user => user.id === id); return owner ? `${owner.fullName} · ${owner.email}` : `Owner ${id.slice(0,8)}`; }

  load() {
    this.loading = true; this.error = '';
    let finished = 0; const done = () => { finished++; if (finished === 2) this.loading = false; };
    this.identity.users().subscribe({ next: items => { this.users = items; done(); }, error: error => { this.error ||= apiError(error, 'Could not load platform users.'); done(); } });
    this.recruitment.businesses().subscribe({ next: items => { this.businesses = items; done(); }, error: error => { this.error ||= apiError(error, 'Could not load business profiles.'); done(); } });
  }

  setStatus(user: UserView, status: UserStatus) {
    if (user.status === status || this.busyId) return;
    this.busyId = user.id; this.error = '';
    this.identity.status(user.id, status).subscribe({ next: updated => { Object.assign(user, updated); this.busyId = ''; this.flash('Account status updated.'); }, error: error => { this.error = apiError(error, 'Could not update this account.'); this.busyId = ''; } });
  }

  approve(user: UserView) {
    if (this.busyId) return;
    this.busyId = user.id; this.error = '';
    this.identity.approve(user.id).subscribe({ next: updated => { Object.assign(user, updated); this.busyId = ''; this.flash(`${user.fullName} can now access recruiter tools.`); }, error: error => { this.error = apiError(error, 'Could not approve this recruiter.'); this.busyId = ''; } });
  }

  reject(user: UserView) {
    if (this.busyId || !confirm(`Reject the recruiter request from ${user.fullName}?`)) return;
    this.busyId = user.id; this.error = '';
    this.identity.reject(user.id).subscribe({ next: updated => { Object.assign(user, updated); this.busyId = ''; this.flash('Recruiter request rejected.'); }, error: error => { this.error = apiError(error, 'Could not reject this recruiter.'); this.busyId = ''; } });
  }

  proof(user: UserView) {
    if (this.busyId) return;
    const popup = window.open('about:blank', '_blank');
    if (!popup) { this.error = 'Allow pop-ups to open the employment proof document.'; return; }
    popup.opener = null;
    this.busyId = user.id; this.error = '';
    this.identity.proof(user.id).subscribe({ next: result => { popup.location.href = result.url; this.busyId = ''; }, error: error => { popup.close(); this.error = apiError(error, 'Employment proof could not be opened.'); this.busyId = ''; } });
  }

  createBusiness() {
    if (this.form.invalid || this.busyId) { this.form.markAllAsTouched(); return; }
    this.busyId = 'business'; this.error = '';
    const value = this.form.getRawValue();
    this.recruitment.createBusiness({...value, name:value.name.trim()} as Partial<Business>).subscribe({ next: () => { this.busyId = ''; this.form.reset({ownerUserId:'',name:'',description:'',website:'',industry:'',address:'',city:'',country:'',status:'ACTIVE'}); this.flash('Business profile created.'); this.load(); }, error: error => { this.error = apiError(error, 'Could not create the business profile.'); this.busyId = ''; } });
  }

  removeBusiness(business: Business) {
    if (this.busyId || !confirm(`Deactivate ${business.name}?`)) return;
    this.busyId = business.id; this.error = '';
    this.recruitment.deleteBusiness(business.id).subscribe({ next: () => { this.busyId = ''; this.flash(`${business.name} deactivated.`); this.load(); }, error: error => { this.error = apiError(error, 'Could not deactivate this business.'); this.busyId = ''; } });
  }

  private flash(message: string) { this.message = message; this.error = ''; window.setTimeout(() => { if (this.message === message) this.message = ''; }, 5000); }
}

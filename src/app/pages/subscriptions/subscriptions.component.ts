import {CommonModule} from '@angular/common';
import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {apiError} from '../../core/api-error';
import {AuthService} from '../../core/auth.service';
import {Business, Invoice, Page, PlanRequest, Subscription, SubscriptionAudience, SubscriptionHistory, SubscriptionPlan, SubscriptionStatus, UserView} from '../../models/api.models';
import {IdentityApiService} from '../../services/identity-api.service';
import {RecruitmentApiService} from '../../services/recruitment-api.service';
import {SubscriptionApiService} from '../../services/subscription-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-intro"><span class="page-kicker">SUBSCRIPTIONS</span><h1>Plans and billing</h1><p *ngIf="!isAdmin">Review your current plan, what it includes and the history linked to your account.</p><p *ngIf="isAdmin">Manage plan options and review recruiter subscription status.</p></div>
    <div class="auth-message error" role="alert" *ngIf="error">{{error}}</div><div class="auth-message success" role="status" *ngIf="message">{{message}}</div>

    <ng-container *ngIf="isAdmin; else accountView">
      <section class="panel"><h2>{{editingPlanId ? 'Edit plan' : 'Create a plan'}}</h2>
        <form class="form-grid" [formGroup]="planForm" (ngSubmit)="createPlan()">
          <label>Plan code<input formControlName="planCode" placeholder="RECRUITER_TEAM" [readonly]="!!editingPlanId"></label>
          <label>Name<input formControlName="displayName"></label>
          <label>Audience<select formControlName="audience" [disabled]="!!editingPlanId"><option value="CANDIDATE">Candidate</option><option value="RECRUITER">Recruiter</option></select></label>
          <label>Price per billing period<input type="number" min="0" step="0.01" formControlName="price"></label>
          <label>Currency<input maxlength="3" formControlName="currency"></label>
          <label>Billing cycle<select formControlName="billingPeriodDays"><option [ngValue]="30">Monthly · 30 days</option><option [ngValue]="365">Yearly · 365 days</option></select></label>
          <label>Trial days<input type="number" min="0" max="90" formControlName="trialDays"></label>
          <label class="full">Description<input formControlName="description"></label>
          <label class="full">Features, separated by commas<input formControlName="features"></label>
          <label *ngIf="editingPlanId"><input type="checkbox" formControlName="active"> Plan is active</label>
          <div class="full"><small>Changing plan details does not change existing active subscriptions.</small></div>
          <button class="primary" [disabled]="planForm.invalid || saving">{{saving?'Saving…':editingPlanId ? 'Save plan' : 'Create plan'}}</button>
          <button type="button" *ngIf="editingPlanId" (click)="cancelEdit()">Cancel edit</button>
        </form>
      </section>
      <section class="panel"><div class="section-heading"><div><h2>Recruiter subscriptions</h2><p>Review plan status and billing dates.</p></div></div>
        <div class="state" *ngIf="loadingCompany">Loading recruiter subscriptions…</div>
        <div class="table-wrap" *ngIf="!loadingCompany && companySubscriptions?.content?.length"><table><thead><tr><th>Recruiter</th><th>Plan</th><th>Status</th><th>Started</th><th>Ends</th><th>Update status</th></tr></thead>
          <tbody><tr *ngFor="let item of companySubscriptions?.content"><td><strong>{{businessName(item.ownerId)}}</strong><small>{{ownerName(item.ownerId)}}</small></td><td>{{item.planName}}<small>{{item.planCode}}</small></td><td>{{item.startsAt | date:'mediumDate'}}</td><td>{{item.endsAt | date:'mediumDate'}}</td><td><div class="subscription-admin-controls">
            <label>Status<select [(ngModel)]="companyStatusSelection[item.id]" [ngModelOptions]="{standalone:true}" [disabled]="saving"><option value="ACTIVE">Active</option><option value="PAST_DUE">Past due</option><option value="SUSPENDED">Suspended</option><option value="CANCELLED">Cancelled</option></select></label>
            <label>Plan<select [(ngModel)]="companyPlanSelection[item.id]" [ngModelOptions]="{standalone:true}" [disabled]="saving"><option *ngFor="let plan of plansForSubscription(item)" [value]="plan.planCode">{{plan.displayName}}{{plan.active?'':' · inactive'}}</option></select></label>
            <label>End date<input type="date" [(ngModel)]="companyEndDateSelection[item.id]" [ngModelOptions]="{standalone:true}" [disabled]="saving"></label>
            <button class="secondary" type="button" (click)="saveCompanySubscription(item)" [disabled]="saving || !companyStatusSelection[item.id]">Save</button>
          </div></td></tr></tbody></table></div>
        <div class="empty" *ngIf="!loadingCompany && !companySubscriptions?.content?.length">No recruiter subscriptions yet.</div>
      </section>
      <section class="panel"><div class="section-heading"><div><h2>Plan catalog</h2><p>Active and inactive plans remain visible to administrators.</p></div></div><div class="state" *ngIf="loadingPlans">Loading plans…</div><div class="empty" *ngIf="!loadingPlans && !plans.length">No plans are configured.</div><div class="cards" *ngIf="plans.length"><article *ngFor="let plan of plans"><span class="pill" [ngClass]="plan.active?'success':'neutral'">{{plan.audience}} · {{plan.active ? 'ACTIVE' : 'INACTIVE'}}</span><h3>{{plan.displayName}}</h3><p>{{plan.planCode}} · {{plan.price | currency:plan.currency}} / {{plan.billingPeriodDays}} days</p><small>{{plan.features.join(' · ') || 'No features listed'}}</small><div class="actions"><button class="secondary" (click)="editPlan(plan)">Edit plan</button></div></article></div></section>
    </ng-container>

    <ng-template #accountView>
      <div class="state" *ngIf="loadingCurrent">Loading your subscription…</div>
      <section class="panel current-plan" *ngIf="!loadingCurrent && current; else noPlan">
        <div><span class="eyebrow">CURRENT PLAN</span><h2>{{current.planName}}</h2><p>{{statusLabel(current.status)}} · {{current.planCode}}</p>
          <p>Current period ends {{current.endsAt | date:'longDate'}}<span *ngIf="daysRemaining >= 0"> · {{daysRemaining}} days remaining</span></p>
          <p class="muted" *ngIf="current.autoRenew">Auto-renew is on.</p><p class="muted" *ngIf="!current.autoRenew">Auto-renew is off.</p>
          <p class="muted" *ngIf="current.pendingPlanCode">{{current.pendingPlanCode}} starts {{current.changeEffectiveAt | date:'longDate'}}. You can’t schedule another change until then.</p>
        </div>
        <div class="actions"><button class="secondary" (click)="renew()" [disabled]="saving">{{saving?'Updating…':'Renew plan'}}</button><button class="danger" (click)="cancel()" [disabled]="saving || current.status === 'CANCELLED'">Cancel plan</button></div>
      </section>
      <ng-template #noPlan><div class="empty no-plan-state" *ngIf="!loadingCurrent && !error"><span>No current subscription is available for this account. Review the options below to get started.</span><button class="secondary" *ngIf="history?.content?.length" (click)="renew()" [disabled]="saving">{{saving?'Renewing…':'Renew previous plan'}}</button></div></ng-template>

      <section class="panel"><div class="page-head"><div><h2>Available {{audience.toLowerCase()}} plans</h2><p class="muted">Plan changes use a mock payment provider in this environment; no real payment method is charged.</p></div></div>
        <div class="state" *ngIf="loadingPlans">Loading available plans…</div><div class="empty" *ngIf="!loadingPlans && !plans.length">No plans are available right now. Check back later.</div>
        <div class="cards plans" *ngIf="plans.length"><article *ngFor="let plan of plans" [class.selected]="current?.planCode === plan.planCode">
          <span class="pill" [ngClass]="plan.trialDays?'success':'neutral'">{{plan.trialDays ? plan.trialDays + ' day trial' : plan.audience}}</span><h3>{{plan.displayName}}</h3><strong>{{plan.price | currency:plan.currency}}<small> / {{periodLabel(plan.billingPeriodDays)}}</small></strong>
          <p>{{plan.description}}</p><ul><li *ngFor="let feature of plan.features">{{feature}}</li></ul>
          <button class="primary" *ngIf="!current" (click)="choosePlan(plan)" [disabled]="saving">{{saving?'Updating…':'Choose plan'}}</button>
          <button class="primary" *ngIf="current && current.planCode !== plan.planCode && plan.price > currentPlanPrice" (click)="choosePlan(plan)" [disabled]="saving || !!current.pendingPlanCode">{{saving?'Updating…':'Upgrade now'}}</button>
          <button class="secondary" *ngIf="current && current.planCode !== plan.planCode && plan.price < currentPlanPrice" (click)="choosePlan(plan)" [disabled]="saving || !!current.pendingPlanCode">{{saving?'Updating…':'Schedule downgrade'}}</button>
          <span class="plan-current-label" *ngIf="current?.planCode === plan.planCode">✓ Current plan</span>
        </article></div>
      </section>

      <section class="panel"><h2>Billing history</h2><div class="state" *ngIf="loadingBilling">Loading billing history…</div><div class="table-wrap" *ngIf="!loadingBilling && invoices?.content?.length"><table><thead><tr><th>Plan</th><th>Amount</th><th>Status</th><th>Issued</th></tr></thead>
        <tbody><tr *ngFor="let invoice of invoices?.content"><td>{{invoice.planCode}}</td><td>{{invoice.amount | currency:invoice.currency}}</td><td>{{invoice.status}}</td><td>{{invoice.issuedAt | date:'mediumDate'}}</td></tr></tbody></table></div>
        <p class="empty" *ngIf="!loadingBilling && !invoices?.content?.length">No invoices yet.</p>
      </section>
      <section class="panel"><h2>Plan changes</h2><div class="metric-row" *ngFor="let item of history?.content"><span>{{statusLabel(item.action)}}</span><b>{{item.toPlanCode || statusLabel(item.toStatus)}}</b><small>{{item.occurredAt | date:'medium'}}</small></div><p class="empty" *ngIf="!loadingBilling && !history?.content?.length">No subscription changes yet.</p></section>
    </ng-template>
  `
})
export class SubscriptionsComponent implements OnInit {
  readonly isAdmin: boolean;
  readonly audience: SubscriptionAudience;
  plans: SubscriptionPlan[] = [];
  editingPlanId: string | null = null;
  current: Subscription | null = null;
  companySubscriptions: Page<Subscription> | null = null;
  history: Page<SubscriptionHistory> | null = null;
  invoices: Page<Invoice> | null = null;
  users: UserView[] = [];
  businesses: Business[] = [];
  error = '';
  message = '';
  saving = false;
  loadingPlans = true;
  loadingCurrent = true;
  loadingBilling = false;
  loadingCompany = true;
  companyStatusSelection: Record<string,string> = {};
  companyPlanSelection: Record<string,string> = {};
  companyEndDateSelection: Record<string,string> = {};

  planForm = this.fb.nonNullable.group({
    planCode: ['', Validators.required], displayName: ['', Validators.required], description: [''],
    audience: ['CANDIDATE' as SubscriptionAudience, Validators.required], price: [0, [Validators.required, Validators.min(0)]],
    currency: ['USD', Validators.required], billingPeriodDays: [30, [Validators.required, Validators.min(1), Validators.max(366)]],
    trialDays: [0, [Validators.min(0), Validators.max(90)]], features: [''], active: [true]
  });

  constructor(private readonly fb: FormBuilder, auth: AuthService, private readonly api: SubscriptionApiService, private readonly identity: IdentityApiService, private readonly recruitment: RecruitmentApiService) {
    this.isAdmin = auth.hasRole('PLATFORM_ADMINISTRATOR');
    this.audience = auth.hasRole('RECRUITER') ? 'RECRUITER' : 'CANDIDATE';
  }

  ngOnInit() {
    if (this.isAdmin) {
      this.api.adminPlans().subscribe({next: value => {this.plans = value; this.loadingPlans = false;}, error: error => {this.fail(error); this.loadingPlans = false;}});
      this.loadCompanySubscriptions();
      this.identity.users().subscribe({next: value => this.users = value, error: () => this.users = []});
      this.recruitment.businesses().subscribe({next: value => this.businesses = value, error: () => this.businesses = []});
      return;
    }
    this.loadBilling();
    this.api.plans(this.audience).subscribe({next: value => {this.plans = value; this.loadingPlans = false;}, error: error => {this.fail(error); this.loadingPlans = false;}});
    this.api.current(this.audience).subscribe({
      next: value => { this.current = value; this.loadingCurrent = false; },
      error: error => { this.loadingCurrent = false; if (error.status === 404) { this.current = null; return; } this.fail(error); }
    });
  }

  get currentPlanPrice() { return this.plans.find(plan => plan.planCode === this.current?.planCode)?.price ?? 0; }
  get daysRemaining() { return this.current ? Math.max(0, Math.ceil((new Date(this.current.endsAt).getTime()-Date.now())/86400000)) : 0; }
  periodLabel(days: number) { return days === 30 ? 'month' : days === 365 ? 'year' : `${days} days`; }
  statusLabel(status?: string) { return (status || '').replaceAll('_',' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()); }
  statusClass(status: string) { return status === 'ACTIVE' || status === 'TRIALING' ? 'success' : status === 'PAST_DUE' ? 'warning' : status === 'SUSPENDED' || status === 'CANCELLED' ? 'danger' : 'neutral'; }
  plansForAudience(audience: SubscriptionAudience) { return this.plans.filter(plan => plan.audience === audience && plan.active); }
  plansForSubscription(item: Subscription) { return this.plans.filter(plan => plan.audience === item.audience && (plan.active || plan.planCode === item.planCode)); }
  ownerName(id: string) { const user = this.users.find(item => item.id === id); return user ? `${user.fullName} · ${user.email}` : `Recruiter ${id.slice(0,8)}`; }
  businessName(id: string) { return this.businesses.find(item => item.ownerUserId === id)?.name || 'Recruiter subscription'; }
  choosePlan(plan: SubscriptionPlan) {
    this.saving = true; this.error = ''; this.message = '';
    const request = !this.current
      ? this.api.subscribe(this.audience, plan.planCode)
      : this.api.changePlan(this.audience, plan.price > this.currentPlanPrice ? 'upgrade' : 'downgrade', plan.planCode);
    request.subscribe({next: value => { this.current = value; this.saving = false; this.message = value.pendingPlanCode ? 'Downgrade scheduled for the end of this period.' : 'Subscription updated.'; this.loadBilling(); }, error: error => { this.fail(error); this.saving = false; }});
  }
  renew() { this.perform(() => this.api.renew(this.audience), 'Subscription renewed.'); }
  cancel() { if (this.current && confirm('Cancel this subscription? Your billing history will remain available.')) this.perform(() => this.api.cancel(this.audience), 'Subscription cancelled.'); }

  createPlan() {
    if (this.planForm.invalid) return;
    const value = this.planForm.getRawValue();
    const request: PlanRequest = {
      planCode: value.planCode.trim(), displayName: value.displayName.trim(), description: value.description || undefined,
      audience: value.audience, price: Number(value.price), currency: value.currency.toUpperCase(),
      billingPeriodDays: Number(value.billingPeriodDays), trialDays: Number(value.trialDays),
      active: value.active, features: value.features.split(',').map(item => item.trim()).filter(Boolean)
    };
    const wasEditing = !!this.editingPlanId;
    const operation = this.editingPlanId ? this.api.updatePlan(this.editingPlanId, request) : this.api.createPlan(request);
    this.saving = true; operation.subscribe({
      next: plan => {
        this.plans = wasEditing ? this.plans.map(item => item.id === plan.id ? plan : item) : [...this.plans, plan];
        this.cancelEdit(); this.saving = false; this.message = wasEditing ? 'Plan updated.' : 'Plan created.';
      },
      error: error => { this.fail(error); this.saving = false; }
    });
  }
  editPlan(plan: SubscriptionPlan) {
    this.editingPlanId = plan.id;
    this.planForm.patchValue({
      planCode: plan.planCode, displayName: plan.displayName, description: plan.description || '',
      audience: plan.audience, price: plan.price, currency: plan.currency,
      billingPeriodDays: plan.billingPeriodDays, trialDays: plan.trialDays,
      features: plan.features.join(', '), active: plan.active
    });
    this.message = ''; this.error = '';
  }
  cancelEdit() {
    this.editingPlanId = null;
    this.planForm.reset({planCode: '', displayName: '', description: '', audience: 'CANDIDATE', price: 0,
      currency: 'USD', billingPeriodDays: 30, trialDays: 0, features: '', active: true});
  }
  saveCompanySubscription(item: Subscription) {
    if (this.saving) return;
    const status = this.companyStatusSelection[item.id] as SubscriptionStatus;
    const planCode = this.companyPlanSelection[item.id];
    const endDate = this.companyEndDateSelection[item.id];
    const updates: {status?: SubscriptionStatus; planCode?: string; endsAt?: string} = {};
    if (status && status !== item.status) updates.status = status;
    if (planCode && planCode !== item.planCode) updates.planCode = planCode;
    const currentDate = item.endsAt ? new Date(item.endsAt).toISOString().slice(0,10) : '';
    if (endDate && endDate !== currentDate) updates.endsAt = new Date(`${endDate}T23:59:59`).toISOString();
    if (!Object.keys(updates).length) return;
    this.saving = true;
    this.api.updateCompanySubscription(item.id, updates).subscribe({next: updated => { if (this.companySubscriptions) this.companySubscriptions.content = this.companySubscriptions.content.map(value => value.id === item.id ? updated : value); this.companyStatusSelection[item.id] = updated.status; this.companyPlanSelection[item.id] = updated.planCode; this.companyEndDateSelection[item.id] = new Date(updated.endsAt).toISOString().slice(0,10); this.saving = false; this.message = 'Recruiter subscription updated.'; }, error: error => {this.fail(error); this.saving = false;}});
  }
  private loadCompanySubscriptions() { this.api.companySubscriptions().subscribe({next: value => {this.companySubscriptions = value; for (const item of value.content) { this.companyStatusSelection[item.id] = item.status; this.companyPlanSelection[item.id] = item.planCode; this.companyEndDateSelection[item.id] = new Date(item.endsAt).toISOString().slice(0,10); } this.loadingCompany = false;}, error: error => {this.fail(error); this.loadingCompany = false;}}); }
  private loadBilling() {
    this.loadingBilling = true;
    let done = 0; const finish = () => {done++; if (done === 2) this.loadingBilling = false;};
    this.api.history(this.audience).subscribe({next: value => {this.history = value; finish();}, error: () => {this.history = null; finish();}});
    this.api.invoices(this.audience).subscribe({next: value => {this.invoices = value; finish();}, error: () => {this.invoices = null; finish();}});
  }
  private perform(action: () => import('rxjs').Observable<Subscription>, success: string) {
    this.saving = true; this.error = ''; this.message = '';
    action().subscribe({next: value => { this.current = value; this.message = success; this.saving = false; this.loadBilling(); }, error: error => { this.fail(error); this.saving = false; }});
  }
  private fail(error: unknown) { this.error = apiError(error, 'Subscription request failed.'); }
}
